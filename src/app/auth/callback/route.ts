// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { clientEnv } from "@/lib/env";

/**
 * Supabase Auth callback handler.
 * Exchanges the auth code for a session and redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the app URL (not the request origin, to handle Vercel preview URLs)
      const appUrl = clientEnv.NEXT_PUBLIC_APP_URL;
      return NextResponse.redirect(`${appUrl}${next}`);
    }
  }

  // Auth failed — redirect to login with error
  return NextResponse.redirect(
    `${clientEnv.NEXT_PUBLIC_APP_URL}/auth/login?error=auth_failed`
  );
}
