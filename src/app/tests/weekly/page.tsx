"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";

export default function WeeklyTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startTest() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tests/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_type: "weekly" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to start test");
        setLoading(false);
      } else {
        router.push(`/tests/session/${json.session.id}`);
      }
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <AppShell title="Weekly Test">
      <Link href="/tests" className="inline-flex items-center gap-1.5 text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
        ← Tests
      </Link>
      <h1 className="text-xl font-bold mb-1 fade-in" style={{ color: "var(--color-text-primary)" }}>
        Weekly Test
      </h1>
      <p className="text-xs mb-5 fade-in" style={{ color: "var(--color-text-muted)" }}>
        A timed simulation for your weekly revision.
      </p>

      <div className="upsc-card p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
          Ready to begin?
        </h2>
        <p className="text-sm mb-6 max-w-md" style={{ color: "var(--color-text-muted)" }}>
          This will start a new weekly test session. You can submit your answers for evaluation once you are done.
        </p>
        
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        
        <button
          onClick={startTest}
          disabled={loading}
          className="btn-primary px-8 py-3 text-lg"
        >
          {loading ? "Starting..." : "Start Test"}
        </button>
      </div>
    </AppShell>
  );
}
