import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/governance/admin-guard";
import { reviewBlueprint } from "@/lib/services/admin.service";
import { buildSuccessResponse, handleUnknownError } from "@/lib/errors/setu-errors";
import { writeAuditLog } from "@/lib/governance/audit-logger";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const body = await request.json();
    const { action, notes } = body;
    if (!["approve", "reject", "request_changes"].includes(action)) {
      return NextResponse.json({ ok: false, error: { code: "input_invalid", message: "Invalid action." } }, { status: 400 });
    }
    await reviewBlueprint(id, action, auth.user.id, notes);
    await writeAuditLog({ event_type: "approval_approved", user_id: auth.user.id, entity_type: "blueprint", entity_id: id, description: `Blueprint ${action}d by admin`, metadata: { action } });
    return NextResponse.json(buildSuccessResponse({ id, action }));
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, "PATCH /api/admin/blueprints/[id]/review"), { status: 500 });
  }
}
