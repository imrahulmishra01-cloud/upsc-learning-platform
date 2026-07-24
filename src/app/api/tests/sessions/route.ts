import { NextRequest, NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;
  const { user, supabase } = auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { test_type } = body;
  if (!test_type) return NextResponse.json({ error: "test_type required" }, { status: 400 });

  const { data, error } = await supabase
    .from("test_sessions")
    .insert({
      user_id: user.id,
      test_type,
      status: "started",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Migration pending" }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data }, { status: 201 });
}
