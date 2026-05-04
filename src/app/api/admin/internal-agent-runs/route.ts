import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/governance/admin-guard";
import { listInternalAgentRuns } from "@/lib/services/admin.service";
import { buildSuccessResponse, handleUnknownError } from "@/lib/errors/setu-errors";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const agentId = request.nextUrl.searchParams.get("agent_id") ?? undefined;
    const data = await listInternalAgentRuns(agentId);
    return NextResponse.json(buildSuccessResponse(data));
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, "GET /api/admin/internal-agent-runs"), { status: 500 });
  }
}
