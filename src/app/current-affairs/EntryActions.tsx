"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EntryActionsProps {
  entryId: string;
  currentStatus: string | null;
  optionalRelevance?: boolean | null;
  essayRelevance?: boolean | null;
}

export default function EntryActions({ entryId, currentStatus, optionalRelevance, essayRelevance }: EntryActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function markAs(status: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/current-affairs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entryId, status }),
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleRelevance(type: "optional_relevance" | "essay_relevance", currentValue: boolean) {
    setLoading(true);
    try {
      const res = await fetch("/api/current-affairs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entryId, [type]: !currentValue }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function archive() {
    setLoading(true);
    try {
      const res = await fetch(`/api/current-affairs?id=${entryId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) return null;

  return (
    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.625rem", flexWrap: "wrap" }}>
      {currentStatus === "unread" && (
        <button
          id={`ca-mark-read-${entryId}`}
          type="button"
          disabled={loading}
          onClick={() => markAs("read")}
          style={{
            padding: "0.25rem 0.625rem",
            borderRadius: "0.375rem",
            border: "1px solid rgba(34,197,94,0.35)",
            background: "rgba(34,197,94,0.08)",
            color: "#4ade80",
            fontSize: "0.75rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {loading ? "…" : "✓ Mark Read"}
        </button>
      )}
      {currentStatus !== "revised" && (
        <button
          id={`ca-mark-revised-${entryId}`}
          type="button"
          disabled={loading}
          onClick={() => markAs("revised")}
          style={{
            padding: "0.25rem 0.625rem",
            borderRadius: "0.375rem",
            border: "1px solid rgba(147,197,253,0.35)",
            background: "rgba(147,197,253,0.08)",
            color: "#93c5fd",
            fontSize: "0.75rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {loading ? "…" : "🔁 Revised"}
        </button>
      )}
      <button
        id={`ca-archive-${entryId}`}
        type="button"
        disabled={loading}
        onClick={archive}
        style={{
          padding: "0.25rem 0.625rem",
          borderRadius: "0.375rem",
          border: "1px solid rgba(239,68,68,0.25)",
          background: "transparent",
          color: "var(--color-text-muted)",
          fontSize: "0.75rem",
          cursor: "pointer",
        }}
      >
        {loading ? "…" : "Archive"}
      </button>

      {optionalRelevance !== undefined && (
        <button
          id={`ca-toggle-opt-${entryId}`}
          type="button"
          disabled={loading}
          onClick={() => toggleRelevance("optional_relevance", !!optionalRelevance)}
          style={{
            padding: "0.25rem 0.625rem",
            borderRadius: "0.375rem",
            border: optionalRelevance ? "1px solid rgba(168,85,247,0.4)" : "1px solid var(--color-border)",
            background: optionalRelevance ? "rgba(168,85,247,0.1)" : "transparent",
            color: optionalRelevance ? "#c084fc" : "var(--color-text-muted)",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          {loading ? "…" : optionalRelevance ? "★ Optional" : "☆ Optional"}
        </button>
      )}

      {essayRelevance !== undefined && (
        <button
          id={`ca-toggle-essay-${entryId}`}
          type="button"
          disabled={loading}
          onClick={() => toggleRelevance("essay_relevance", !!essayRelevance)}
          style={{
            padding: "0.25rem 0.625rem",
            borderRadius: "0.375rem",
            border: essayRelevance ? "1px solid rgba(236,72,153,0.4)" : "1px solid var(--color-border)",
            background: essayRelevance ? "rgba(236,72,153,0.1)" : "transparent",
            color: essayRelevance ? "#f472b6" : "var(--color-text-muted)",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          {loading ? "…" : essayRelevance ? "★ Essay" : "☆ Essay"}
        </button>
      )}
    </div>
  );
}
