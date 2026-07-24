import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Database Status" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Table groups ───────────────────────────────────────────────────────────

const PHASE2A_TABLES = [
  "profiles",
  "allowed_users",
  "app_settings",       // primary key: "key text" — NOT "id uuid"
  "audit_logs",
  "source_registry",
  "material_import_logs",
  "syllabus_papers",
  "syllabus_topics",
  "syllabus_subtopics",
  "topic_progress",
  "topic_notes",
  "revision_intervals",
  "revision_tasks",
  "weakness_tags",
  "ai_usage_limits",
  "ai_cache",
] as const;

const PHASE2B_TABLES = [
  "study_plans",
  "study_goals",
  "monthly_targets",
  "weekly_targets",
  "daily_tasks",
  "backlog_items",
  "study_sessions",
  "time_logs",
] as const;

const PHASE3A_TABLES = [
  "uploaded_files",
  "material_library",
  "current_affairs_registry",
] as const;

const PHASE3C_TABLES = [
  "material_reading_progress",
  "material_notes",
] as const;

const STAGE5_TABLES = [
  "current_affairs_entries",
  "pyq_questions",
  "pyq_attempts",
  "csat_sessions",
  "answer_submissions",
  "revision_items",
  "test_sessions",
] as const;

const ALL_TABLES = [...PHASE2A_TABLES, ...PHASE2B_TABLES, ...PHASE3A_TABLES, ...PHASE3C_TABLES, ...STAGE5_TABLES] as const;

type TableName = (typeof ALL_TABLES)[number];

type TableCheckResult = {
  table: TableName;
  exists: boolean;
};

// ── Existence check ────────────────────────────────────────────────────────

async function checkTables(): Promise<{ results: TableCheckResult[]; error: string | null }> {
  const supabase = await createClient();
  if (!supabase) {
    return { results: [], error: "Supabase not configured." };
  }

  try {
    // Primary path: information_schema query (works with service role or liberal anon grants)
    const { data, error } = await supabase
      .from("information_schema.tables" as never)
      .select("table_name")
      .eq("table_schema", "public")
      .in("table_name", ALL_TABLES as unknown as string[]);

    if (!error) {
      const existingSet = new Set((data as { table_name: string }[]).map((r) => r.table_name));
      return {
        results: ALL_TABLES.map((t) => ({ table: t, exists: existingSet.has(t) })),
        error: null,
      };
    }

    // Fallback: probe each table individually using select("*").limit(0)
    // This does NOT assume any particular column name (handles app_settings.key PK).
    // PostgREST returns an error if table doesn't exist; success = table exists.
    const existingTables = new Set<string>();
    for (const t of ALL_TABLES) {
      try {
        const { error: tErr } = await supabase.from(t as never).select("*").limit(0);
        if (!tErr) existingTables.add(t);
      } catch {
        // table missing or RLS hard-block — treat as not found
      }
    }
    return {
      results: ALL_TABLES.map((t) => ({ table: t, exists: existingTables.has(t) })),
      error: null,
    };
  } catch (err) {
    return {
      results: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ── UI helpers ─────────────────────────────────────────────────────────────

function TableList({ tables, results }: { tables: readonly string[]; results: TableCheckResult[] }) {
  const resultMap = new Map(results.map((r) => [r.table, r.exists]));
  return (
    <ul className="space-y-2">
      {tables.map((t) => {
        const exists = resultMap.get(t as TableName) ?? false;
        return (
          <li key={t} className="flex items-center justify-between text-xs">
            <code className="font-mono" style={{ color: "var(--color-text-secondary)" }}>
              {t}
            </code>
            <span className={`badge ${exists ? "badge-connected" : "badge-not-configured"}`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${exists ? "bg-green-400" : "bg-slate-500"}`} />
              {exists ? "✓" : "Missing"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function DatabaseSettingsPage() {
  const { results, error } = await checkTables();

  const p2aFound    = results.filter((r) => PHASE2A_TABLES.includes(r.table as typeof PHASE2A_TABLES[number]) && r.exists).length;
  const p2bFound    = results.filter((r) => PHASE2B_TABLES.includes(r.table as typeof PHASE2B_TABLES[number]) && r.exists).length;
  const p3aFound    = results.filter((r) => PHASE3A_TABLES.includes(r.table as typeof PHASE3A_TABLES[number]) && r.exists).length;
  const p3cFound    = results.filter((r) => PHASE3C_TABLES.includes(r.table as typeof PHASE3C_TABLES[number]) && r.exists).length;
  const p5Found     = results.filter((r) => STAGE5_TABLES.includes(r.table as typeof STAGE5_TABLES[number]) && r.exists).length;
  const totalFound  = p2aFound + p2bFound + p3aFound + p3cFound + p5Found;
  const totalTables = ALL_TABLES.length;            // 36

  const p2aReady  = p2aFound  === PHASE2A_TABLES.length;   // 16
  const p2bReady  = p2bFound  === PHASE2B_TABLES.length;   // 8
  const p3aReady  = p3aFound  === PHASE3A_TABLES.length;   // 3
  const p3cReady  = p3cFound  === PHASE3C_TABLES.length;   // 2
  const p5Ready   = p5Found   === STAGE5_TABLES.length;    // 7
  const allReady  = totalFound === totalTables;

  function statusBadge(found: number, total: number) {
    const done = found === total;
    const partial = found > 0;
    return (
      <span className={`badge ${done ? "badge-connected" : partial ? "badge-pending" : "badge-not-configured"}`}>
        <span className={`w-1.5 h-1.5 rounded-full inline-block ${done ? "bg-green-400" : partial ? "bg-yellow-400" : "bg-slate-500"}`} />
        {done ? "Ready" : partial ? "Partial" : "Migration needed"}
      </span>
    );
  }

  return (
    <AppShell title="Database Status">
      {/* Back */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-xs mb-4 fade-in"
        style={{ color: "var(--color-text-muted)" }}
      >
        ← Settings
      </Link>

      <h1 className="text-xl font-bold mb-1 fade-in" style={{ color: "var(--color-text-primary)" }}>
        Database Status
      </h1>
      <p className="text-xs mb-5 fade-in" style={{ color: "var(--color-text-muted)" }}>
        Phase 2A (16) + Phase 2B (8) + Phase 3A (3) + Phase 3C (2) + Stage 5 (7) = 36 total.
        Apply all migration files to reach 36 / 36.
      </p>

      {/* Overall summary */}
      <div className="upsc-card mb-4 fade-in">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              All Phases Combined
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {error ? `Error: ${error}` : `${totalFound} / ${totalTables} tables detected`}
            </p>
          </div>
          {statusBadge(totalFound, totalTables)}
        </div>
      </div>

      {/* Phase 2A group */}
      <div className="upsc-card mb-3 fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Phase 2A — Foundation (16 tables)</p>
          {statusBadge(p2aFound, PHASE2A_TABLES.length)}
        </div>
        {results.length > 0 ? (
          <TableList tables={PHASE2A_TABLES} results={results} />
        ) : (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {error ? "Cannot connect to database." : "No data yet."}
          </p>
        )}
      </div>

      {/* Phase 2B group */}
      <div className="upsc-card mb-4 fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Phase 2B — Planner (8 tables)</p>
          {statusBadge(p2bFound, PHASE2B_TABLES.length)}
        </div>
        {results.length > 0 ? (
          <TableList tables={PHASE2B_TABLES} results={results} />
        ) : (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {error ? "Cannot connect to database." : "No data yet."}
          </p>
        )}
        {!p2bReady && results.length > 0 && (
          <p className="text-[10px] mt-3" style={{ color: "var(--color-text-muted)" }}>
            Apply <code>supabase/migrations/20240002_phase2b_planner_dashboard.sql</code> to add these tables.
          </p>
        )}
      </div>

      {/* Phase 3A group */}
      <div className="upsc-card mb-4 fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Phase 3A — Material Vault (3 tables)</p>
          {statusBadge(p3aFound, PHASE3A_TABLES.length)}
        </div>
        {results.length > 0 ? (
          <TableList tables={PHASE3A_TABLES} results={results} />
        ) : (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {error ? "Cannot connect to database." : "No data yet."}
          </p>
        )}
        {!p3aReady && results.length > 0 && (
          <p className="text-[10px] mt-3" style={{ color: "var(--color-text-muted)" }}>
            Apply <code>supabase/migrations/20240003_phase3a_material_vault.sql</code> to add these tables.
          </p>
        )}
      </div>

      {/* Phase 3C group */}
      <div className="upsc-card mb-4 fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Phase 3C — Reading Tracker (2 tables)</p>
          {statusBadge(p3cFound, PHASE3C_TABLES.length)}
        </div>
        {results.length > 0 ? (
          <TableList tables={PHASE3C_TABLES} results={results} />
        ) : (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {error ? "Cannot connect to database." : "No data yet."}
          </p>
        )}
        {!p3cReady && results.length > 0 && (
          <p className="text-[10px] mt-3" style={{ color: "var(--color-text-muted)" }}>
            Apply <code>supabase/migrations/20240004_phase3c_reading_tracker_notes.sql</code> to add these tables.
          </p>
        )}
      </div>

      {/* Stage 5 group */}
      <div className="upsc-card mb-4 fade-in">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Stage 5 — Remaining Phases (7 tables)</p>
          {statusBadge(p5Found, STAGE5_TABLES.length)}
        </div>
        {results.length > 0 ? (
          <TableList tables={STAGE5_TABLES} results={results} />
        ) : (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {error ? "Cannot connect to database." : "No data yet."}
          </p>
        )}
        {!p5Ready && results.length > 0 && (
          <p className="text-[10px] mt-3" style={{ color: "var(--color-text-muted)" }}>
            Apply <code>supabase/migrations/20240005_required_reading_matrix.sql</code> to add these tables.
          </p>
        )}
      </div>

      {/* Instructions */}
      {!allReady && (
        <div
          className="mt-2 p-4 rounded-xl text-xs fade-in"
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            color: "var(--color-text-secondary)",
          }}
        >
          <strong style={{ color: "#fbbf24" }}>Migration required</strong>
          <br />
          {!p2aReady && (
            <>Run <code>supabase/migrations/20240001_phase2a_foundation.sql</code> for Phase 2A tables.<br /></>
          )}
          {!p2bReady && (
            <>Run <code>supabase/migrations/20240002_phase2b_planner_dashboard.sql</code> for Phase 2B tables.<br /></>
          )}
          {!p3aReady && (
            <>Run <code>supabase/migrations/20240003_phase3a_material_vault.sql</code> for Phase 3A tables.<br /></>
          )}
          {!p3cReady && (
            <>Run <code>supabase/migrations/20240004_phase3c_reading_tracker_notes.sql</code> for Phase 3C tables.<br /></>
          )}
          {!p5Ready && (
            <>Run <code>supabase/migrations/20240005_required_reading_matrix.sql</code> for Stage 5 tables.</>
          )}
          <br />
          See README for full instructions.
        </div>
      )}
    </AppShell>
  );
}
