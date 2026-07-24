import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { getPlannerSummary } from "@/lib/db/planner";

export const metadata: Metadata = { title: "Planner" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmt(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default async function PlannerPage() {
  const s = await getPlannerSummary();

  const SUB_LINKS = [
    { href: "/planner/plans",    icon: "📅", label: "Plans",    desc: s.activePlan ? `Active: ${s.activePlan.title}` : "No active plan" },
    { href: "/planner/tasks",    icon: "✅", label: "Tasks",    desc: `${s.todayTasksTotal} today · ${s.todayTasksDone} done` },
    { href: "/planner/goals",    icon: "🎯", label: "Goals",    desc: "Study goals and milestones" },
    { href: "/planner/progress", icon: "📈", label: "Progress", desc: "Topic coverage and sessions" },
  ];

  const taskPct = s.todayTasksTotal > 0
    ? Math.round((s.todayTasksDone / s.todayTasksTotal) * 100)
    : 0;

  return (
    <AppShell title="Planner">
      <h1 className="text-xl font-bold mb-1 fade-in" style={{ color: "var(--color-text-primary)" }}>
        Study Planner
      </h1>
      <p className="text-xs mb-5 fade-in" style={{ color: "var(--color-text-muted)" }}>
        {s.activePlan
          ? `Active plan: ${s.activePlan.title}`
          : "No active plan. Create one in Plans →"}
      </p>

      {/* ── Today's summary strip ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 mb-4 fade-in">
        {/* Tasks today */}
        <div className="upsc-card p-3">
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>
            Today&apos;s Tasks
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {s.todayTasksDone}
            <span className="text-sm font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>
              / {s.todayTasksTotal}
            </span>
          </p>
          {/* progress bar */}
          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${taskPct}%`, background: "var(--color-brand)" }}
            />
          </div>
        </div>

        {/* Time today */}
        <div className="upsc-card p-3">
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>
            Time Today
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {fmt(s.todayMinutesLogged)}
          </p>
          <p className="text-[10px] mt-2" style={{ color: "var(--color-text-muted)" }}>
            logged actual time
          </p>
        </div>

        {/* Revision due */}
        <div className="upsc-card p-3">
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>
            Revision Due
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: s.revisionDueCount > 0 ? "#fbbf24" : "var(--color-text-primary)" }}
          >
            {s.revisionDueCount}
          </p>
          <p className="text-[10px] mt-2" style={{ color: "var(--color-text-muted)" }}>
            pending reviews
          </p>
        </div>

        {/* Backlog */}
        <div className="upsc-card p-3">
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>
            Backlog
          </p>
          <p
            className="text-2xl font-bold"
            style={{ color: s.backlogOpenCount > 0 ? "#f87171" : "var(--color-text-primary)" }}
          >
            {s.backlogOpenCount}
          </p>
          <p className="text-[10px] mt-2" style={{ color: "var(--color-text-muted)" }}>
            open items
          </p>
        </div>
      </div>

      {/* ── Weekly target strip ───────────────────────────────────── */}
      {s.weeklyTargetMinutes > 0 && (
        <div className="upsc-card mb-4 fade-in">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
              This Week
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {fmt(s.weeklyLoggedMinutes)} / {fmt(s.weeklyTargetMinutes)}
            </p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.round((s.weeklyLoggedMinutes / s.weeklyTargetMinutes) * 100))}%`,
                background: "var(--color-brand)",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Sub-page nav ─────────────────────────────────────────── */}
      <div className="space-y-2 fade-in">
        {SUB_LINKS.map(({ href, icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            id={`planner-link-${label.toLowerCase()}`}
            className="upsc-card flex items-center justify-between no-underline group"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{icon}</span>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
              </div>
            </div>
            <span className="text-lg" style={{ color: "var(--color-text-muted)" }}>›</span>
          </Link>
        ))}
      </div>

      {s.caRevisionDueCount > 0 && (
        <Link
          href="/current-affairs/revision"
          className="upsc-card flex items-center justify-between no-underline group fade-in"
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.3)",
            marginTop: "1.5rem",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                Pending Current Affairs Revisions
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {s.caRevisionDueCount} item{s.caRevisionDueCount !== 1 ? "s" : ""} overdue
              </p>
            </div>
          </div>
          <span className="text-lg" style={{ color: "#fbbf24" }}>›</span>
        </Link>
      )}

      {/* ── Generate Study Plan card ──────────────────────────────── */}
      <Link
        href="/planner/generate"
        id="planner-link-generate"
        className="upsc-card flex items-center justify-between no-underline group fade-in"
        style={{
          background: "rgba(34,197,94,0.06)",
          border: "1px solid rgba(34,197,94,0.2)",
          marginTop: "0.75rem",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl flex-shrink-0">⚡</span>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              Generate Study Plan
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              Auto-create monthly targets, weekly targets &amp; daily tasks
            </p>
          </div>
        </div>
        <span className="text-lg" style={{ color: "#4ade80" }}>›</span>
      </Link>
    </AppShell>
  );
}
