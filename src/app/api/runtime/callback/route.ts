import { NextRequest, NextResponse } from "next/server";
import { buildErrorResponse, SETU_ERROR_CODES } from "@/lib/errors/setu-errors";
import { writeAuditLog } from "@/lib/governance/audit-logger";

/**
 * POST /api/runtime/callback
 *
 * Receives callbacks from runtime execution providers (e.g. n8n).
 * Currently returns a 503 because runtime execution is disabled.
 *
 * Phase 9: Will validate WEBHOOK_SIGNING_SECRET and process events.
 */
export async function POST(request: NextRequest) {
  await writeAuditLog({
    event_type: "runtime_action_blocked",
    severity: "warning",
    description: "Runtime callback received but execution is disabled",
    metadata: {
      path: request.nextUrl.pathname,
    },
  });

  return NextResponse.json(
    buildErrorResponse(
      SETU_ERROR_CODES.RUNTIME_NOT_CONNECTED,
      "Runtime execution is not yet activated. Callbacks are not accepted.",
      {
        safe_next_step:
          "Runtime will be enabled after enterprise provider activation.",
      }
    ),
    { status: 503 }
  );
}
