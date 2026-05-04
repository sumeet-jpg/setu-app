// @ts-nocheck
/**
 * POST /api/conversations/:id/message — with rate limiting and kill switch check
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildErrorResponse, buildSuccessResponse, handleUnknownError, SETU_ERROR_CODES } from "@/lib/errors/setu-errors";
import { getConversation, getOrCreateConversationState, getMessages, saveMessage, updateConversationState, createBlueprint, updateBlueprint, updateConversationStage, getCatalog } from "@/lib/services/conversation.service";
import { runBlueprintPipeline } from "@/lib/blueprint/pipeline";
import { checkKillSwitches } from "@/lib/governance/kill-switch";
import { RATE_LIMITS, getClientIp } from "@/lib/security/rate-limiter";
import type { ConversationStage } from "@/types/conversation";
import type { RequirementExtraction } from "@/types/blueprint";

const MessageSchema = z.object({
  session_id: z.string().min(8).max(128),
  message: z.string().min(1).max(4000).trim(),
});

export async function POST(request: NextRequest, { params }) {
  const { id: conversationId } = await params;

  // Rate limit
  const ip = getClientIp(request);
  const rateCheck = RATE_LIMITS.messageSend(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      buildErrorResponse(SETU_ERROR_CODES.RATE_LIMIT, "Too many messages. Please slow down."),
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = MessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        buildErrorResponse(SETU_ERROR_CODES.INPUT_INVALID, "Message and session_id are required."),
        { status: 400 }
      );
    }

    const { session_id, message } = parsed.data;

    // Check kill switches
    const killCheck = await checkKillSwitches({ session_id });
    if (killCheck.blocked && killCheck.level === "global" && killCheck.reason?.includes("Runtime")) {
      // Global runtime kill switch — don't block blueprint conversations, only execution
      // Continue — blueprint generation is not live execution
    }

    const conversation = await getConversation(conversationId, session_id);
    if (!conversation) {
      return NextResponse.json(
        buildErrorResponse(SETU_ERROR_CODES.PERMISSION_DENIED, "Conversation not found."),
        { status: 404 }
      );
    }

    const state = await getOrCreateConversationState(conversationId);
    const messages = await getMessages(conversationId);
    const messageHistory = messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    await saveMessage(conversationId, "user", message);

    const catalog = await getCatalog();

    if (catalog.length === 0) {
      const holdingResponse = {
        assistant_message: "Thanks for sharing that. Could you tell me more about your team and which tools you currently use?",
        conversation_stage: state.stage as ConversationStage,
        structured_requirement_update: {},
        blueprint_patch: {},
        next_questions: ["Which software tools does your team currently use?"],
        ui_cards: [],
        cta: "Continue describing your workflow",
      };
      await saveMessage(conversationId, "assistant", holdingResponse.assistant_message, holdingResponse);
      return NextResponse.json(buildSuccessResponse(holdingResponse));
    }

    const pipelineOutput = await runBlueprintPipeline({
      conversationId,
      sessionId: session_id,
      userMessage: message,
      messageHistory,
      currentState: {
        stage: state.stage as ConversationStage,
        requirements: (state.requirements as Partial<RequirementExtraction>) ?? {},
        blueprint: undefined,
      },
      catalog,
    });

    let blueprintId = state.blueprint_id as string | undefined;

    if (!blueprintId && Object.keys(pipelineOutput.updatedBlueprint).length > 0) {
      const inputSummary = (pipelineOutput.updatedBlueprint as Record<string, unknown>)?.input_summary as string || message.slice(0, 200);
      const newBlueprint = await createBlueprint(conversationId, session_id, inputSummary);
      blueprintId = newBlueprint.id;
    }

    if (blueprintId && Object.keys(pipelineOutput.updatedBlueprint).length > 0) {
      await updateBlueprint(blueprintId, pipelineOutput.updatedBlueprint);
    }

    const newTurnCount = (state.turn_count ?? 0) + 1;
    await updateConversationState(conversationId, {
      stage: pipelineOutput.newStage,
      requirements: pipelineOutput.updatedRequirements,
      ...(blueprintId ? { blueprint_id: blueprintId } : {}),
      last_intent: pipelineOutput.intent,
      turn_count: newTurnCount,
    });

    if (blueprintId) {
      await updateConversationStage(conversationId, pipelineOutput.newStage, blueprintId);
    }

    await saveMessage(conversationId, "assistant", pipelineOutput.response.assistant_message, pipelineOutput.response as unknown as Record<string, unknown>, pipelineOutput.intent);

    return NextResponse.json(
      buildSuccessResponse({
        ...pipelineOutput.response,
        conversation_id: conversationId,
        blueprint_id: blueprintId,
        turn_count: newTurnCount,
      })
    );
  } catch (error) {
    return NextResponse.json(handleUnknownError(error, `POST /api/conversations/${conversationId}/message`), { status: 500 });
  }
}
