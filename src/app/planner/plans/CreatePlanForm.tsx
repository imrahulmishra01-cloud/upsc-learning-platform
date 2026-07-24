"use client";

import { useState, useTransition } from "react";

interface CreatePlanFormProps {
  onSuccess: () => void;
}

export default function CreatePlanForm({ onSuccess }: CreatePlanFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const body = {
        title:                    fd.get("title"),
        start_date:               fd.get("start_date"),
        target_date:              fd.get("target_date"),
        daily_available_minutes:  Number(fd.get("daily_available_minutes")),
        pace:                     fd.get("pace"),
        backlog_buffer_days:      Number(fd.get("backlog_buffer_days")),
        description:              fd.get("description") || undefined,
      };

      const res = await fetch("/api/planner/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to create plan.");
        return;
      }
      onSuccess();
    });
  };

  const inputStyle = "input-field text-sm";
  const labelStyle = "block text-xs font-medium mb-1.5" ;

  return (
    <form id="create-plan-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="plan-title" className={labelStyle} style={{ color: "var(--color-text-secondary)" }}>
          Plan title *
        </label>
        <input
          id="plan-title"
          name="title"
          type="text"
          required
          placeholder="e.g. UPSC 2026 Main Preparation"
          className={inputStyle}
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="plan-start-date" className={labelStyle} style={{ color: "var(--color-text-secondary)" }}>
            Start date *
          </label>
          <input
            id="plan-start-date"
            name="start_date"
            type="date"
            required
            className={inputStyle}
            disabled={isPending}
          />
        </div>
        <div>
          <label htmlFor="plan-target-date" className={labelStyle} style={{ color: "var(--color-text-secondary)" }}>
            Target date *
          </label>
          <input
            id="plan-target-date"
            name="target_date"
            type="date"
            required
            className={inputStyle}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="plan-minutes" className={labelStyle} style={{ color: "var(--color-text-secondary)" }}>
            Daily hours available
          </label>
          <input
            id="plan-minutes"
            name="daily_available_minutes"
            type="number"
            min="30"
            max="720"
            step="30"
            defaultValue="120"
            className={inputStyle}
            disabled={isPending}
          />
          <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>in minutes (120 = 2 hrs)</p>
        </div>
        <div>
          <label htmlFor="plan-pace" className={labelStyle} style={{ color: "var(--color-text-secondary)" }}>
            Pace
          </label>
          <select
            id="plan-pace"
            name="pace"
            defaultValue="normal"
            className={inputStyle}
            disabled={isPending}
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="plan-buffer" className={labelStyle} style={{ color: "var(--color-text-secondary)" }}>
          Backlog buffer days
        </label>
        <input
          id="plan-buffer"
          name="backlog_buffer_days"
          type="number"
          min="0"
          max="30"
          defaultValue="7"
          className={inputStyle}
          disabled={isPending}
        />
        <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
          Days reserved for catching up missed tasks
        </p>
      </div>

      <div>
        <label htmlFor="plan-description" className={labelStyle} style={{ color: "var(--color-text-secondary)" }}>
          Description (optional)
        </label>
        <textarea
          id="plan-description"
          name="description"
          rows={2}
          placeholder="Notes about this plan…"
          className={`${inputStyle} resize-none`}
          disabled={isPending}
        />
      </div>

      {error && (
        <div
          className="p-3 rounded-xl text-xs"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171",
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        id="create-plan-submit"
        type="submit"
        className="btn-primary w-full"
        disabled={isPending}
      >
        {isPending ? "Creating…" : "Create Plan (Draft)"}
      </button>
      <p className="text-[10px] text-center" style={{ color: "var(--color-text-muted)" }}>
        Plans start in <strong>draft</strong> status. Activate manually from the plan list.
      </p>
    </form>
  );
}
