// @ts-nocheck
/**
 * SETU — Supabase Server Clients
 *
 * Two clients:
 * 1. createServerClient()      — uses anon key + cookie session (for auth-aware server actions)
 * 2. createAdminClient()       — uses service role key (bypasses RLS, admin ops only)
 *
 * RULES:
 * - createAdminClient() must NEVER be called from client components.
 * - createAdminClient() must NEVER be called with user-supplied input without validation.
 * - Service role key is NEVER logged, exported to client, or sent to LLM.
 */

import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getServerEnv, clientEnv } from "@/lib/env";

/**
 * Auth-aware server client — uses anon key + cookie session.
 * Use in Server Components and Route Handlers that need the current user's session.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSSRServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — cookies are read-only
            // The middleware handles session refresh
          }
        },
      },
    }
  );
}

/**
 * Service-role admin client — bypasses RLS.
 * Use ONLY for trusted server-side operations (seeding, admin routes, internal agents).
 * NEVER use for user-facing queries without explicit tenant filtering.
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY directly — does NOT go through getServerEnv()
 * so a missing optional env var doesn't crash routes that only need Supabase.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('[Setu] NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
