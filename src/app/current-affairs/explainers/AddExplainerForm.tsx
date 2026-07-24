"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

// ── Category Mappings ────────────────────────────────────────────────────────
const EXPLAINER_CATEGORIES = [
  { label: "Infrastructure", gs: ["GS3"] },
  { label: "Technology", gs: ["GS3"] },
  { label: "Energy & Environment", gs: ["GS3"] },
  { label: "Economy", gs: ["GS3"] },
  { label: "Farmer's Welfare", gs: ["GS3"] },
  { label: "Rural Prosperity", gs: ["GS2", "GS3"] },
  { label: "Industries", gs: ["GS3"] },
  { label: "Security", gs: ["GS3"] },
  { label: "Governance/Policy", gs: ["GS2"] },
  { label: "Other", gs: [] },
];

export default function AddExplainerForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // ── Field state ─────────────────────────────────────────────────────────────
  const [headline, setHeadline] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [articleDate, setArticleDate] = useState(new Date().toISOString().split("T")[0]);
  const [userNotes, setUserNotes] = useState("");
  const [visibility, setVisibility] = useState<"private" | "shared_between_two">("private");

  // ── Reset form ──────────────────────────────────────────────────────────────
  function resetForm() {
    setHeadline("");
    setSourceUrl("");
    setCategoryIndex(0);
    setArticleDate(new Date().toISOString().split("T")[0]);
    setUserNotes("");
    setVisibility("private");
    setError(null);
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmedUrl = sourceUrl.trim();
    if (!headline.trim()) {
      setError("Headline is required.");
      return;
    }
    if (!trimmedUrl) {
      setError("PIB explainer URL is required.");
      return;
    }
    
    try {
      const urlObj = new URL(trimmedUrl);
      if (!urlObj.hostname.endsWith("pib.gov.in")) {
        setError("Only pib.gov.in URLs are allowed for PIB Explainers.");
        return;
      }
    } catch {
      setError("Invalid URL format.");
      return;
    }

    const selectedCategory = EXPLAINER_CATEGORIES[categoryIndex];

    setLoading(true);
    try {
      const res = await fetch("/api/current-affairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: headline.trim(),
          article_date: articleDate,
          source_name: "PIB Latest Explainers",
          source_url: trimmedUrl,
          source_category: "pib",
          region: "national",
          gs_papers: selectedCategory.gs,
          topic: selectedCategory.label,
          prelims_relevance: false,
          mains_relevance: false,
          importance: "medium", // default
          user_notes: userNotes.trim() || null,
          tags: [],
          visibility,
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

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Toggle button */}
      <button
        id="ca-toggle-add-explainer"
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (success) setSuccess(false);
        }}
        className="btn-primary"
        style={{ width: "100%", marginBottom: open ? "1rem" : 0 }}
      >
        {open ? "✕ Close Form" : "+ Add PIB Explainer"}
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
          ✓ PIB Explainer saved successfully!
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
              marginBottom: "0.25rem",
            }}
          >
            Add PIB Explainer
          </h2>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
            PIB Explainers are metadata/link only. Paste the official PIB explainer URL and use Open Source to read it.
          </p>

          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            {/* Headline */}
            <div style={rowStyle}>
              <label htmlFor="exp-headline" style={labelStyle}>
                Headline <span style={{ color: "var(--color-brand)" }}>*</span>
              </label>
              <input
                id="exp-headline"
                type="text"
                className="input-field"
                placeholder="e.g. Sub-Mission on Agricultural Mechanization"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            {/* URL */}
            <div style={rowStyle}>
              <label htmlFor="exp-url" style={labelStyle}>
                PIB Explainer URL <span style={{ color: "var(--color-brand)" }}>*</span>
              </label>
              <input
                id="exp-url"
                type="url"
                className="input-field"
                placeholder="https://pib.gov.in/..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                required
              />
            </div>

            {/* Category + Date row */}
            <div
              style={{
                ...rowStyle,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div>
                <label htmlFor="exp-category" style={labelStyle}>
                  Category / Topic
                </label>
                <select
                  id="exp-category"
                  className="input-field"
                  value={categoryIndex}
                  onChange={(e) => setCategoryIndex(Number(e.target.value))}
                >
                  {EXPLAINER_CATEGORIES.map((cat, idx) => (
                    <option key={cat.label} value={idx}>
                      {cat.label} {cat.gs.length > 0 ? `(${cat.gs.join(", ")})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="exp-article-date" style={labelStyle}>
                  Article Date
                </label>
                <input
                  id="exp-article-date"
                  type="date"
                  className="input-field"
                  value={articleDate}
                  onChange={(e) => setArticleDate(e.target.value)}
                />
              </div>
            </div>
            
            {/* Visibility row */}
            <div style={rowStyle}>
              <label htmlFor="exp-visibility" style={labelStyle}>
                Visibility
              </label>
              <select
                id="exp-visibility"
                className="input-field"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "private" | "shared_between_two")}
              >
                <option value="private">Private</option>
                <option value="shared_between_two">Shared (both users)</option>
              </select>
            </div>

            {/* Notes */}
            <div style={rowStyle}>
              <label htmlFor="exp-notes" style={labelStyle}>
                Notes
              </label>
              <textarea
                id="exp-notes"
                className="input-field"
                rows={2}
                placeholder="Key points or context..."
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
                id="exp-submit-entry"
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? "Saving…" : "Save PIB Explainer"}
              </button>
              <button
                id="exp-cancel-entry"
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
