// @ts-nocheck
/**
 * SETU — Supabase Middleware Helper
 * Refreshes expired sessions so users don't get logged out unexpectedly.
 */

import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { clientEnv } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createSSRServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
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
    }
  );

  // Refresh session — do not remove this, it's required for SSR auth
  const {
    data: { user },
  } = await supabase.auth.getUser();


  // Admin routes: requireAdmin() in each route handles auth via ADMIN_SECRET header.
  // Dashboard/customer routes: not used in Setu's anonymous model — skip redirect.

  return supabaseResponse;
}
