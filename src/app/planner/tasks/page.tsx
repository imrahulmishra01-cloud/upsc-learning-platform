import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { getDailyTasks } from "@/lib/db/planner";
import TasksClient, { type FilterType } from "./TasksClient";

export const metadata: Metadata = { title: "Tasks" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface TasksPageProps {
  searchParams?: Promise<{ filter?: string }>;
}

export default async function TasksPage(props: TasksPageProps) {
  const searchParams = (await props.searchParams) || {};
  const rawFilter = searchParams.filter;
  const filter: FilterType =
    rawFilter === "upcoming" || rawFilter === "completed" ? rawFilter : "today";

  const tasks = await getDailyTasks({ dateFilter: filter });

  return (
    <AppShell title="Tasks">
      <Link href="/planner" className="inline-flex items-center gap-1.5 text-xs mb-4 fade-in" style={{ color: "var(--color-text-muted)" }}>
        ← Planner
      </Link>
      <h1 className="text-xl font-bold mb-1 fade-in" style={{ color: "var(--color-text-primary)" }}>
        Daily Tasks
      </h1>
      <p className="text-xs mb-5 fade-in" style={{ color: "var(--color-text-muted)" }}>
        {filter === "today" ? "Today's tasks" : filter === "upcoming" ? "Upcoming tasks" : "Completed tasks"}
        {tasks.length > 0 ? ` · ${tasks.length} task${tasks.length > 1 ? "s" : ""}` : ""}
      </p>
      <div className="fade-in">
        <TasksClient initialTasks={tasks} initialFilter={filter} />
      </div>
    </AppShell>
  );
}
