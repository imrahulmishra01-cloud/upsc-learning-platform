import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { getStudyPlans } from "@/lib/db/planner";
import GenerateForm from "./GenerateForm";

export const metadata: Metadata = { title: "Generate Study Plan" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GeneratePage() {
  const plans = await getStudyPlans();

  return (
    <AppShell title="Generate Study Plan">
      {/* Back breadcrumb */}
      <Link
        href="/planner"
        className="inline-flex items-center gap-1.5 text-xs mb-4 fade-in"
        style={{ color: "var(--color-text-muted)" }}
      >
        ← Planner
      </Link>

      <h1 className="text-xl font-bold mb-1 fade-in" style={{ color: "var(--color-text-primary)" }}>
        Generate Study Plan
      </h1>
      <p className="text-xs mb-4 fade-in" style={{ color: "var(--color-text-muted)" }}>
        Automatically create monthly targets, weekly targets, and daily tasks from your plan settings.
      </p>

      {/* Rule-based warning notice */}
      <div
        className="mb-5 p-3 rounded-xl text-xs fade-in"
        style={{
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.2)",
          color: "var(--color-text-secondary)",
        }}
      >
        <strong style={{ color: "#fbbf24" }}>📋 Rule-based scheduling.</strong>{" "}
        This generator uses a structured UPSC preparation template — not AI.
        It creates realistic tasks based on your dates, daily hours, and pace.
        AI-powered personalised scheduling is planned for a later phase.
        <br />
        <span className="mt-1 block" style={{ color: "var(--color-text-muted)" }}>
          Generated tasks are tagged <code>[Rule-generated]</code> in their descriptions so you can tell them apart.
        </span>
      </div>

      {/* Generator form */}
      <div className="fade-in">
        <GenerateForm plans={plans} />
      </div>

      {/* Quick links */}
      <div className="mt-6 space-y-2 fade-in">
        <p className="section-title">Quick Links</p>
        {[
          { href: "/planner/plans",    icon: "📅", label: "Plans",    desc: "Create or manage study plans" },
          { href: "/planner/tasks",    icon: "✅", label: "Tasks",    desc: "View your generated daily tasks" },
          { href: "/planner/progress", icon: "📈", label: "Progress", desc: "Track your study progress" },
          { href: "/planner",          icon: "🗓", label: "Planner",  desc: "Planner hub" },
        ].map(({ href, icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            id={`generate-link-${label.toLowerCase()}`}
            className="upsc-card flex items-center gap-3 no-underline"
          >
            <span className="text-lg flex-shrink-0">{icon}</span>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
            </div>
            <span className="ml-auto text-lg" style={{ color: "var(--color-text-muted)" }}>›</span>
          </Link>
        ))}
      </div>

      {/* Deferred features notice */}
      <div
        className="mt-5 p-3 rounded-xl text-xs fade-in"
        style={{
          background: "rgba(100,116,139,0.08)",
          border: "1px solid rgba(100,116,139,0.2)",
          color: "var(--color-text-muted)",
        }}
      >
        <strong style={{ color: "var(--color-text-secondary)" }}>Coming in later phases:</strong>
        <ul className="mt-1.5 space-y-0.5 list-disc list-inside">
          <li>AI/Gemini personalised plan generation</li>
          <li>Regenerate / reset generated plan workflow</li>
          <li>PYQ bank integration with smart task placement</li>
          <li>Optional subject deep planning templates</li>
          <li>Current affairs automation pipeline</li>
          <li>Progress analytics charts and heatmaps</li>
          <li>R2 material links in generated tasks</li>
        </ul>
      </div>
    </AppShell>
  );
}
