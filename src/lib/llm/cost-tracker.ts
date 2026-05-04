// @ts-nocheck
/**
 * SETU — LLM Cost Tracker
 * Logs cost events to Supabase cost_events table.
 */

import type { LLMResult } from "./provider";
import { writeAuditLog } from "@/lib/governance/audit-logger";

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

export async function logCostEvent(result: LLMResult, ctx: CostEventContext): Promise<void> {
  const estimatedCost = estimateCostUsd(result);

  // Write to audit log
  await writeAuditLog({
    event_type: "blueprint_generated",
    severity: "info",
    session_id: ctx.conversationId,
    description: `LLM call: ${ctx.eventType}`,
    metadata: {
      provider: result.provider,
      model: result.model,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      estimated_cost_usd: estimatedCost,
      event_type: ctx.eventType,
    },
  });

  // Write to cost_events table
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const db = createAdminClient();
    await db.from("cost_events").insert({
      conversation_id: ctx.conversationId ?? null,
      blueprint_id: ctx.blueprintId ?? null,
      agent_id: null,
      tenant_id: ctx.tenantId ?? null,
      event_type: ctx.eventType,
      provider: result.provider,
      model: result.model,
      tokens_used: (result.inputTokens ?? 0) + (result.outputTokens ?? 0),
      estimated_cost_usd: estimatedCost,
      threshold_reached: false,
    });
  } catch (err) {
    console.error("[Setu] Failed to write cost event to DB:", err instanceof Error ? err.message : "unknown");
  }
}
