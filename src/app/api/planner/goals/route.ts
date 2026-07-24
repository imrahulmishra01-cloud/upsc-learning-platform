import { NextRequest, NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/planner/goals — Create a study goal */
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

  const { title, goal_type, target_date, plan_id, priority, description } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }
  const priorityVal = Number(priority ?? 2);
  if (![1, 2, 3].includes(priorityVal)) {
    return NextResponse.json({ error: "priority must be 1, 2, or 3." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("study_goals")
    .insert({
      user_id: user.id,
      title: (title as string).trim(),
      description: description ? String(description).trim() : null,
      goal_type: goal_type ?? "general",
      target_date: target_date ?? null,
      plan_id: plan_id ?? null,
      priority: priorityVal,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ goal: data }, { status: 201 });
}

/** PATCH /api/planner/goals — Update goal status */
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

  const { id, status } = body;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }
  const VALID = ["active", "completed", "paused", "archived"];
  if (!status || !VALID.includes(status as string)) {
    return NextResponse.json({ error: `status must be one of: ${VALID.join(", ")}.` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("study_goals")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ goal: data });
}
