import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/auth/allowed-emails";
import type { SupabaseClient } from "@supabase/supabase-js";

export type User = NonNullable<Awaited<ReturnType<SupabaseClient["auth"]["getUser"]>>["data"]["user"]>;

export type AuthSuccessResult = {
  authorized: true;
  user: User;
  supabase: SupabaseClient;
  response: null;
};

export type AuthFailureResult = {
  authorized: false;
  user: null;
  supabase: null;
  response: NextResponse;
};

export type AuthGuardResult = AuthSuccessResult | AuthFailureResult;

/**
 * Server-only authorization guard for API routes.
 *
 * Verifies that:
 * 1. A valid Supabase auth session exists via cookie-aware server client.
 * 2. The authenticated user's email is explicitly present on the server-side allowlist.
 *
 * Never uses the service-role client. Respects Row Level Security (RLS).
 *
 * @param clientOverride Optional client parameter for unit testing (defaults to createClient()).
 */
export async function requireAllowedUser(clientOverride?: SupabaseClient | null): Promise<AuthGuardResult> {
  const supabase = clientOverride !== undefined ? clientOverride : await createClient();
  if (!supabase) {
    return {
      authorized: false,
      user: null,
      supabase: null,
      response: NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      ),
    };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      user: null,
      supabase: null,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  if (!user.email || !isEmailAllowed(user.email)) {
    return {
      authorized: false,
      user: null,
      supabase: null,
      response: NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: user as User,
    supabase: supabase as SupabaseClient,
    response: null,
  };
}
