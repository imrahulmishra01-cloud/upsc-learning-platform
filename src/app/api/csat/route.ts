import { NextRequest, NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MISSING_TABLE = "42P01";

/** GET /api/csat — List CSAT sessions for authenticated user */
export async function GET() {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  const { data, error } = await supabase
    .from("csat_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (error) {
    if (error.code === MISSING_TABLE) {
      return NextResponse.json({ sessions: [], migrationPending: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data ?? [] });
}

/** POST /api/csat — Create a new CSAT session */
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
    session_type,
    topic_areas,
    questions_attempted,
    questions_correct,
    notes,
    started_at,
  } = body;

  if (!session_type) {
    return NextResponse.json({ error: "session_type is required." }, { status: 400 });
  }

  const VALID_TYPES = ["practice", "mock_test", "pyq_paper", "sectional", "timed_drill"];
  if (!VALID_TYPES.includes(session_type as string)) {
    return NextResponse.json(
      { error: `session_type must be one of: ${VALID_TYPES.join(", ")}.` },
      { status: 400 }
    );
  }

  const attempted = Number(questions_attempted ?? 0);
  const correct = Number(questions_correct ?? 0);
  if (!Number.isFinite(attempted) || attempted < 0) {
    return NextResponse.json({ error: "questions_attempted must be a non-negative number." }, { status: 400 });
  }
  if (!Number.isFinite(correct) || correct < 0 || correct > attempted) {
    return NextResponse.json({ error: "questions_correct must be between 0 and questions_attempted." }, { status: 400 });
  }

  const score_pct = attempted > 0 ? Math.round((correct / attempted) * 100) : null;

  const { data, error } = await supabase
    .from("csat_sessions")
    .insert({
      user_id: user.id,
      session_type,
      topic_areas: Array.isArray(topic_areas) ? topic_areas : [],
      questions_attempted: attempted,
      questions_correct: correct,
      score_pct,
      notes: notes ? String(notes).trim() : null,
      started_at: started_at ?? new Date().toISOString(),
      ended_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === MISSING_TABLE) {
      return NextResponse.json({ error: "Migration pending. Run the CSAT migration first." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data }, { status: 201 });
}

/** PATCH /api/csat — Update a CSAT session */
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

  // Prevent user_id override
  delete updates.user_id;

  // Recalculate score_pct if scores are updated
  if (updates.questions_attempted != null || updates.questions_correct != null) {
    const attempted = Number(updates.questions_attempted);
    const correct = Number(updates.questions_correct);
    if (Number.isFinite(attempted) && Number.isFinite(correct) && attempted > 0) {
      updates.score_pct = Math.round((correct / attempted) * 100);
    }
  }

  if (!updates.ended_at) {
    updates.ended_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("csat_sessions")
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

  return NextResponse.json({ session: data });
}
