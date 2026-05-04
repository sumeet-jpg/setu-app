// @ts-nocheck
"use client";

import { useState, useCallback, useRef } from "react";
import type { AssistantResponse, ConversationStage } from "@/types/conversation";
import type { Blueprint } from "@/types/blueprint";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  structured?: AssistantResponse;
  timestamp: Date;
}

export interface ConversationState {
  conversationId: string | null;
  sessionId: string;
  stage: ConversationStage;
  messages: Message[];
  blueprint: Partial<Blueprint> | null;
  blueprintId: string | null;
  isLoading: boolean;
  error: string | null;
  turnCount: number;
  leadCaptured: boolean;
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Retrieve or create session ID from sessionStorage
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return generateSessionId();
  const existing = sessionStorage.getItem("setu_session_id");
  if (existing) return existing;
  const newId = generateSessionId();
  sessionStorage.setItem("setu_session_id", newId);
  return newId;
}

export function useConversation() {
  const sessionId = useRef<string>(getOrCreateSessionId());

  const [state, setState] = useState<ConversationState>({
    conversationId: null,
    sessionId: sessionId.current,
    stage: "problem_discovery",
    messages: [],
    blueprint: null,
    blueprintId: null,
    isLoading: false,
    error: null,
    turnCount: 0,
    leadCaptured: false,
  });

  /**
   * Start a new conversation.
   * Called once when user first interacts.
   */
  const startConversation = useCallback(async (): Promise<string | null> => {
    if (state.conversationId) return state.conversationId;

    try {
      const response = await fetch("/api/conversations/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId.current }),
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error?.message ?? "Failed to start conversation");

      setState((prev) => ({
        ...prev,
        conversationId: data.data.conversation_id,
        stage: data.data.stage,
      }));

      return data.data.conversation_id;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to start conversation",
      }));
      return null;
    }
  }, [state.conversationId]);

  /**
   * Send a user message and get the assistant response.
   */
  const sendMessage = useCallback(
    async (userMessage: string): Promise<void> => {
      if (!userMessage.trim() || state.isLoading) return;

      // Add user message to UI immediately
      const userMsg: Message = {
        id: generateMessageId(),
        role: "user",
        content: userMessage.trim(),
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMsg],
        isLoading: true,
        error: null,
      }));

      try {
        // Start conversation if needed
        let convId = state.conversationId;
        if (!convId) {
          convId = await startConversation();
          if (!convId) throw new Error("Could not start conversation");
        }

        const response = await fetch(
          `/api/conversations/${convId}/message`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId.current,
              message: userMessage.trim(),
            }),
          }
        );

        const data = await response.json();

        if (!data.ok) {
          throw new Error(data.error?.message ?? "Something went wrong");
        }

        const assistantResponse: AssistantResponse = data.data;

        const assistantMsg: Message = {
          id: generateMessageId(),
          role: "assistant",
          content: assistantResponse.assistant_message,
          structured: assistantResponse,
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMsg],
          stage: assistantResponse.conversation_stage ?? prev.stage,
          blueprint: assistantResponse.blueprint_patch
            ? { ...(prev.blueprint ?? {}), ...(assistantResponse.blueprint_patch as Partial<Blueprint>) }
            : prev.blueprint,
          blueprintId: data.data.blueprint_id ?? prev.blueprintId,
          turnCount: data.data.turn_count ?? prev.turnCount + 1,
          isLoading: false,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";

        const errorMsg: Message = {
          id: generateMessageId(),
          role: "assistant",
          content: errorMessage,
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, errorMsg],
          isLoading: false,
          error: errorMessage,
        }));
      }
    },
    [state.conversationId, state.isLoading, startConversation]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    sendMessage,
    startConversation,
    clearError,
  };
}
