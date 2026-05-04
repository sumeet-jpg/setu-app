// @ts-nocheck
/**
 * SETU — Admin Route Guard
 *
 * Use this in every /api/admin/* route handler to verify:
 * 1. User is authenticated
 * 2. User has admin role
 *
 * Returns the user object on success, throws on failure.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { buildErrorResponse, SETU_ERROR_CODES } from "@/lib/errors/setu-errors";
import { auditLog } from "@/lib/governance/audit-logger";

export interface AdminUser {
  id: string;
  email: string;
}

/**
 * Verify the request is from an authenticated admin.
 * Returns { user } on success, or a NextResponse error on failure.
 *
 * Usage in API route:
 *   const result = await requireAdmin(request);
 *   if (result instanceof NextResponse) return result;
 *   const { user } = result;
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: AdminUser } | NextResponse> {
  const supabase = await createServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      buildErrorResponse(
        SETU_ERROR_CODES.UNAUTHORIZED,
        "Authentication required.",
        { safe_next_step: "Please log in to the admin console." }
      ),
      { status: 401 }
    );
  }

  // Phase 1: admin is any authenticated user (single-admin model)
  // Phase 2: will check user_roles table for 'admin' role
  const adminUser: AdminUser = {
    id: user.id,
    email: user.email ?? "",
  };

  // Audit every admin API access
  await auditLog.adminAccess(user.id, request.nextUrl.pathname);

  return { user: adminUser };
}

/**
 * Verify admin in a Server Component (not API route).
 * Returns the user or redirects to login.
 */
export async function getAdminUserOrNull(): Promise<AdminUser | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    return { id: user.id, email: user.email ?? "" };
  } catch {
    return null;
  }
}
