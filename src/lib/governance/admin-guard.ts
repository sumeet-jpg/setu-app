// @ts-nocheck
/**
 * SETU — Admin Route Guard
 * Verifies authentication AND that the signed-in email is on the admin
 * allowlist (ADMIN_EMAIL, comma-separated for more than one admin).
 *
 * Until this fix: /signin is a PUBLIC page offering Google/GitHub OAuth
 * with no invite restriction — this app has no other use for Supabase
 * Auth (real customers are anonymous-UUID only, per src/app/my-employees).
 * getAdminUserOrNull() treated "successfully authenticated" as "is admin",
 * so anyone who visited /signin and clicked "Sign in with Google" got full
 * admin access — subscription management, lead data, blueprint
 * approve/reject — with zero further check. Confirmed live: nothing in
 * the signin flow restricts which Google account can complete it.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { buildErrorResponse, SETU_ERROR_CODES } from "@/lib/errors/setu-errors";
import { auditLog } from "@/lib/governance/audit-logger";
import { RATE_LIMITS } from "@/lib/security/rate-limiter";

export interface AdminUser {
  id: string;
  email: string;
}

export async function requireAdmin(request: NextRequest): Promise<{ user: AdminUser } | NextResponse> {
  // Path 1: secret-header check — set ADMIN_SECRET on Vercel to allow scripted/cron access.
  const adminSecret = process.env.ADMIN_SECRET
  if (adminSecret) {
    const provided =
      request.headers.get('x-admin-secret') ??
      request.cookies.get('admin_secret')?.value
    if (provided === adminSecret) {
      return { user: { id: 'admin', email: process.env.ADMIN_ALERT_EMAIL ?? 'admin@setuagents.com' } }
    }
  }

  // Path 2: real Supabase Auth session — this is what /admin/subscriptions itself
  // already gates on, so a signed-in admin's browser session works here too.
  // Previously, if ADMIN_SECRET was unset, this function allowed ALL requests —
  // meaning anyone who found an admin API route URL could call it directly,
  // no login required, regardless of the UI's own auth gate.
  const admin = await getAdminUserOrNull()
  if (admin) return { user: admin }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function isAllowedAdminEmail(email: string): boolean {
  const allowlist = (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  // Fail closed: if ADMIN_EMAIL was never set, nobody is an admin — better
  // than the previous behavior (everybody is).
  if (allowlist.length === 0) return false
  return allowlist.includes(email.toLowerCase())
}

export async function getAdminUserOrNull(): Promise<AdminUser | null> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return null;
    if (!isAllowedAdminEmail(user.email)) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}
