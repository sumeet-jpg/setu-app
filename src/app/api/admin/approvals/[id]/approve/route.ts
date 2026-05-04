import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/governance/admin-guard";
import { resolveApproval } from "@/lib/services/admin.service";
import { buildSuccessResponse, handleUnknownError } from "@/lib/errors/setu-errors";
import { writeAuditLog } from "@/lib/governance/audit-logger";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    await resolveApproval(id, "approved", auth.user.id, body.notes);
    await writeAuditLog({ event_type: "approval_approved", user_id: auth.user.id, entity_type: "approval_request", entity_id: id, description: "Approval request approved" });
    return NextResponse.json(buildSuccessResponse({ id, status: "approved" }));
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, "POST /api/admin/approvals/[id]/approve"), { status: 500 });
  }
}
