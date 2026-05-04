import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/governance/admin-guard";
import { listRuntimeInstances, listRuntimeDeployments, listKillSwitches } from "@/lib/services/admin.service";
import { buildSuccessResponse, handleUnknownError } from "@/lib/errors/setu-errors";
import { isRuntimeExecutionEnabled } from "@/lib/env";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const [instances, deployments, killSwitches] = await Promise.all([
      listRuntimeInstances(),
      listRuntimeDeployments(),
      listKillSwitches(),
    ]);
    return NextResponse.json(buildSuccessResponse({
      execution_enabled: isRuntimeExecutionEnabled(),
      instances,
      deployments,
      kill_switches: killSwitches,
    }));
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, "GET /api/admin/runtime"), { status: 500 });
  }
}
