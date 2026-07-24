import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { OFFICIAL_SOURCES } from "@/lib/ingestion/sources";
import OfficialSourcePanel from "../OfficialSourcePanel";

export const metadata: Metadata = { title: "Official Source Ingest | Current Affairs" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IngestPage() {
  // Auth gate — page is server-rendered, so we check auth here
  const supabase = await createClient();
  let unauthorised = false;

  if (!supabase) {
    unauthorised = true;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) unauthorised = true;
  }

  if (unauthorised) {
    return (
      <AppShell title="Ingest">
        <div className="upsc-card fade-in" style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)" }}>Please log in to access ingestion.</p>
        </div>
      </AppShell>
    );
  }

  // Build source list from server-side allowlist (never from client)
  const sources = OFFICIAL_SOURCES.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    region: s.region,
    suggestedGsPapers: s.suggestedGsPapers,
    topicHint: s.topicHint ?? null,
    fetchMode: s.fetchMode,
    enabledForAutoFetch: s.enabledForAutoFetch,
    allowed: s.allowed,
    language: s.language,
    statusMessage: s.statusMessage,
  }));

  return (
    <AppShell title="Official Source Ingest">
      {/* Header */}
      <div className="mb-5 fade-in">
        <div style={{ marginBottom: "0.25rem" }}>
          <Link
            href="/current-affairs"
            style={{
              color: "var(--color-text-muted)",
              fontSize: "0.8125rem",
              textDecoration: "none",
            }}
          >
            ← Current Affairs
          </Link>
        </div>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          ⬇ Official Source Ingestion
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Fetch current affairs from PIB, PRS, and RBI. No scraping. No paywalls.
        </p>
      </div>

      {/* Legal note */}
      <div
        className="upsc-card fade-in"
        style={{
          padding: "0.875rem 1rem",
          marginBottom: "1.25rem",
          background: "rgba(99,102,241,0.06)",
          borderColor: "rgba(99,102,241,0.25)",
        }}
      >
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--color-text-primary)" }}>Legal &amp; Privacy:</strong>{" "}
          Only official government RSS feeds (PIB, PRS, RBI) are used. No full article text
          is stored — only headline, date, source name, and article link. All entries appear as{" "}
          <strong>unread</strong> and are fully editable/archivable by you.
          <br /><br />
          <strong>Note:</strong> Ingestion stores metadata only. Use Open Source to read the official page.
        </p>
      </div>

      {/* Source panel (client component) */}
      <div className="fade-in">
        <p className="section-title" style={{ marginBottom: "0.75rem" }}>
          Available Sources ({sources.length})
        </p>
        <OfficialSourcePanel sources={sources} />
      </div>
    </AppShell>
  );
}
