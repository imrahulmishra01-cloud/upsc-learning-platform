import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { normalizeOfficialSourceUrl } from "@/lib/ingestion/guards";
import EntryActions from "../EntryActions";
import AddReportForm from "./AddReportForm";

export const metadata: Metadata = { title: "Reports | Current Affairs" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CaEntry {
  id: string;
  headline: string;
  article_date: string | null;
  source_name: string | null;
  source_url: string | null;
  region: string | null;
  gs_papers: string[] | null;
  topic: string | null;
  importance: string | null;
  status: string | null;
  prelims_relevance: boolean | null;
  mains_relevance: boolean | null;
  revision_date: string | null;
  user_notes: string | null;
  tags: string[] | null;
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

export default async function ReportsPage() {
  let entries: CaEntry[] = [];
  let migrationPending = false;

  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("current_affairs_entries")
        .select("id, headline, article_date, source_name, source_url, region, gs_papers, topic, importance, status, prelims_relevance, mains_relevance, revision_date, user_notes, tags")
        .eq("user_id", user.id)
        .eq("source_category", "report")
        .neq("status", "skipped")
        .order("article_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(150);
      if (error?.code === "42P01") migrationPending = true;
      else entries = (data ?? []) as CaEntry[];
    }
  }

  return (
    <AppShell title="Reports Hub">
      <div className="mb-5 fade-in">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          <Link
            href="/current-affairs"
            style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem", textDecoration: "none" }}
          >
            ← Current Affairs
          </Link>
        </div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          📊 Official Reports Hub
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {entries.length} report entries
        </p>
      </div>

      <AddReportForm />

      {migrationPending && (
        <div className="upsc-card fade-in" style={{ padding: "1.5rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Migration pending — apply supabase/migrations/20240005_required_reading_matrix.sql
          </p>
        </div>
      )}

      {!migrationPending && entries.length === 0 && (
        <div className="upsc-card fade-in" style={{ padding: "2.5rem 1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📊</div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            No official reports added yet.
          </p>
        </div>
      )}

      {!migrationPending && entries.length > 0 && (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {entries.map((entry) => {
            const imp = importanceDot(entry.importance);
            return (
              <div
                key={entry.id}
                id={`ca-report-${entry.id}`}
                className="upsc-card"
                style={{ padding: "1rem" }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.5rem" }}>
                  <span className="badge badge-pending">
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: imp.color, display: "inline-block" }} />
                    {imp.label}
                  </span>
                  <span className="badge badge-not-configured">
                    {entry.region === "international" ? "🌐 Intl" : "🇮🇳 Natl"}
                  </span>
                  {entry.status === "unread" && (
                    <span className="badge badge-pending">● Unread</span>
                  )}
                  {entry.status === "revised" && (
                    <span className="badge badge-connected">✓ Revised</span>
                  )}
                  {(entry.gs_papers ?? []).map((gs) => (
                    <span key={gs} className="badge badge-connected">{gs}</span>
                  ))}
                </div>
                <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.45, marginBottom: "0.25rem" }}>
                  {entry.headline}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {entry.article_date && <span>📅 {formatDate(entry.article_date)}</span>}
                  {entry.source_name && <span>🏢 {entry.source_name}</span>}
                  {entry.topic && <span>🏷 {entry.topic}</span>}
                  {entry.prelims_relevance && <span style={{ color: "#93c5fd" }}>Prelims</span>}
                  {entry.mains_relevance && <span style={{ color: "#c4b5fd" }}>Mains</span>}
                  {entry.revision_date && (
                    <span style={{ color: new Date(entry.revision_date) <= new Date() ? "#f87171" : "var(--color-text-muted)" }}>
                      🔁 {formatDate(entry.revision_date)}
                    </span>
                  )}
                </div>

                {entry.user_notes && (
                  <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "var(--color-bg-body)", borderRadius: "0.5rem", fontSize: "0.8125rem", color: "var(--color-text-primary)", whiteSpace: "pre-wrap" }}>
                    <span style={{ fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: "0.25rem", fontSize: "0.75rem" }}>MY NOTES</span>
                    {entry.user_notes}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                  <EntryActions entryId={entry.id} currentStatus={entry.status} />
                  
                  {entry.source_url ? (
                    <a
                      href={normalizeOfficialSourceUrl(entry.source_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open official report"
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "0.375rem",
                        background: "rgba(99,102,241,0.08)",
                        color: "var(--color-brand)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        border: "1px solid rgba(99,102,241,0.2)"
                      }}
                    >
                      ↗ Open Source
                    </a>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      No source link saved
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
