"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";

type Priority = "low" | "medium" | "high" | "critical";
type Status = "pending" | "done" | "snoozed";

interface RevisionItem {
  id: string;
  title: string;
  item_type: string;
  priority: Priority;
  due_date: string;
  status: Status;
  subject_area: string | null;
  repetition_count: number;
}

interface Stats {
  overdue: number;
  dueToday: number;
  completedThisWeek: number;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  low:      "var(--color-text-muted)",
  medium:   "var(--color-warning)",
  high:     "#f97316",
  critical: "var(--color-error)",
};

const PRIORITY_BG: Record<Priority, string> = {
  low:      "rgba(100,116,139,0.15)",
  medium:   "rgba(245,158,11,0.15)",
  high:     "rgba(249,115,22,0.15)",
  critical: "rgba(239,68,68,0.15)",
};

const QUICK_LINKS = [
  { href: "/revision/overdue",         icon: "⚠️",  label: "Overdue"         },
  { href: "/revision/weak-areas",      icon: "🎯",  label: "Weak Areas"      },
  { href: "/revision/current-affairs", icon: "📰",  label: "Current Affairs" },
  { href: "/revision/pyq-mistakes",    icon: "❌",  label: "PYQ Mistakes"    },
];

export default function RevisionPage() {
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [stats, setStats] = useState<Stats>({ overdue: 0, dueToday: 0, completedThisWeek: 0 });
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/revision?status=pending&due_date_lte=${today}`);
      if (res.status === 503 || res.status === 404) {
        setTableMissing(true);
        return;
      }
      const json = await res.json();
      if (json.tableMissing) {
        setTableMissing(true);
        return;
      }
      const allItems: RevisionItem[] = json.items ?? [];
      setItems(allItems);

      // Compute stats
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);

      const overdueItems = allItems.filter(
        (it) => it.status === "pending" && it.due_date < todayStr
      );
      const dueTodayItems = allItems.filter(
        (it) => it.status === "pending" && it.due_date === todayStr
      );

      // Fetch completed this week separately
      const completedRes = await fetch(`/api/revision?status=done`);
      const completedJson = completedRes.ok ? await completedRes.json() : { items: [] };
      const completedThisWeek = (completedJson.items ?? []).filter(
        (it: RevisionItem) => new Date(it.due_date) >= weekStart
      ).length;

      setStats({
        overdue: overdueItems.length,
        dueToday: dueTodayItems.length,
        completedThisWeek,
      });
    } catch {
      setTableMissing(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markDone(id: string) {
    setActionLoading(id + "_done");
    try {
      await fetch("/api/revision", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "done" }),
      });
      await load();
    } finally {
      setActionLoading(null);
    }
  }

  async function snooze(id: string, days: number) {
    setActionLoading(id + "_snooze_" + days);
    try {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + days);
      const snoozedUntil = newDate.toISOString().split("T")[0];
      await fetch("/api/revision", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "snoozed", snoozed_until: snoozedUntil }),
      });
      await load();
    } finally {
      setActionLoading(null);
    }
  }

  const todayItems = items.filter((it) => it.due_date === new Date().toISOString().split("T")[0]);

  return (
    <AppShell title="Revision Center">
      {/* Header */}
      <div className="mb-5 fade-in">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          🔁 Revision Center
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Spaced repetition — never forget what you studied
        </p>
      </div>

      {/* Stats row */}
      {!tableMissing && (
        <div className="grid grid-cols-3 gap-3 mb-5 fade-in">
          <div className="upsc-card text-center py-4">
            <p
              className="text-2xl font-bold"
              style={{ color: stats.overdue > 0 ? "var(--color-error)" : "var(--color-brand)" }}
            >
              {loading ? "—" : stats.overdue}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Overdue</p>
          </div>
          <div className="upsc-card text-center py-4">
            <p
              className="text-2xl font-bold"
              style={{ color: stats.dueToday > 0 ? "var(--color-warning)" : "var(--color-brand)" }}
            >
              {loading ? "—" : stats.dueToday}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Due Today</p>
          </div>
          <div className="upsc-card text-center py-4">
            <p className="text-2xl font-bold" style={{ color: "var(--color-brand)" }}>
              {loading ? "—" : stats.completedThisWeek}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Done This Week</p>
          </div>
        </div>
      )}

      {/* Migration pending */}
      {tableMissing && (
        <div
          className="upsc-card mb-5 fade-in"
          style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.06)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--color-warning)" }}>
            ⚠ Migration pending
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            The <code>revision_items</code> table is not yet available. Apply the migration to
            activate spaced repetition.
          </p>
        </div>
      )}

      {/* Quick links */}
      <p className="section-title fade-in">Quick Access</p>
      <div className="grid grid-cols-2 gap-3 mb-6 fade-in sm:grid-cols-4">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            id={`revision-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
            className="upsc-card no-underline flex flex-col items-center gap-2 text-center py-4"
          >
            <span className="text-xl">{link.icon}</span>
            <span className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>
              {link.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Today's items */}
      {!tableMissing && (
        <>
          <p className="section-title fade-in">Due Today</p>
          {loading ? (
            <div className="upsc-card shimmer h-24 fade-in" />
          ) : todayItems.length === 0 ? (
            <div className="upsc-card fade-in text-center py-8">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                All clear for today!
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                No revision items due today.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 fade-in">
              {todayItems.map((item) => (
                <div
                  key={item.id}
                  id={`revision-item-${item.id}`}
                  className="upsc-card"
                  style={{
                    borderLeft: `3px solid ${PRIORITY_COLORS[item.priority]}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.subject_area && (
                          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {item.subject_area}
                          </span>
                        )}
                        <span
                          className="badge"
                          style={{
                            background: PRIORITY_BG[item.priority],
                            color: PRIORITY_COLORS[item.priority],
                            border: `1px solid ${PRIORITY_COLORS[item.priority]}40`,
                            fontSize: "0.65rem",
                          }}
                        >
                          {item.priority}
                        </span>
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          Rep #{item.repetition_count}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      id={`mark-done-${item.id}`}
                      onClick={() => markDone(item.id)}
                      disabled={actionLoading !== null}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                      style={{ background: "var(--color-brand)", color: "#0f1117" }}
                    >
                      {actionLoading === item.id + "_done" ? "…" : "✓ Mark Done"}
                    </button>
                    <button
                      id={`snooze-1-${item.id}`}
                      onClick={() => snooze(item.id, 1)}
                      disabled={actionLoading !== null}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                      style={{
                        background: "var(--color-bg-secondary)",
                        color: "var(--color-text-secondary)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      {actionLoading === item.id + "_snooze_1" ? "…" : "Snooze +1d"}
                    </button>
                    <button
                      id={`snooze-3-${item.id}`}
                      onClick={() => snooze(item.id, 3)}
                      disabled={actionLoading !== null}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                      style={{
                        background: "var(--color-bg-secondary)",
                        color: "var(--color-text-secondary)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      {actionLoading === item.id + "_snooze_3" ? "…" : "Snooze +3d"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
