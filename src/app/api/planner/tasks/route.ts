import { NextRequest, NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/planner/tasks — Create a new daily task */
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

  const { title, task_date, estimated_minutes, task_type, plan_id, priority, description } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }
  const minutes = Number(estimated_minutes ?? 30);
  if (!Number.isFinite(minutes) || minutes < 1) {
    return NextResponse.json({ error: "estimated_minutes must be positive." }, { status: 400 });
  }
  const priorityVal = Number(priority ?? 2);
  if (![1, 2, 3].includes(priorityVal)) {
    return NextResponse.json({ error: "priority must be 1, 2, or 3." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("daily_tasks")
    .insert({
      user_id: user.id,
      title: (title as string).trim(),
      description: description ? String(description).trim() : null,
      task_date: task_date ?? new Date().toISOString().split("T")[0],
      estimated_minutes: minutes,
      task_type: task_type ?? "study",
      plan_id: plan_id ?? null,
      priority: priorityVal,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ task: data }, { status: 201 });
}

/** PATCH /api/planner/tasks — Update task status */
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

  const VALID_STATUSES = ["pending", "in_progress", "completed", "skipped", "moved", "cancelled"];
  if (!status || !VALID_STATUSES.includes(status as string)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}.` },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { status };
  if (status === "completed") {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("daily_tasks")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ task: data });
}
