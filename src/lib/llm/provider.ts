/**
 * SETU — LLM Provider Abstraction
 *
 * Wraps OpenAI (primary) and Anthropic (fallback).
 * Model names always come from env vars — never hardcoded.
 * API keys are NEVER logged, returned, or passed into prompts.
 *
 * Usage:
 *   const result = await callLLM({ system, userMessage, schema: "json" });
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getServerEnv } from "@/lib/env";
import {
  SetuError,
  SETU_ERROR_CODES,
} from "@/lib/errors/setu-errors";

export type LLMProvider = "openai" | "anthropic";
export type LLMResponseFormat = "text" | "json";

export interface LLMCallOptions {
  system: string;
  userMessage: string;
  format?: LLMResponseFormat;
  maxTokens?: number;
  temperature?: number;
  /** Use fast model for cheap tasks, reasoning model for complex ones */
  modelTier?: "fast" | "reasoning";
  /** Override provider for this call */
  provider?: LLMProvider;
}

export interface LLMResult {
  content: string;
  provider: LLMProvider;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * Main LLM call — tries primary provider, falls back to secondary.
 * Throws SetuError on both failing.
 */
export async function callLLM(options: LLMCallOptions): Promise<LLMResult> {
  const env = getServerEnv();
  const primaryProvider = (options.provider ?? env.DEFAULT_LLM_PROVIDER) as LLMProvider;
  const fallbackProvider: LLMProvider = primaryProvider === "openai" ? "anthropic" : "openai";

  try {
    return await callProvider(primaryProvider, options, env);
  } catch (primaryError) {
    console.error(
      `[Setu LLM] Primary provider (${primaryProvider}) failed:`,
      primaryError instanceof Error ? primaryError.message : "unknown"
    );

    // Attempt fallback
    try {
      console.warn(`[Setu LLM] Falling back to ${fallbackProvider}`);
      return await callProvider(fallbackProvider, options, env);
    } catch (fallbackError) {
      console.error(
        `[Setu LLM] Fallback provider (${fallbackProvider}) also failed:`,
        fallbackError instanceof Error ? fallbackError.message : "unknown"
      );
      throw new SetuError(
        SETU_ERROR_CODES.LLM_ERROR,
        "AI reasoning is temporarily unavailable. Please try again in a moment.",
        "Both LLM providers failed"
      );
    }
  }
}

/**
 * Call a specific provider.
 * API keys retrieved from env each call — never cached in module scope.
 */
async function callProvider(
  provider: LLMProvider,
  options: LLMCallOptions,
  env: ReturnType<typeof getServerEnv>
): Promise<LLMResult> {
  if (provider === "openai") {
    return callOpenAI(options, env);
  }
  return callAnthropic(options, env);
}

async function callOpenAI(
  options: LLMCallOptions,
  env: ReturnType<typeof getServerEnv>
): Promise<LLMResult> {
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const model =
    options.modelTier === "fast" ? env.FAST_MODEL : env.PRIMARY_REASONING_MODEL;

  const response = await client.chat.completions.create({
    model,
    max_tokens: options.maxTokens ?? 2000,
    temperature: options.temperature ?? 0.3,
    response_format:
      options.format === "json" ? { type: "json_object" } : { type: "text" },
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty content");
  }

  return {
    content,
    provider: "openai",
    model,
    inputTokens: response.usage?.prompt_tokens,
    outputTokens: response.usage?.completion_tokens,
  };
}

async function callAnthropic(
  options: LLMCallOptions,
  env: ReturnType<typeof getServerEnv>
): Promise<LLMResult> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const model = env.FALLBACK_REASONING_MODEL;

  // Inject JSON instruction into system prompt for Anthropic
  const systemPrompt =
    options.format === "json"
      ? `${options.system}\n\nIMPORTANT: Respond ONLY with valid JSON. No preamble, no markdown fences.`
      : options.system;

  const response = await client.messages.create({
    model,
    max_tokens: options.maxTokens ?? 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: options.userMessage }],
  });

  const block = response.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Anthropic returned unexpected content type");
  }

  return {
    content: block.text,
    provider: "anthropic",
    model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

/**
 * Parse JSON from LLM output safely.
 * Strips markdown fences that some models add.
 */
export function parseLLMJson<T = Record<string, unknown>>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new SetuError(
      SETU_ERROR_CODES.LLM_ERROR,
      "AI returned an unexpected format. Please try again.",
      `JSON parse failed. Raw (first 200 chars): ${cleaned.slice(0, 200)}`
    );
  }
}
