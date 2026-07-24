"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RevisionActionsProps {
  entryId: string;
}

export default function RevisionActions({ entryId }: RevisionActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function pushRevision(days: number) {
    setLoading(true);
    try {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + days);
      const nextDateStr = nextDate.toISOString().split("T")[0];

      const res = await fetch("/api/current-affairs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: entryId, 
          status: "read", // Marking revised means it is read now
          revision_date: nextDateStr 
        }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
      <button
        type="button"
        disabled={loading}
        onClick={() => pushRevision(7)}
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
        {loading ? "…" : "✓ Revise (+7d)"}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => pushRevision(30)}
        style={{
          padding: "0.25rem 0.625rem",
          borderRadius: "0.375rem",
          border: "1px solid rgba(192,132,252,0.35)",
          background: "rgba(192,132,252,0.08)",
          color: "#c084fc",
          fontSize: "0.75rem",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {loading ? "…" : "✓ Revise (+30d)"}
      </button>
    </div>
  );
}
