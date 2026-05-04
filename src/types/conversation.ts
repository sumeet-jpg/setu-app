/**
 * SETU — Conversation Type Definitions
 */

import type { RequirementExtraction } from "./blueprint";

export type ConversationStage =
  | "problem_discovery"
  | "system_mapping"
  | "risk_mapping"
  | "agent_recommendation"
  | "blueprint_generation"
  | "blueprint_refinement"
  | "sandbox_planning"
  | "conversion";

export type ConversationIntent =
  | "provide_problem"
  | "answer_question"
  | "change_tool"
  | "change_approval_rule"
  | "ask_explanation"
  | "ask_pricing"
  | "ask_security"
  | "request_sandbox"
  | "request_human"
  | "book_audit"
  | "irrelevant"
  | "unsafe_request";

export type MessageRole = "user" | "assistant" | "system";

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  // Structured response (assistant messages only)
  structured_response?: AssistantResponse;
  intent?: ConversationIntent;
  created_at: string;
}

export interface ConversationState {
  id: string;
  conversation_id: string;
  stage: ConversationStage;
  requirements: Partial<RequirementExtraction>;
  blueprint_id?: string;
  lead_captured: boolean;
  last_intent?: ConversationIntent;
  turn_count: number;
  updated_at: string;
}

export interface Conversation {
  id: string;
  session_id?: string;
  lead_id?: string;
  blueprint_id?: string;
  stage: ConversationStage;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Every assistant response must follow this exact shape.
 * The frontend renders directly from this structure.
 */
export interface AssistantResponse {
  assistant_message: string;
  conversation_stage: ConversationStage;
  structured_requirement_update: Partial<RequirementExtraction>;
  blueprint_patch: Record<string, unknown>;
  next_questions: string[];
  ui_cards: UICard[];
  cta: string;
}

export interface UICard {
  type:
    | "agent_recommendation"
    | "tool_requirements"
    | "policy_guardrail"
    | "risk_score"
    | "cost_estimate"
    | "sandbox_plan"
    | "agent_passport"
    | "info"
    | "warning"
    | "success";
  title: string;
  content: Record<string, unknown>;
  is_blocking?: boolean;
}
