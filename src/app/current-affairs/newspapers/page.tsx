import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { normalizeOfficialSourceUrl } from "@/lib/ingestion/guards";
import EntryActions from "../EntryActions";
import AddNewspaperForm from "./AddNewspaperForm";

export const metadata: Metadata = { title: "Newspapers | Current Affairs" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CaEntry {
  id: string;
  headline: string;
  article_date: string | null;
  source_name: string | null;
  source_url: string | null;
  source_category: string | null;
  gs_papers: string[] | null;
  topic: string | null;
  importance: string | null;
  status: string | null;
  region: string | null;
  user_notes: string | null;
  revision_date: string | null;
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

/** Group entries by source_name */
function groupBySource(entries: CaEntry[]) {
  const map = new Map<string, CaEntry[]>();
  for (const entry of entries) {
    const key = entry.source_name ?? "Unknown Source";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return map;
}

export default async function NewspapersPage() {
  let entries: CaEntry[] = [];
  let migrationPending = false;

  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("current_affairs_entries")
        .select("id, headline, article_date, source_name, source_url, source_category, gs_papers, topic, importance, status, region, user_notes, revision_date")
        .eq("user_id", user.id)
        .in("source_category", ["newspaper", "pib", "prs"])
        .neq("status", "skipped")
        .order("source_name", { ascending: true })
        .order("article_date", { ascending: false })
        .limit(150);
      if (error?.code === "42P01") migrationPending = true;
      else entries = (data ?? []) as CaEntry[];
    }
  }

  const grouped = groupBySource(entries);

  return (
    <AppShell title="Newspapers">
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
          📰 Newspapers &amp; PIB
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {entries.length} entries from newspapers, PIB and PRS
        </p>
      </div>

      <AddNewspaperForm />

      {migrationPending && (
        <div className="upsc-card fade-in" style={{ padding: "1.5rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Migration pending — apply supabase/migrations/20240005_required_reading_matrix.sql
          </p>
        </div>
      )}

      {!migrationPending && entries.length === 0 && (
        <div className="upsc-card fade-in" style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📰</div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            No newspaper entries yet. Add from the{" "}
            <Link href="/current-affairs" style={{ color: "var(--color-brand)" }}>
              main page
            </Link>{" "}
            and set Source Type to Newspaper or PIB.
          </p>
        </div>
      )}

      {!migrationPending && entries.length > 0 && (
        <div className="fade-in">
          {Array.from(grouped.entries()).map(([source, sourceEntries]) => (
            <div key={source} style={{ marginBottom: "1.5rem" }}>
              <p className="section-title">📰 {source}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {sourceEntries.map((entry) => {
                  const imp = importanceDot(entry.importance);
                  return (
                    <div
                      key={entry.id}
                      id={`ca-newspapers-${entry.id}`}
                      className="upsc-card"
                      style={{ padding: "0.875rem" }}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.375rem" }}>
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
                        {entry.topic && <span>🏷 {entry.topic}</span>}
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
                            title="Open source"
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
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
