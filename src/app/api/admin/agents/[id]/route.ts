// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/governance/admin-guard";
import { updateAgent } from "@/lib/services/admin.service";
import { buildSuccessResponse, handleUnknownError } from "@/lib/errors/setu-errors";

export async function PATCH(request: NextRequest, { params }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const body = await request.json();
    await updateAgent(id, body);
    return NextResponse.json(buildSuccessResponse({ id }));
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, "PATCH /api/admin/agents/[id]"), { status: 500 });
  }
}
