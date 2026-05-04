// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/governance/admin-guard";
import { getApprovals } from "@/lib/services/admin.service";
import { buildSuccessResponse, handleUnknownError } from "@/lib/errors/setu-errors";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const data = await getApprovals({ status });
    return NextResponse.json(buildSuccessResponse(data));
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, "GET /api/admin/approvals"), { status: 500 });
  }
}
