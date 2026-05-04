// @ts-nocheck
/**
 * POST /api/conversations/start — with rate limiting
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildErrorResponse, buildSuccessResponse, handleUnknownError, SETU_ERROR_CODES } from "@/lib/errors/setu-errors";
import { createConversation, getOrCreateConversationState } from "@/lib/services/conversation.service";
import { auditLog } from "@/lib/governance/audit-logger";
import { RATE_LIMITS, getClientIp } from "@/lib/security/rate-limiter";

const StartSchema = z.object({
  session_id: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateCheck = RATE_LIMITS.conversationStart(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      buildErrorResponse(SETU_ERROR_CODES.RATE_LIMIT, "Too many conversations started. Please try again later."),
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = StartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        buildErrorResponse(SETU_ERROR_CODES.INPUT_INVALID, "A valid session_id is required."),
        { status: 400 }
      );
    }

    const { session_id } = parsed.data;
    const conversation = await createConversation(session_id);
    const state = await getOrCreateConversationState(conversation.id);
    await auditLog.conversationStarted(conversation.id, session_id);

    return NextResponse.json(
      buildSuccessResponse({
        conversation_id: conversation.id,
        session_id,
        stage: state.stage ?? "problem_discovery",
        turn_count: 0,
      }),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, "POST /api/conversations/start"), { status: 500 });
  }
}
