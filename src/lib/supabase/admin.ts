import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client using the service role key.
 * NEVER import this in client components or expose it to the browser.
 * Use only in Route Handlers, Server Actions, or migration scripts.
 *
 * The service role key bypasses RLS — use with extreme caution.
 * Only use for admin operations that cannot be done with the user's JWT.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Disable session persistence — admin client is stateless
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
