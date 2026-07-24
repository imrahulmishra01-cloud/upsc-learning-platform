import { NextRequest, NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import {
  buildGeneratorPlan,
  type GeneratorInput,
} from "@/lib/generator/planner-generator";
import type { PlanPace } from "@/lib/db/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_PACES: PlanPace[] = ["slow", "normal", "aggressive"];

export async function POST(req: NextRequest) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  // ── Body ──────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { plan_id, daily_available_minutes, pace, backlog_buffer_days, include_csat, include_optional } = body;

  if (!plan_id || typeof plan_id !== "string" || plan_id.trim().length === 0) {
    return NextResponse.json({ error: "plan_id is required." }, { status: 400 });
  }

  // ── Fetch and verify plan ─────────────────────────────────────────────
  const { data: plan, error: planErr } = await supabase
    .from("study_plans")
    .select("id, user_id, start_date, target_date, daily_available_minutes, pace, backlog_buffer_days, status")
    .eq("id", plan_id)
    .eq("user_id", user.id)   // ownership check on top of RLS
    .maybeSingle();

  if (planErr) {
    return NextResponse.json({ error: planErr.message }, { status: 500 });
  }
  if (!plan) {
    return NextResponse.json({ error: "Plan not found or access denied." }, { status: 404 });
  }
  if (plan.status === "archived") {
    return NextResponse.json({ error: "Cannot generate for an archived plan." }, { status: 422 });
  }

  // ── Resolve generator params (body overrides plan defaults) ───────────
  const finalMinutes = (() => {
    const v = Number(daily_available_minutes ?? plan.daily_available_minutes);
    return Number.isFinite(v) && v > 0 ? v : plan.daily_available_minutes;
  })();

  const finalPace: PlanPace = (() => {
    const p = (pace as string) ?? plan.pace;
    return VALID_PACES.includes(p as PlanPace) ? (p as PlanPace) : plan.pace;
  })();

  const finalBuffer = (() => {
    const v = Number(backlog_buffer_days ?? plan.backlog_buffer_days);
    return Number.isFinite(v) && v >= 0 ? v : plan.backlog_buffer_days;
  })();

  const finalCsat     = Boolean(include_csat ?? false);
  const finalOptional = Boolean(include_optional ?? false);

  // ── Date validation ───────────────────────────────────────────────────
  if (plan.target_date <= plan.start_date) {
    return NextResponse.json({ error: "Plan target_date must be after start_date." }, { status: 422 });
  }
  if (finalMinutes < 1) {
    return NextResponse.json({ error: "daily_available_minutes must be positive." }, { status: 400 });
  }

  // ── Duplicate generation guard ────────────────────────────────────────
  // Check if monthly_targets or daily_tasks already exist for this plan.
  // If they do, block the generation (safer than auto-deleting).
  const [existingMonthly, existingTasks] = await Promise.all([
    supabase
      .from("monthly_targets")
      .select("id")
      .eq("plan_id", plan_id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),

    supabase
      .from("daily_tasks")
      .select("id")
      .eq("plan_id", plan_id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  const hasDuplicate =
    (existingMonthly.data !== null) || (existingTasks.data !== null);

  if (hasDuplicate) {
    return NextResponse.json(
      {
        error:
          "Generated plan content already exists for this plan. " +
          "Delete existing monthly targets or tasks before regenerating. " +
          "(Regeneration/reset workflow will be added in a later phase.)",
        code: "DUPLICATE_GENERATION",
      },
      { status: 409 }
    );
  }

  // ── Build the plan (pure computation) ────────────────────────────────
  const generatorInput: GeneratorInput = {
    planId:               plan_id,
    userId:               user.id,
    startDate:            plan.start_date,
    targetDate:           plan.target_date,
    dailyAvailableMinutes: finalMinutes,
    pace:                 finalPace,
    backlogBufferDays:    finalBuffer,
    includeCsat:          finalCsat,
    includeOptional:      finalOptional,
  };

  const generated = buildGeneratorPlan(generatorInput);

  if (generated.months.length === 0) {
    return NextResponse.json({ error: "Plan date range too short to generate targets." }, { status: 422 });
  }

  // ── Insert monthly_targets ────────────────────────────────────────────
  const { data: insertedMonths, error: monthErr } = await supabase
    .from("monthly_targets")
    .insert(generated.months.map(({ ...m }) => m))
    .select("id, month_start");

  if (monthErr || !insertedMonths) {
    return NextResponse.json({ error: monthErr?.message ?? "Failed to insert monthly targets." }, { status: 500 });
  }

  // Build month_start → id map
  const monthMap = new Map<string, string>(
    insertedMonths.map((m: { id: string; month_start: string }) => [m.month_start, m.id])
  );

  // ── Insert weekly_targets (resolve monthly_target_id) ─────────────────
  const weeksToInsert = generated.weeks.map(({ _month_start, ...w }) => ({
    ...w,
    monthly_target_id: monthMap.get(_month_start) ?? null,
  }));

  const { data: insertedWeeks, error: weekErr } = await supabase
    .from("weekly_targets")
    .insert(weeksToInsert)
    .select("id, week_start");

  if (weekErr || !insertedWeeks) {
    return NextResponse.json({ error: weekErr?.message ?? "Failed to insert weekly targets." }, { status: 500 });
  }

  // Build week_start → id map (take the first match if overlap)
  const weekMap = new Map<string, string>();
  for (const w of insertedWeeks as { id: string; week_start: string }[]) {
    if (!weekMap.has(w.week_start)) weekMap.set(w.week_start, w.id);
  }

  // ── Insert daily_tasks in batches of 100 ─────────────────────────────
  const tasksToInsert = generated.tasks.map(({ _week_start, ...t }) => ({
    ...t,
    weekly_target_id: weekMap.get(_week_start) ?? null,
  }));

  let tasksCreated = 0;
  const BATCH = 100;
  for (let i = 0; i < tasksToInsert.length; i += BATCH) {
    const batch = tasksToInsert.slice(i, i + BATCH);
    const { error: taskBatchErr } = await supabase.from("daily_tasks").insert(batch);
    if (taskBatchErr) {
      return NextResponse.json({ error: taskBatchErr.message }, { status: 500 });
    }
    tasksCreated += batch.length;
  }

  // ── Insert simple revision_tasks at milestone dates ───────────────────
  let revisionTasksCreated = 0;
  if (generated.revisionTaskDates.length > 0) {
    const revisionRows = generated.revisionTaskDates.map((due_date) => ({
      user_id:    user.id,
      topic_id:   null,
      subtopic_id: null,
      visibility: "private" as const,
      interval_id: null,
      due_date,
      notes:       `[Rule-generated] ${finalPace} plan milestone revision checkpoint.`,
    }));
    const { error: revErr } = await supabase.from("revision_tasks").insert(revisionRows);
    if (!revErr) revisionTasksCreated = revisionRows.length;
    // Non-fatal if revision_task insert fails — just skip
  }

  // ── Mark plan as generated + activate it ─────────────────────────────
  // Demote other active plans first (same logic as PATCH /api/planner/plans)
  await supabase
    .from("study_plans")
    .update({ status: "paused" })
    .eq("user_id", user.id)
    .eq("status", "active")
    .neq("id", plan_id);

  await supabase
    .from("study_plans")
    .update({
      generated_by: "future_generator",  // matches DB constraint
      status:       "active",
    })
    .eq("id", plan_id)
    .eq("user_id", user.id);

  // ── Return summary ────────────────────────────────────────────────────
  return NextResponse.json(
    {
      ok: true,
      summary: {
        months_created:         insertedMonths.length,
        weeks_created:          insertedWeeks.length,
        tasks_created:          tasksCreated,
        revision_tasks_created: revisionTasksCreated,
        date_range:             `${plan.start_date} → ${plan.target_date}`,
        pace:                   finalPace,
        daily_minutes:          finalMinutes,
        total_days:             generated.summary.totalDays,
        active_days:            generated.summary.activeDays,
        buffer_days:            generated.summary.bufferDays,
        phases:                 generated.summary.phases,
        include_csat:           finalCsat,
        include_optional:       finalOptional,
      },
    },
    { status: 201 }
  );
}
