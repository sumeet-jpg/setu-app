// @ts-nocheck
// ── Per-customer LLM usage cap ──────────────────────────────────────────────
// Nothing previously tracked or limited how much Claude API spend a single
// customer could generate. See migration 016 for context. Two tiers:
//   - Anonymous pre-hire interview: a small daily cap per user_id (protects
//     the free, no-signup demo from scripted abuse without hurting a real
//     visitor's actual demo session).
//   - Post-hire execute loop: a monthly cap per (user_id, employee_slug),
//     scoped to the specific $49/mo subscription it's billed against.
// Both fail OPEN on a DB read error — a Supabase hiccup should not take
// down the product for every customer — but fail CLOSED (deny) once the
// cap is confirmed exceeded.

import { createAdminClient } from '@/lib/supabase/server'

export const ANON_INTERVIEW_DAILY_CAP_USD = Number(process.env.ANON_INTERVIEW_DAILY_CAP_USD ?? 1)
export const HIRED_EMPLOYEE_MONTHLY_CAP_USD = Number(process.env.HIRED_EMPLOYEE_MONTHLY_CAP_USD ?? 15)

// Anthropic list pricing per 1K tokens. Update if the model changes.
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6':          { input: 0.003, output: 0.015 },
  'claude-sonnet-4-20250514':   { input: 0.003, output: 0.015 },
  default:                      { input: 0.003, output: 0.015 },
}

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING.default
  return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output
}

export interface CapCheck {
  allowed: boolean
  spentUsd: number
  capUsd: number
}

// Anonymous interview: capped per user_id (not per employee — a scripted
// abuser rotating through employee slugs shouldn't reset the budget), over
// a rolling 24h window.
export async function checkInterviewCap(userId: string): Promise<CapCheck> {
  const capUsd = ANON_INTERVIEW_DAILY_CAP_USD
  try {
    const db = createAdminClient()
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await db
      .from('employee_usage_events')
      .select('estimated_cost_usd')
      .eq('user_id', userId)
      .eq('event_type', 'interview')
      .gte('created_at', since)

    if (error) throw error
    const spentUsd = (data ?? []).reduce((sum, r) => sum + Number(r.estimated_cost_usd ?? 0), 0)
    return { allowed: spentUsd < capUsd, spentUsd, capUsd }
  } catch (err) {
    console.error('[usage/cap] checkInterviewCap failed, failing open', err)
    return { allowed: true, spentUsd: 0, capUsd }
  }
}

// Post-hire execute loop: capped per (user_id, employee_slug) — scoped to
// the specific subscription paying for it — over a rolling 30-day window.
export async function checkExecuteCap(userId: string, employeeSlug: string): Promise<CapCheck> {
  const capUsd = HIRED_EMPLOYEE_MONTHLY_CAP_USD
  try {
    const db = createAdminClient()
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await db
      .from('employee_usage_events')
      .select('estimated_cost_usd')
      .eq('user_id', userId)
      .eq('employee_slug', employeeSlug)
      .eq('event_type', 'execute')
      .gte('created_at', since)

    if (error) throw error
    const spentUsd = (data ?? []).reduce((sum, r) => sum + Number(r.estimated_cost_usd ?? 0), 0)
    return { allowed: spentUsd < capUsd, spentUsd, capUsd }
  } catch (err) {
    console.error('[usage/cap] checkExecuteCap failed, failing open', err)
    return { allowed: true, spentUsd: 0, capUsd }
  }
}

export async function logUsage(params: {
  userId: string
  employeeSlug: string
  eventType: 'interview' | 'execute'
  model: string
  inputTokens: number
  outputTokens: number
}): Promise<void> {
  try {
    const db = createAdminClient()
    const estimatedCost = estimateCostUsd(params.model, params.inputTokens, params.outputTokens)
    await db.from('employee_usage_events').insert({
      user_id:            params.userId,
      employee_slug:      params.employeeSlug,
      event_type:         params.eventType,
      model:              params.model,
      input_tokens:       params.inputTokens,
      output_tokens:      params.outputTokens,
      estimated_cost_usd: estimatedCost,
    })
  } catch (err) {
    // Non-fatal — losing one usage log row is far better than failing the
    // user's actual request over a logging write.
    console.error('[usage/cap] logUsage failed', err)
  }
}
