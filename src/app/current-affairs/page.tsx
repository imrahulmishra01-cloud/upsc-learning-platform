import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { normalizeOfficialSourceUrl } from "@/lib/ingestion/guards";
import AddEntryForm from "./AddEntryForm";
import EntryActions from "./EntryActions";

export const metadata: Metadata = { title: "Current Affairs" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── Types ─────────────────────────────────────────────────────────────────────
interface CaEntry {
  id: string;
  headline: string;
  article_date: string | null;
  source_name: string | null;
  source_url: string | null;
  source_category: string | null;
  region: string | null;
  gs_papers: string[] | null;
  topic: string | null;
  importance: string | null;
  status: string | null;
  prelims_relevance: boolean | null;
  mains_relevance: boolean | null;
  optional_relevance: boolean | null;
  essay_relevance: boolean | null;
  revision_date: string | null;
  tags: string[] | null;
  created_at: string;
}

// ── Sub-section navigation ─────────────────────────────────────────────────────
const SUB_SECTIONS = [
  { href: "/current-affairs/national",       label: "National",       icon: "🇮🇳" },
  { href: "/current-affairs/international",  label: "International",  icon: "🌐" },
  { href: "/current-affairs/newspapers",     label: "Newspapers",     icon: "📰" },
  { href: "/current-affairs/revision",       label: "Revision",       icon: "🔁" },
  { href: "/current-affairs/reports",        label: "Reports",        icon: "📊" },
  { href: "/current-affairs/explainers",     label: "Explainers",     icon: "💡" },
  { href: "/current-affairs/ingest",         label: "Official Sources", icon: "⬇" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
function importanceBadge(importance: string | null) {
  if (importance === "high")   return { cls: "badge badge-pending",  dot: "#f87171", label: "High" };
  if (importance === "very_high") return { cls: "badge badge-pending", dot: "#ef4444", label: "Critical" };
  if (importance === "low")    return { cls: "badge badge-connected", dot: "#4ade80", label: "Low"  };
  return                               { cls: "badge badge-pending",  dot: "#fbbf24", label: "Med"  };
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function groupByDate(entries: CaEntry[]) {
  const map = new Map<string, CaEntry[]>();
  for (const entry of entries) {
    const key = entry.article_date ?? "Unknown Date";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return map;
}

// ── Page ───────────────────────────────────────────────────────────────────────
interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CurrentAffairsPage(props: PageProps) {
  const searchParams = (await props.searchParams) || {};
  let entries: CaEntry[] = [];
  let migrationPending = false;
  let fetchError: string | null = null;

  // Read filter params
  const filterStatus    = (searchParams.status as string) || "";
  const filterRegion    = (searchParams.region as string) || "";
  const filterGs        = (searchParams.gs as string) || "";
  const filterImportance = (searchParams.importance as string) || "";
  const filterSource    = (searchParams.source as string) || "";

  const supabase = await createClient();

  if (!supabase) {
    migrationPending = true;
  } else {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      try {
        let query = supabase
          .from("current_affairs_entries")
          .select(
            "id, headline, article_date, source_name, source_url, source_category, region, gs_papers, topic, importance, status, prelims_relevance, mains_relevance, optional_relevance, essay_relevance, revision_date, tags, created_at"
          )
          .eq("user_id", user.id)
          .neq("status", "skipped")
          .order("article_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(200);

        if (filterStatus)    query = query.eq("status", filterStatus);
        if (filterRegion)    query = query.eq("region", filterRegion);
        if (filterImportance) query = query.eq("importance", filterImportance);
        if (filterSource)    query = query.eq("source_category", filterSource);
        if (filterGs)        query = query.contains("gs_papers", [filterGs]);

        const { data, error } = await query;

        if (error) {
          if (error.code === "42P01") {
            migrationPending = true;
          } else {
            console.error("[CurrentAffairsPage] fetch error:", error);
            fetchError = error.message;
          }
        } else {
          entries = (data ?? []) as CaEntry[];
        }
      } catch {
        migrationPending = true;
      }
    }
  }

  // ── Stats ────────────────────────────────────────────────────────────────────
  const total         = entries.length;
  const unreadCount   = entries.filter((e) => e.status === "unread").length;
  const revisionCount = entries.filter(
    (e) => e.revision_date && new Date(e.revision_date) <= new Date()
  ).length;

  const grouped = groupByDate(entries);

  // ── Active filter count for indicator ────────────────────────────────────────
  const activeFilters = [filterStatus, filterRegion, filterGs, filterImportance, filterSource].filter(Boolean).length;

  return (
    <AppShell title="Current Affairs">
      {/* Page header */}
      <div className="mb-5 fade-in">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Current Affairs
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Track, tag and revise today&apos;s news for UPSC
        </p>
      </div>

      {/* Stats row */}
      {!migrationPending && (
        <div
          className="fade-in"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0.75rem",
            marginBottom: "1.25rem",
          }}
        >
          {[
            { label: "Total",  value: total,         icon: "📋" },
            { label: "Unread", value: unreadCount,   icon: "🔵" },
            { label: "Due",    value: revisionCount, icon: "🔁" },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="upsc-card"
              style={{ padding: "0.875rem", textAlign: "center" }}
            >
              <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{icon}</div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--color-brand)",
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--color-text-muted)",
                  marginTop: "0.25rem",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-section links */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p className="section-title">Browse by Category</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
          {SUB_SECTIONS.map(({ href, label, icon }) => (
            <Link
              key={href}
              id={`ca-nav-${label.toLowerCase()}`}
              href={href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.5rem 0.875rem",
                borderRadius: "9999px",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-card)",
                color: "var(--color-text-primary)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                textDecoration: "none",
                transition: "border-color 0.2s ease, background 0.2s ease",
              }}
            >
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Filter bar (server-side, link-based) */}
      {!migrationPending && (
        <div className="upsc-card fade-in" style={{ padding: "0.875rem", marginBottom: "1.25rem" }}>
          <p className="section-title" style={{ marginBottom: "0.625rem" }}>
            Filters {activeFilters > 0 && <span className="badge badge-pending">{activeFilters} active</span>}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {/* Status */}
            {["unread", "read", "noted", "revised"].map((s) => (
              <Link
                key={s}
                href={filterStatus === s ? "/current-affairs" : `/current-affairs?status=${s}${filterRegion ? `&region=${filterRegion}` : ""}${filterGs ? `&gs=${filterGs}` : ""}${filterImportance ? `&importance=${filterImportance}` : ""}${filterSource ? `&source=${filterSource}` : ""}`}
                id={`ca-filter-status-${s}`}
                style={{
                  padding: "0.25rem 0.625rem",
                  borderRadius: "0.375rem",
                  border: filterStatus === s ? "1px solid var(--color-brand)" : "1px solid var(--color-border)",
                  background: filterStatus === s ? "rgba(99,102,241,0.15)" : "transparent",
                  color: filterStatus === s ? "var(--color-brand)" : "var(--color-text-muted)",
                  fontSize: "0.75rem",
                  textDecoration: "none",
                  whiteSpace: "nowrap" as const,
                }}
              >
                {s}
              </Link>
            ))}
            <span style={{ width: "1px", background: "var(--color-border)", alignSelf: "stretch", margin: "0 0.125rem" }} />
            {/* Region */}
            {["national", "international"].map((r) => (
              <Link
                key={r}
                href={filterRegion === r ? "/current-affairs" : `/current-affairs?region=${r}${filterStatus ? `&status=${filterStatus}` : ""}${filterGs ? `&gs=${filterGs}` : ""}${filterImportance ? `&importance=${filterImportance}` : ""}${filterSource ? `&source=${filterSource}` : ""}`}
                id={`ca-filter-region-${r}`}
                style={{
                  padding: "0.25rem 0.625rem",
                  borderRadius: "0.375rem",
                  border: filterRegion === r ? "1px solid var(--color-brand)" : "1px solid var(--color-border)",
                  background: filterRegion === r ? "rgba(99,102,241,0.15)" : "transparent",
                  color: filterRegion === r ? "var(--color-brand)" : "var(--color-text-muted)",
                  fontSize: "0.75rem",
                  textDecoration: "none",
                  whiteSpace: "nowrap" as const,
                }}
              >
                {r === "national" ? "🇮🇳 National" : "🌐 International"}
              </Link>
            ))}
            <span style={{ width: "1px", background: "var(--color-border)", alignSelf: "stretch", margin: "0 0.125rem" }} />
            {/* Importance */}
            {["high", "medium", "low"].map((imp) => (
              <Link
                key={imp}
                href={filterImportance === imp ? "/current-affairs" : `/current-affairs?importance=${imp}${filterStatus ? `&status=${filterStatus}` : ""}${filterRegion ? `&region=${filterRegion}` : ""}${filterGs ? `&gs=${filterGs}` : ""}${filterSource ? `&source=${filterSource}` : ""}`}
                id={`ca-filter-imp-${imp}`}
                style={{
                  padding: "0.25rem 0.625rem",
                  borderRadius: "0.375rem",
                  border: filterImportance === imp ? "1px solid var(--color-brand)" : "1px solid var(--color-border)",
                  background: filterImportance === imp ? "rgba(99,102,241,0.15)" : "transparent",
                  color: filterImportance === imp ? "var(--color-brand)" : "var(--color-text-muted)",
                  fontSize: "0.75rem",
                  textDecoration: "none",
                  whiteSpace: "nowrap" as const,
                }}
              >
                {imp === "high" ? "🔴 High" : imp === "low" ? "🟢 Low" : "🟡 Med"}
              </Link>
            ))}
            <span style={{ width: "1px", background: "var(--color-border)", alignSelf: "stretch", margin: "0 0.125rem" }} />
            {/* GS papers */}
            {["GS1", "GS2", "GS3", "GS4", "Essay"].map((gs) => (
              <Link
                key={gs}
                href={filterGs === gs ? "/current-affairs" : `/current-affairs?gs=${gs}${filterStatus ? `&status=${filterStatus}` : ""}${filterRegion ? `&region=${filterRegion}` : ""}${filterImportance ? `&importance=${filterImportance}` : ""}${filterSource ? `&source=${filterSource}` : ""}`}
                id={`ca-filter-gs-${gs.toLowerCase()}`}
                style={{
                  padding: "0.25rem 0.625rem",
                  borderRadius: "0.375rem",
                  border: filterGs === gs ? "1px solid var(--color-brand)" : "1px solid var(--color-border)",
                  background: filterGs === gs ? "rgba(99,102,241,0.15)" : "transparent",
                  color: filterGs === gs ? "var(--color-brand)" : "var(--color-text-muted)",
                  fontSize: "0.75rem",
                  textDecoration: "none",
                  whiteSpace: "nowrap" as const,
                }}
              >
                {gs}
              </Link>
            ))}
            {activeFilters > 0 && (
              <Link
                href="/current-affairs"
                id="ca-filter-clear"
                style={{
                  padding: "0.25rem 0.625rem",
                  borderRadius: "0.375rem",
                  border: "1px solid rgba(239,68,68,0.3)",
                  background: "rgba(239,68,68,0.06)",
                  color: "#f87171",
                  fontSize: "0.75rem",
                  textDecoration: "none",
                  whiteSpace: "nowrap" as const,
                }}
              >
                ✕ Clear
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Add entry form */}
      <AddEntryForm />

      {/* Migration pending state */}
      {migrationPending && (
        <div className="upsc-card fade-in" style={{ textAlign: "center", padding: "2.5rem 1.25rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🗂️</div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.5rem" }}>
            Migration Pending
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", maxWidth: "300px", margin: "0 auto 1rem", lineHeight: 1.6 }}>
            Apply the database migration to enable Current Affairs tracking.
          </p>
          <code style={{ display: "block", padding: "0.625rem 1rem", borderRadius: "0.5rem", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontSize: "0.75rem", fontFamily: "monospace", wordBreak: "break-all", maxWidth: "340px", margin: "0 auto" }}>
            supabase/migrations/20240005_required_reading_matrix.sql
          </code>
        </div>
      )}

      {/* Fetch error */}
      {fetchError && (
        <div className="upsc-card fade-in" style={{ padding: "1rem", background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)" }}>
          <p style={{ fontSize: "0.875rem", color: "#f87171" }}>⚠️ {fetchError}</p>
        </div>
      )}

      {/* Empty state */}
      {!migrationPending && !fetchError && entries.length === 0 && (
        <div className="upsc-card fade-in" style={{ textAlign: "center", padding: "2.5rem 1.25rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📰</div>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "0.375rem" }}>
            No entries {activeFilters > 0 ? "matching filters" : "yet"}
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {activeFilters > 0 ? (
              <>Try clearing filters or <Link href="/current-affairs" style={{ color: "var(--color-brand)" }}>view all</Link>.</>
            ) : (
              "Add your first current affairs entry above."
            )}
          </p>
        </div>
      )}

      {/* Grouped entries */}
      {!migrationPending && entries.length > 0 && (
        <div className="fade-in">
          {Array.from(grouped.entries()).map(([date, dayEntries]) => (
            <div key={date} style={{ marginBottom: "1.5rem" }}>
              <p className="section-title">{formatDate(date)}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {dayEntries.map((entry) => {
                  const imp = importanceBadge(entry.importance);
                  return (
                    <div
                      key={entry.id}
                      id={`ca-entry-${entry.id}`}
                      className="upsc-card"
                      style={{ padding: "1rem" }}
                    >
                      {/* Badges */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.5rem" }}>
                        <span className={imp.cls}>
                          <span style={{ width: 6, height: 6, borderRadius: "9999px", background: imp.dot, display: "inline-block" }} />
                          {imp.label}
                        </span>
                        <span className="badge badge-not-configured">
                          {entry.region === "international" ? "🌐 Intl" : "🇮🇳 Natl"}
                        </span>
                        {entry.status === "unread" && (
                          <span className="badge badge-pending">
                            <span style={{ width: 6, height: 6, borderRadius: "9999px", background: "#fbbf24", display: "inline-block" }} />
                            Unread
                          </span>
                        )}
                        {entry.status === "revised" && (
                          <span className="badge badge-connected">✓ Revised</span>
                        )}
                        {(entry.gs_papers ?? []).map((gs) => (
                          <span key={gs} className="badge badge-connected">{gs}</span>
                        ))}
                      </div>

                      {/* Headline */}
                      <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.45, marginBottom: "0.375rem" }}>
                        {entry.headline}
                      </p>

                      {/* Meta */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {entry.source_name && <span>📰 {entry.source_name}</span>}
                        {entry.topic && <span>🏷 {entry.topic}</span>}
                        {entry.prelims_relevance && <span style={{ color: "#93c5fd" }}>P</span>}
                        {entry.mains_relevance && <span style={{ color: "#c4b5fd" }}>M</span>}
                        {entry.revision_date && (
                          <span style={{ color: new Date(entry.revision_date) <= new Date() ? "#f87171" : "var(--color-text-muted)" }}>
                            🔁 {formatDate(entry.revision_date)}
                          </span>
                        )}
                        {(entry.tags ?? []).length > 0 && (
                          <span>{(entry.tags ?? []).slice(0, 3).join(", ")}</span>
                        )}
                      </div>

                      {/* Inline actions & Open Source */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                        <EntryActions entryId={entry.id} currentStatus={entry.status} optionalRelevance={entry.optional_relevance} essayRelevance={entry.essay_relevance} />
                        
                        {entry.source_url ? (
                          <a
                            href={normalizeOfficialSourceUrl(entry.source_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open official source"
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
