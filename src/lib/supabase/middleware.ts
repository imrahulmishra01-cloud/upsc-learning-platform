import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isEmailAllowed } from "@/lib/auth/allowed-emails";

/**
 * Refreshes the Supabase auth session in middleware and enforces route protection.
 * Requires both a valid Supabase user session and allowlist membership for protected UI routes.
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const protectedPrefixes = [
    "/dashboard",
    "/settings",
    "/planner",
    "/materials",
    "/pyq",
    "/reports",
    "/revision",
    "/tests",
    "/csat",
    "/current-affairs",
    "/optional",
    "/ai",
  ];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  const isAllowlisted = !!user?.email && isEmailAllowed(user.email);

  // Unauthenticated user trying to reach a protected route → redirect to login
  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated user but NOT on allowlist trying to reach a protected route → redirect to login error
  if (isProtected && user && !isAllowlisted) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("error", "access_denied");
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated & allowlisted user hitting /login → redirect to dashboard
  if (pathname === "/login" && user && isAllowlisted) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
