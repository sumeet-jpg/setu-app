import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/governance/admin-guard";
import { reviewBlueprint } from "@/lib/services/admin.service";
import { buildSuccessResponse, handleUnknownError } from "@/lib/errors/setu-errors";
import { auditLog } from "@/lib/governance/audit-logger";

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
    // Was always logging "approval_approved" regardless of action — a
    // rejected blueprint showed up in the audit trail as approved.
    await auditLog.blueprintReviewed(auth.user.email, id, action === "approve" ? "approved" : "rejected");
    return NextResponse.json(buildSuccessResponse({ id, action }));
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, "PATCH /api/admin/blueprints/[id]/review"), { status: 500 });
  }
}
