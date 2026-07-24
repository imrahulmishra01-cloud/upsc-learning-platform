import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "History Optional" };
export const dynamic = "force-dynamic";

const SECTIONS = [
  { id: "ancient-india",              name: "Ancient India"              },
  { id: "medieval-india",             name: "Medieval India"             },
  { id: "modern-india",               name: "Modern India"               },
  { id: "world-history",              name: "World History"              },
  { id: "post-independence-india",    name: "Post-Independence India"    },
  { id: "art-and-culture",            name: "Art and Culture"            },
  { id: "socio-religious-movements",  name: "Socio-Religious Movements"  },
  { id: "indian-national-movement",   name: "Indian National Movement"   },
  { id: "constitutional-development", name: "Constitutional Development" },
  { id: "post-war-world-order",       name: "Post-War World Order"       },
];

type ProgressRow = {
  topic_name: string;
  completion_pct: number;
  notes_count: number;
  last_revised_at: string | null;
};

function statusBadge(pct: number) {
  if (pct === 0)
    return <span className="badge badge-not-configured" style={{ fontSize: "0.65rem" }}>Not started</span>;
  if (pct < 100)
    return <span className="badge badge-pending" style={{ fontSize: "0.65rem" }}>In progress</span>;
  return <span className="badge badge-connected" style={{ fontSize: "0.65rem" }}>Completed</span>;
}

function progressBar(pct: number) {
  return (
    <div
      className="w-full rounded-full overflow-hidden mt-2"
      style={{ height: "4px", background: "var(--color-border)" }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background:
            pct === 100
              ? "var(--color-brand)"
              : pct > 0
              ? "var(--color-warning)"
              : "transparent",
        }}
      />
    </div>
  );
}

export default async function HistoryOptionalPage() {
  const supabase = await createClient();
  const progressMap: Record<string, ProgressRow> = {};
  let tableMissing = false;

  if (supabase) {
    await supabase.auth.getUser();

    try {
      const { data, error } = await supabase
        .from("topic_progress")
        .select("topic_name, completion_pct, notes_count, last_revised_at")
        .ilike("subject_area", "%History Optional%");

      if (error) {
        if (error.code === "42P01") tableMissing = true;
        else console.error("[history-optional] topic_progress error:", error.message);
      } else if (data) {
        for (const row of data as ProgressRow[]) {
          progressMap[row.topic_name.toLowerCase()] = row;
        }
      }
    } catch {
      tableMissing = true;
    }
  }

  return (
    <AppShell title="History Optional">
      {/* Back + header */}
      <div className="mb-5 fade-in">
        <Link
          href="/optional"
          className="text-xs mb-3 inline-flex items-center gap-1 no-underline"
          style={{ color: "var(--color-text-muted)" }}
        >
          ← Optional Subject
        </Link>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          📜 History Optional
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Paper I &amp; Paper II — {SECTIONS.length} sections
        </p>
      </div>

      {tableMissing && (
        <div
          className="upsc-card mb-4 fade-in text-xs"
          style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.06)" }}
        >
          ⚠ <strong style={{ color: "var(--color-warning)" }}>Migration pending</strong> — The{" "}
          <code>topic_progress</code> table is not yet available. Progress will appear after migration.
        </div>
      )}

      {/* Overall progress summary */}
      {!tableMissing && (
        <div className="upsc-card mb-5 fade-in">
          <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
            Overall Coverage
          </p>
          {(() => {
            const values = Object.values(progressMap);
            const avg = values.length
              ? Math.round(values.reduce((s, r) => s + (r.completion_pct ?? 0), 0) / values.length)
              : 0;
            const completed = values.filter((r) => r.completion_pct >= 100).length;
            return (
              <>
                <p className="text-2xl font-bold mt-1" style={{ color: "var(--color-brand)" }}>
                  {avg}%
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {completed} / {SECTIONS.length} sections fully covered
                </p>
                <div
                  className="w-full rounded-full overflow-hidden mt-2"
                  style={{ height: "4px", background: "var(--color-border)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${avg}%`,
                      background: avg >= 100 ? "var(--color-brand)" : "var(--color-warning)",
                    }}
                  />
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Section list */}
      <p className="section-title fade-in">Sections</p>
      <div className="flex flex-col gap-3 fade-in">
        {SECTIONS.map((sec) => {
          const prog = progressMap[sec.name.toLowerCase()];
          const pct = prog?.completion_pct ?? 0;
          const notes = prog?.notes_count ?? 0;
          const lastRevised = prog?.last_revised_at
            ? new Date(prog.last_revised_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })
            : null;

          return (
            <div key={sec.id} id={`history-section-${sec.id}`} className="upsc-card fade-in">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {sec.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      📝 {notes} note{notes !== 1 ? "s" : ""}
                    </span>
                    {lastRevised && (
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        🔁 {lastRevised}
                      </span>
                    )}
                  </div>
                </div>
                {statusBadge(pct)}
              </div>
              {progressBar(pct)}
              {pct > 0 && (
                <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                  {pct}% covered
                </p>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
