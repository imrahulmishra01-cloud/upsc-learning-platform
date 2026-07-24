import { NextRequest, NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/planner/plans — Create a new study plan */
export async function POST(req: NextRequest) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { title, start_date, target_date, daily_available_minutes, pace, backlog_buffer_days, description } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }
  if (!start_date || !target_date) {
    return NextResponse.json({ error: "start_date and target_date are required." }, { status: 400 });
  }
  if (new Date(target_date as string) <= new Date(start_date as string)) {
    return NextResponse.json({ error: "target_date must be after start_date." }, { status: 400 });
  }
  const minutes = Number(daily_available_minutes ?? 120);
  if (!Number.isFinite(minutes) || minutes < 1) {
    return NextResponse.json({ error: "daily_available_minutes must be a positive number." }, { status: 400 });
  }
  const paceVal = (pace as string) ?? "normal";
  if (!["slow", "normal", "aggressive"].includes(paceVal)) {
    return NextResponse.json({ error: "pace must be slow, normal, or aggressive." }, { status: 400 });
  }
  const bufferDays = Number(backlog_buffer_days ?? 7);
  if (!Number.isFinite(bufferDays) || bufferDays < 0) {
    return NextResponse.json({ error: "backlog_buffer_days must be >= 0." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("study_plans")
    .insert({
      user_id: user.id,
      title: (title as string).trim(),
      description: description ? String(description).trim() : null,
      start_date,
      target_date,
      daily_available_minutes: minutes,
      pace: paceVal,
      backlog_buffer_days: bufferDays,
      status: "paused",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ plan: data }, { status: 201 });
}

/** PATCH /api/planner/plans — Update or activate a study plan */
export async function PATCH(req: NextRequest) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { id, action } = body;
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const validActions = ["activate", "archive"];
  const actionVal = (action as string) || "activate";

  if (!validActions.includes(actionVal)) {
    return NextResponse.json({ error: "action must be 'activate' or 'archive'." }, { status: 400 });
  }

  // Step 1: Verify plan exists and belongs to this user
  const { data: targetPlan, error: fetchErr } = await supabase
    .from("study_plans")
    .select("id, status, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!targetPlan) {
    return NextResponse.json({ error: "Plan not found or access denied." }, { status: 404 });
  }

  if (actionVal === "archive") {
    if (targetPlan.status === "archived") {
      return NextResponse.json({ plan: targetPlan });
    }
    const { data: updated, error: updateErr } = await supabase
      .from("study_plans")
      .update({ status: "archived" })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ plan: updated });
  }

  // actionVal === "activate"
  if (targetPlan.status === "completed" || targetPlan.status === "archived") {
    return NextResponse.json(
      { error: `Cannot activate a plan with status "${targetPlan.status}".` },
      { status: 422 }
    );
  }
  if (targetPlan.status === "active") {
    return NextResponse.json({ plan: targetPlan });
  }

  // Step 2: Demote any currently-active plans for this user to "paused"
  const { error: demoteErr } = await supabase
    .from("study_plans")
    .update({ status: "paused" })
    .eq("user_id", user.id)
    .eq("status", "active")
    .neq("id", id);

  if (demoteErr) {
    return NextResponse.json({ error: demoteErr.message }, { status: 500 });
  }

  // Step 3: Activate the selected plan
  const { data: updated, error: updateErr } = await supabase
    .from("study_plans")
    .update({ status: "active" })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }
  return NextResponse.json({ plan: updated });
}
