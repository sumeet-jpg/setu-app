// @ts-nocheck
/**
 * SETU — Supabase Browser Client
 *
 * Uses the public anon key only. Safe for client components.
 * RLS policies enforce all tenant and role restrictions.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { clientEnv } from "@/lib/env";

export function createClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
