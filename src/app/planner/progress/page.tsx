import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Progress" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Types ─────────────────────────────────────────────────────────────────

interface ProgressData {
  // topic_progress
  topicProgressCount: number;
  avgCoveragePct: number;
  avgConfidence: number;

  // daily_tasks
  tasksCompleted: number;
  tasksPending: number;
  tasksSkipped: number;
  totalTasksEstimatedMin: number;
  totalTasksActualMin: number;

  // revision_tasks
  revisionTotal: number;
  revisionDue: number;
  revisionCompleted: number;

  // study_sessions
  sessionCount: number;
  sessionTotalMin: number;

  // time_logs
  timeLogTotalMin: number;
  timeLogEntries: number;

  // migration status flags
  phase2aPresent: boolean;
  phase2bPresent: boolean;
}

// ── Data fetch ────────────────────────────────────────────────────────────

async function fetchProgressData(): Promise<ProgressData> {
  const empty: ProgressData = {
    topicProgressCount: 0,
    avgCoveragePct: 0,
    avgConfidence: 0,
    tasksCompleted: 0,
    tasksPending: 0,
    tasksSkipped: 0,
    totalTasksEstimatedMin: 0,
    totalTasksActualMin: 0,
    revisionTotal: 0,
    revisionDue: 0,
    revisionCompleted: 0,
    sessionCount: 0,
    sessionTotalMin: 0,
    timeLogTotalMin: 0,
    timeLogEntries: 0,
    phase2aPresent: false,
    phase2bPresent: false,
  };

  const supabase = await createClient();
  if (!supabase) return empty;

  const today = new Date().toISOString().split("T")[0];

  const [topicRes, tasksRes, revisionRes, sessionsRes, timeLogsRes] =
    await Promise.allSettled([
      // Phase 2A — topic_progress
      supabase.from("topic_progress").select("coverage_pct, confidence_score"),

      // Phase 2B — daily_tasks
      supabase.from("daily_tasks").select("status, estimated_minutes, actual_minutes"),

      // Phase 2A — revision_tasks
      supabase
        .from("revision_tasks")
        .select("completed_at, due_date"),

      // Phase 2B — study_sessions
      supabase.from("study_sessions").select("duration_minutes"),

      // Phase 2B — time_logs
      supabase.from("time_logs").select("minutes"),
    ]);

  const result: ProgressData = { ...empty };

  // topic_progress (Phase 2A)
  if (topicRes.status === "fulfilled" && !topicRes.value.error) {
    result.phase2aPresent = true;
    const rows = (topicRes.value.data ?? []) as { coverage_pct: number; confidence_score: number }[];
    result.topicProgressCount = rows.length;
    if (rows.length > 0) {
      result.avgCoveragePct   = Math.round(rows.reduce((s, r) => s + r.coverage_pct,    0) / rows.length);
      result.avgConfidence    = Math.round(rows.reduce((s, r) => s + r.confidence_score, 0) / rows.length * 10) / 10;
    }
  }

  // daily_tasks (Phase 2B)
  if (tasksRes.status === "fulfilled" && !tasksRes.value.error) {
    result.phase2bPresent = true;
    const rows = (tasksRes.value.data ?? []) as { status: string; estimated_minutes: number; actual_minutes: number }[];
    result.tasksCompleted         = rows.filter((r) => r.status === "completed").length;
    result.tasksPending           = rows.filter((r) => r.status === "pending" || r.status === "in_progress").length;
    result.tasksSkipped           = rows.filter((r) => r.status === "skipped").length;
    result.totalTasksEstimatedMin = rows.reduce((s, r) => s + (r.estimated_minutes ?? 0), 0);
    result.totalTasksActualMin    = rows.reduce((s, r) => s + (r.actual_minutes    ?? 0), 0);
  }

  // revision_tasks (Phase 2A)
  if (revisionRes.status === "fulfilled" && !revisionRes.value.error) {
    result.phase2aPresent = true;
    const rows = (revisionRes.value.data ?? []) as { completed_at: string | null; due_date: string }[];
    result.revisionTotal     = rows.length;
    result.revisionCompleted = rows.filter((r) => r.completed_at !== null).length;
    result.revisionDue       = rows.filter((r) => r.completed_at === null && r.due_date <= today).length;
  }

  // study_sessions (Phase 2B)
  if (sessionsRes.status === "fulfilled" && !sessionsRes.value.error) {
    result.phase2bPresent = true;
    const rows = (sessionsRes.value.data ?? []) as { duration_minutes: number }[];
    result.sessionCount    = rows.length;
    result.sessionTotalMin = rows.reduce((s, r) => s + (r.duration_minutes ?? 0), 0);
  }

  // time_logs (Phase 2B)
  if (timeLogsRes.status === "fulfilled" && !timeLogsRes.value.error) {
    result.phase2bPresent = true;
    const rows = (timeLogsRes.value.data ?? []) as { minutes: number }[];
    result.timeLogEntries  = rows.length;
    result.timeLogTotalMin = rows.reduce((s, r) => s + (r.minutes ?? 0), 0);
  }

  return result;
}

// ── Formatting ────────────────────────────────────────────────────────────

function fmt(min: number): string {
  if (min <= 0) return "0m";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Stat row ──────────────────────────────────────────────────────────────

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: "var(--color-border)" }}>
      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{label}</p>
      <div className="text-right">
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
        {sub && <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function ProgressPage() {
  const d = await fetchProgressData();

  const migrationMissing = !d.phase2aPresent && !d.phase2bPresent;

  return (
    <AppShell title="Progress">
      <Link href="/planner" className="inline-flex items-center gap-1.5 text-xs mb-4 fade-in" style={{ color: "var(--color-text-muted)" }}>
        ← Planner
      </Link>

      <h1 className="text-xl font-bold mb-1 fade-in" style={{ color: "var(--color-text-primary)" }}>
        Progress Overview
      </h1>
      <p className="text-xs mb-5 fade-in" style={{ color: "var(--color-text-muted)" }}>
        Summary from topic progress, tasks, revisions, study sessions, and time logs.
      </p>

      {/* Migration notice */}
      {migrationMissing && (
        <div
          className="mb-4 p-4 rounded-xl text-xs fade-in"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            color: "var(--color-text-secondary)",
          }}
        >
          <strong style={{ color: "#fbbf24" }}>Database migrations not applied yet.</strong>
          <br />
          Apply Phase 2A and Phase 2B migrations in your Supabase Dashboard to start tracking progress.
          See <Link href="/settings/database" style={{ color: "var(--color-brand)" }}>Settings → Database</Link> for status.
        </div>
      )}

      {/* ── Topic Progress (Phase 2A) ─────────────────────────────── */}
      <div className="upsc-card mb-3 fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Topic Progress</p>
          {!d.phase2aPresent && (
            <span className="badge badge-not-configured text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
              Migration needed
            </span>
          )}
        </div>
        {d.phase2aPresent ? (
          <>
            <Stat label="Topics tracked"      value={d.topicProgressCount} />
            <Stat label="Avg coverage"        value={`${d.avgCoveragePct}%`} />
            <Stat label="Avg confidence"      value={`${d.avgConfidence} / 5`} />
          </>
        ) : (
          <p className="text-xs py-2" style={{ color: "var(--color-text-muted)" }}>
            No topic progress data yet. Mark topics as you study them.
          </p>
        )}
      </div>

      {/* ── Daily Tasks (Phase 2B) ────────────────────────────────── */}
      <div className="upsc-card mb-3 fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Daily Tasks (All time)</p>
          {!d.phase2bPresent && (
            <span className="badge badge-not-configured text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
              Migration needed
            </span>
          )}
        </div>
        {d.phase2bPresent ? (
          <>
            <Stat label="Completed"       value={d.tasksCompleted} />
            <Stat label="Pending"         value={d.tasksPending} />
            <Stat label="Skipped"         value={d.tasksSkipped} />
            <Stat label="Estimated time"  value={fmt(d.totalTasksEstimatedMin)} />
            <Stat label="Actual time"     value={fmt(d.totalTasksActualMin)} />
          </>
        ) : (
          <p className="text-xs py-2" style={{ color: "var(--color-text-muted)" }}>
            No tasks yet. Create daily tasks in the{" "}
            <Link href="/planner/tasks" style={{ color: "var(--color-brand)" }}>Tasks</Link> page.
          </p>
        )}
      </div>

      {/* ── Revision Tasks (Phase 2A) ─────────────────────────────── */}
      <div className="upsc-card mb-3 fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Revision Tasks</p>
          {!d.phase2aPresent && (
            <span className="badge badge-not-configured text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
              Migration needed
            </span>
          )}
        </div>
        {d.phase2aPresent ? (
          <>
            <Stat label="Total revisions"    value={d.revisionTotal} />
            <Stat label="Completed"          value={d.revisionCompleted} />
            <Stat label="Due now"            value={d.revisionDue}
                  sub={d.revisionDue > 0 ? "overdue or due today" : undefined} />
          </>
        ) : (
          <p className="text-xs py-2" style={{ color: "var(--color-text-muted)" }}>
            No revision tasks yet.
          </p>
        )}
      </div>

      {/* ── Study Sessions (Phase 2B) ─────────────────────────────── */}
      <div className="upsc-card mb-3 fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Study Sessions</p>
          {!d.phase2bPresent && (
            <span className="badge badge-not-configured text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
              Migration needed
            </span>
          )}
        </div>
        {d.phase2bPresent ? (
          <>
            <Stat label="Sessions logged"   value={d.sessionCount} />
            <Stat label="Total study time"  value={fmt(d.sessionTotalMin)} />
          </>
        ) : (
          <p className="text-xs py-2" style={{ color: "var(--color-text-muted)" }}>
            No study sessions yet.
          </p>
        )}
      </div>

      {/* ── Time Logs (Phase 2B) ──────────────────────────────────── */}
      <div className="upsc-card mb-4 fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Manual Time Logs</p>
          {!d.phase2bPresent && (
            <span className="badge badge-not-configured text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
              Migration needed
            </span>
          )}
        </div>
        {d.phase2bPresent ? (
          <>
            <Stat label="Log entries"      value={d.timeLogEntries} />
            <Stat label="Total logged"     value={fmt(d.timeLogTotalMin)} />
          </>
        ) : (
          <p className="text-xs py-2" style={{ color: "var(--color-text-muted)" }}>
            No time logs yet.
          </p>
        )}
      </div>

      {/* Generator readiness */}
      <div
        className="p-3 rounded-xl text-xs fade-in"
        style={{
          background: "rgba(34,197,94,0.06)",
          border: "1px solid rgba(34,197,94,0.2)",
          color: "var(--color-text-muted)",
        }}
      >
        <strong style={{ color: "#4ade80" }}>Custom Study Plan Generator:</strong>{" "}
        When built in a later phase, it will use{" "}
        <code>study_plans</code>, <code>monthly_targets</code>, <code>weekly_targets</code>, <code>daily_tasks</code>, and <code>backlog_items</code>{" "}
        to auto-schedule based on start date, target date, daily hours, pace, and revision cycles.
      </div>
    </AppShell>
  );
}
