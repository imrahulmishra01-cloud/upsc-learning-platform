import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import RevisionActions from "./RevisionActions";

export const metadata: Metadata = { title: "Revision | Current Affairs" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CaEntry {
  id: string;
  headline: string;
  article_date: string | null;
  source_name: string | null;
  gs_papers: string[] | null;
  topic: string | null;
  importance: string | null;
  status: string | null;
  revision_date: string | null;
  region: string | null;
  prelims_relevance: boolean | null;
  mains_relevance: boolean | null;
  user_notes: string | null;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function importanceDot(importance: string | null) {
  if (importance === "high")  return { color: "#f87171", label: "High" };
  if (importance === "low")   return { color: "#4ade80", label: "Low"  };
  return                             { color: "#fbbf24", label: "Med"  };
}

function isOverdue(revision_date: string | null) {
  if (!revision_date) return false;
  return new Date(revision_date) <= new Date();
}

export default async function RevisionPage() {
  let entries: CaEntry[] = [];
  let migrationPending = false;

  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("current_affairs_entries")
        .select("id, headline, article_date, source_name, gs_papers, topic, importance, status, revision_date, region, prelims_relevance, mains_relevance, user_notes")
        .eq("user_id", user.id)
        .neq("status", "skipped")
        .not("revision_date", "is", null)
        .order("revision_date", { ascending: true })
        .limit(150);
      if (error?.code === "42P01") migrationPending = true;
      else entries = (data ?? []) as CaEntry[];
    }
  }

  const overdue = entries.filter((e) => isOverdue(e.revision_date));
  const upcoming = entries.filter((e) => !isOverdue(e.revision_date));

  return (
    <AppShell title="Revision">
      <div className="mb-5 fade-in">
        <div style={{ marginBottom: "0.25rem" }}>
          <Link
            href="/current-affairs"
            style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", textDecoration: "none" }}
          >
            ← Current Affairs
          </Link>
        </div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          🔁 Revision Queue
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {overdue.length} due · {upcoming.length} upcoming
        </p>
      </div>

      {migrationPending && (
        <div className="upsc-card fade-in" style={{ padding: "1.5rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Migration pending — apply supabase/migrations/20240005_required_reading_matrix.sql
          </p>
        </div>
      )}

      {!migrationPending && entries.length === 0 && (
        <div className="upsc-card fade-in" style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔁</div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            No revision items. Set a revision date when adding entries.
          </p>
          <Link
            href="/current-affairs"
            style={{ color: "var(--color-brand)", fontSize: "0.875rem", display: "inline-block", marginTop: "0.75rem" }}
          >
            ← Go back to add entries
          </Link>
        </div>
      )}

      {!migrationPending && overdue.length > 0 && (
        <div className="fade-in" style={{ marginBottom: "1.5rem" }}>
          <p className="section-title" style={{ color: "#f87171" }}>⚠️ Due Now ({overdue.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {overdue.map((entry) => {
              const imp = importanceDot(entry.importance);
              return (
                <div
                  key={entry.id}
                  id={`ca-revision-due-${entry.id}`}
                  className="upsc-card"
                  style={{
                    padding: "1rem",
                    borderColor: "rgba(248, 113, 113, 0.3)",
                    background: "rgba(248, 113, 113, 0.04)",
                  }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.5rem" }}>
                    <span className="badge badge-pending">
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: imp.color, display: "inline-block" }} />
                      {imp.label}
                    </span>
                    <span className="badge" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>
                      Due {formatDate(entry.revision_date)}
                    </span>
                    {(entry.gs_papers ?? []).map((gs) => (
                      <span key={gs} className="badge badge-connected">{gs}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.45, marginBottom: "0.25rem" }}>
                    {entry.headline}
                  </p>
                  {entry.user_notes && (
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                      {entry.user_notes}
                    </p>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                    {entry.source_name && <span>📰 {entry.source_name}</span>}
                    {entry.topic && <span>🏷 {entry.topic}</span>}
                    {entry.prelims_relevance && <span style={{ color: "#93c5fd" }}>Prelims</span>}
                    {entry.mains_relevance && <span style={{ color: "#c4b5fd" }}>Mains</span>}
                  </div>
                  <RevisionActions entryId={entry.id} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!migrationPending && upcoming.length > 0 && (
        <div className="fade-in">
          <p className="section-title">📅 Upcoming ({upcoming.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {upcoming.map((entry) => {
              const imp = importanceDot(entry.importance);
              return (
                <div
                  key={entry.id}
                  id={`ca-revision-upcoming-${entry.id}`}
                  className="upsc-card"
                  style={{ padding: "1rem" }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.5rem" }}>
                    <span className="badge badge-pending">
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: imp.color, display: "inline-block" }} />
                      {imp.label}
                    </span>
                    <span className="badge badge-not-configured">
                      Due {formatDate(entry.revision_date)}
                    </span>
                    {(entry.gs_papers ?? []).map((gs) => (
                      <span key={gs} className="badge badge-connected">{gs}</span>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.45, marginBottom: "0.25rem" }}>
                    {entry.headline}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    {entry.source_name && <span>📰 {entry.source_name}</span>}
                    {entry.topic && <span>🏷 {entry.topic}</span>}
                  </div>
                  <RevisionActions entryId={entry.id} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
