import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run middleware on all paths EXCEPT:
     * - _next/static  (Next.js static assets)
     * - _next/image   (image optimisation API)
     * - favicon.ico
     * - Static file extensions: svg, png, jpg, jpeg, gif, webp, ico
     *
     * Paths that are intentionally NOT excluded (middleware runs on them):
     * - /                   → redirects to /dashboard or /login
     * - /login              → redirects authenticated users to /dashboard
     * - /dashboard          → protected (redirects unauthenticated to /login)
     * - /settings           → protected (redirects unauthenticated to /login)
     * - /auth/callback      → NOT protected; only session-refresh runs, no redirect
     * - /api/*              → NOT protected; individual routes handle their own auth
     * - /manifest.webmanifest → served by App Router; middleware passes through harmlessly
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
