// @ts-nocheck
/**
 * POST /api/leads
 *
 * Captures a lead from the blueprint builder.
 * Linked to conversation and blueprint if provided.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildErrorResponse,
  buildSuccessResponse,
  handleUnknownError,
  SETU_ERROR_CODES,
} from "@/lib/errors/setu-errors";
import { createLead, updateConversationState } from "@/lib/services/conversation.service";
import { auditLog } from "@/lib/governance/audit-logger";

const LeadSchema = z.object({
  email: z.string().email("A valid email address is required."),
  name: z.string().min(1).max(200).optional(),
  company: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  conversation_id: z.string().uuid().optional(),
  blueprint_id: z.string().uuid().optional(),
  session_id: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = LeadSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        buildErrorResponse(SETU_ERROR_CODES.INPUT_INVALID, firstError.message),
        { status: 400 }
      );
    }

    const { email, name, company, role, conversation_id, blueprint_id } =
      parsed.data;

    const lead = await createLead(email, {
      name,
      company,
      role,
      conversationId: conversation_id,
      blueprintId: blueprint_id,
    });

    // Mark conversation lead as captured
    if (conversation_id) {
      await updateConversationState(conversation_id, {
        lead_captured: true,
      }).catch(() => {}); // non-blocking
    }

    // Audit (email domain only — not full email)
    await auditLog.leadCreated(lead.id, email);

    return NextResponse.json(
      buildSuccessResponse({
        lead_id: lead.id,
        message:
          "Your contact information has been saved. A Setu team member will reach out to discuss your blueprint.",
      }),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      handleUnknownError(error, "POST /api/leads"),
      { status: 500 }
    );
  }
}
