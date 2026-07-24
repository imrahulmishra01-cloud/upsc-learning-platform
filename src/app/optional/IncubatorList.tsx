import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { normalizeOfficialSourceUrl } from "@/lib/ingestion/guards";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

interface IncubatorEntry {
  id: string;
  headline: string;
  article_date: string | null;
  source_url: string | null;
  source_category: string | null;
  optional_relevance: boolean | null;
  essay_relevance: boolean | null;
}

export default async function IncubatorList() {
  const supabase = await createClient();
  let entries: IncubatorEntry[] = [];
  let tableMissing = false;

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("current_affairs_entries")
        .select("id, headline, article_date, source_url, source_category, optional_relevance, essay_relevance")
        .eq("user_id", user.id)
        .or("optional_relevance.eq.true,essay_relevance.eq.true")
        .order("article_date", { ascending: false })
        .limit(20);

      if (error) {
        if (error.code === "42P01") tableMissing = true;
      } else if (data) {
        entries = data as IncubatorEntry[];
      }
    }
  }

  if (tableMissing || entries.length === 0) {
    return (
      <div className="upsc-card fade-in mb-6 p-4 text-center">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          No entries added to the Optional/Essay Incubator yet.
          <br />
          <span style={{ fontSize: "0.75rem", marginTop: "0.5rem", display: "inline-block" }}>
            Add them from the{" "}
            <Link href="/current-affairs" style={{ color: "var(--color-brand)" }}>
              Current Affairs
            </Link>{" "}
            page using the &quot;★ Optional&quot; or &quot;★ Essay&quot; buttons.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 mb-6 fade-in">
      {entries.map((entry) => (
        <div key={entry.id} className="upsc-card p-3">
          <div className="flex flex-wrap gap-2 mb-2">
            {entry.optional_relevance && (
              <span className="badge" style={{ background: "rgba(168,85,247,0.1)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.2)" }}>
                ★ Optional
              </span>
            )}
            {entry.essay_relevance && (
              <span className="badge" style={{ background: "rgba(236,72,153,0.1)", color: "#f472b6", border: "1px solid rgba(236,72,153,0.2)" }}>
                ★ Essay
              </span>
            )}
            {entry.source_category === "report" && <span className="badge badge-pending">Report</span>}
            {entry.source_category === "pib" && <span className="badge badge-pending">PIB</span>}
            {entry.source_category === "prs" && <span className="badge badge-pending">PRS</span>}
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            {entry.source_url ? (
              <a
                href={normalizeOfficialSourceUrl(entry.source_url)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "underline", textDecorationColor: "var(--color-border)" }}
              >
                {entry.headline}
              </a>
            ) : (
              entry.headline
            )}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            📅 {formatDate(entry.article_date)}
          </p>
        </div>
      ))}
    </div>
  );
}
