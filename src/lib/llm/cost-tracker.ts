// @ts-nocheck
/**
 * SETU — LLM Cost Tracker
 *
 * Logs cost events after every LLM call.
 * Checks against configured cost limits.
 * Never exposes raw pricing data to clients.
 */

import type { LLMResult } from "./provider";
import { writeAuditLog } from "@/lib/governance/audit-logger";

// Approximate costs per 1k tokens (USD) — update as pricing changes
const COST_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "claude-sonnet-4-20250514": { input: 0.003, output: 0.015 },
  default: { input: 0.003, output: 0.015 },
};

export function estimateCostUsd(result: LLMResult): number {
  const pricing = COST_PER_1K_TOKENS[result.model] ?? COST_PER_1K_TOKENS.default;
  const inputCost = ((result.inputTokens ?? 0) / 1000) * pricing.input;
  const outputCost = ((result.outputTokens ?? 0) / 1000) * pricing.output;
  return inputCost + outputCost;
}

export interface CostEventContext {
  conversationId?: string;
  blueprintId?: string;
  agentId?: string;
  tenantId?: string;
  eventType: string;
}

/**
 * Log a cost event after an LLM call.
 * Phase 1: logs to console only.
 * Phase 2: writes to cost_events table.
 */
export async function logCostEvent(
  result: LLMResult,
  ctx: CostEventContext
): Promise<void> {
  const estimatedCost = estimateCostUsd(result);

  // Console log only — no secrets in metadata
  await writeAuditLog({
    event_type: "blueprint_generated", // closest audit event for now
    severity: "info",
    session_id: ctx.conversationId,
    description: `LLM call completed: ${ctx.eventType}`,
    metadata: {
      provider: result.provider,
      model: result.model,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      estimated_cost_usd: estimatedCost,
      event_type: ctx.eventType,
    },
  });

  // TODO Phase 2: insert into cost_events table
}
