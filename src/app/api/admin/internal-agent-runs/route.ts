// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/governance/admin-guard";
import { getInternalAgentRuns } from "@/lib/services/admin.service";
import { buildSuccessResponse, handleUnknownError } from "@/lib/errors/setu-errors";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const data = await getInternalAgentRuns();
    return NextResponse.json(buildSuccessResponse(data));
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, "GET /api/admin/internal-agent-runs"), { status: 500 });
  }
}
