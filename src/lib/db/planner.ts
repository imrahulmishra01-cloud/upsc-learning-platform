/**
 * Server-only planner data fetch helpers.
 * Uses user-scoped Supabase client — no service role key.
 * Import only in Server Components, Route Handlers, or Server Actions.
 */
import { createClient } from "@/lib/supabase/server";
import type {
  StudyPlan,
  StudyGoal,
  DailyTask,
  BacklogItem,
  PlannerSummary,
} from "@/lib/db/types";

/** Returns today's date string in YYYY-MM-DD format (UTC). */
function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/** Returns the Monday of the current week (UTC). */
function weekStartISO(): string {
  const d = new Date();
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}

/** Returns the Sunday of the current week (UTC). */
function weekEndISO(): string {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}

/**
 * Fetches the user's active study plan (if any).
 * Returns null if no plan or Supabase not configured.
 */
export async function getActivePlan(): Promise<StudyPlan | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from("study_plans")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as StudyPlan | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetches all study plans for the current user.
 */
export async function getStudyPlans(): Promise<StudyPlan[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("study_plans")
      .select("*")
      .order("created_at", { ascending: false });
    return (data as StudyPlan[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetches today's daily tasks for the current user.
 */
export async function getTodayTasks(): Promise<DailyTask[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("task_date", todayISO())
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true });
    return (data as DailyTask[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetches daily tasks with optional filters.
 */
export async function getDailyTasks(opts?: {
  dateFilter?: "today" | "upcoming" | "completed";
  limit?: number;
}): Promise<DailyTask[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  try {
    let query = supabase
      .from("daily_tasks")
      .select("*")
      .order("task_date", { ascending: true })
      .order("priority", { ascending: true });

    const today = todayISO();
    if (opts?.dateFilter === "today") {
      query = query.eq("task_date", today);
    } else if (opts?.dateFilter === "upcoming") {
      query = query
        .gte("task_date", today)
        .in("status", ["pending", "in_progress"]);
    } else if (opts?.dateFilter === "completed") {
      query = query.eq("status", "completed");
    }

    if (opts?.limit) query = query.limit(opts.limit);

    const { data } = await query;
    return (data as DailyTask[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetches all study goals for the current user.
 */
export async function getStudyGoals(): Promise<StudyGoal[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("study_goals")
      .select("*")
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });
    return (data as StudyGoal[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetches open backlog items for the current user.
 */
export async function getBacklogItems(): Promise<BacklogItem[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("backlog_items")
      .select("*")
      .in("status", ["open", "rescheduled"])
      .order("due_date", { ascending: true });
    return (data as BacklogItem[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Builds a PlannerSummary for the planner hub page.
 * Gracefully returns zeros/nulls if tables don't exist or no data yet.
 */
export async function getPlannerSummary(): Promise<PlannerSummary> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      activePlan: null,
      todayTasksTotal: 0,
      todayTasksDone: 0,
      todayMinutesLogged: 0,
      revisionDueCount: 0,
      weeklyTargetMinutes: 0,
      weeklyLoggedMinutes: 0,
      backlogOpenCount: 0,
      caRevisionDueCount: 0,
    };
  }

  const today = todayISO();
  const weekStart = weekStartISO();
  const weekEnd = weekEndISO();

  // Run all queries concurrently, never crashing on table-not-found
  const [
    activePlanRes,
    todayTasksRes,
    revisionRes,
    weeklyTargetRes,
    timeLogsRes,
    backlogRes,
    caRevisionRes,
  ] = await Promise.allSettled([
    supabase
      .from("study_plans")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("daily_tasks")
      .select("id, status, actual_minutes")
      .eq("task_date", today),

    supabase
      .from("revision_tasks")
      .select("id")
      .lte("due_date", today)
      .is("completed_at", null),

    supabase
      .from("weekly_targets")
      .select("target_minutes")
      .gte("week_start", weekStart)
      .lte("week_end", weekEnd)
      .eq("status", "active")
      .limit(1)
      .maybeSingle(),

    supabase
      .from("time_logs")
      .select("minutes")
      .gte("log_date", weekStart)
      .lte("log_date", weekEnd),

    supabase
      .from("backlog_items")
      .select("id")
      .eq("status", "open"),

    supabase
      .from("current_affairs_entries")
      .select("id")
      .neq("status", "skipped")
      .lte("revision_date", today),
  ]);

  // Safe extraction
  const activePlan =
    activePlanRes.status === "fulfilled"
      ? ((activePlanRes.value.data as StudyPlan | null) ?? null)
      : null;

  const todayTasks =
    todayTasksRes.status === "fulfilled"
      ? ((todayTasksRes.value.data as { id: string; status: string; actual_minutes: number }[] | null) ?? [])
      : [];

  const todayTasksTotal = todayTasks.length;
  const todayTasksDone = todayTasks.filter((t) => t.status === "completed").length;
  const todayMinutesLogged = todayTasks.reduce((sum, t) => sum + (t.actual_minutes ?? 0), 0);

  const revisionDueCount =
    revisionRes.status === "fulfilled"
      ? (revisionRes.value.data?.length ?? 0)
      : 0;

  const weeklyTargetMinutes =
    weeklyTargetRes.status === "fulfilled"
      ? (((weeklyTargetRes.value.data as { target_minutes?: number } | null)?.target_minutes) ?? 0)
      : 0;

  const timeLogs =
    timeLogsRes.status === "fulfilled"
      ? ((timeLogsRes.value.data as { minutes: number }[] | null) ?? [])
      : [];
  const weeklyLoggedMinutes = timeLogs.reduce((sum, l) => sum + (l.minutes ?? 0), 0);

  const backlogOpenCount =
    backlogRes.status === "fulfilled"
      ? (backlogRes.value.data?.length ?? 0)
      : 0;

  const caRevisionDueCount =
    caRevisionRes.status === "fulfilled"
      ? (caRevisionRes.value.data?.length ?? 0)
      : 0;

  return {
    activePlan,
    todayTasksTotal,
    todayTasksDone,
    todayMinutesLogged,
    revisionDueCount,
    weeklyTargetMinutes,
    weeklyLoggedMinutes,
    backlogOpenCount,
    caRevisionDueCount,
  };
}

/**
 * Fetches dashboard counts for the /dashboard page cards.
 * Never throws — returns zeros on any error.
 */
export async function getDashboardCounts(): Promise<{
  todayTasksPending: number | null;
  revisionDue: number | null;
  aiUsedToday: number | null;
  aiDailyLimit: number | null;
  avgTopicProgress: number | null;
  caRevisionDue: number | null;
  testsPending: number | null;
  pyqsDue: number | null;
  activeMaterials: number | null;
}> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      todayTasksPending: null,
      revisionDue: null,
      aiUsedToday: null,
      aiDailyLimit: null,
      avgTopicProgress: null,
      caRevisionDue: null,
      testsPending: null,
      pyqsDue: null,
      activeMaterials: null,
    };
  }

  const today = todayISO();

  const [
    tasksRes,
    revisionRes,
    aiRes,
    progressRes,
    caRevisionRes,
    testsRes,
    pyqsRes,
    materialsRes
  ] = await Promise.allSettled([
    supabase
      .from("daily_tasks")
      .select("id", { count: "exact", head: true })
      .eq("task_date", today)
      .in("status", ["pending", "in_progress"]),

    supabase
      .from("revision_tasks")
      .select("id", { count: "exact", head: true })
      .lte("due_date", today)
      .is("completed_at", null),

    supabase
      .from("ai_usage_limits")
      .select("used_today, daily_limit")
      .limit(1)
      .maybeSingle(),

    supabase
      .from("topic_progress")
      .select("coverage_pct"),

    supabase
      .from("current_affairs_entries")
      .select("id", { count: "exact", head: true })
      .neq("status", "skipped")
      .lte("revision_date", today),

    supabase
      .from("test_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "started"),

    supabase
      .from("pyq_attempts")
      .select("id", { count: "exact", head: true })
      .eq("revision_needed", true),

    supabase
      .from("material_library")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  const todayTasksPending =
    tasksRes.status === "fulfilled" && !tasksRes.value.error ? (tasksRes.value.count ?? 0) : null;

  const revisionDue =
    revisionRes.status === "fulfilled" && !revisionRes.value.error ? (revisionRes.value.count ?? 0) : null;

  const aiRow =
    aiRes.status === "fulfilled" && !aiRes.value.error
      ? (aiRes.value.data as { used_today: number; daily_limit: number } | null)
      : null;
  const aiUsedToday = aiRes.status === "fulfilled" && !aiRes.value.error ? (aiRow?.used_today ?? 0) : null;
  const aiDailyLimit = aiRes.status === "fulfilled" && !aiRes.value.error ? (aiRow?.daily_limit ?? 20) : null;

  const progressRows =
    progressRes.status === "fulfilled" && !progressRes.value.error
      ? ((progressRes.value.data as { coverage_pct: number }[] | null) ?? [])
      : null;
  const avgTopicProgress =
    progressRows !== null
      ? progressRows.length > 0
        ? Math.round(progressRows.reduce((s, r) => s + r.coverage_pct, 0) / progressRows.length)
        : 0
      : null;

  const caRevisionDue =
    caRevisionRes.status === "fulfilled" && !caRevisionRes.value.error ? (caRevisionRes.value.count ?? 0) : null;

  const testsPending =
    testsRes.status === "fulfilled" && !testsRes.value.error ? (testsRes.value.count ?? 0) : null;

  const pyqsDue =
    pyqsRes.status === "fulfilled" && !pyqsRes.value.error ? (pyqsRes.value.count ?? 0) : null;

  const activeMaterials =
    materialsRes.status === "fulfilled" && !materialsRes.value.error ? (materialsRes.value.count ?? 0) : null;

  return {
    todayTasksPending,
    revisionDue,
    aiUsedToday,
    aiDailyLimit,
    avgTopicProgress,
    caRevisionDue,
    testsPending,
    pyqsDue,
    activeMaterials,
  };
}
