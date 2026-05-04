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
  const supabase = await createServerClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      buildErrorResponse(SETU_ERROR_CODES.UNAUTHORIZED, "Authentication required.", { safe_next_step: "Please log in to the admin console." }),
      { status: 401 }
    );
  }

  // Rate limit admin routes
  const rateCheck = RATE_LIMITS.adminRoute(user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      buildErrorResponse(SETU_ERROR_CODES.RATE_LIMIT, "Too many admin requests."),
      { status: 429 }
    );
  }

  const adminUser: AdminUser = { id: user.id, email: user.email ?? "" };
  await auditLog.adminAccess(user.id, request.nextUrl.pathname);
  return { user: adminUser };
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
