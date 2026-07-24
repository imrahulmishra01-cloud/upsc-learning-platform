import { NextResponse } from "next/server";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

/**
 * Returns Supabase connection status for allowed users.
 */
export async function GET() {
  const auth = await requireAllowedUser();
  if (!auth.authorized) return auth.response;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { ok: false, message: "Supabase environment variables are not configured." },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }

  return NextResponse.json(
    { ok: true, message: "Connected to Supabase." },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
