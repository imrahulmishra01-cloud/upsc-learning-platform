import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "PYQ Practice | UPSC App" };
export const dynamic = "force-dynamic";

const MISSING_TABLE = "42P01";

interface PYQStats {
  totalQuestions: number;
  totalAttempts: number;
  pendingRevision: number;
  migrationPending: boolean;
}

async function fetchPYQStats(): Promise<PYQStats> {
  const supabase = await createClient();
  if (!supabase) {
    return { totalQuestions: 0, totalAttempts: 0, pendingRevision: 0, migrationPending: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { totalQuestions: 0, totalAttempts: 0, pendingRevision: 0, migrationPending: false };
  }

  const [qRes, aRes, revRes] = await Promise.allSettled([
    supabase.from("pyq_questions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("pyq_attempts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("pyq_attempts").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("revision_needed", true),
  ]);

  const isMissingTable = (r: PromiseSettledResult<unknown>) =>
    r.status === "fulfilled" &&
    (r.value as { error?: { code?: string } })?.error?.code === MISSING_TABLE;

  if (isMissingTable(qRes)) {
    return { totalQuestions: 0, totalAttempts: 0, pendingRevision: 0, migrationPending: true };
  }

  const totalQuestions =
    qRes.status === "fulfilled" ? ((qRes.value as { count?: number | null })?.count ?? 0) : 0;
  const totalAttempts =
    aRes.status === "fulfilled" ? ((aRes.value as { count?: number | null })?.count ?? 0) : 0;
  const pendingRevision =
    revRes.status === "fulfilled" ? ((revRes.value as { count?: number | null })?.count ?? 0) : 0;

  return { totalQuestions, totalAttempts, pendingRevision, migrationPending: false };
}

const NAV_LINKS = [
  { href: "/pyq/prelims", icon: "📋", label: "Prelims PYQ", desc: "GS Paper 1 & CSAT questions" },
  { href: "/pyq/mains", icon: "📝", label: "Mains PYQ", desc: "GS 1–4, Essay, Optional" },
  { href: "/pyq/csat", icon: "🔢", label: "CSAT PYQ", desc: "Aptitude & comprehension" },
  { href: "/pyq/essay", icon: "✍️", label: "Essay PYQ", desc: "Essay topic bank" },
  { href: "/pyq/optional", icon: "📚", label: "Optional PYQ", desc: "Subject-specific questions" },
  { href: "/pyq/trends", icon: "📈", label: "Trend Analysis", desc: "Topics that repeat most" },
  { href: "/pyq/mistakes", icon: "🔍", label: "Mistake Log", desc: "Factual & concept errors" },
];

export default async function PYQHubPage() {
  const stats = await fetchPYQStats();

  return (
    <AppShell title="PYQ Practice">
      {/* Header */}
      <div className="mb-6 fade-in">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          📋 PYQ Practice
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Previous Year Questions — UPSC Prelims, Mains &amp; Essay
        </p>
      </div>

      {/* Migration pending notice */}
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
          Run the PYQ migration to enable question tracking. Stats will appear after migration.
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-6 fade-in">
        {[
          { label: "Questions", value: stats.totalQuestions, icon: "📚" },
          { label: "Attempts", value: stats.totalAttempts, icon: "✏️" },
          { label: "For Revision", value: stats.pendingRevision, icon: "🔁" },
        ].map((s) => (
          <div
            key={s.label}
            className="upsc-card text-center"
            style={{ padding: "1rem 0.75rem" }}
          >
            <div className="text-xl mb-1">{s.icon}</div>
            <div
              className="text-xl font-bold"
              style={{ color: "var(--color-brand)" }}
            >
              {stats.migrationPending ? "—" : s.value}
            </div>
            <div
              className="text-xs mt-0.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Info note */}
      <div
        className="mb-5 px-4 py-3 rounded-xl text-xs fade-in"
        style={{
          background: "rgba(34, 197, 94, 0.06)",
          border: "1px solid rgba(34, 197, 94, 0.15)",
          color: "var(--color-text-muted)",
        }}
      >
        📌 Add questions manually from{" "}
        <strong style={{ color: "var(--color-text-secondary)" }}>
          UPSC official papers
        </strong>{" "}
        — supports Prelims GS &amp; CSAT, all Mains papers, and Essay.
      </div>

      {/* Navigation links */}
      <p className="section-title">Sections</p>
      <div className="grid grid-cols-1 gap-3 fade-in">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            id={`pyq-nav-${link.href.replace("/pyq/", "")}`}
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
