"use client";

import { useState, FormEvent } from "react";

interface EvaluateFeedback {
  marks_awarded?: number;
  max_marks?: number;
  question_demand?: string;
  strengths?: string[];
  weaknesses?: string[];
  missing_points?: string[];
  structure_feedback?: string;
  content_feedback?: string;
  examples_needed?: string[];
  word_limit_feedback?: string;
  model_answer_outline?: string[];
  revision_tasks?: string[];
  final_advice?: string;
  raw_response?: string;
  error?: string;
}

const SESSION_TYPES = [
  { value: "daily_practice", label: "Daily Practice" },
  { value: "weekly_test", label: "Weekly Test" },
  { value: "monthly_test", label: "Monthly Test" },
  { value: "essay", label: "Essay" },
  { value: "optional", label: "Optional Answer" },
  { value: "csat", label: "CSAT" },
];

const PAPERS = ["GS1", "GS2", "GS3", "GS4 / Ethics", "Essay", "CSAT", "History Optional", "Geography Optional"];

export default function EvaluateForm({
  geminiConfigured,
  dailyLimitReached,
}: {
  geminiConfigured: boolean;
  dailyLimitReached: boolean;
}) {
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [sessionType, setSessionType] = useState("daily_practice");
  const [paper, setPaper] = useState("GS1");
  const [maxMarks, setMaxMarks] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<EvaluateFeedback | null>(null);
  const [selfMode, setSelfMode] = useState(false);
  const [selfMarks, setSelfMarks] = useState("");
  const [selfNotes, setSelfNotes] = useState("");

  const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!questionText.trim() || !answerText.trim()) return;
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText,
          answerText,
          sessionType,
          paper,
          maxMarks: parseInt(maxMarks) || 10,
        }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setError(data.message || "Daily limit reached. Use self-evaluation below.");
        setSelfMode(true);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Evaluation failed. Try again.");
        return;
      }

      setFeedback(data.feedback);
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 fade-in">
      {(dailyLimitReached || !geminiConfigured) && (
        <div className="upsc-card" style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.05)" }}>
          <p className="text-xs" style={{ color: "#fbbf24" }}>
            {!geminiConfigured
              ? "⚠ Gemini API not configured. Add GEMINI_API_KEY to .env.local."
              : "⚠ Daily AI limit reached. You can still self-evaluate below."}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 upsc-card">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-medium mb-1 block" style={{ color: "var(--color-text-muted)" }}>Session Type</label>
            <select value={sessionType} onChange={e => setSessionType(e.target.value)} className="w-full p-2 text-xs rounded-lg border bg-[var(--color-bg-primary)] focus:outline-none" style={{ color: "var(--color-text-primary)", borderColor: "var(--color-border)" }}>
              {SESSION_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-medium mb-1 block" style={{ color: "var(--color-text-muted)" }}>Paper</label>
            <select value={paper} onChange={e => setPaper(e.target.value)} className="w-full p-2 text-xs rounded-lg border bg-[var(--color-bg-primary)] focus:outline-none" style={{ color: "var(--color-text-primary)", borderColor: "var(--color-border)" }}>
              {PAPERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="w-20">
            <label className="text-[10px] font-medium mb-1 block" style={{ color: "var(--color-text-muted)" }}>Max Marks</label>
            <input type="number" min="1" max="250" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} className="w-full p-2 text-xs rounded-lg border bg-[var(--color-bg-primary)] focus:outline-none" style={{ color: "var(--color-text-primary)", borderColor: "var(--color-border)" }} />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-medium mb-1 block" style={{ color: "var(--color-text-muted)" }}>Question</label>
          <textarea
            required
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            placeholder="Paste the UPSC question here..."
            rows={3}
            className="w-full p-2.5 text-xs rounded-lg border resize-none bg-[var(--color-bg-primary)] focus:outline-none focus:border-green-500"
            style={{ color: "var(--color-text-primary)", borderColor: "var(--color-border)" }}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>Your Answer</label>
            <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>{wordCount} words</span>
          </div>
          <textarea
            required
            value={answerText}
            onChange={e => setAnswerText(e.target.value)}
            placeholder="Paste your answer here. No OCR — text only."
            rows={8}
            className="w-full p-2.5 text-xs rounded-lg border resize-none bg-[var(--color-bg-primary)] focus:outline-none focus:border-green-500"
            style={{ color: "var(--color-text-primary)", borderColor: "var(--color-border)" }}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !geminiConfigured || dailyLimitReached || !questionText.trim() || !answerText.trim()}
          className="w-full py-2.5 text-sm font-medium rounded-xl transition-opacity disabled:opacity-40"
          style={{ background: "var(--color-brand)", color: "#ffffff" }}
        >
          {loading ? "Evaluating..." : "Evaluate with Gemini"}
        </button>
      </form>

      {/* Self-Evaluation Fallback */}
      {(selfMode || dailyLimitReached) && (
        <div className="upsc-card">
          <p className="text-sm font-medium mb-3" style={{ color: "var(--color-text-primary)" }}>Self-Evaluation</p>
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="text-[10px] mb-1 block" style={{ color: "var(--color-text-muted)" }}>Self Score (0-{maxMarks})</label>
              <input type="number" min="0" max={parseInt(maxMarks)} value={selfMarks} onChange={e => setSelfMarks(e.target.value)} className="w-full p-2 text-xs rounded-lg border bg-[var(--color-bg-primary)] focus:outline-none" style={{ color: "var(--color-text-primary)", borderColor: "var(--color-border)" }} />
            </div>
          </div>
          <textarea
            value={selfNotes}
            onChange={e => setSelfNotes(e.target.value)}
            placeholder="Your self-assessment notes..."
            rows={3}
            className="w-full p-2.5 text-xs rounded-lg border resize-none bg-[var(--color-bg-primary)] focus:outline-none"
            style={{ color: "var(--color-text-primary)", borderColor: "var(--color-border)" }}
          />
        </div>
      )}

      {/* Feedback Display */}
      {feedback && !feedback.error && (
        <div className="space-y-3 fade-in">
          {/* Score Card */}
          <div className="upsc-card" style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.05)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Score</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{feedback.question_demand}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: "var(--color-brand)" }}>
                  {feedback.marks_awarded ?? "—"}
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>/{feedback.max_marks ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Feedback sections */}
          {[
            { title: "✅ Strengths", items: feedback.strengths, color: "#4ade80" },
            { title: "⚠️ Weaknesses", items: feedback.weaknesses, color: "#fbbf24" },
            { title: "❌ Missing Points", items: feedback.missing_points, color: "#f87171" },
          ].map(({ title, items, color }) => items && items.length > 0 && (
            <div key={title} className="upsc-card">
              <p className="text-xs font-semibold mb-2" style={{ color }}>{title}</p>
              <ul className="space-y-1">
                {items.map((item, i) => (
                  <li key={i} className="text-xs flex items-start gap-2" style={{ color: "var(--color-text-secondary)" }}>
                    <span className="mt-0.5 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {feedback.structure_feedback && (
            <div className="upsc-card">
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>📋 Structure</p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{feedback.structure_feedback}</p>
            </div>
          )}

          {feedback.content_feedback && (
            <div className="upsc-card">
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>📚 Content</p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{feedback.content_feedback}</p>
            </div>
          )}

          {feedback.model_answer_outline && feedback.model_answer_outline.length > 0 && (
            <div className="upsc-card">
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>📝 Model Answer Outline</p>
              <ol className="space-y-1 list-decimal list-inside">
                {feedback.model_answer_outline.map((point, i) => (
                  <li key={i} className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{point}</li>
                ))}
              </ol>
            </div>
          )}

          {feedback.revision_tasks && feedback.revision_tasks.length > 0 && (
            <div className="upsc-card" style={{ borderColor: "rgba(34,197,94,0.2)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-brand)" }}>🔁 Revision Tasks</p>
              <ul className="space-y-1">
                {feedback.revision_tasks.map((task, i) => (
                  <li key={i} className="text-xs flex items-start gap-2" style={{ color: "var(--color-text-secondary)" }}>
                    <span className="mt-0.5 flex-shrink-0">□</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.final_advice && (
            <div className="upsc-card" style={{ background: "rgba(34,197,94,0.08)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-brand)" }}>💡 Final Advice</p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{feedback.final_advice}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
