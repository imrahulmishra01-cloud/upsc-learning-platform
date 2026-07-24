"use client";

import { useState } from "react";

interface NcertSyncResult {
  inserted: number;
  updated: number;
  unchanged: number;
  languageSkipped?: number;
  total: number;
  message: string;
  error?: string;
}

export default function NcertSyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NcertSyncResult | null>(null);

  async function sync() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ingest/ncert", { method: "POST" });
      const json: NcertSyncResult = await res.json();
      setResult(json);
    } catch {
      setResult({
        inserted: 0,
        updated: 0,
        unchanged: 0,
        total: 0,
        message: "Network error",
        error: "Network error — please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
        <button
          id="ncert-sync-btn"
          type="button"
          disabled={loading}
          onClick={sync}
          className="btn-primary"
        >
          {loading ? "Syncing…" : "⬇ Sync NCERT Metadata"}
        </button>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          Updates Material Library with official ncert.nic.in links
        </p>
      </div>

      {result && (
        <div
          style={{
            marginTop: "0.875rem",
            padding: "0.875rem 1rem",
            borderRadius: "0.625rem",
            background: result.error ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
            border: result.error
              ? "1px solid rgba(239,68,68,0.25)"
              : "1px solid rgba(34,197,94,0.25)",
          }}
        >
          {result.error ? (
            <p style={{ color: "#f87171", fontSize: "0.875rem" }}>⚠️ {result.error}</p>
          ) : (
            <>
              <p style={{ color: "#4ade80", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                ✓ {result.message}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "1.25rem",
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                }}
              >
                <span>📥 {result.inserted} new entries added</span>
                <span>✏️ {result.updated} entries updated with official links</span>
                <span>✓ {result.unchanged} already up to date</span>
                {(result.languageSkipped ?? 0) > 0 && <span>⚠️ {result.languageSkipped} non-English skipped</span>}
              </div>
            </>
          )}
        </div>
      )}

      <p
        style={{
          marginTop: "0.75rem",
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
        }}
      >
        Only stores metadata and links to ncert.nic.in. No PDFs are downloaded or
        stored. Existing seed rows are updated in-place. All entries remain editable.
      </p>
    </div>
  );
}
