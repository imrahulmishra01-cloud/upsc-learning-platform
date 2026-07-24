/**
 * Phase 2C — Rule-based Study Plan Generator
 * Pure TypeScript logic, no AI/Gemini calls.
 * Exports: buildGeneratorPlan()
 */

import type { PlanPace } from "@/lib/db/types";

// ── Constants ─────────────────────────────────────────────────────────────

/** UPSC GS paper short labels used in task titles. */
const GS_PAPERS = ["GS1", "GS2", "GS3", "GS4"] as const;


/** Task type string literal union */
type TaskType =
  | "study"
  | "revision"
  | "notes"
  | "answer_writing"
  | "csat"
  | "current_affairs"
  | "backlog";


/** Pace multipliers on daily task count */
const PACE_FACTOR: Record<PlanPace, number> = {
  slow:       0.7,
  normal:     1.0,
  aggressive: 1.3,
};

/** How many daily task slots to target per pace */
const BASE_SLOTS_PER_DAY: Record<PlanPace, number> = {
  slow:       1,
  normal:     2,
  aggressive: 3,
};

// ── Date helpers ──────────────────────────────────────────────────────────

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split("T")[0];
}

export function diffDays(a: string, b: string): number {
  return Math.ceil(
    (new Date(b).getTime() - new Date(a).getTime()) / 86400000
  );
}

/** Returns ISO date string for the Monday of the week containing `dateStr` */
function weekMonday(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}

/** Returns ISO date string for the Sunday of the week containing `dateStr` */
function weekSunday(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getUTCDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}

/** Returns the last day of the calendar month containing `dateStr` */
function monthEnd(dateStr: string): string {
  const d = new Date(dateStr);
  return new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
}

/** Clamps a date string to not exceed `ceiling` */
function clamp(dateStr: string, ceiling: string): string {
  return dateStr > ceiling ? ceiling : dateStr;
}

// ── Plan phase labeling ───────────────────────────────────────────────────

type PlanPhase =
  | "foundation"
  | "core"
  | "answer_writing"
  | "consolidation"
  | "final_revision"
  | "crash";

function getPlanPhases(totalDays: number): PlanPhase[] {
  if (totalDays < 90) return ["crash"];
  if (totalDays < 180) return ["core", "answer_writing", "consolidation"];
  if (totalDays < 270) return ["foundation", "core", "answer_writing", "final_revision"];
  return ["foundation", "core", "answer_writing", "consolidation", "final_revision"];
}

function phaseLabel(phase: PlanPhase): string {
  const labels: Record<PlanPhase, string> = {
    foundation:     "Foundation Phase",
    core:           "GS Core Phase",
    answer_writing: "Answer Writing & Revision Phase",
    consolidation:  "Consolidation Phase",
    final_revision: "Final Revision Phase",
    crash:          "Crash Revision Phase",
  };
  return labels[phase];
}

function phaseFocusArea(phase: PlanPhase): string {
  const areas: Record<PlanPhase, string> = {
    foundation:     "NCERT foundation, basic reading, current affairs habit",
    core:           "GS1-4 core syllabus coverage, notes making",
    answer_writing: "Answer writing practice, revision cycles",
    consolidation:  "Test-series integration, gap analysis, backlog",
    final_revision: "Full syllabus revision, PYQ analysis, speed drills",
    crash:          "High-priority revision, current affairs, answer writing",
  };
  return areas[phase];
}

// ── Task sequence builders ────────────────────────────────────────────────

type DailyTaskTemplate = {
  title: string;
  task_type: TaskType;
  estimated_minutes: number;
  priority: 1 | 2 | 3;
  description: string;
};

function getTaskRotation(phase: PlanPhase, pace: PlanPace, includeCsat: boolean): DailyTaskTemplate[] {
  const templates: DailyTaskTemplate[] = [];
  const factor = PACE_FACTOR[pace];
  const slots = BASE_SLOTS_PER_DAY[pace];

  if (phase === "foundation") {
    templates.push(
      { title: "Study GS1 foundation block", task_type: "study", estimated_minutes: Math.round(90 * factor), priority: 1, description: "[Rule-generated] GS1 History, Geography, Society — NCERT foundation reading." },
      { title: "Study GS2 polity basics",    task_type: "study", estimated_minutes: Math.round(90 * factor), priority: 1, description: "[Rule-generated] GS2 Polity — Constitution, Parliament, Federalism." },
      { title: "Study GS3 economy foundation", task_type: "study", estimated_minutes: Math.round(90 * factor), priority: 2, description: "[Rule-generated] GS3 Economy — NCERT basics, economic concepts." },
      { title: "Current affairs note-making", task_type: "current_affairs", estimated_minutes: 30, priority: 2, description: "[Rule-generated] Daily current affairs from approved newspaper sources." },
      { title: "GS1 foundation revision",    task_type: "revision", estimated_minutes: 45, priority: 2, description: "[Rule-generated] Review and reinforce GS1 foundation notes." },
    );
  } else if (phase === "core") {
    const papers = [...GS_PAPERS];
    for (const paper of papers) {
      templates.push({
        title: `Study ${paper} core topics`,
        task_type: "study",
        estimated_minutes: Math.round(90 * factor),
        priority: 1,
        description: `[Rule-generated] ${paper} systematic syllabus coverage — main UPSC topics.`,
      });
    }
    templates.push(
      { title: "Notes consolidation block",  task_type: "notes",  estimated_minutes: 30,  priority: 2, description: "[Rule-generated] Consolidate and organize notes from previous study sessions." },
      { title: "Current affairs note-making", task_type: "current_affairs", estimated_minutes: 30, priority: 2, description: "[Rule-generated] Daily current affairs note-making." },
      { title: "Weekly revision review",     task_type: "revision", estimated_minutes: Math.round(45 * factor), priority: 2, description: "[Rule-generated] Revise topics studied earlier this week." },
    );
  } else if (phase === "answer_writing") {
    templates.push(
      { title: "Answer writing practice — GS1", task_type: "answer_writing", estimated_minutes: Math.round(60 * factor), priority: 1, description: "[Rule-generated] Timed answer writing for GS1 — aim for 150-200 words." },
      { title: "Answer writing practice — GS2", task_type: "answer_writing", estimated_minutes: Math.round(60 * factor), priority: 1, description: "[Rule-generated] Timed answer writing for GS2 — governance, polity." },
      { title: "Answer writing practice — GS3", task_type: "answer_writing", estimated_minutes: Math.round(60 * factor), priority: 1, description: "[Rule-generated] Timed answer writing for GS3 — economy, environment." },
      { title: "Answer writing practice — GS4", task_type: "answer_writing", estimated_minutes: Math.round(60 * factor), priority: 1, description: "[Rule-generated] Timed answer writing for GS4 — ethics case studies." },
      { title: "Revise previous GS notes",    task_type: "revision", estimated_minutes: Math.round(45 * factor), priority: 2, description: "[Rule-generated] Spaced revision of GS notes from core phase." },
      { title: "Current affairs — editorial analysis", task_type: "current_affairs", estimated_minutes: 30, priority: 2, description: "[Rule-generated] Read and analyse editorials — link to GS topics." },
    );
  } else if (phase === "consolidation") {
    templates.push(
      { title: "Backlog catch-up block",       task_type: "backlog",       estimated_minutes: Math.round(60 * factor), priority: 1, description: "[Rule-generated] Catch up on any pending or missed topics." },
      { title: "Full GS syllabus revision",    task_type: "revision",      estimated_minutes: Math.round(45 * factor), priority: 1, description: "[Rule-generated] Systematic revision across all GS papers." },
      { title: "PYQ practice placeholder",     task_type: "study",         estimated_minutes: 45, priority: 2, description: "[Rule-generated] PYQ practice block — use previous year papers from your own materials. (PYQ bank deferred to later phase.)" },
      { title: "Answer writing sprint",        task_type: "answer_writing", estimated_minutes: Math.round(60 * factor), priority: 2, description: "[Rule-generated] High-volume answer writing practice." },
    );
  } else if (phase === "final_revision") {
    templates.push(
      { title: "Final revision — GS1 full",    task_type: "revision", estimated_minutes: Math.round(90 * factor), priority: 1, description: "[Rule-generated] Complete GS1 rapid revision cycle." },
      { title: "Final revision — GS2 full",    task_type: "revision", estimated_minutes: Math.round(90 * factor), priority: 1, description: "[Rule-generated] Complete GS2 rapid revision cycle." },
      { title: "Final revision — GS3 full",    task_type: "revision", estimated_minutes: Math.round(90 * factor), priority: 1, description: "[Rule-generated] Complete GS3 rapid revision cycle." },
      { title: "Final revision — GS4 & Essay", task_type: "revision", estimated_minutes: Math.round(60 * factor), priority: 1, description: "[Rule-generated] GS4 ethics + essay rapid revision." },
      { title: "Current affairs — last 6 months", task_type: "current_affairs", estimated_minutes: 30, priority: 2, description: "[Rule-generated] Current affairs rapid review of recent 6 months." },
    );
  } else {
    // crash
    templates.push(
      { title: "High-priority GS revision",   task_type: "revision",       estimated_minutes: Math.round(90 * factor), priority: 1, description: "[Rule-generated] Crash plan: rapid high-priority GS coverage." },
      { title: "Answer writing — crash round", task_type: "answer_writing", estimated_minutes: Math.round(60 * factor), priority: 1, description: "[Rule-generated] Crash plan: answer writing under timed conditions." },
      { title: "Current affairs rapid review", task_type: "current_affairs", estimated_minutes: 30, priority: 1, description: "[Rule-generated] Crash plan: recent current affairs rapid scan." },
    );
  }

  if (includeCsat && (phase === "foundation" || phase === "core" || phase === "crash")) {
    templates.push({
      title: "CSAT practice block",
      task_type: "csat",
      estimated_minutes: Math.round(45 * factor),
      priority: 3,
      description: "[Rule-generated] CSAT comprehension and maths practice.",
    });
  }

  // Return the right number of templates per pace
  return templates.slice(0, Math.max(slots + 1, templates.length));
}

// ── Main generator ────────────────────────────────────────────────────────

export interface GeneratorInput {
  planId: string;
  userId: string;
  startDate: string;
  targetDate: string;
  dailyAvailableMinutes: number;
  pace: PlanPace;
  backlogBufferDays: number;
  includeCsat: boolean;
  includeOptional: boolean;
}

export interface GeneratedMonthlyTarget {
  user_id: string;
  plan_id: string;
  month_start: string;
  month_end: string;
  title: string;
  focus_area: string;
  target_minutes: number;
  status: "planned";
  visibility: "private";
}

export interface GeneratedWeeklyTarget {
  user_id: string;
  plan_id: string;
  monthly_target_id: null; // will be filled after monthly insert
  week_start: string;
  week_end: string;
  title: string;
  focus_area: string;
  target_minutes: number;
  status: "planned";
  visibility: "private";
  // local-only for linking:
  _month_start: string;
}

export interface GeneratedDailyTask {
  user_id: string;
  plan_id: string;
  weekly_target_id: null; // will be filled after weekly insert
  title: string;
  description: string;
  task_type: string;
  task_date: string;
  estimated_minutes: number;
  actual_minutes: 0;
  status: "pending";
  priority: number;
  visibility: "private";
  // local-only for linking:
  _week_start: string;
}

export interface GeneratorPlan {
  months: GeneratedMonthlyTarget[];
  weeks: GeneratedWeeklyTarget[];
  tasks: GeneratedDailyTask[];
  revisionTaskDates: string[];   // dates for simple milestone-based revision tasks
  summary: {
    totalDays: number;
    activeDays: number;
    bufferDays: number;
    phases: PlanPhase[];
  };
}

/**
 * Builds all monthly targets, weekly targets, and daily tasks for the plan.
 * Pure computation — no DB calls. All DB writes happen in the API route.
 *
 * Cap: max 500 daily tasks to keep inserts fast and realistic.
 */
export function buildGeneratorPlan(input: GeneratorInput): GeneratorPlan {
  const {
    planId, userId, startDate, targetDate,
    dailyAvailableMinutes, pace, backlogBufferDays,
    includeCsat, includeOptional,
  } = input;

  const totalDays  = diffDays(startDate, targetDate);
  const activeDays = Math.max(1, totalDays - backlogBufferDays);
  const phases     = getPlanPhases(totalDays);

  const MAX_DAILY_TASKS = 500;

  // ── Build monthly targets ───────────────────────────────────────────────
  const months: GeneratedMonthlyTarget[] = [];
  let cursor = startDate;
  let monthIdx = 0;

  while (cursor <= targetDate) {
    const mEnd = clamp(monthEnd(cursor), targetDate);
    const mDays = diffDays(cursor, mEnd) + 1;

    // Assign a phase label proportionally
    const phaseIdx = Math.min(
      Math.floor((monthIdx / Math.ceil(totalDays / 30)) * phases.length),
      phases.length - 1
    );
    const phase = phases[phaseIdx];

    months.push({
      user_id:        userId,
      plan_id:        planId,
      month_start:    cursor,
      month_end:      mEnd,
      title:          `Month ${monthIdx + 1} — ${phaseLabel(phase)}`,
      focus_area:     phaseFocusArea(phase),
      target_minutes: mDays * dailyAvailableMinutes,
      status:         "planned",
      visibility:     "private",
    });

    if (mEnd >= targetDate) break;
    cursor = addDays(mEnd, 1);
    monthIdx++;
  }

  // ── Build weekly targets ────────────────────────────────────────────────
  const weeks: GeneratedWeeklyTarget[] = [];
  let weekCursor = weekMonday(startDate);
  let weekIdx = 0;

  while (weekCursor <= targetDate) {
    const wEnd = clamp(weekSunday(weekCursor), targetDate);
    const wStart = weekCursor < startDate ? startDate : weekCursor;
    if (wStart > targetDate) break;

    const wDays = diffDays(wStart, wEnd) + 1;
    const phaseIdx = Math.min(
      Math.floor((weekIdx / Math.ceil(totalDays / 7)) * phases.length),
      phases.length - 1
    );
    const phase = phases[phaseIdx];

    weeks.push({
      user_id:           userId,
      plan_id:           planId,
      monthly_target_id: null,
      week_start:        wStart,
      week_end:          wEnd,
      title:             `Week ${weekIdx + 1} — ${phaseLabel(phase)}`,
      focus_area:        phaseFocusArea(phase),
      target_minutes:    wDays * dailyAvailableMinutes,
      status:            "planned",
      visibility:        "private",
      _month_start:      cursor, // will be resolved when inserting
    });

    if (wEnd >= targetDate) break;
    weekCursor = addDays(wEnd, 1);
    weekIdx++;
  }

  // Link each week to its month's month_start (the month that contains week_start)
  for (const week of weeks) {
    const containing = months.find(
      (m) => week.week_start >= m.month_start && week.week_start <= m.month_end
    );
    week._month_start = containing?.month_start ?? months[0]?.month_start ?? startDate;
  }

  // ── Build daily tasks ───────────────────────────────────────────────────
  const tasks: GeneratedDailyTask[] = [];
  let daysCovered = 0;
  let taskCount = 0;

  for (const week of weeks) {
    if (taskCount >= MAX_DAILY_TASKS) break;

    const wPhaseIdx = Math.min(
      Math.floor((weeks.indexOf(week) / weeks.length) * phases.length),
      phases.length - 1
    );
    const wPhase = phases[wPhaseIdx];
    const rotation = getTaskRotation(wPhase, pace, includeCsat);
    let rotIdx = 0;

    // Walk through each day in this week
    let dayCursor = week.week_start;
    while (dayCursor <= week.week_end && dayCursor <= targetDate) {
      if (taskCount >= MAX_DAILY_TASKS) break;

      // Skip backlog buffer days (spread evenly at week boundaries)
      const isBufferDay =
        backlogBufferDays > 0 &&
        daysCovered > 0 &&
        daysCovered % Math.max(1, Math.floor(activeDays / backlogBufferDays)) === 0;

      if (isBufferDay && daysCovered < totalDays - 1) {
        // Backlog buffer day — insert a catch-up task instead of regular tasks
        tasks.push({
          user_id:           userId,
          plan_id:           planId,
          weekly_target_id:  null,
          title:             "Backlog catch-up block",
          description:       "[Rule-generated] Backlog buffer day — catch up on pending or missed tasks.",
          task_type:         "backlog",
          task_date:         dayCursor,
          estimated_minutes: Math.min(dailyAvailableMinutes, 60),
          actual_minutes:    0,
          status:            "pending",
          priority:          2,
          visibility:        "private",
          _week_start:       week.week_start,
        });
        taskCount++;
        daysCovered++;
        dayCursor = addDays(dayCursor, 1);
        continue;
      }

      // Determine how many tasks fit in available minutes today
      let minutesLeft = dailyAvailableMinutes;
      const slotsPerDay = BASE_SLOTS_PER_DAY[pace];
      let slotsThisDay = 0;

      while (minutesLeft >= 20 && slotsThisDay < slotsPerDay && taskCount < MAX_DAILY_TASKS) {
        const tpl = rotation[rotIdx % rotation.length];
        const est = Math.min(tpl.estimated_minutes, minutesLeft);
        if (est < 20) break;

        tasks.push({
          user_id:           userId,
          plan_id:           planId,
          weekly_target_id:  null,
          title:             tpl.title,
          description:       tpl.description,
          task_type:         tpl.task_type,
          task_date:         dayCursor,
          estimated_minutes: est,
          actual_minutes:    0,
          status:            "pending",
          priority:          tpl.priority,
          visibility:        "private",
          _week_start:       week.week_start,
        });

        minutesLeft -= est;
        rotIdx++;
        slotsThisDay++;
        taskCount++;
      }

      daysCovered++;
      dayCursor = addDays(dayCursor, 1);
    }
  }

  // Optional subject block — appended if requested and there's space
  if (includeOptional && taskCount < MAX_DAILY_TASKS) {
    // Sprinkle one optional task per week across the first 60% of the plan
    const optionalWeeks = weeks.slice(0, Math.ceil(weeks.length * 0.6));
    for (const week of optionalWeeks) {
      if (taskCount >= MAX_DAILY_TASKS) break;
      tasks.push({
        user_id:           userId,
        plan_id:           planId,
        weekly_target_id:  null,
        title:             "Optional subject study block",
        description:       "[Rule-generated] Weekly optional subject study slot. Assign your specific optional paper.",
        task_type:         "study",
        task_date:         week.week_start,
        estimated_minutes: 60,
        actual_minutes:    0,
        status:            "pending",
        priority:          3,
        visibility:        "private",
        _week_start:       week.week_start,
      });
      taskCount++;
    }
  }

  // ── Simple revision milestone dates ────────────────────────────────────
  // Create revision_tasks at 30, 60, 90 day checkpoints if within plan
  const revisionTaskDates: string[] = [];
  for (const days of [30, 60, 90]) {
    const d = addDays(startDate, days);
    if (d < targetDate) revisionTaskDates.push(d);
  }

  return {
    months,
    weeks,
    tasks,
    revisionTaskDates,
    summary: { totalDays, activeDays, bufferDays: backlogBufferDays, phases },
  };
}
