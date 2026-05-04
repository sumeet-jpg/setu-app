// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/governance/admin-guard";
import { listAuditLogs } from "@/lib/services/admin.service";
import { buildSuccessResponse, handleUnknownError } from "@/lib/errors/setu-errors";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const event_type = request.nextUrl.searchParams.get("event_type") ?? undefined;
    const severity = request.nextUrl.searchParams.get("severity") ?? undefined;
    const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "100");
    const data = await listAuditLogs({ event_type, severity, limit });
    return NextResponse.json(buildSuccessResponse(data));
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, "GET /api/admin/audit-logs"), { status: 500 });
  }
}
