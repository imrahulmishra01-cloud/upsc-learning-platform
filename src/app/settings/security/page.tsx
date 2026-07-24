import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = { title: "Security Status" };

const RLS_POLICIES = [
  { table: "profiles",             policies: ["own read", "own update", "peer read"] },
  { table: "allowed_users",        policies: ["read if allowed"] },
  { table: "app_settings",         policies: ["read if allowed"] },
  { table: "audit_logs",           policies: ["own read"] },
  { table: "source_registry",      policies: ["read if allowed"] },
  { table: "material_import_logs", policies: ["own (all operations)"] },
  { table: "syllabus_papers",      policies: ["read if allowed"] },
  { table: "syllabus_topics",      policies: ["read if allowed"] },
  { table: "syllabus_subtopics",   policies: ["read if allowed"] },
  { table: "revision_intervals",   policies: ["read if allowed"] },
  { table: "topic_progress",       policies: ["own private (all)", "shared read"] },
  { table: "topic_notes",          policies: ["own private (all)", "shared read"] },
  { table: "revision_tasks",       policies: ["own (all operations)"] },
  { table: "weakness_tags",        policies: ["own private (all)", "shared read"] },
  { table: "ai_usage_limits",      policies: ["own (all operations)"] },
  { table: "ai_cache",             policies: ["own (all operations)"] },
];

export default function SecuritySettingsPage() {
  return (
    <AppShell title="Security Status">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-xs mb-4 fade-in"
        style={{ color: "var(--color-text-muted)" }}
      >
        ← Settings
      </Link>

      <h1
        className="text-xl font-bold mb-1 fade-in"
        style={{ color: "var(--color-text-primary)" }}
      >
        Security & RLS Status
      </h1>
      <p className="text-xs mb-5 fade-in" style={{ color: "var(--color-text-muted)" }}>
        Row Level Security policies defined for Phase 2A. Applied when migration is run.
      </p>

      {/* Access model summary */}
      <div className="upsc-card mb-4 fade-in">
        <p className="section-title mb-3">Configurable Allowlist Access Model</p>
        <ul className="space-y-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          {[
            "Auth via Supabase magic link — no passwords",
            "Allowlist gate: APP_ALLOWED_EMAIL_1 + APP_ALLOWED_EMAIL_2",
            "DB allowlist: allowed_users table (is_active=true)",
            "Roles: owner · second_user",
            "Private rows: only the creator can read/write",
            "Shared rows: allowed users can read",
            "No user can read another's private data",
            "Service role key never exposed to browser",
            "is_allowed_user() RLS helper for reference tables",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span style={{ color: "var(--color-brand)" }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* RLS policy table */}
      <div className="upsc-card fade-in">
        <p className="section-title mb-3">RLS Policies ({RLS_POLICIES.reduce((a, r) => a + r.policies.length, 0)} total)</p>
        <div className="space-y-3">
          {RLS_POLICIES.map(({ table, policies }) => (
            <div key={table} className="pb-3 border-b last:border-b-0" style={{ borderColor: "var(--color-border)" }}>
              <p className="text-xs font-mono font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                {table}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {policies.map((p) => (
                  <span
                    key={p}
                    className="badge badge-connected text-[10px]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="mt-4 p-4 rounded-xl text-xs fade-in"
        style={{
          background: "rgba(34, 197, 94, 0.06)",
          border: "1px solid rgba(34, 197, 94, 0.2)",
          color: "var(--color-text-secondary)",
        }}
      >
        <strong style={{ color: "#4ade80" }}>RLS active after migration.</strong>{" "}
        Policies are applied when you run the Phase 2A migration SQL in your Supabase
        Dashboard. No unsafe public policies exist.
      </div>
    </AppShell>
  );
}
