"use client";

import { useState, useTransition } from "react";
import type { StudyGoal, StudyPlan } from "@/lib/db/types";

// ── Goal card with complete/archive action ────────────────────────────────
function GoalCard({ goal, onStatusChange }: { goal: StudyGoal; onStatusChange: (id: string, status: string) => void }) {
  const [isPending, startTransition] = useTransition();

  const handleComplete = () => {
    startTransition(async () => {
      const res = await fetch("/api/planner/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: goal.id, status: "completed" }),
        cache: "no-store",
      });
      if (res.ok) onStatusChange(goal.id, "completed");
    });
  };

  const PRIORITY_COLOR = ["", "#f87171", "#fbbf24", "#4ade80"];
  const isActive = goal.status === "active";

  return (
    <div id={`goal-card-${goal.id}`} className="upsc-card" style={{ opacity: isPending ? 0.6 : 1 }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: PRIORITY_COLOR[goal.priority] ?? "#94a3b8" }}
            />
            <p className="text-sm font-medium" style={{
              color: "var(--color-text-primary)",
              textDecoration: goal.status === "completed" ? "line-through" : "none",
            }}>
              {goal.title}
            </p>
          </div>
          {goal.description && (
            <p className="text-xs mt-1 mb-1" style={{ color: "var(--color-text-muted)" }}>{goal.description}</p>
          )}
          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
            {goal.goal_type}
            {goal.target_date && ` · Due ${new Date(goal.target_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
          </p>
        </div>
        {isActive && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={handleComplete}
              disabled={isPending}
              className="text-xs px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(34,197,94,0.15)", color: "var(--color-brand)", border: "1px solid rgba(34,197,94,0.3)" }}
            >
              Done
            </button>
            <button
              onClick={() => {
                if (confirm("Archive this goal?")) {
                  startTransition(async () => {
                    const res = await fetch("/api/planner/goals", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: goal.id, status: "archived" }),
                      cache: "no-store",
                    });
                    if (res.ok) onStatusChange(goal.id, "archived");
                  });
                }
              }}
              disabled={isPending}
              className="text-xs px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(100,116,139,0.1)", color: "var(--color-text-muted)", border: "1px solid rgba(100,116,139,0.2)" }}
            >
              Archive
            </button>
          </div>
        )}
        {!isActive && (
          <span className="badge badge-not-configured text-[10px] flex-shrink-0">{goal.status}</span>
        )}
      </div>
    </div>
  );
}

// ── Create goal form ──────────────────────────────────────────────────────
function CreateGoalForm({ plans, onCreated }: { plans: StudyPlan[]; onCreated: (g: StudyGoal) => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      const res = await fetch("/api/planner/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       fd.get("title"),
          goal_type:   fd.get("goal_type"),
          target_date: fd.get("target_date") || undefined,
          plan_id:     fd.get("plan_id") || undefined,
          priority:    Number(fd.get("priority") ?? 2),
          description: fd.get("description") || undefined,
        }),
        cache: "no-store",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to create goal.");
        return;
      }
      const { goal } = await res.json();
      onCreated(goal as StudyGoal);
      form.reset();
      setOpen(false);
    });
  };

  if (!open) {
    return (
      <button id="add-goal-btn" onClick={() => setOpen(true)} className="btn-primary w-full text-sm">
        + Add Goal
      </button>
    );
  }

  const ls = "block text-xs font-medium mb-1";
  return (
    <form id="create-goal-form" onSubmit={handleSubmit} className="space-y-3 p-4 rounded-xl" style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}>
      <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>New Goal</p>
      <div>
        <label htmlFor="goal-title" className={ls} style={{ color: "var(--color-text-secondary)" }}>Title *</label>
        <input id="goal-title" name="title" type="text" required placeholder="e.g. Complete GS1 Syllabus" className="input-field text-sm" disabled={isPending} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="goal-type" className={ls} style={{ color: "var(--color-text-secondary)" }}>Type</label>
          <select id="goal-type" name="goal_type" className="input-field text-sm" disabled={isPending}>
            <option value="general">General</option>
            <option value="syllabus">Syllabus</option>
            <option value="revision">Revision</option>
            <option value="answer_writing">Answer Writing</option>
            <option value="csat">CSAT</option>
            <option value="optional">Optional</option>
            <option value="current_affairs">Current Affairs</option>
            <option value="pyq">PYQ</option>
          </select>
        </div>
        <div>
          <label htmlFor="goal-priority" className={ls} style={{ color: "var(--color-text-secondary)" }}>Priority</label>
          <select id="goal-priority" name="priority" defaultValue="2" className="input-field text-sm" disabled={isPending}>
            <option value="1">🔴 High</option>
            <option value="2">🟡 Normal</option>
            <option value="3">🟢 Low</option>
          </select>
        </div>
        <div>
          <label htmlFor="goal-target-date" className={ls} style={{ color: "var(--color-text-secondary)" }}>Target date</label>
          <input id="goal-target-date" name="target_date" type="date" className="input-field text-sm" disabled={isPending} />
        </div>
        {plans.length > 0 && (
          <div>
            <label htmlFor="goal-plan" className={ls} style={{ color: "var(--color-text-secondary)" }}>Link to plan</label>
            <select id="goal-plan" name="plan_id" className="input-field text-sm" disabled={isPending}>
              <option value="">None</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        )}
      </div>
      <div>
        <label htmlFor="goal-desc" className={ls} style={{ color: "var(--color-text-secondary)" }}>Description</label>
        <textarea id="goal-desc" name="description" rows={2} className="input-field text-sm resize-none" disabled={isPending} />
      </div>
      {error && (
        <div className="p-2 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }} role="alert">{error}</div>
      )}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1 text-sm py-2.5" disabled={isPending}>{isPending ? "Adding…" : "Add Goal"}</button>
        <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm py-2.5 rounded-xl" style={{ background: "var(--color-bg-card)", color: "var(--color-text-muted)" }}>Cancel</button>
      </div>
    </form>
  );
}

// ── Main client ──────────────────────────────────────────────────────────
export default function GoalsClient({
  initialGoals,
  plans,
}: {
  initialGoals: StudyGoal[];
  plans: StudyPlan[];
}) {
  const [goals, setGoals] = useState(initialGoals);

  const handleStatusChange = (id: string, status: string) => {
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, status: status as StudyGoal["status"] } : g));
  };

  const handleCreated = (g: StudyGoal) => {
    setGoals((prev) => [g, ...prev]);
  };

  const active   = goals.filter((g) => g.status === "active");
  const inactive = goals.filter((g) => g.status !== "active");

  return (
    <div>
      {goals.length === 0 ? (
        <div className="upsc-card text-center py-8 mb-4">
          <p className="text-3xl mb-2">🎯</p>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>No goals yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Add your first study goal below.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {active.length > 0 && (
            <>
              <p className="section-title">Active ({active.length})</p>
              {active.map((g) => <GoalCard key={g.id} goal={g} onStatusChange={handleStatusChange} />)}
            </>
          )}
          {inactive.length > 0 && (
            <>
              <p className="section-title mt-4">Completed / Archived</p>
              {inactive.map((g) => <GoalCard key={g.id} goal={g} onStatusChange={handleStatusChange} />)}
            </>
          )}
        </div>
      )}
      <CreateGoalForm plans={plans} onCreated={handleCreated} />
    </div>
  );
}
