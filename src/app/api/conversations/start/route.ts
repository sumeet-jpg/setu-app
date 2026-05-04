/**
 * POST /api/conversations/start
 *
 * Creates a new conversation + initial state.
 * No auth required — prospect flow.
 * Session ID is generated client-side and used for scoping.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildErrorResponse,
  buildSuccessResponse,
  handleUnknownError,
  SETU_ERROR_CODES,
} from "@/lib/errors/setu-errors";
import {
  createConversation,
  getOrCreateConversationState,
} from "@/lib/services/conversation.service";
import { auditLog } from "@/lib/governance/audit-logger";

const StartSchema = z.object({
  session_id: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = StartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        buildErrorResponse(
          SETU_ERROR_CODES.INPUT_INVALID,
          "A valid session_id is required.",
          { safe_next_step: "Generate a session ID and retry." }
        ),
        { status: 400 }
      );
    }

    const { session_id } = parsed.data;

    // Create conversation record
    const conversation = await createConversation(session_id);

    // Create initial state
    const state = await getOrCreateConversationState(conversation.id);

    // Audit
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
    return NextResponse.json(
      handleUnknownError(error, "POST /api/conversations/start"),
      { status: 500 }
    );
  }
}
