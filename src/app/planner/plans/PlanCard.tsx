"use client";

import { useState, useTransition } from "react";
import type { StudyPlan } from "@/lib/db/types";

const STATUS_STYLES: Record<string, string> = {
  active:    "badge-connected",
  draft:     "badge-not-configured",
  paused:    "badge-pending",
  completed: "badge-connected",
  archived:  "badge-not-configured",
};
const STATUS_DOT: Record<string, string> = {
  active:    "bg-green-400",
  draft:     "bg-slate-500",
  paused:    "bg-yellow-400",
  completed: "bg-green-400",
  archived:  "bg-slate-500",
};

interface PlanCardProps {
  plan: StudyPlan;
  onActivated: (id: string) => void;
}

export default function PlanCard({ plan: initialPlan, onActivated }: PlanCardProps) {
  const [plan, setPlan] = useState(initialPlan);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const start = new Date(plan.start_date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
  const end = new Date(plan.target_date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
  const totalDays = Math.ceil(
    (new Date(plan.target_date).getTime() - new Date(plan.start_date).getTime()) / 86400000
  );
  const hours = (plan.daily_available_minutes / 60).toFixed(1);

  const canActivate = plan.status === "draft" || plan.status === "paused";

  const handleActivate = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/planner/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Only send id — never send user_id; server always uses the session
        body: JSON.stringify({ id: plan.id }),
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((json as { error?: string }).error ?? "Failed to activate plan.");
        return;
      }

      // Update local state immediately so the badge reflects "active"
      setPlan((prev) => ({ ...prev, status: "active" }));
      // Notify parent so it can demote other cards' badges optimistically
      onActivated(plan.id);
    });
  };

  return (
    <div
      id={`plan-card-${plan.id}`}
      className="upsc-card"
      style={{ opacity: isPending ? 0.7 : 1, transition: "opacity 0.2s" }}
    >
      {/* Header: title + status badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-sm leading-tight" style={{ color: "var(--color-text-primary)" }}>
          {plan.title}
        </p>
        <span className={`badge ${STATUS_STYLES[plan.status] ?? "badge-not-configured"} flex-shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${STATUS_DOT[plan.status] ?? "bg-slate-500"}`} />
          {plan.status}
        </span>
      </div>

      {plan.description && (
        <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>{plan.description}</p>
      )}

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] mb-3" style={{ color: "var(--color-text-muted)" }}>
        <span>📅 {start} → {end}</span>
        <span>📆 {totalDays} days total</span>
        <span>⏱ {hours}h / day</span>
        <span>🏃 Pace: {plan.pace}</span>
        <span>🔄 Buffer: {plan.backlog_buffer_days}d</span>
        <span>🤖 {plan.generator_ready ? "Generator-ready" : "Manual only"}</span>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="mb-2 p-2 rounded-lg text-xs"
          style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Activate button — only shown for draft or paused plans */}
      {canActivate && (
        <button
          id={`activate-plan-${plan.id}`}
          onClick={handleActivate}
          disabled={isPending}
          className="w-full text-sm py-2 rounded-xl font-medium transition-colors mb-2"
          style={{
            background: isPending ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.15)",
            color: "var(--color-brand)",
            border: "1px solid rgba(34,197,94,0.3)",
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Activating…" : "⚡ Activate this plan"}
        </button>
      )}
      
      {/* Archive button — shown if not archived */}
      {plan.status !== "archived" && (
        <button
          id={`archive-plan-${plan.id}`}
          onClick={() => {
            if (confirm("Are you sure you want to archive this plan? It will be hidden from the active planner.")) {
              setError(null);
              startTransition(async () => {
                const res = await fetch("/api/planner/plans", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: plan.id, action: "archive" }),
                  cache: "no-store",
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) {
                  setError((json as { error?: string }).error ?? "Failed to archive plan.");
                  return;
                }
                setPlan((prev) => ({ ...prev, status: "archived" }));
              });
            }
          }}
          disabled={isPending}
          className="w-full text-sm py-2 rounded-xl font-medium transition-colors"
          style={{
            background: "rgba(100,116,139,0.1)",
            color: "var(--color-text-muted)",
            border: "1px solid rgba(100,116,139,0.2)",
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Processing…" : "Archive Plan"}
        </button>
      )}

      {plan.status === "active" && (
        <p className="text-[11px] text-center" style={{ color: "var(--color-brand)" }}>
          ✓ This is your active plan
        </p>
      )}
    </div>
  );
}
