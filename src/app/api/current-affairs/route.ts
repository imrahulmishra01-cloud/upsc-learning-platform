import { NextRequest, NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "42P01";
}

// ── GET /api/current-affairs ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  const { searchParams } = new URL(req.url);
  const status           = searchParams.get("status");
  const region           = searchParams.get("region");
  const gs_paper         = searchParams.get("gs_paper");
  const source_category  = searchParams.get("source_category");
  const importance       = searchParams.get("importance");

  let query = supabase
    .from("current_affairs_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("article_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (status)          query = query.eq("status", status);
  if (region)          query = query.eq("region", region);
  if (source_category) query = query.eq("source_category", source_category);
  if (importance)      query = query.eq("importance", importance);
  if (gs_paper)        query = query.contains("gs_papers", [gs_paper]);

  const { data, error } = await query;

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({ entries: [], migrationPending: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}

// ── POST /api/current-affairs ─────────────────────────────────────────────────
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
    title,
    summary,
    source_name,
    source_url,
    source_category = "newspaper",
    region = "national",
    gs_papers = [],
    syllabus_topics = [],
    key_terms = [],
    prelims_relevance = null,
    mains_relevance = null,
    importance = "medium",
    article_date = new Date().toISOString().split("T")[0],
    read_time_mins = 5,
    status = "unread",
    visibility = "private",
    user_notes = null,
  } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("current_affairs_entries")
    .insert({
      user_id:           user.id,
      title:             String(title).trim(),
      summary:           summary ? String(summary).trim() : null,
      source_name:       source_name ? String(source_name).trim() : null,
      source_url:        source_url ? String(source_url).trim() : null,
      source_category,
      region,
      gs_papers:         Array.isArray(gs_papers) ? gs_papers : [],
      syllabus_topics:   Array.isArray(syllabus_topics) ? syllabus_topics : [],
      key_terms:         Array.isArray(key_terms) ? key_terms : [],
      prelims_relevance: prelims_relevance ? String(prelims_relevance).trim() : null,
      mains_relevance:   mains_relevance ? String(mains_relevance).trim() : null,
      importance,
      article_date,
      read_time_mins:    Number(read_time_mins) || 5,
      status,
      visibility,
      user_notes:        user_notes ? String(user_notes).trim() : null,
    })
    .select()
    .single();

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json(
        { error: "Migration pending. Run the Current Affairs migration first." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry: data }, { status: 201 });
}

// ── PATCH /api/current-affairs ────────────────────────────────────────────────
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

  // Auto-set read_at when status changes to 'read'
  if (updates.status === "read" && !updates.read_at) {
    updates.read_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("current_affairs_entries")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({ error: "Migration pending." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry: data });
}

// ── DELETE /api/current-affairs ────────────────----------------───────────────
export async function DELETE(req: NextRequest) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id parameter is required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("current_affairs_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({ error: "Migration pending." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
