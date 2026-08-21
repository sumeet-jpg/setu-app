// @ts-nocheck
/**
 * SETU — Admin Route Guard
 * Verifies authentication and admin role.
 * Phase 1: any authenticated user = admin (single-admin model)
 * Phase 2+: checks profiles table for admin role
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

export async function getAdminUserOrNull(): Promise<AdminUser | null> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return { id: user.id, email: user.email ?? "" };
  } catch {
    return null;
  }
}
