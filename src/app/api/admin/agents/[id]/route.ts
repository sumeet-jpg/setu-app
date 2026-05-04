import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/governance/admin-guard";
import { updateAgent } from "@/lib/services/admin.service";
import { buildSuccessResponse, handleUnknownError, buildErrorResponse, SETU_ERROR_CODES } from "@/lib/errors/setu-errors";

const UpdateSchema = z.object({
  status: z.string().optional(),
  readiness_tier: z.string().optional(),
  is_flagship: z.boolean().optional(),
  is_public: z.boolean().optional(),
  default_mode: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json(buildErrorResponse(SETU_ERROR_CODES.INPUT_INVALID, "Invalid update fields"), { status: 400 });
    await updateAgent(id, parsed.data);
    return NextResponse.json(buildSuccessResponse({ id, updated: true }));
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, `PATCH /api/admin/agents/${id}`), { status: 500 });
  }
}
