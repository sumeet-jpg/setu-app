/**
 * POST /api/conversations/:id/message
 *
 * Core conversation endpoint. Receives a user message,
 * runs the full 13-step blueprint pipeline, and returns
 * a structured AssistantResponse.
 *
 * Rate: limited by LLM cost budget (no hard rate limit in Phase 2).
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
  getConversation,
  getOrCreateConversationState,
  getMessages,
  saveMessage,
  updateConversationState,
  createBlueprint,
  updateBlueprint,
  updateConversationStage,
  getCatalog,
} from "@/lib/services/conversation.service";
import { runBlueprintPipeline } from "@/lib/blueprint/pipeline";
import type { ConversationStage } from "@/types/conversation";
import type { RequirementExtraction } from "@/types/blueprint";

const MessageSchema = z.object({
  session_id: z.string().min(8).max(128),
  message: z.string().min(1).max(4000).trim(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;

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

    // ── Verify conversation belongs to this session ──────────
    const conversation = await getConversation(conversationId, session_id);
    if (!conversation) {
      return NextResponse.json(
        buildErrorResponse(
          SETU_ERROR_CODES.PERMISSION_DENIED,
          "Conversation not found.",
          { safe_next_step: "Start a new conversation." }
        ),
        { status: 404 }
      );
    }

    // ── Get current state + message history ──────────────────
    const state = await getOrCreateConversationState(conversationId);
    const messages = await getMessages(conversationId);

    const messageHistory = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // ── Save user message ────────────────────────────────────
    await saveMessage(conversationId, "user", message);

    // ── Load catalog ─────────────────────────────────────────
    const catalog = await getCatalog();

    if (catalog.length === 0) {
      // Catalog not yet seeded — return a safe holding response
      const holdingResponse = {
        assistant_message:
          "Thanks for sharing that. I'm setting up my knowledge base — could you tell me a bit more about your team and which tools you currently use for this workflow?",
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

    // ── Run the 13-step pipeline ─────────────────────────────
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

    // ── Persist blueprint if generated or updated ────────────
    let blueprintId = state.blueprint_id as string | undefined;

    if (!blueprintId && Object.keys(pipelineOutput.updatedBlueprint).length > 0) {
      // Create blueprint on first meaningful output
      const inputSummary =
        (pipelineOutput.updatedBlueprint as Record<string, unknown>)?.input_summary as string ||
        message.slice(0, 200);
      const newBlueprint = await createBlueprint(conversationId, session_id, inputSummary);
      blueprintId = newBlueprint.id;
    }

    if (blueprintId && Object.keys(pipelineOutput.updatedBlueprint).length > 0) {
      await updateBlueprint(blueprintId, pipelineOutput.updatedBlueprint);
    }

    // ── Update conversation state ────────────────────────────
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

    // ── Save assistant message ────────────────────────────────
    await saveMessage(
      conversationId,
      "assistant",
      pipelineOutput.response.assistant_message,
      pipelineOutput.response as unknown as Record<string, unknown>,
      pipelineOutput.intent
    );

    // ── Return structured response ────────────────────────────
    return NextResponse.json(
      buildSuccessResponse({
        ...pipelineOutput.response,
        conversation_id: conversationId,
        blueprint_id: blueprintId,
        turn_count: newTurnCount,
      })
    );
  } catch (error) {
    return NextResponse.json(
      handleUnknownError(error, `POST /api/conversations/${conversationId}/message`),
      { status: 500 }
    );
  }
}
