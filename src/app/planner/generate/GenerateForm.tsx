"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { StudyPlan } from "@/lib/db/types";

// ── Result type from API ──────────────────────────────────────────────────

interface GenerateSummary {
  months_created:         number;
  weeks_created:          number;
  tasks_created:          number;
  revision_tasks_created: number;
  date_range:             string;
  pace:                   string;
  daily_minutes:          number;
  total_days:             number;
  active_days:            number;
  buffer_days:            number;
  phases:                 string[];
}

// ── Sub-components ────────────────────────────────────────────────────────

function PlanSelector({
  plans,
  selectedId,
  onChange,
}: {
  plans: StudyPlan[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  if (plans.length === 0) {
    return (
      <div
        className="p-4 rounded-xl text-xs"
        style={{
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.2)",
          color: "var(--color-text-secondary)",
        }}
      >
        <strong style={{ color: "#fbbf24" }}>No plans found.</strong>{" "}
        <Link href="/planner/plans" style={{ color: "var(--color-brand)" }}>
          Create a plan first →
        </Link>
      </div>
    );
  }

  const selected = plans.find((p) => p.id === selectedId);

  return (
    <div className="space-y-2">
      {plans.map((p) => {
        const isSelected = p.id === selectedId;
        return (
          <button
            key={p.id}
            id={`select-plan-${p.id}`}
            type="button"
            onClick={() => onChange(p.id)}
            className="w-full text-left p-3 rounded-xl transition-colors"
            style={{
              background: isSelected ? "rgba(34,197,94,0.1)" : "var(--color-bg-secondary)",
              border: `1px solid ${isSelected ? "rgba(34,197,94,0.4)" : "var(--color-border)"}`,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {p.title}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {p.start_date} → {p.target_date} · {p.pace} pace · {(p.daily_available_minutes / 60).toFixed(1)}h/day
                </p>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <span
                  className={`badge ${p.status === "active" ? "badge-connected" : "badge-not-configured"}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${p.status === "active" ? "bg-green-400" : "bg-slate-500"}`} />
                  {p.status}
                </span>
                {p.generated_by === "future_generator" && (
                  <span className="text-[9px]" style={{ color: "#4ade80" }}>
                    ⚡ Generated
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}

      {selected && (
        <div
          className="mt-1 p-3 rounded-xl text-[11px]"
          style={{
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.2)",
            color: "var(--color-text-muted)",
          }}
        >
          Selected: <strong style={{ color: "var(--color-text-secondary)" }}>{selected.title}</strong>
          {" "}· {selected.start_date} → {selected.target_date}
        </div>
      )}
    </div>
  );
}

function SuccessCard({ summary }: { summary: GenerateSummary }) {
  return (
    <div
      id="generate-success"
      className="rounded-xl p-4 space-y-3"
      style={{
        background: "rgba(34,197,94,0.08)",
        border: "1px solid rgba(34,197,94,0.3)",
      }}
    >
      <p className="text-sm font-semibold" style={{ color: "#4ade80" }}>
        ✓ Plan generated successfully!
      </p>

      <div className="grid grid-cols-2 gap-2">
        {[
          ["Months",         summary.months_created],
          ["Weeks",          summary.weeks_created],
          ["Daily tasks",    summary.tasks_created],
          ["Revision tasks", summary.revision_tasks_created],
          ["Total days",     summary.total_days],
          ["Active days",    summary.active_days],
          ["Buffer days",    summary.buffer_days],
          ["Daily hours",    `${(summary.daily_minutes / 60).toFixed(1)}h`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="p-2 rounded-lg text-center"
            style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}
          >
            <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
            <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        <strong style={{ color: "var(--color-text-secondary)" }}>Phases:</strong>{" "}
        {summary.phases.join(" → ")}
      </div>
      <div className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        <strong style={{ color: "var(--color-text-secondary)" }}>Pace:</strong> {summary.pace} ·{" "}
        <strong style={{ color: "var(--color-text-secondary)" }}>Range:</strong> {summary.date_range}
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <Link href="/planner/tasks" id="goto-tasks" className="btn-primary text-center text-sm py-2.5 no-underline">
          → View Today&apos;s Tasks
        </Link>
        <Link href="/planner/progress" className="text-center text-xs no-underline" style={{ color: "var(--color-brand)" }}>
          View Progress Overview →
        </Link>
      </div>
    </div>
  );
}

// ── Main client component ─────────────────────────────────────────────────

interface GenerateFormProps {
  plans: StudyPlan[];
}

export default function GenerateForm({ plans: initialPlans }: GenerateFormProps) {
  const eligiblePlans = initialPlans.filter(
    (p) => p.status !== "archived" && p.status !== "completed"
  );

  const [selectedPlanId, setSelectedPlanId] = useState(
    eligiblePlans.find((p) => p.status === "active")?.id ??
    eligiblePlans[0]?.id ??
    ""
  );

  const selectedPlan = eligiblePlans.find((p) => p.id === selectedPlanId);

  // Form overrides — start empty so plan defaults are used unless changed
  const [minutesOverride, setMinutesOverride] = useState<string>("");
  const [paceOverride, setPaceOverride] = useState<string>("");
  const [bufferOverride, setBufferOverride] = useState<string>("");
  const [includeCsat, setIncludeCsat] = useState(true);
  const [includeOptional, setIncludeOptional] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [successSummary, setSuccessSummary] = useState<GenerateSummary | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsDuplicate(false);
    setSuccessSummary(null);

    if (!selectedPlanId) {
      setError("Please select a plan first.");
      return;
    }

    const body: Record<string, unknown> = { plan_id: selectedPlanId };
    if (minutesOverride) body.daily_available_minutes = Number(minutesOverride);
    if (paceOverride)    body.pace                    = paceOverride;
    if (bufferOverride)  body.backlog_buffer_days      = Number(bufferOverride);
    body.include_csat     = includeCsat;
    body.include_optional = includeOptional;

    startTransition(async () => {
      const res = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({})) as Record<string, unknown>;

      if (!res.ok) {
        if ((json.code as string) === "DUPLICATE_GENERATION") {
          setIsDuplicate(true);
        }
        setError((json.error as string) ?? "Generation failed.");
        return;
      }

      setSuccessSummary(json.summary as GenerateSummary);
    });
  };

  if (successSummary) {
    return <SuccessCard summary={successSummary} />;
  }

  const ls = "block text-xs font-medium mb-1.5";
  const effectivePace  = paceOverride  || selectedPlan?.pace             || "normal";
  const effectiveMins  = minutesOverride || String(selectedPlan?.daily_available_minutes ?? 120);
  const effectiveBuf   = bufferOverride  || String(selectedPlan?.backlog_buffer_days ?? 7);

  return (
    <form id="generate-plan-form" onSubmit={handleSubmit} className="space-y-5">

      {/* Plan selection */}
      <div className="fade-in">
        <p className={ls} style={{ color: "var(--color-text-secondary)" }}>
          Select a plan to generate for
        </p>
        <PlanSelector
          plans={eligiblePlans}
          selectedId={selectedPlanId}
          onChange={(id) => {
            setSelectedPlanId(id);
            setError(null);
            setIsDuplicate(false);
          }}
        />
      </div>

      {/* Override options — only shown when a plan is selected */}
      {selectedPlan && (
        <div className="fade-in space-y-4">
          <p className="section-title">Generator Options</p>
          <p className="text-[11px] -mt-2" style={{ color: "var(--color-text-muted)" }}>
            Leave fields empty to use the values from the selected plan.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Daily minutes */}
            <div>
              <label htmlFor="gen-minutes" className={ls} style={{ color: "var(--color-text-secondary)" }}>
                Daily minutes
              </label>
              <input
                id="gen-minutes"
                type="number"
                min="30"
                max="720"
                step="15"
                value={minutesOverride}
                onChange={(e) => setMinutesOverride(e.target.value)}
                placeholder={effectiveMins}
                className="input-field text-sm"
                disabled={isPending}
              />
              <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                Plan default: {selectedPlan.daily_available_minutes}m
              </p>
            </div>

            {/* Pace */}
            <div>
              <label htmlFor="gen-pace" className={ls} style={{ color: "var(--color-text-secondary)" }}>
                Pace
              </label>
              <select
                id="gen-pace"
                value={paceOverride}
                onChange={(e) => setPaceOverride(e.target.value)}
                className="input-field text-sm"
                disabled={isPending}
              >
                <option value="">Plan default ({selectedPlan.pace})</option>
                <option value="slow">Slow — fewer tasks, more buffer</option>
                <option value="normal">Normal — balanced coverage</option>
                <option value="aggressive">Aggressive — more tasks per day</option>
              </select>
            </div>

            {/* Buffer days */}
            <div>
              <label htmlFor="gen-buffer" className={ls} style={{ color: "var(--color-text-secondary)" }}>
                Buffer days
              </label>
              <input
                id="gen-buffer"
                type="number"
                min="0"
                max="30"
                value={bufferOverride}
                onChange={(e) => setBufferOverride(e.target.value)}
                placeholder={effectiveBuf}
                className="input-field text-sm"
                disabled={isPending}
              />
              <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                Plan default: {selectedPlan.backlog_buffer_days}d
              </p>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer" htmlFor="gen-csat">
              <input
                id="gen-csat"
                type="checkbox"
                checked={includeCsat}
                onChange={(e) => setIncludeCsat(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 rounded"
                style={{ accentColor: "var(--color-brand)" }}
              />
              <div>
                <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>Include CSAT tasks</p>
                <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  Adds CSAT practice blocks during foundation and core phases
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer" htmlFor="gen-optional">
              <input
                id="gen-optional"
                type="checkbox"
                checked={includeOptional}
                onChange={(e) => setIncludeOptional(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 rounded"
                style={{ accentColor: "var(--color-brand)" }}
              />
              <div>
                <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>Include optional subject slots</p>
                <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  Adds one weekly optional subject block (first 60% of the plan)
                </p>
              </div>
            </label>
          </div>

          {/* Plan date display */}
          <div
            className="p-3 rounded-xl text-xs"
            style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
          >
            <div className="grid grid-cols-2 gap-1" style={{ color: "var(--color-text-muted)" }}>
              <span>📅 Start: <strong style={{ color: "var(--color-text-secondary)" }}>{selectedPlan.start_date}</strong></span>
              <span>🎯 Target: <strong style={{ color: "var(--color-text-secondary)" }}>{selectedPlan.target_date}</strong></span>
              <span>⏱ Pace: <strong style={{ color: "var(--color-text-secondary)" }}>{effectivePace}</strong></span>
              <span>🔄 Buffer: <strong style={{ color: "var(--color-text-secondary)" }}>{effectiveBuf}d</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {error && (
        <div
          id="generate-error"
          className="p-3 rounded-xl text-xs"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171",
          }}
          role="alert"
        >
          <strong>Error: </strong>{error}
          {isDuplicate && (
            <div className="mt-2 text-[10px]" style={{ color: "#fca5a5" }}>
              To regenerate: delete the existing tasks for this plan first, then try again.
              A reset/regenerate workflow will be added in a later phase.
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      {selectedPlan && (
        <button
          id="generate-submit"
          type="submit"
          disabled={isPending || !selectedPlanId}
          className="btn-primary w-full text-sm"
          style={{ opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? "Generating plan…" : "⚡ Generate Study Plan"}
        </button>
      )}

      {isPending && (
        <p className="text-[11px] text-center" style={{ color: "var(--color-text-muted)" }}>
          Creating monthly targets, weekly targets, and daily tasks…
        </p>
      )}
    </form>
  );
}
