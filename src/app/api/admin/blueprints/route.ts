// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/governance/admin-guard";
import { listBlueprints } from "@/lib/services/admin.service";
import { buildSuccessResponse, handleUnknownError } from "@/lib/errors/setu-errors";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "50");
    const offset = parseInt(request.nextUrl.searchParams.get("offset") ?? "0");
    const data = await listBlueprints({ status, limit, offset });
    return NextResponse.json(buildSuccessResponse(data));
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, "GET /api/admin/blueprints"), { status: 500 });
  }
}
