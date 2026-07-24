"use client";

import { useState, useTransition, useOptimistic } from "react";
import type { DailyTask } from "@/lib/db/types";

// ── Task status update button ─────────────────────────────────────────────
interface TaskRowProps {
  task: DailyTask;
  onStatusChange: (id: string, status: string) => void;
}

function TaskRow({ task, onStatusChange }: TaskRowProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatus = (newStatus: string) => {
    startTransition(async () => {
      const res = await fetch("/api/planner/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: newStatus }),
        cache: "no-store",
      });
      if (res.ok) onStatusChange(task.id, newStatus);
    });
  };

  const isDone = task.status === "completed";
  const isSkipped = task.status === "skipped";

  return (
    <li
      id={`task-row-${task.id}`}
      className="flex items-start gap-3 py-3 border-b last:border-b-0"
      style={{ borderColor: "var(--color-border)", opacity: isPending ? 0.6 : 1 }}
    >
      {/* Completion toggle */}
      <button
        onClick={() => handleStatus(isDone ? "pending" : "completed")}
        disabled={isPending}
        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
        style={{
          borderColor: isDone ? "var(--color-brand)" : "var(--color-border)",
          background: isDone ? "var(--color-brand)" : "transparent",
        }}
        aria-label={isDone ? "Mark pending" : "Mark complete"}
      >
        {isDone && <span className="text-[10px] text-black font-bold">✓</span>}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium leading-snug"
          style={{
            color: isDone || isSkipped ? "var(--color-text-muted)" : "var(--color-text-primary)",
            textDecoration: isDone ? "line-through" : "none",
          }}
        >
          {task.title}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {task.task_type} · {task.estimated_minutes}min est.
          {task.actual_minutes > 0 ? ` · ${task.actual_minutes}min actual` : ""}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1 flex-shrink-0">
        {!isDone && !isSkipped && task.status !== "cancelled" && (
          <>
            <button
              onClick={() => handleStatus("skipped")}
              disabled={isPending}
              className="text-[10px] px-2 py-1 rounded-lg"
              style={{
                background: "rgba(100,116,139,0.15)",
                color: "var(--color-text-muted)",
              }}
            >
              Skip
            </button>
            <button
              onClick={() => {
                if (confirm("Cancel this task? It will be removed from your active list.")) {
                  handleStatus("cancelled");
                }
              }}
              disabled={isPending}
              className="text-[10px] px-2 py-1 rounded-lg"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#f87171",
              }}
            >
              Cancel
            </button>
          </>
        )}
        {isSkipped && (
          <span className="text-[10px] px-2 py-1 rounded-lg badge badge-not-configured">
            Skipped
          </span>
        )}
        {task.status === "cancelled" && (
          <span className="text-[10px] px-2 py-1 rounded-lg badge" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
            Cancelled
          </span>
        )}
      </div>
    </li>
  );
}

// ── Create task form ──────────────────────────────────────────────────────
interface CreateTaskFormProps {
  onCreated: (task: DailyTask) => void;
}

function CreateTaskForm({ onCreated }: CreateTaskFormProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      const res = await fetch("/api/planner/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:             fd.get("title"),
          task_date:         fd.get("task_date"),
          estimated_minutes: Number(fd.get("estimated_minutes") ?? 30),
          task_type:         fd.get("task_type"),
          priority:          Number(fd.get("priority") ?? 2),
          description:       fd.get("description") || undefined,
        }),
        cache: "no-store",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to create task.");
        return;
      }
      const { task } = await res.json();
      onCreated(task as DailyTask);
      form.reset();
      setOpen(false);
    });
  };

  if (!open) {
    return (
      <button
        id="add-task-btn"
        onClick={() => setOpen(true)}
        className="btn-primary w-full text-sm"
      >
        + Add Task
      </button>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const ls = "block text-xs font-medium mb-1" ;

  return (
    <form id="create-task-form" onSubmit={handleSubmit} className="space-y-3 p-4 rounded-xl" style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}>
      <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>New Task</p>

      <div>
        <label htmlFor="task-title" className={ls} style={{ color: "var(--color-text-secondary)" }}>Title *</label>
        <input id="task-title" name="title" type="text" required placeholder="e.g. Read NCERT Ch. 3" className="input-field text-sm" disabled={isPending} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="task-date" className={ls} style={{ color: "var(--color-text-secondary)" }}>Date</label>
          <input id="task-date" name="task_date" type="date" defaultValue={today} className="input-field text-sm" disabled={isPending} />
        </div>
        <div>
          <label htmlFor="task-minutes" className={ls} style={{ color: "var(--color-text-secondary)" }}>Est. mins</label>
          <input id="task-minutes" name="estimated_minutes" type="number" min="5" defaultValue="30" className="input-field text-sm" disabled={isPending} />
        </div>
        <div>
          <label htmlFor="task-type" className={ls} style={{ color: "var(--color-text-secondary)" }}>Type</label>
          <select id="task-type" name="task_type" className="input-field text-sm" disabled={isPending}>
            <option value="study">Study</option>
            <option value="revision">Revision</option>
            <option value="notes">Notes</option>
            <option value="answer_writing">Answer Writing</option>
            <option value="pyq">PYQ</option>
            <option value="csat">CSAT</option>
            <option value="current_affairs">Current Affairs</option>
            <option value="backlog">Backlog</option>
          </select>
        </div>
        <div>
          <label htmlFor="task-priority" className={ls} style={{ color: "var(--color-text-secondary)" }}>Priority</label>
          <select id="task-priority" name="priority" defaultValue="2" className="input-field text-sm" disabled={isPending}>
            <option value="1">🔴 High</option>
            <option value="2">🟡 Normal</option>
            <option value="3">🟢 Low</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-2 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }} role="alert">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1 text-sm py-2.5" disabled={isPending}>
          {isPending ? "Adding…" : "Add"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="flex-1 text-sm py-2.5 rounded-xl" style={{ background: "var(--color-bg-card)", color: "var(--color-text-muted)" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main client component ─────────────────────────────────────────────────
export type FilterType = "today" | "upcoming" | "completed" | "cancelled";

interface TasksClientProps {
  initialTasks: DailyTask[];
  initialFilter: FilterType;
}

export default function TasksClient({ initialTasks, initialFilter }: TasksClientProps) {
  const [filter, setFilter] = useState<FilterType>(initialFilter);
  const [tasks, updateTasks] = useOptimistic(
    initialTasks,
    (current, { id, status }: { id: string; status: string }) =>
      current.map((t) => (t.id === id ? { ...t, status: status as DailyTask["status"] } : t))
  );

  const handleStatusChange = (id: string, status: string) => {
    updateTasks({ id, status });
  };

 const handleCreated = () => {
  // Reload the page to get fresh server data including the new task
  window.location.reload();
};

  const FILTERS: { value: FilterType; label: string }[] = [
    { value: "today",     label: "Today" },
    { value: "upcoming",  label: "Upcoming" },
    { value: "completed", label: "Done" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const pending   = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  const done      = tasks.filter((t) => t.status === "completed");
  const skipped   = tasks.filter((t) => t.status === "skipped");
  const cancelled = tasks.filter((t) => t.status === "cancelled");

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            id={`filter-${value}`}
            onClick={() => setFilter(value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
            style={{
              background: filter === value ? "var(--color-brand-dim)" : "var(--color-bg-secondary)",
              color: filter === value ? "var(--color-brand)" : "var(--color-text-muted)",
              border: `1px solid ${filter === value ? "var(--color-brand-border)" : "var(--color-border)"}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="upsc-card text-center py-8">
          <p className="text-3xl mb-2">📝</p>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>No tasks yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Add your first task below.</p>
        </div>
      ) : (
        <div className="upsc-card mb-4">
          {(filter === "today" || filter === "upcoming") && pending.length > 0 && (
            <>
              <p className="section-title mb-2">{filter === "today" ? "Today" : "Pending"} ({pending.length})</p>
              <ul>
                {pending.map((t) => (
                  <TaskRow key={t.id} task={t} onStatusChange={handleStatusChange} />
                ))}
              </ul>
            </>
          )}
          {filter === "completed" && done.length > 0 && (
            <>
              <p className="section-title mb-2">Completed ({done.length})</p>
              <ul>
                {done.map((t) => (
                  <TaskRow key={t.id} task={t} onStatusChange={handleStatusChange} />
                ))}
              </ul>
            </>
          )}
          {filter === "completed" && skipped.length > 0 && (
            <>
              <p className="section-title mt-4 mb-2">Skipped ({skipped.length})</p>
              <ul>
                {skipped.map((t) => (
                  <TaskRow key={t.id} task={t} onStatusChange={handleStatusChange} />
                ))}
              </ul>
            </>
          )}
          {filter === "cancelled" && cancelled.length > 0 && (
            <>
              <p className="section-title mb-2">Cancelled ({cancelled.length})</p>
              <ul>
                {cancelled.map((t) => (
                  <TaskRow key={t.id} task={t} onStatusChange={handleStatusChange} />
                ))}
              </ul>
            </>
          )}
          {/* Empty state for active filter */}
          {filter === "today" && pending.length === 0 && <p className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>No tasks for today.</p>}
          {filter === "upcoming" && pending.length === 0 && <p className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>No upcoming tasks.</p>}
          {filter === "completed" && done.length === 0 && skipped.length === 0 && <p className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>No completed tasks.</p>}
          {filter === "cancelled" && cancelled.length === 0 && <p className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>No cancelled tasks.</p>}
        </div>
      )}

      {/* Add task form */}
      <CreateTaskForm onCreated={handleCreated} />
    </div>
  );
}
