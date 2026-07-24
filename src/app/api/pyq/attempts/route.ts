import { NextRequest, NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MISSING_TABLE = "42P01";

/** GET /api/pyq/attempts?pyqId=<id> — Get attempts for a question */
export async function GET(req: NextRequest) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  const { searchParams } = new URL(req.url);
  const pyqId = searchParams.get("pyqId");

  let query = supabase
    .from("pyq_attempts")
    .select("*")
    .eq("user_id", user.id)
    .order("attempted_at", { ascending: false });

  if (pyqId) {
    query = query.eq("pyq_question_id", pyqId);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === MISSING_TABLE) {
      return NextResponse.json({ attempts: [], migrationPending: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ attempts: data ?? [] });
}

/** POST /api/pyq/attempts — Create or upsert an attempt */
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

  const {
    pyqId,
    status,
    user_answer_text,
    self_score,
    mistake_type,
    mistake_notes,
    revision_needed,
    notes,
  } = body;

  if (!pyqId || typeof pyqId !== "string") {
    return NextResponse.json({ error: "pyqId is required." }, { status: 400 });
  }

  const VALID_STATUSES = ["not_attempted", "attempted", "correct", "incorrect", "partial"];
  if (status && !VALID_STATUSES.includes(status as string)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}.` },
      { status: 400 }
    );
  }

  const VALID_MISTAKE_TYPES = ["none", "factual", "concept", "calculation", "reading", "time", "other"];
  if (mistake_type && !VALID_MISTAKE_TYPES.includes(mistake_type as string)) {
    return NextResponse.json(
      { error: `mistake_type must be one of: ${VALID_MISTAKE_TYPES.join(", ")}.` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("pyq_attempts")
    .insert({
      user_id: user.id,
      pyq_question_id: pyqId,
      status: status ?? "attempted",
      user_answer_text: user_answer_text ? String(user_answer_text).trim() : null,
      self_score: self_score != null ? Number(self_score) : null,
      mistake_type: mistake_type ?? "none",
      mistake_notes: mistake_notes ? String(mistake_notes).trim() : null,
      revision_needed: revision_needed ?? false,
      notes: notes ? String(notes).trim() : null,
      attempted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === MISSING_TABLE) {
      return NextResponse.json({ error: "Migration pending. Run the PYQ migration first." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ attempt: data }, { status: 201 });
}

/** PATCH /api/pyq/attempts — Update an attempt (mark revised, update mistake_type) */
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

  const { id, ...updates } = body;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  // Prevent user_id / pyq_question_id override
  delete updates.user_id;
  delete updates.pyq_question_id;

  const { data, error } = await supabase
    .from("pyq_attempts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    if (error.code === MISSING_TABLE) {
      return NextResponse.json({ error: "Migration pending." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ attempt: data });
}
