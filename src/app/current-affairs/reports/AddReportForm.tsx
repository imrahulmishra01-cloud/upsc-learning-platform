"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const GS_PAPERS = ["GS1", "GS2", "GS3", "GS4", "Essay"] as const;

export default function AddReportForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Field state
  const [headline, setHeadline] = useState("");
  const [sourceName, setSourceName] = useState(""); // Issuing organization
  const [sourceUrl, setSourceUrl] = useState("");
  const [articleDate, setArticleDate] = useState(new Date().toISOString().split("T")[0]);
  const [region, setRegion] = useState<"national" | "international">("national");
  const [topic, setTopic] = useState("");
  const [gsPapers, setGsPapers] = useState<string[]>([]);
  const [userNotes, setUserNotes] = useState("");
  const [importance, setImportance] = useState<"high" | "medium" | "low">("medium");
  const [revisionDate, setRevisionDate] = useState("");
  const [visibility, setVisibility] = useState<"private" | "shared_between_two">("private");

  function toggleGsPaper(paper: string) {
    setGsPapers((prev) =>
      prev.includes(paper) ? prev.filter((p) => p !== paper) : [...prev, paper]
    );
  }

  function resetForm() {
    setHeadline("");
    setSourceName("");
    setSourceUrl("");
    setArticleDate(new Date().toISOString().split("T")[0]);
    setRegion("national");
    setTopic("");
    setGsPapers([]);
    setUserNotes("");
    setImportance("medium");
    setRevisionDate("");
    setVisibility("private");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!headline.trim()) {
      setError("Report Title (Headline) is required.");
      return;
    }
    
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
          source_category: "report",
          region,
          gs_papers: gsPapers,
          topic: topic.trim() || null,
          prelims_relevance: false,
          mains_relevance: false,
          importance,
          user_notes: userNotes.trim() || null,
          tags: [],
          visibility,
          revision_date: revisionDate || null,
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

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: "var(--color-text-muted)",
    marginBottom: "0.375rem",
    textTransform: "uppercase",
  };

  const rowStyle: React.CSSProperties = { marginBottom: "1rem" };
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
      <button
        id="ca-toggle-add-report"
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (success) setSuccess(false);
        }}
        className="btn-primary"
        style={{ width: "100%", marginBottom: open ? "1rem" : 0 }}
      >
        {open ? "✕ Close Form" : "+ Add Official Report"}
      </button>

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
          ✓ Report saved successfully!
        </div>
      )}

      {open && (
        <div className="upsc-card fade-in" style={{ padding: "1.25rem" }}>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.25rem" }}>
            Add Official Report
          </h2>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
            Store metadata and links for official government or international reports.
          </p>

          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <div style={rowStyle}>
              <label htmlFor="rep-headline" style={labelStyle}>
                Report Title <span style={{ color: "var(--color-brand)" }}>*</span>
              </label>
              <input
                id="rep-headline"
                type="text"
                className="input-field"
                placeholder="e.g. Economic Survey 2024, World Development Report"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                required
              />
            </div>

            <div style={{ ...rowStyle, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label htmlFor="rep-source-name" style={labelStyle}>
                  Issuing Organization
                </label>
                <input
                  id="rep-source-name"
                  type="text"
                  className="input-field"
                  placeholder="e.g. NITI Aayog, World Bank"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="rep-url" style={labelStyle}>
                  Official URL
                </label>
                <input
                  id="rep-url"
                  type="url"
                  className="input-field"
                  placeholder="https://..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                />
              </div>
            </div>

            <div style={{ ...rowStyle, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label htmlFor="rep-date" style={labelStyle}>Year / Date</label>
                <input
                  id="rep-date"
                  type="date"
                  className="input-field"
                  value={articleDate}
                  onChange={(e) => setArticleDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="rep-region" style={labelStyle}>Region</label>
                <select
                  id="rep-region"
                  className="input-field"
                  value={region}
                  onChange={(e) => setRegion(e.target.value as "national" | "international")}
                >
                  <option value="national">National (India)</option>
                  <option value="international">International</option>
                </select>
              </div>
              <div>
                <label htmlFor="rep-importance" style={labelStyle}>Importance</label>
                <select
                  id="rep-importance"
                  className="input-field"
                  value={importance}
                  onChange={(e) => setImportance(e.target.value as "high" | "medium" | "low")}
                >
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
            </div>
            
            <div style={{ ...rowStyle, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label htmlFor="rep-topic" style={labelStyle}>Topic Category</label>
                <input
                  id="rep-topic"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Economy, Environment"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="rep-rev-date" style={labelStyle}>Revision Date</label>
                <input
                  id="rep-rev-date"
                  type="date"
                  className="input-field"
                  value={revisionDate}
                  onChange={(e) => setRevisionDate(e.target.value)}
                />
              </div>
            </div>

            <div style={rowStyle}>
              <span style={labelStyle}>GS Papers</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", marginTop: "0.25rem" }}>
                {GS_PAPERS.map((paper) => (
                  <label key={paper} style={checkboxLabelStyle} htmlFor={`rep-gs-${paper}`}>
                    <input
                      id={`rep-gs-${paper}`}
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

            <div style={rowStyle}>
              <label htmlFor="rep-notes" style={labelStyle}>Notes / Summary</label>
              <textarea
                id="rep-notes"
                className="input-field"
                rows={3}
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                style={{ resize: "vertical" }}
                placeholder="Key takeaways or recommendations..."
              />
            </div>
            
            <div style={rowStyle}>
              <label htmlFor="rep-visibility" style={labelStyle}>Visibility</label>
              <select
                id="rep-visibility"
                className="input-field"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "private" | "shared_between_two")}
              >
                <option value="private">Private</option>
                <option value="shared_between_two">Shared (both users)</option>
              </select>
            </div>

            {error && (
              <div style={{ padding: "0.75rem 1rem", borderRadius: "0.625rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", fontSize: "0.875rem", marginBottom: "1rem" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? "Saving…" : "Save Report Entry"}
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setOpen(false); }}
                style={{ padding: "0.75rem 1.25rem", borderRadius: "0.625rem", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}
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
