import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getSourcesByCategory } from "@/lib/ingestion/sources";
import AddInternationalEntryForm from "./AddInternationalEntryForm";
import InternationalSourceCatalog from "./InternationalSourceCatalog";

export const metadata: Metadata = { title: "International | Current Affairs" };
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
  prelims_relevance: boolean | null;
  mains_relevance: boolean | null;
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

export default async function InternationalPage() {
  let entries: CaEntry[] = [];
  let migrationPending = false;

  const supabase = await createClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("current_affairs_entries")
        .select("id, headline, article_date, source_name, gs_papers, topic, importance, status, prelims_relevance, mains_relevance, tags")
        .eq("user_id", user.id)
        .eq("region", "international")
        .neq("status", "skipped")
        .order("article_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(150);
      if (error?.code === "42P01") migrationPending = true;
      else entries = (data ?? []) as CaEntry[];
    }
  }

  const internationalSources = getSourcesByCategory("international");

  return (
    <AppShell title="International">
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
          🌐 International
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {entries.length} international entries
        </p>
      </div>

      <AddInternationalEntryForm />
      <InternationalSourceCatalog sources={internationalSources} />

      {migrationPending && (
        <div className="upsc-card fade-in" style={{ padding: "1.5rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Migration pending — apply supabase/migrations/20240005_required_reading_matrix.sql
          </p>
        </div>
      )}

      {!migrationPending && entries.length === 0 && (
        <div className="upsc-card fade-in" style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🌐</div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            No international entries yet. Add from the{" "}
            <Link href="/current-affairs" style={{ color: "var(--color-brand)" }}>
              main page
            </Link>{" "}
            and set Region to International.
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
                id={`ca-international-${entry.id}`}
                className="upsc-card"
                style={{ padding: "1rem" }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.5rem" }}>
                  <span className="badge badge-pending">
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: imp.color, display: "inline-block" }} />
                    {imp.label}
                  </span>
                  {entry.status === "unread" && (
                    <span className="badge badge-pending">● Unread</span>
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
                  {entry.source_name && <span>📰 {entry.source_name}</span>}
                  {entry.topic && <span>🏷 {entry.topic}</span>}
                  {entry.prelims_relevance && <span style={{ color: "#93c5fd" }}>Prelims</span>}
                  {entry.mains_relevance && <span style={{ color: "#c4b5fd" }}>Mains</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
