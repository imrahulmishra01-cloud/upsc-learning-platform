"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";

interface PYQQuestion {
  id: string;
  year: number;
  paper: string;
  subject?: string | null;
  topic: string;
  subtopic?: string | null;
  question_text?: string | null;
  marks?: number | null;
  word_limit?: number | null;
  difficulty?: string | null;
}

const PAPERS = ["GS1", "GS2", "GS3", "GS4", "Essay", "Optional"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1978 }, (_, i) => CURRENT_YEAR - i);

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  easy: { bg: "rgba(34,197,94,0.12)", text: "#86efac", border: "rgba(34,197,94,0.3)" },
  medium: { bg: "rgba(245,158,11,0.12)", text: "#fcd34d", border: "rgba(245,158,11,0.3)" },
  hard: { bg: "rgba(239,68,68,0.12)", text: "#fca5a5", border: "rgba(239,68,68,0.3)" },
};

export default function PYQMainsPage() {
  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationPending, setMigrationPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [form, setForm] = useState({
    year: String(CURRENT_YEAR - 1),
    paper: "GS1",
    subject: "",
    topic: "",
    subtopic: "",
    question_text: "",
    marks: "",
    word_limit: "",
    difficulty: "medium",
  });

  const [filterPaper, setFilterPaper] = useState("");
  const [filterYear, setFilterYear] = useState("");

  async function fetchQuestions() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ exam_stage: "mains" });
      if (filterPaper) params.set("paper", filterPaper);
      if (filterYear) params.set("year", filterYear);
      const res = await fetch(`/api/pyq?${params}`);
      const json = await res.json();
      if (json.migrationPending) {
        setMigrationPending(true);
      } else if (json.questions) {
        setQuestions(json.questions);
      } else {
        setError(json.error ?? "Failed to load.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPaper, filterYear]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.topic.trim()) { setAddError("Topic is required."); return; }
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch("/api/pyq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: Number(form.year),
          exam_stage: "mains",
          paper: form.paper,
          subject: form.subject || null,
          topic: form.topic,
          subtopic: form.subtopic || null,
          question_text: form.question_text || null,
          marks: form.marks ? Number(form.marks) : null,
          word_limit: form.word_limit ? Number(form.word_limit) : null,
          difficulty: form.difficulty,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAddError(json.error ?? "Failed.");
      } else {
        setShowAddForm(false);
        setForm({ year: String(CURRENT_YEAR - 1), paper: "GS1", subject: "", topic: "", subtopic: "", question_text: "", marks: "", word_limit: "", difficulty: "medium" });
        fetchQuestions();
      }
    } catch {
      setAddError("Network error.");
    } finally {
      setAddLoading(false);
    }
  }

  const diffStyle = (d?: string | null) =>
    d && DIFFICULTY_COLORS[d] ? DIFFICULTY_COLORS[d] : { bg: "rgba(100,116,139,0.15)", text: "#94a3b8", border: "rgba(100,116,139,0.3)" };

  return (
    <AppShell title="Mains PYQ">
      <div className="mb-5 fade-in">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              📝 Mains PYQ
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              GS 1–4, Essay &amp; Optional
            </p>
          </div>
          <button
            id="btn-add-mains"
            onClick={() => setShowAddForm((v) => !v)}
            className="btn-primary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
          >
            {showAddForm ? "✕ Cancel" : "+ Add"}
          </button>
        </div>
      </div>

      {migrationPending && (
        <div className="mb-4 p-4 rounded-xl text-sm fade-in" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "var(--color-text-secondary)" }}>
          <span style={{ color: "#fbbf24" }}>⚠️ Migration pending.</span> Run the PYQ migration to start tracking.
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAdd} className="upsc-card mb-5 fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p className="section-title" style={{ marginBottom: "0.25rem" }}>New Mains Question</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Year *</label>
              <select id="mains-year" className="input-field" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Paper *</label>
              <select id="mains-paper" className="input-field" value={form.paper} onChange={(e) => setForm((f) => ({ ...f, paper: e.target.value }))}>
                {PAPERS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Subject (optional)</label>
            <input id="mains-subject" className="input-field" placeholder="e.g. History, Geography" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Topic *</label>
            <input id="mains-topic" className="input-field" placeholder="e.g. Federalism, Climate Change" value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Subtopic (optional)</label>
            <input id="mains-subtopic" className="input-field" placeholder="e.g. Centre-State relations" value={form.subtopic} onChange={(e) => setForm((f) => ({ ...f, subtopic: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Question text (optional)</label>
            <textarea id="mains-qtext" className="input-field" rows={3} placeholder="Paste question here…" value={form.question_text} onChange={(e) => setForm((f) => ({ ...f, question_text: e.target.value }))} style={{ resize: "vertical" }} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Marks</label>
              <input id="mains-marks" type="number" className="input-field" placeholder="10" value={form.marks} onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Word limit</label>
              <input id="mains-wordlimit" type="number" className="input-field" placeholder="150" value={form.word_limit} onChange={(e) => setForm((f) => ({ ...f, word_limit: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>Difficulty</label>
              <select id="mains-difficulty" className="input-field" value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {addError && <p className="text-sm" style={{ color: "var(--color-error)" }}>{addError}</p>}
          <button type="submit" className="btn-primary" disabled={addLoading}>{addLoading ? "Saving…" : "Save Question"}</button>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 fade-in">
        <select id="filter-paper" className="input-field" style={{ flex: "0 0 auto", width: "7rem" }} value={filterPaper} onChange={(e) => setFilterPaper(e.target.value)}>
          <option value="">All papers</option>
          {PAPERS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select id="filter-year-mains" className="input-field" style={{ flex: "0 0 auto", width: "6.5rem" }} value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
          <option value="">All years</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{[1, 2, 3].map((i) => <div key={i} className="upsc-card shimmer" style={{ height: "5rem" }} />)}</div>
      ) : error ? (
        <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>{error}</div>
      ) : questions.length === 0 && !migrationPending ? (
        <div className="p-6 rounded-xl text-center" style={{ background: "var(--color-bg-secondary)", border: "1px dashed var(--color-border)" }}>
          <div className="text-3xl mb-2">📭</div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No mains questions yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 fade-in">
          {questions.map((q) => {
            const ds = diffStyle(q.difficulty);
            return (
              <Link key={q.id} href={`/pyq/mains/${q.id}`} className="no-underline">
                <div id={`mains-q-${q.id}`} className="upsc-card group hover:border-[var(--color-brand)] transition-colors">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="badge" style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>{q.year}</span>
                    <span className="badge badge-not-configured">{q.paper}</span>
                    {q.marks && <span className="badge badge-not-configured">{q.marks}m</span>}
                    {q.word_limit && <span className="badge badge-not-configured">{q.word_limit}w</span>}
                    {q.difficulty && <span className="badge" style={{ background: ds.bg, color: ds.text, border: `1px solid ${ds.border}` }}>{q.difficulty}</span>}
                  </div>
                  <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
                    {q.topic}
                    {q.subtopic && <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}> · {q.subtopic}</span>}
                  </p>
                  {q.subject && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{q.subject}</p>}
                  {q.question_text && <p className="text-xs mt-1.5 line-clamp-2" style={{ color: "var(--color-text-muted)", lineHeight: "1.5" }}>{q.question_text}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
