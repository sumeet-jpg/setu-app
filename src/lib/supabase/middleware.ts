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

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  const isSigninRoute = request.nextUrl.pathname === "/signin";
  const isApiAdminRoute = request.nextUrl.pathname.startsWith("/api/admin");
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isApiCustomerRoute = request.nextUrl.pathname.startsWith("/api/customer");

  // Redirect unauthenticated users away from admin routes
  if ((isAdminRoute || isApiAdminRoute) && !user && !isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/login";
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect unauthenticated users away from customer routes
  if ((isDashboardRoute || isApiCustomerRoute) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/signin";
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect already-authenticated users away from signin
  if (isSigninRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
