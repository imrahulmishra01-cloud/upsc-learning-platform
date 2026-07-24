import { NextResponse, type NextRequest } from "next/server";
import { isEmailAllowed } from "@/lib/auth/allowed-emails";

/**
 * Server-side email allowlist check.
 * Called from the login page before invoking Supabase, so the allowlist
 * is never exposed to the browser.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json(
        { ok: false, message: "Email is required." },
        { status: 400 }
      );
    }

    if (!isEmailAllowed(email)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "This email is not authorised to access this app. Contact the system administrator if you believe this is an error.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 }
    );
  }
}
