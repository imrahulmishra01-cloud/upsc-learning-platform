import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { getStudyPlans } from "@/lib/db/planner";
import CreatePlanForm from "./CreatePlanForm";
import PlansClient from "./PlansClient";

export const metadata: Metadata = { title: "Study Plans" };

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Server action — called by CreatePlanForm on success to reload fresh data
async function reloadPage() {
  "use server";
  redirect("/planner/plans");
}

export default async function PlansPage() {
  const plans = await getStudyPlans();

  return (
    <AppShell title="Study Plans">
      <Link
        href="/planner"
        className="inline-flex items-center gap-1.5 text-xs mb-4 fade-in"
        style={{ color: "var(--color-text-muted)" }}
      >
        ← Planner
      </Link>

      <h1 className="text-xl font-bold mb-1 fade-in" style={{ color: "var(--color-text-primary)" }}>
        Study Plans
      </h1>
      <p className="text-xs mb-5 fade-in" style={{ color: "var(--color-text-muted)" }}>
        {plans.length === 0
          ? "No plans yet. Create your first one below."
          : `${plans.length} plan${plans.length > 1 ? "s" : ""} · tap ⚡ Activate to set one as active`}
      </p>

      {/* Plan list — interactive client component with Activate buttons */}
      <PlansClient initialPlans={plans} />

      {/* Create form */}
      <div className="upsc-card fade-in">
        <p className="section-title mb-4">Create New Plan</p>
        <CreatePlanForm onSuccess={reloadPage} />
      </div>

      {/* Generate Study Plan card */}
      <Link
        href="/planner/generate"
        id="plans-link-generate"
        className="upsc-card flex items-center justify-between no-underline fade-in"
        style={{
          marginTop: "1rem",
          background: "rgba(34,197,94,0.06)",
          border: "1px solid rgba(34,197,94,0.2)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">⚡</span>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              Generate Study Plan
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              Auto-create monthly targets, weekly targets &amp; daily tasks from a plan
            </p>
          </div>
        </div>
        <span className="text-lg" style={{ color: "#4ade80" }}>›</span>
      </Link>
    </AppShell>
  );
}
