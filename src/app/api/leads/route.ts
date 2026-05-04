// @ts-nocheck
/**
 * POST /api/leads — Lead capture with email notification and rate limiting
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildErrorResponse, buildSuccessResponse, handleUnknownError, SETU_ERROR_CODES } from "@/lib/errors/setu-errors";
import { createLead, updateConversationState, getBlueprintById } from "@/lib/services/conversation.service";
import { auditLog } from "@/lib/governance/audit-logger";
import { sendLeadNotification, sendProspectConfirmation, sendBlueprintReviewNotification } from "@/lib/email/resend";
import { RATE_LIMITS, getClientIp } from "@/lib/security/rate-limiter";
import { createAdminClient } from "@/lib/supabase/server";

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
  // Rate limit
  const ip = getClientIp(request);
  const rateCheck = RATE_LIMITS.leadCapture(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      buildErrorResponse(SETU_ERROR_CODES.RATE_LIMIT, "Too many requests. Please try again later."),
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = LeadSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(buildErrorResponse(SETU_ERROR_CODES.INPUT_INVALID, firstError.message), { status: 400 });
    }

    const { email, name, company, role, conversation_id, blueprint_id, session_id } = parsed.data;

    const lead = await createLead(email, { name, company, role, conversationId: conversation_id, blueprintId: blueprint_id });

    // Mark conversation lead captured
    if (conversation_id) {
      await updateConversationState(conversation_id, { lead_captured: true }).catch(() => {});
    }

    // Move blueprint to pending_review
    let inputSummary = "";
    let agentName: string | undefined;
    let confidence: number | undefined;

    if (blueprint_id && session_id) {
      try {
        const db = createAdminClient();
        const { data: bp } = await db
          .from("generated_blueprints")
          .select("input_summary, recommendation, status")
          .eq("id", blueprint_id)
          .single();

        if (bp) {
          inputSummary = bp.input_summary ?? "";
          const rec = bp.recommendation as Record<string, unknown> | null;
          agentName = rec?.agent_name as string | undefined;
          confidence = rec?.confidence_score as number | undefined;

          // Auto-promote to pending_review
          if (bp.status === "draft") {
            await db
              .from("generated_blueprints")
              .update({ status: "pending_review" })
              .eq("id", blueprint_id);
          }
        }
      } catch {}
    }

    // Audit
    await auditLog.leadCreated(lead.id, email);

    // Send emails (non-blocking)
    Promise.all([
      sendLeadNotification({ leadEmail: email, leadName: name, company, blueprintId: blueprint_id, inputSummary }),
      sendProspectConfirmation({ toEmail: email, name, blueprintId: blueprint_id }),
      blueprint_id ? sendBlueprintReviewNotification({ blueprintId: blueprint_id, inputSummary, agentName, confidence }) : Promise.resolve(),
    ]).catch(() => {});

    return NextResponse.json(
      buildSuccessResponse({
        lead_id: lead.id,
        message: "Your contact information has been saved. A Setu advisor will reach out within 1 business day.",
      }),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, "POST /api/leads"), { status: 500 });
  }
}
