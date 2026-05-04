// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/governance/admin-guard";
import { toggleKillSwitch } from "@/lib/services/admin.service";
import { buildSuccessResponse, handleUnknownError } from "@/lib/errors/setu-errors";
import { writeAuditLog } from "@/lib/governance/audit-logger";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const { activate } = await request.json();
    await toggleKillSwitch(id, activate, auth.user.email);
    await writeAuditLog({ event_type: activate ? "kill_switch_enabled" : "kill_switch_disabled", severity: "warning", user_id: auth.user.id, entity_type: "kill_switch", entity_id: id, description: `Kill switch ${activate ? "activated" : "deactivated"} by ${auth.user.email}` });
    return NextResponse.json(buildSuccessResponse({ id, is_active: activate }));
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, "PATCH /api/admin/kill-switches/[id]"), { status: 500 });
  }
}
