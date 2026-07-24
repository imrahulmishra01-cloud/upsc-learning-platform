import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GEMINI_MODEL = "gemini-1.5-flash"; // Free tier compatible
const MAX_TOKENS = 2048;
const DAILY_LIMIT_DEFAULT = 10; // Conservative free-tier limit

function hashAnswer(text: string): string {
  // Simple hash for duplicate detection (not cryptographic)
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function POST(request: Request) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json({ error: "Gemini API not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { questionText, answerText, sessionType, paper, maxMarks, pyqId } = body;

    if (!questionText?.trim()) return NextResponse.json({ error: "Question text required" }, { status: 400 });
    if (!answerText?.trim()) return NextResponse.json({ error: "Answer text required" }, { status: 400 });
    if (!sessionType) return NextResponse.json({ error: "Session type required" }, { status: 400 });

    const wordCount = countWords(answerText);
    const answerHash = hashAnswer(answerText + questionText);

    // Check for duplicate submission
    try {
      const { data: existingDup } = await supabase
        .from("answer_submissions")
        .select("id, evaluation_status")
        .eq("user_id", user.id)
        .eq("answer_hash", answerHash)
        .single();

      if (existingDup) {
        return NextResponse.json({
          error: "Duplicate answer detected. This exact answer has already been submitted.",
          existingId: existingDup.id
        }, { status: 409 });
      }
    } catch {
      // 42P01 or no duplicate - continue
    }

    // Check AI usage limits
    let usedToday = 0;
    let dailyLimit = DAILY_LIMIT_DEFAULT;
    try {
      const { data: limitRow } = await supabase
        .from("ai_usage_limits")
        .select("daily_limit, used_today, reset_date")
        .eq("user_id", user.id)
        .single();

      if (limitRow) {
        const today = new Date().toISOString().split("T")[0];
        // Reset if date changed
        if (limitRow.reset_date !== today) {
          await supabase.from("ai_usage_limits").update({ used_today: 0, reset_date: today }).eq("user_id", user.id);
          usedToday = 0;
        } else {
          usedToday = limitRow.used_today || 0;
        }
        dailyLimit = limitRow.daily_limit || DAILY_LIMIT_DEFAULT;
      }
    } catch {
      // ai_usage_limits might not exist yet; continue with defaults
    }

    if (usedToday >= dailyLimit) {
      // Save submission as limit_reached, allow self-evaluation
      let submissionId: string | null = null;
      try {
        const { data: sub } = await supabase
          .from("answer_submissions")
          .insert({
            user_id: user.id,
            pyq_id: pyqId || null,
            session_type: sessionType,
            paper: paper || null,
            question_text: questionText,
            answer_text: answerText,
            word_count: wordCount,
            max_marks: maxMarks || null,
            evaluation_status: "limit_reached",
            answer_hash: answerHash,
          })
          .select("id")
          .single();
        submissionId = sub?.id ?? null;
      } catch { /* table might not exist */ }

      return NextResponse.json({
        error: "Daily AI limit reached",
        limitReached: true,
        usedToday,
        dailyLimit,
        submissionId,
        message: `You have used ${usedToday}/${dailyLimit} AI evaluations today. Please try again tomorrow or add self-evaluation.`
      }, { status: 429 });
    }

    // Create pending submission first
    let submissionId: string | null = null;
    try {
      const { data: sub } = await supabase
        .from("answer_submissions")
        .insert({
          user_id: user.id,
          pyq_id: pyqId || null,
          session_type: sessionType,
          paper: paper || null,
          question_text: questionText,
          answer_text: answerText,
          word_count: wordCount,
          max_marks: maxMarks || null,
          evaluation_status: "processing",
          answer_hash: answerHash,
        })
        .select("id")
        .single();
      submissionId = sub?.id ?? null;
    } catch { /* table might not exist */ }

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const prompt = buildEvaluationPrompt(questionText, answerText, sessionType, paper, maxMarks, wordCount);

    let evaluationFeedback: Record<string, unknown> = {};
    let marksAwarded: number | null = null;
    let tokensUsed = 0;
    let evalStatus: string = "done";

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: MAX_TOKENS,
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });

      const responseText = result.response.text();
      tokensUsed = result.response.usageMetadata?.totalTokenCount ?? 0;

      try {
        evaluationFeedback = JSON.parse(responseText);
        marksAwarded = evaluationFeedback.marks_awarded as number ?? null;
      } catch {
        evaluationFeedback = { raw_response: responseText };
        evalStatus = "done";
      }
    } catch (aiErr) {
      console.error("Gemini API error:", aiErr);
      evalStatus = "failed";
      evaluationFeedback = { error: "AI evaluation failed. Please try self-evaluation." };
    }

    // Increment AI usage
    try {
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("ai_usage_limits").upsert(
        { user_id: user.id, used_today: usedToday + 1, daily_limit: dailyLimit, reset_date: today },
        { onConflict: "user_id" }
      );
    } catch { /* non-critical */ }

    // Update submission with results
    if (submissionId) {
      try {
        await supabase
          .from("answer_submissions")
          .update({
            evaluation_status: evalStatus,
            marks_awarded: marksAwarded,
            evaluation_feedback: evaluationFeedback,
            ai_model_used: GEMINI_MODEL,
            ai_tokens_used: tokensUsed,
            updated_at: new Date().toISOString(),
          })
          .eq("id", submissionId)
          .eq("user_id", user.id);
      } catch { /* non-critical */ }
    }

    return NextResponse.json({
      submissionId,
      evaluationStatus: evalStatus,
      marksAwarded,
      feedback: evaluationFeedback,
      wordCount,
      usedToday: usedToday + 1,
      dailyLimit,
    });
  } catch (err) {
    console.error("Evaluation error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const sessionType = searchParams.get("sessionType");

  try {
    let query = supabase
      .from("answer_submissions")
      .select("*")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(limit);

    if (sessionType) query = query.eq("session_type", sessionType);

    const { data: submissions, error } = await query;
    if (error) {
      if (error.code === "42P01") return NextResponse.json({ submissions: [], migrationPending: true });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get usage info
    let aiUsage = { used_today: 0, daily_limit: DAILY_LIMIT_DEFAULT };
    try {
      const { data: limitRow } = await supabase
        .from("ai_usage_limits")
        .select("daily_limit, used_today")
        .eq("user_id", user.id)
        .single();
      if (limitRow) aiUsage = limitRow;
    } catch { /* non-critical */ }

    return NextResponse.json({ submissions: submissions || [], aiUsage });
  } catch (err) {
    console.error("Submissions fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function buildEvaluationPrompt(
  questionText: string,
  answerText: string,
  sessionType: string,
  paper: string | undefined,
  maxMarks: number | undefined,
  wordCount: number
): string {
  return `You are an expert UPSC examiner evaluating a candidate's answer. Provide structured feedback in JSON format only. Do not include any text outside the JSON.

QUESTION:
${questionText}

CANDIDATE ANSWER (${wordCount} words):
${answerText}

SESSION TYPE: ${sessionType}
PAPER: ${paper || "General Studies"}
MAXIMUM MARKS: ${maxMarks || 10}

Evaluate and respond with ONLY valid JSON in this exact structure:
{
  "marks_awarded": <number between 0 and ${maxMarks || 10}>,
  "max_marks": ${maxMarks || 10},
  "question_demand": "<what the question actually asks>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "missing_points": ["<important missing point 1>", "<important missing point 2>"],
  "structure_feedback": "<feedback on introduction, body, conclusion structure>",
  "content_feedback": "<feedback on factual accuracy, depth, analysis>",
  "examples_needed": ["<specific example needed 1>", "<specific example needed 2>"],
  "word_limit_feedback": "<${wordCount} words - is this appropriate?>",
  "model_answer_outline": ["<key point 1>", "<key point 2>", "<key point 3>"],
  "revision_tasks": ["<specific revision task 1>", "<revision task 2>"],
  "final_advice": "<one concise actionable improvement tip>"
}`;
}
