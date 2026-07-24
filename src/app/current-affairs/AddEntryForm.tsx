"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────
type SourceCategory = "newspaper" | "pib" | "prs" | "rbi" | "report" | "government" | "international" | "academic" | "other";
type Region = "national" | "international";
type Importance = "high" | "medium" | "low";
const GS_PAPERS = ["GS1", "GS2", "GS3", "GS4", "Essay"] as const;

// ── Component ─────────────────────────────────────────────────────────────────
export default function AddEntryForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // ── Field state ─────────────────────────────────────────────────────────────
  const [headline, setHeadline] = useState("");
  const [articleDate, setArticleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceCategory, setSourceCategory] = useState<SourceCategory>("newspaper");
  const [region, setRegion] = useState<Region>("national");
  const [gsPapers, setGsPapers] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [importance, setImportance] = useState<Importance>("medium");
  const [prelimsRelevance, setPrelimsRelevance] = useState(false);
  const [mainsRelevance, setMainsRelevance] = useState(false);
  const [userNotes, setUserNotes] = useState("");
  const [tags, setTags] = useState("");

  // ── GS paper toggle ─────────────────────────────────────────────────────────
  function toggleGsPaper(paper: string) {
    setGsPapers((prev) =>
      prev.includes(paper) ? prev.filter((p) => p !== paper) : [...prev, paper]
    );
  }

  // ── Reset form ──────────────────────────────────────────────────────────────
  function resetForm() {
    setHeadline("");
    setArticleDate(new Date().toISOString().split("T")[0]);
    setSourceName("");
    setSourceUrl("");
    setSourceCategory("newspaper");
    setRegion("national");
    setGsPapers([]);
    setTopic("");
    setImportance("medium");
    setPrelimsRelevance(false);
    setMainsRelevance(false);
    setUserNotes("");
    setTags("");
    setError(null);
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!headline.trim()) {
      setError("Headline is required.");
      return;
    }

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      const res = await fetch("/api/current-affairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: headline.trim(),
          article_date: articleDate,
          source_name: sourceName.trim() || null,
          source_url: sourceUrl.trim() || null,
          source_category: sourceCategory,
          region,
          gs_papers: gsPapers,
          topic: topic.trim() || null,
          prelims_relevance: prelimsRelevance,
          mains_relevance: mainsRelevance,
          importance,
          user_notes: userNotes.trim() || null,
          tags: parsedTags,
          visibility: "private",
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to save entry.");
        return;
      }

      setSuccess(true);
      resetForm();
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Styles ───────────────────────────────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: "var(--color-text-muted)",
    marginBottom: "0.375rem",
    textTransform: "uppercase",
  };

  const rowStyle: React.CSSProperties = {
    marginBottom: "1rem",
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.875rem",
    color: "var(--color-text-primary)",
    cursor: "pointer",
    userSelect: "none",
  };

  const checkboxStyle: React.CSSProperties = {
    accentColor: "var(--color-brand)",
    width: "1rem",
    height: "1rem",
    cursor: "pointer",
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Toggle button */}
      <button
        id="ca-toggle-add-form"
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (success) setSuccess(false);
        }}
        className="btn-primary"
        style={{ width: "100%", marginBottom: open ? "1rem" : 0 }}
      >
        {open ? "✕ Close Form" : "+ Add Current Affairs Entry"}
      </button>

      {/* Success banner shown when form collapses after submit */}
      {success && !open && (
        <div
          className="fade-in"
          style={{
            marginTop: "0.75rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.625rem",
            background: "rgba(34, 197, 94, 0.12)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            color: "#4ade80",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          ✓ Entry saved successfully!
        </div>
      )}

      {/* Collapsible form */}
      {open && (
        <div className="upsc-card fade-in" style={{ padding: "1.25rem" }}>
          <h2
            style={{
              fontSize: "0.9375rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginBottom: "1.25rem",
            }}
          >
            New Current Affairs Entry
          </h2>

          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            {/* Headline */}
            <div style={rowStyle}>
              <label htmlFor="ca-headline" style={labelStyle}>
                Headline <span style={{ color: "var(--color-brand)" }}>*</span>
              </label>
              <input
                id="ca-headline"
                type="text"
                className="input-field"
                placeholder="e.g. India signs trade deal with UAE"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            {/* Date + Source Category row */}
            <div
              style={{
                ...rowStyle,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div>
                <label htmlFor="ca-article-date" style={labelStyle}>
                  Article Date
                </label>
                <input
                  id="ca-article-date"
                  type="date"
                  className="input-field"
                  value={articleDate}
                  onChange={(e) => setArticleDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="ca-source-category" style={labelStyle}>
                  Source Type
                </label>
                <select
                  id="ca-source-category"
                  className="input-field"
                  value={sourceCategory}
                  onChange={(e) => setSourceCategory(e.target.value as SourceCategory)}
                >
                  <option value="newspaper">Newspaper</option>
                  <option value="pib">PIB</option>
                  <option value="prs">PRS Legislative</option>
                  <option value="rbi">RBI</option>
                  <option value="report">Report</option>
                  <option value="government">Government</option>
                  <option value="international">International</option>
                  <option value="academic">Academic</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Source Name + URL */}
            <div style={rowStyle}>
              <label htmlFor="ca-source-name" style={labelStyle}>
                Source Name
              </label>
              <input
                id="ca-source-name"
                type="text"
                className="input-field"
                placeholder="e.g. The Hindu, PIB, Reuters"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
              />
            </div>

            <div style={rowStyle}>
              <label htmlFor="ca-source-url" style={labelStyle}>
                Article URL
              </label>
              <input
                id="ca-source-url"
                type="url"
                className="input-field"
                placeholder="https://..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
            </div>

            {/* Region + Importance */}
            <div
              style={{
                ...rowStyle,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div>
                <label htmlFor="ca-region" style={labelStyle}>
                  Region
                </label>
                <select
                  id="ca-region"
                  className="input-field"
                  value={region}
                  onChange={(e) => setRegion(e.target.value as Region)}
                >
                  <option value="national">National</option>
                  <option value="international">International</option>
                </select>
              </div>
              <div>
                <label htmlFor="ca-importance" style={labelStyle}>
                  Importance
                </label>
                <select
                  id="ca-importance"
                  className="input-field"
                  value={importance}
                  onChange={(e) => setImportance(e.target.value as Importance)}
                >
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
            </div>

            {/* Topic */}
            <div style={rowStyle}>
              <label htmlFor="ca-topic" style={labelStyle}>
                Topic / Subject
              </label>
              <input
                id="ca-topic"
                type="text"
                className="input-field"
                placeholder="e.g. Economy, Environment, Polity"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            {/* GS Papers */}
            <div style={rowStyle}>
              <span style={labelStyle}>GS Papers</span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.625rem",
                  marginTop: "0.25rem",
                }}
              >
                {GS_PAPERS.map((paper) => (
                  <label key={paper} style={checkboxLabelStyle} htmlFor={`ca-gs-${paper}`}>
                    <input
                      id={`ca-gs-${paper}`}
                      type="checkbox"
                      style={checkboxStyle}
                      checked={gsPapers.includes(paper)}
                      onChange={() => toggleGsPaper(paper)}
                    />
                    {paper}
                  </label>
                ))}
              </div>
            </div>

            {/* Relevance checkboxes */}
            <div style={rowStyle}>
              <span style={labelStyle}>Relevance</span>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginTop: "0.25rem",
                }}
              >
                <label style={checkboxLabelStyle} htmlFor="ca-prelims">
                  <input
                    id="ca-prelims"
                    type="checkbox"
                    style={checkboxStyle}
                    checked={prelimsRelevance}
                    onChange={(e) => setPrelimsRelevance(e.target.checked)}
                  />
                  Prelims
                </label>
                <label style={checkboxLabelStyle} htmlFor="ca-mains">
                  <input
                    id="ca-mains"
                    type="checkbox"
                    style={checkboxStyle}
                    checked={mainsRelevance}
                    onChange={(e) => setMainsRelevance(e.target.checked)}
                  />
                  Mains
                </label>
              </div>
            </div>

            {/* Tags */}
            <div style={rowStyle}>
              <label htmlFor="ca-tags" style={labelStyle}>
                Tags <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(comma-separated)</span>
              </label>
              <input
                id="ca-tags"
                type="text"
                className="input-field"
                placeholder="e.g. trade, diplomacy, south-asia"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div style={rowStyle}>
              <label htmlFor="ca-notes" style={labelStyle}>
                Notes
              </label>
              <textarea
                id="ca-notes"
                className="input-field"
                rows={3}
                placeholder="Key points, analysis, mains angle..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.625rem",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                  fontSize: "0.875rem",
                  marginBottom: "1rem",
                }}
              >
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                id="ca-submit-entry"
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? "Saving…" : "Save Entry"}
              </button>
              <button
                id="ca-cancel-entry"
                type="button"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
                style={{
                  padding: "0.75rem 1.25rem",
                  borderRadius: "0.625rem",
                  border: "1px solid var(--color-border)",
                  background: "transparent",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  transition: "border-color 0.15s ease",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
