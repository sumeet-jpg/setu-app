// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/governance/admin-guard";
import { getRuntimeInstances } from "@/lib/services/admin.service";
import { buildSuccessResponse, handleUnknownError } from "@/lib/errors/setu-errors";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const data = await getRuntimeInstances();
    return NextResponse.json(buildSuccessResponse({ instances: data, execution_enabled: false }));
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, "GET /api/admin/runtime"), { status: 500 });
  }
}
