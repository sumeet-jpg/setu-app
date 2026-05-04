/**
 * SETU — Intent Classifier
 * Step 1 of the blueprint pipeline.
 */

import { callLLM, parseLLMJson } from "@/lib/llm/provider";
import { buildIntentClassifierPrompt } from "@/prompts/workflow-advisor";
import type { ConversationIntent } from "@/types/conversation";

export interface IntentResult {
  intent: ConversationIntent;
  confidence: number;
}

export async function classifyIntent(
  userMessage: string
): Promise<IntentResult> {
  // Fast model — this is a cheap classification task
  const result = await callLLM({
    system: buildIntentClassifierPrompt(),
    userMessage,
    format: "json",
    modelTier: "fast",
    maxTokens: 100,
    temperature: 0,
  });

  const parsed = parseLLMJson<{ intent: string; confidence: number }>(
    result.content
  );

  const validIntents: ConversationIntent[] = [
    "provide_problem",
    "answer_question",
    "change_tool",
    "change_approval_rule",
    "ask_explanation",
    "ask_pricing",
    "ask_security",
    "request_sandbox",
    "request_human",
    "book_audit",
    "irrelevant",
    "unsafe_request",
  ];

  const intent = validIntents.includes(parsed.intent as ConversationIntent)
    ? (parsed.intent as ConversationIntent)
    : "provide_problem";

  return { intent, confidence: parsed.confidence ?? 70 };
}
