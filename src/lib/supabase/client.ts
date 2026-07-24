import { createBrowserClient } from "@supabase/ssr";

/**
 * Returns a Supabase client safe to use in browser/client components.
 * If env vars are missing (dev before setup), returns null gracefully.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
