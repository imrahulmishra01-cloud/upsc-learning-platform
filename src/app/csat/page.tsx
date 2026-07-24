import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "CSAT Prep | UPSC App" };
export const dynamic = "force-dynamic";

const MISSING_TABLE = "42P01";

interface CSATStats {
  sessionsCompleted: number;
  avgScore: number | null;
  migrationPending: boolean;
}

async function fetchCSATStats(): Promise<CSATStats> {
  const supabase = await createClient();
  if (!supabase) {
    return { sessionsCompleted: 0, avgScore: null, migrationPending: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { sessionsCompleted: 0, avgScore: null, migrationPending: false };
  }

  const { data, error } = await supabase
    .from("csat_sessions")
    .select("score_pct")
    .eq("user_id", user.id);

  if (error) {
    if (error.code === MISSING_TABLE) {
      return { sessionsCompleted: 0, avgScore: null, migrationPending: true };
    }
    return { sessionsCompleted: 0, avgScore: null, migrationPending: false };
  }

  const sessions = data ?? [];
  const withScore = sessions.filter((s) => s.score_pct != null);
  const avg =
    withScore.length > 0
      ? Math.round(withScore.reduce((sum, s) => sum + (s.score_pct ?? 0), 0) / withScore.length)
      : null;

  return {
    sessionsCompleted: sessions.length,
    avgScore: avg,
    migrationPending: false,
  };
}

const TOPIC_AREAS = [
  { icon: "📖", label: "Reading Comprehension", color: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.3)", text: "#a5b4fc" },
  { icon: "🧠", label: "Logical Reasoning", color: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.3)", text: "#f9a8d4" },
  { icon: "🔍", label: "Analytical Ability", color: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", text: "#fcd34d" },
  { icon: "🔢", label: "Basic Numeracy", color: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", text: "#86efac" },
  { icon: "⚖️", label: "Decision Making", color: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", text: "#93c5fd" },
];

const NAV_LINKS = [
  { href: "/csat/practice", icon: "✏️", label: "Practice Sessions", desc: "Log and track practice sessions" },
  { href: "/csat/pyq", icon: "📋", label: "CSAT PYQ", desc: "Past year CSAT questions" },
  { href: "/csat/mistakes", icon: "🔍", label: "Mistake Log", desc: "Review wrong answers" },
  { href: "/csat/weak-areas", icon: "📉", label: "Weak Areas", desc: "Topics needing more practice" },
];

export default async function CSATHubPage() {
  const stats = await fetchCSATStats();

  return (
    <AppShell title="CSAT Prep">
      {/* Header */}
      <div className="mb-6 fade-in">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          🔢 CSAT Prep
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Civil Services Aptitude Test — Paper II
        </p>
      </div>

      {/* Migration pending */}
      {stats.migrationPending && (
        <div
          className="mb-5 p-4 rounded-xl text-sm fade-in"
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span style={{ color: "#fbbf24" }}>⚠️ Migration pending.</span>{" "}
          Run the CSAT migration to enable session tracking.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 fade-in">
        <div className="upsc-card text-center">
          <div className="text-2xl mb-1">✅</div>
          <div
            className="text-2xl font-bold"
            style={{ color: "var(--color-brand)" }}
          >
            {stats.migrationPending ? "—" : stats.sessionsCompleted}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Sessions Completed
          </div>
        </div>
        <div className="upsc-card text-center">
          <div className="text-2xl mb-1">🎯</div>
          <div
            className="text-2xl font-bold"
            style={{ color: stats.avgScore != null && stats.avgScore >= 66 ? "var(--color-brand)" : "var(--color-warning)" }}
          >
            {stats.migrationPending
              ? "—"
              : stats.avgScore != null
              ? `${stats.avgScore}%`
              : "—"}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Avg Score
          </div>
        </div>
      </div>

      {/* Topic Area Cards */}
      <p className="section-title">Topic Areas</p>
      <div className="flex flex-col gap-2 mb-6 fade-in">
        {TOPIC_AREAS.map((t) => (
          <div
            key={t.label}
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background: t.color,
              border: `1px solid ${t.border}`,
            }}
          >
            <span className="text-xl">{t.icon}</span>
            <span className="font-medium text-sm" style={{ color: t.text }}>
              {t.label}
            </span>
          </div>
        ))}
      </div>

      {/* Navigation links */}
      <p className="section-title">Sections</p>
      <div className="grid grid-cols-1 gap-3 fade-in">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            id={`csat-nav-${link.href.replace("/csat/", "")}`}
            className="upsc-card no-underline flex items-center gap-4"
          >
            <span className="text-2xl flex-shrink-0">{link.icon}</span>
            <div className="flex-1 min-w-0">
              <div
                className="font-semibold text-sm"
                style={{ color: "var(--color-text-primary)" }}
              >
                {link.label}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                {link.desc}
              </div>
            </div>
            <span style={{ color: "var(--color-text-muted)" }}>›</span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
