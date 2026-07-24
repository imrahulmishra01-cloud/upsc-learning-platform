import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { getStudyGoals, getStudyPlans, getPlannerSummary } from "@/lib/db/planner";
import GoalsClient from "./GoalsClient";

export const metadata: Metadata = { title: "Goals" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GoalsPage() {
  const [goals, plans, summary] = await Promise.all([getStudyGoals(), getStudyPlans(), getPlannerSummary()]);

  return (
    <AppShell title="Goals">
      <Link href="/planner" className="inline-flex items-center gap-1.5 text-xs mb-4 fade-in" style={{ color: "var(--color-text-muted)" }}>
        ← Planner
      </Link>
      <h1 className="text-xl font-bold mb-1 fade-in" style={{ color: "var(--color-text-primary)" }}>
        Study Goals
      </h1>
      <p className="text-xs mb-5 fade-in" style={{ color: "var(--color-text-muted)" }}>
        High-level milestones for your UPSC preparation.
      </p>

      {summary.caRevisionDueCount > 0 && (
        <Link
          href="/current-affairs/revision"
          className="upsc-card flex items-center justify-between no-underline group fade-in mb-5"
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.3)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                Pending Current Affairs Revisions
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {summary.caRevisionDueCount} item{summary.caRevisionDueCount !== 1 ? "s" : ""} overdue
              </p>
            </div>
          </div>
          <span className="text-lg" style={{ color: "#fbbf24" }}>›</span>
        </Link>
      )}

      <div className="fade-in">
        <GoalsClient initialGoals={goals} plans={plans} />
      </div>
    </AppShell>
  );
}
