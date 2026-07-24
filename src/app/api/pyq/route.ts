import { NextRequest, NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MISSING_TABLE = "42P01";

/** GET /api/pyq — List questions with optional filters */
export async function GET(req: NextRequest) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  const { searchParams } = new URL(req.url);
  const exam_stage = searchParams.get("exam_stage");
  const paper = searchParams.get("paper");
  const year = searchParams.get("year");
  const topic = searchParams.get("topic");

  let query = supabase
    .from("pyq_questions")
    .select("*")
    .eq("user_id", user.id)
    .order("year", { ascending: false });

  if (exam_stage) query = query.eq("exam_stage", exam_stage);
  if (paper) query = query.eq("paper", paper);
  if (year) query = query.eq("year", Number(year));
  if (topic) query = query.ilike("topic", `%${topic}%`);

  const { data, error } = await query;

  if (error) {
    if (error.code === MISSING_TABLE) {
      return NextResponse.json({ questions: [], migrationPending: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions: data ?? [] });
}

/** POST /api/pyq — Create a new PYQ question */
export async function POST(req: NextRequest) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    year,
    exam_stage,
    paper,
    subject,
    topic,
    subtopic,
    question_text,
    marks,
    word_limit,
    difficulty,
  } = body;

  if (!year || !exam_stage || !paper || !topic) {
    return NextResponse.json(
      { error: "year, exam_stage, paper, and topic are required." },
      { status: 400 }
    );
  }

  const yearNum = Number(year);
  if (!Number.isFinite(yearNum) || yearNum < 1979 || yearNum > new Date().getFullYear()) {
    return NextResponse.json({ error: "Invalid year." }, { status: 400 });
  }

  const VALID_STAGES = ["prelims", "mains", "csat", "essay", "optional"];
  if (!VALID_STAGES.includes(exam_stage as string)) {
    return NextResponse.json(
      { error: `exam_stage must be one of: ${VALID_STAGES.join(", ")}.` },
      { status: 400 }
    );
  }

  const VALID_DIFFICULTIES = ["easy", "medium", "hard", null, undefined];
  if (!VALID_DIFFICULTIES.includes(difficulty as string | null | undefined)) {
    return NextResponse.json(
      { error: "difficulty must be easy, medium, or hard." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("pyq_questions")
    .insert({
      user_id: user.id,
      year: yearNum,
      exam_stage,
      paper: String(paper).trim(),
      subject: subject ? String(subject).trim() : null,
      topic: String(topic).trim(),
      subtopic: subtopic ? String(subtopic).trim() : null,
      question_text: question_text ? String(question_text).trim() : null,
      marks: marks ? Number(marks) : null,
      word_limit: word_limit ? Number(word_limit) : null,
      difficulty: difficulty ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === MISSING_TABLE) {
      return NextResponse.json({ error: "Migration pending. Run the PYQ migration first." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ question: data }, { status: 201 });
}

/** PATCH /api/pyq — Update a PYQ question */
export async function PATCH(req: NextRequest) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { id, ...updates } = body;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  // Prevent user_id override
  delete updates.user_id;

  const { data, error } = await supabase
    .from("pyq_questions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    if (error.code === MISSING_TABLE) {
      return NextResponse.json({ error: "Migration pending." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ question: data });
}
