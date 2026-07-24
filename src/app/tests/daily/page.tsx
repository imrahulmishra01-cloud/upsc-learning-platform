"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import EvaluateForm from "@/app/ai/evaluate/EvaluateForm";

export default function DailyTestPage() {
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
        body: JSON.stringify({ test_type: "daily" }),
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
    <AppShell title="Daily Practice">
      <Link href="/tests" className="inline-flex items-center gap-1.5 text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
        ← Tests
      </Link>
      <h1 className="text-xl font-bold mb-1 fade-in" style={{ color: "var(--color-text-primary)" }}>
        Daily Answer Practice
      </h1>
      <p className="text-xs mb-5 fade-in" style={{ color: "var(--color-text-muted)" }}>
        Pick a UPSC question, write your answer, and get AI feedback. One practice per day builds habit.
      </p>

      <div className="upsc-card p-4 mb-6 flex flex-col items-start gap-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Track your Daily Test
          </h2>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Start a recorded test session to track your progress over time.
          </p>
        </div>
        
        {error && <p className="text-xs text-red-500">{error}</p>}
        
        <button
          onClick={startTest}
          disabled={loading}
          className="btn-primary px-4 py-2 text-sm"
        >
          {loading ? "Starting..." : "Start Daily Test Session"}
        </button>
      </div>

      <div className="pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
          Quick Evaluation (Unrecorded)
        </h2>
        <EvaluateForm geminiConfigured={true} dailyLimitReached={false} />
      </div>
    </AppShell>
  );
}
