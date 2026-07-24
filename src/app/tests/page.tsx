import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tests & Evaluation" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TestsPage() {
  const supabase = await createClient();
  let recentTests: { id: string; test_type: string; status: string; started_at: string; score_pct: number | null }[] = [];
  let migrationPending = false;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("test_sessions")
        .select("id, test_type, status, started_at, score_pct")
        .order("started_at", { ascending: false })
        .limit(5);

      if (error?.code === "42P01") migrationPending = true;
      else if (data) recentTests = data;
    } catch { migrationPending = true; }
  }

  const TEST_SECTIONS = [
    { href: "/tests/daily", icon: "📝", label: "Daily Answer Practice", desc: "One answer per day, AI evaluated" },
    { href: "/tests/weekly", icon: "📅", label: "Weekly Test", desc: "Multiple answers, timed simulation" },
    { href: "/tests/monthly", icon: "📆", label: "Monthly Full Test", desc: "Full paper simulation" },
    { href: "/tests/essay", icon: "✍️", label: "Essay Practice", desc: "Essay writing with AI feedback" },
    { href: "/tests/optional", icon: "🎯", label: "Optional Answer Practice", desc: "Geography / History optional" },
    { href: "/ai/evaluate", icon: "🤖", label: "AI Evaluator", desc: "Paste any answer for instant AI feedback" },
  ];

  return (
    <AppShell title="Tests">
      <h1 className="text-xl font-bold mb-1 fade-in" style={{ color: "var(--color-text-primary)" }}>
        Tests & Practice
      </h1>
      <p className="text-xs mb-5 fade-in" style={{ color: "var(--color-text-muted)" }}>
        Answer practice, mock tests, and AI-powered evaluation.
      </p>

      {migrationPending && (
        <div className="upsc-card mb-4 fade-in" style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.05)" }}>
          <p className="text-xs" style={{ color: "#fbbf24" }}>
            Migration pending — Apply <code>supabase/migrations/20240005_required_reading_matrix.sql</code> to enable test tracking.
          </p>
        </div>
      )}

      <div className="space-y-2 mb-6 fade-in">
        {TEST_SECTIONS.map(({ href, icon, label, desc }) => (
          <Link key={href} href={href} className="upsc-card flex items-center justify-between no-underline group" id={`test-section-${href.split("/").pop()}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
              </div>
            </div>
            <span className="text-lg" style={{ color: "var(--color-text-muted)" }}>›</span>
          </Link>
        ))}
      </div>

      {recentTests.length > 0 && (
        <div className="fade-in">
          <p className="section-title">Recent Tests</p>
          <div className="space-y-2">
            {recentTests.map(test => (
              <div key={test.id} className="upsc-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {test.test_type.charAt(0).toUpperCase() + test.test_type.slice(1)} Test
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {new Date(test.started_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    {test.score_pct != null && (
                      <p className="text-sm font-bold" style={{ color: "var(--color-brand)" }}>{test.score_pct.toFixed(1)}%</p>
                    )}
                    <span className={`badge text-[9px] ${test.status === "evaluated" ? "badge-connected" : "badge-pending"}`}>
                      {test.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
