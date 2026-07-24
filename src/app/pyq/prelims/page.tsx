"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";

interface PYQQuestion {
  id: string;
  year: number;
  paper: string;
  topic: string;
  subtopic?: string | null;
  question_text?: string | null;
  marks?: number | null;
  difficulty?: string | null;
}

interface AttemptForm {
  pyqId: string;
  status: string;
  mistake_type: string;
  notes: string;
  revision_needed: boolean;
  self_score: string;
}

interface PyqAttempt {
  id: string;
  pyq_question_id: string;
  status: string;
  self_score: number | null;
  mistake_type: string | null;
  attempted_at: string;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  easy: { bg: "rgba(34,197,94,0.12)", text: "#86efac", border: "rgba(34,197,94,0.3)" },
  medium: { bg: "rgba(245,158,11,0.12)", text: "#fcd34d", border: "rgba(245,158,11,0.3)" },
  hard: { bg: "rgba(239,68,68,0.12)", text: "#fca5a5", border: "rgba(239,68,68,0.3)" },
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1978 }, (_, i) => CURRENT_YEAR - i);

export default function PYQPrelimsPage() {
  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [attempts, setAttempts] = useState<PyqAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationPending, setMigrationPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add question form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [form, setForm] = useState({
    year: String(CURRENT_YEAR - 1),
    paper: "GS",
    topic: "",
    subtopic: "",
    question_text: "",
    marks: "",
    difficulty: "medium",
  });

  // Attempt form
  const [attemptForm, setAttemptForm] = useState<AttemptForm | null>(null);
  const [attemptLoading, setAttemptLoading] = useState(false);
  const [attemptError, setAttemptError] = useState<string | null>(null);

  // Filter
  const [filterYear, setFilterYear] = useState("");
  const [filterTopic, setFilterTopic] = useState("");

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ exam_stage: "prelims" });
      if (filterYear) params.set("year", filterYear);
      if (filterTopic) params.set("topic", filterTopic);
      const res = await fetch(`/api/pyq?${params}`);
      const json = await res.json();
      if (json.migrationPending) {
        setMigrationPending(true);
        setQuestions([]);
      } else if (json.questions) {
        setQuestions(json.questions);
        
        // fetch attempts
        const attRes = await fetch("/api/pyq/attempts");
        const attJson = await attRes.json();
        if (attJson.attempts) {
          setAttempts(attJson.attempts);
        }
      } else {
        setError(json.error ?? "Failed to load questions.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterTopic]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!form.topic.trim()) {
      setAddError("Topic is required.");
      return;
    }
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch("/api/pyq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: Number(form.year),
          exam_stage: "prelims",
          paper: form.paper,
          topic: form.topic,
          subtopic: form.subtopic || null,
          question_text: form.question_text || null,
          marks: form.marks ? Number(form.marks) : null,
          difficulty: form.difficulty,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAddError(json.error ?? "Failed to add question.");
      } else {
        setShowAddForm(false);
        setForm({ year: String(CURRENT_YEAR - 1), paper: "GS", topic: "", subtopic: "", question_text: "", marks: "", difficulty: "medium" });
        fetchQuestions();
      }
    } catch {
      setAddError("Network error.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleAttemptSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!attemptForm) return;
    setAttemptLoading(true);
    setAttemptError(null);
    try {
      const res = await fetch("/api/pyq/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...attemptForm,
          self_score: attemptForm.self_score ? Number(attemptForm.self_score) : null
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAttemptError(json.error ?? "Failed to log attempt.");
      } else {
        setAttemptForm(null);
        // refresh attempts
        const attRes = await fetch("/api/pyq/attempts");
        const attJson = await attRes.json();
        if (attJson.attempts) setAttempts(attJson.attempts);
      }
    } catch {
      setAttemptError("Network error.");
    } finally {
      setAttemptLoading(false);
    }
  }

  const diffStyle = (d?: string | null) =>
    d && DIFFICULTY_COLORS[d] ? DIFFICULTY_COLORS[d] : { bg: "rgba(100,116,139,0.15)", text: "#94a3b8", border: "rgba(100,116,139,0.3)" };

  return (
    <AppShell title="Prelims PYQ">
      {/* Header */}
      <div className="mb-5 fade-in">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              📋 Prelims PYQ
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              GS Paper 1 &amp; CSAT — Prelims stage
            </p>
          </div>
          <button
            id="btn-add-question"
            onClick={() => setShowAddForm((v) => !v)}
            className="btn-primary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
          >
            {showAddForm ? "✕ Cancel" : "+ Add Question"}
          </button>
        </div>
      </div>

      {/* Migration pending */}
      {migrationPending && (
        <div
          className="mb-4 p-4 rounded-xl text-sm fade-in"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span style={{ color: "#fbbf24" }}>⚠️ Migration pending.</span>{" "}
          Run the PYQ migration to start tracking questions.
        </div>
      )}

      {/* Add question form */}
      {showAddForm && (
        <form
          onSubmit={handleAddQuestion}
          className="upsc-card mb-5 fade-in"
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <p className="section-title" style={{ marginBottom: "0.25rem" }}>New Question</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Year *</label>
              <select
                id="add-year"
                className="input-field"
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Paper *</label>
              <select
                id="add-paper"
                className="input-field"
                value={form.paper}
                onChange={(e) => setForm((f) => ({ ...f, paper: e.target.value }))}
              >
                <option value="GS">GS</option>
                <option value="CSAT">CSAT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Topic *</label>
            <input
              id="add-topic"
              className="input-field"
              placeholder="e.g. Indian Polity, Environment"
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Subtopic (optional)</label>
            <input
              id="add-subtopic"
              className="input-field"
              placeholder="e.g. Fundamental Rights, Biodiversity"
              value={form.subtopic}
              onChange={(e) => setForm((f) => ({ ...f, subtopic: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Question text (optional)</label>
            <textarea
              id="add-question-text"
              className="input-field"
              rows={3}
              placeholder="Paste or type the question text here…"
              value={form.question_text}
              onChange={(e) => setForm((f) => ({ ...f, question_text: e.target.value }))}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Marks</label>
              <input
                id="add-marks"
                type="number"
                className="input-field"
                placeholder="2"
                value={form.marks}
                onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Difficulty</label>
              <select
                id="add-difficulty"
                className="input-field"
                value={form.difficulty}
                onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {addError && (
            <p className="text-sm" style={{ color: "var(--color-error)" }}>{addError}</p>
          )}

          <button type="submit" className="btn-primary" disabled={addLoading}>
            {addLoading ? "Saving…" : "Save Question"}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 fade-in">
        <select
          id="filter-year"
          className="input-field"
          style={{ flex: "0 0 auto", width: "7rem" }}
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        >
          <option value="">All years</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <input
          id="filter-topic"
          className="input-field"
          placeholder="Filter by topic…"
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
        />
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="upsc-card shimmer" style={{ height: "5rem" }} />
          ))}
        </div>
      ) : error ? (
        <div
          className="p-4 rounded-xl text-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}
        >
          {error}
        </div>
      ) : questions.length === 0 && !migrationPending ? (
        <div
          className="p-6 rounded-xl text-center"
          style={{ background: "var(--color-bg-secondary)", border: "1px dashed var(--color-border)" }}
        >
          <div className="text-3xl mb-2">📭</div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No prelims questions yet. Add your first question above.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 fade-in">
          {questions.map((q) => {
            const ds = diffStyle(q.difficulty);
            const isAttempting = attemptForm?.pyqId === q.id;
            const qAttempts = attempts.filter(a => a.pyq_question_id === q.id);

            return (
              <div key={q.id} className="upsc-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span
                        className="badge"
                        style={{ background: "rgba(34,197,94,0.12)", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)" }}
                      >
                        {q.year}
                      </span>
                      <span
                        className="badge badge-not-configured"
                      >
                        {q.paper}
                      </span>
                      {q.difficulty && (
                        <span
                          className="badge"
                          style={{ background: ds.bg, color: ds.text, border: `1px solid ${ds.border}` }}
                        >
                          {q.difficulty}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
                      {q.topic}
                      {q.subtopic && (
                        <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}> · {q.subtopic}</span>
                      )}
                    </p>
                    {q.question_text && (
                      <p
                        className="text-xs mt-1 line-clamp-2"
                        style={{ color: "var(--color-text-muted)", lineHeight: "1.5" }}
                      >
                        {q.question_text}
                      </p>
                    )}
                  </div>
                  <button
                    id={`btn-attempt-${q.id}`}
                    onClick={() =>
                      setAttemptForm(
                        isAttempting
                          ? null
                          : { pyqId: q.id, status: "attempted", mistake_type: "none", notes: "", revision_needed: false, self_score: "" }
                      )
                    }
                    style={{
                      flexShrink: 0,
                      background: isAttempting ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.12)",
                      color: isAttempting ? "#fca5a5" : "#86efac",
                      border: `1px solid ${isAttempting ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                      borderRadius: "0.5rem",
                      padding: "0.375rem 0.75rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {isAttempting ? "✕ Close" : "✏️ Attempt"}
                  </button>
                </div>

                {/* Inline attempt form */}
                {isAttempting && attemptForm && (
                  <form
                    onSubmit={handleAttemptSubmit}
                    style={{
                      marginTop: "1rem",
                      paddingTop: "1rem",
                      borderTop: "1px solid var(--color-border)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.625rem",
                    }}
                  >
                    <p className="section-title" style={{ marginBottom: "0.125rem" }}>Log Attempt</p>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Status</label>
                        <select
                          id={`attempt-status-${q.id}`}
                          className="input-field"
                          value={attemptForm.status}
                          onChange={(e) => setAttemptForm((f) => f ? { ...f, status: e.target.value } : f)}
                        >
                          <option value="attempted">Attempted</option>
                          <option value="correct">Correct ✓</option>
                          <option value="incorrect">Incorrect ✗</option>
                          <option value="partial">Partial</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Mistake type</label>
                        <select
                          id={`attempt-mistake-${q.id}`}
                          className="input-field"
                          value={attemptForm.mistake_type}
                          onChange={(e) => setAttemptForm((f) => f ? { ...f, mistake_type: e.target.value } : f)}
                        >
                          <option value="none">None</option>
                          <option value="factual">Factual</option>
                          <option value="concept">Concept</option>
                          <option value="calculation">Calculation</option>
                          <option value="reading">Reading</option>
                          <option value="time">Time</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Marks Scored (+2 / -0.66)</label>
                      <input
                        type="number"
                        step="0.01"
                        id={`attempt-score-${q.id}`}
                        className="input-field"
                        placeholder="e.g. 2 or -0.66"
                        value={attemptForm.self_score}
                        onChange={(e) => setAttemptForm((f) => f ? { ...f, self_score: e.target.value } : f)}
                      />
                    </div>

                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Notes</label>
                      <textarea
                        id={`attempt-notes-${q.id}`}
                        className="input-field"
                        rows={2}
                        placeholder="Why did you get this wrong? What to revise?"
                        value={attemptForm.notes}
                        onChange={(e) => setAttemptForm((f) => f ? { ...f, notes: e.target.value } : f)}
                        style={{ resize: "vertical" }}
                      />
                    </div>

                    <label
                      className="flex items-center gap-2 cursor-pointer text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <input
                        id={`attempt-revision-${q.id}`}
                        type="checkbox"
                        checked={attemptForm.revision_needed}
                        onChange={(e) => setAttemptForm((f) => f ? { ...f, revision_needed: e.target.checked } : f)}
                        style={{ accentColor: "var(--color-brand)" }}
                      />
                      Mark for revision
                    </label>

                    {attemptError && (
                      <p className="text-xs" style={{ color: "var(--color-error)" }}>{attemptError}</p>
                    )}

                    <button type="submit" className="btn-primary" disabled={attemptLoading}>
                      {attemptLoading ? "Saving…" : "Save Attempt"}
                    </button>
                  </form>
                )}

                {qAttempts.length > 0 && !isAttempting && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                    <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>
                      Attempt History ({qAttempts.length})
                    </p>
                    <div className="flex flex-col gap-2">
                      {qAttempts.slice(0, 3).map(att => (
                        <div key={att.id} className="flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: "var(--color-bg-secondary)" }}>
                          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            {new Date(att.attempted_at).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <div className="flex gap-1.5">
                            <span className="badge badge-pending">{att.status}</span>
                            {att.self_score != null && (
                              <span className="badge badge-connected">{att.self_score > 0 ? `+${att.self_score}` : att.self_score}</span>
                            )}
                            {att.mistake_type && att.mistake_type !== "none" && (
                              <span className="badge" style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}>{att.mistake_type}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {qAttempts.length > 3 && (
                        <p className="text-xs text-center mt-1" style={{ color: "var(--color-text-muted)" }}>
                          + {qAttempts.length - 3} more attempts
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
