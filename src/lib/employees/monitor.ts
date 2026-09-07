// @ts-nocheck
// ── Setu Watch-Pattern Monitor ──────────────────────────────────────────────
// A read-only Claude pass that checks an employee's static watchPatterns
// (e.g. "MQL-to-SQL conversion rate dropping >15%") against the owner's
// REAL connected-tool data, using the same http_request infrastructure the
// execute loop uses to actually do work.
//
// Why this exists: every employee profile ships with a real, specific list
// of things it claims to watch — see src/lib/employees/profiles*.ts. Before
// this file, those strings were seeded into employee_watch_patterns and
// then never evaluated by anything. The only proactive briefs that could
// ever fire were the 4 generic, introspective ones in proactive.ts (memory
// staleness, belief conflicts, etc.) — none of which look at the business.
// This is what makes the watch-pattern promise real for tool-connected
// customers, using data Setu already has legitimate access to.
//
// Safety, because this runs unattended across every customer on a cron:
// - STRICT read-only, enforced in code, not just prompt instruction: any
//   http_request the model attempts with a method other than GET is
//   rejected before executeHttpRequest is ever called.
// - Costed and capped through the same monthly budget as real task
//   execution (checkExecuteCap / migration 020) — cannot be used to spend
//   past what a subscription is capped at.
// - Skips customers with no connected tools entirely (nothing real to
//   check, so no Claude call is made) and dedupes findings per pattern for
//   a few days so the same signal can't fire every single run.

import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server'
import { getEmployee } from '@/lib/employees/profiles'
import { getTool, buildToolContext } from '@/lib/tools/registry'
import { executeHttpRequest } from '@/lib/tools/executor'
import { checkExecuteCap, logUsage } from '@/lib/usage/cap'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MAX_LOOPS = 8
export const REFIRE_COOLDOWN_DAYS = 3

// Pure and exported so this dedup/cooldown decision — the thing standing
// between a real signal and the same brief spamming the owner every single
// day — can be tested without a database or an LLM call.
export function filterEligiblePatternIndices(
  patternCount: number,
  patternRowByIndex: Map<number, { last_fired_at: string | null }>,
  now: number = Date.now()
): number[] {
  const cooldownCutoff = now - REFIRE_COOLDOWN_DAYS * 86400000
  return Array.from({ length: patternCount }, (_, i) => i).filter(i => {
    const row = patternRowByIndex.get(i)
    if (!row?.last_fired_at) return true
    return new Date(row.last_fired_at).getTime() < cooldownCutoff
  })
}

const REPORT_TOOL: Anthropic.Tool = {
  name: 'report_findings',
  description: `Call this exactly once when you are done checking the watch patterns you were given, whether or not anything triggered. Only report a pattern as triggered if you actually read real data (via http_request) supporting it — never guess or assume based on general knowledge.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      findings: {
        type: 'array',
        description: 'Patterns that appear to have genuinely triggered based on data you read. Empty array if none did.',
        items: {
          type: 'object',
          properties: {
            pattern_index: { type: 'number', description: '0-based index into the numbered watch pattern list you were given' },
            title: { type: 'string', description: 'Short, specific headline for this signal' },
            body: { type: 'string', description: '2-3 sentences: what you found, the actual numbers, and why it matters' },
            urgency: { type: 'string', enum: ['low', 'normal', 'high', 'critical'] },
          },
          required: ['pattern_index', 'title', 'body', 'urgency'],
        },
      },
    },
    required: ['findings'],
  },
}

const HTTP_REQUEST_TOOL: Anthropic.Tool = {
  name: 'http_request',
  description: `Make a READ-ONLY GET request to a connected tool's API to check real data. Only GET is permitted — this is a passive monitoring pass, not task execution. Use query params for filtering.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      tool: { type: 'string', description: 'Tool slug from the connected tools list' },
      path: { type: 'string', description: 'API path relative to the tool base URL' },
      query: { type: 'object', description: 'Query string parameters', additionalProperties: { type: 'string' } },
    },
    required: ['tool', 'path'],
  },
}

function sseNoop() {} // placeholder for symmetry if this ever needs streaming; currently synchronous

// Runs one monitoring pass for a single (userId, employeeSlug). Returns the
// number of new briefs created. Never throws — a monitoring failure for one
// customer must not take down the sweep for everyone else (see the cron).
export async function runWatchPatternCheck(userId: string, slug: string): Promise<number> {
  const employee = getEmployee(slug)
  const patterns = (employee?.watchPatterns as string[] | undefined) ?? []
  if (patterns.length === 0) return 0

  const supabase = createAdminClient()

  const { data: connections } = await supabase
    .from('tool_connections')
    .select('tool_slug, encrypted_key, config')
    .eq('user_id', userId)

  if (!connections || connections.length === 0) return 0 // nothing real to check

  const connectedSlugs = connections.map(c => c.tool_slug)
  const connectionMap = new Map(connections.map(c => [c.tool_slug, { key: c.encrypted_key, config: c.config ?? {} }]))

  const cap = await checkExecuteCap(userId, slug)
  if (!cap.allowed) return 0 // same monthly budget as real execution — don't bypass it

  // Skip patterns that fired recently so the same signal doesn't spam every run.
  const { data: patternRows } = await supabase
    .from('employee_watch_patterns')
    .select('id, pattern_key, last_fired_at')
    .eq('user_id', userId)
    .eq('employee_slug', slug)
    .like('pattern_key', 'static_%')

  const patternRowByIndex = new Map<number, { id: string; last_fired_at: string | null }>()
  for (const row of patternRows ?? []) {
    const idx = Number(row.pattern_key.replace('static_', ''))
    if (Number.isFinite(idx)) patternRowByIndex.set(idx, row)
  }

  const eligibleIndices = filterEligiblePatternIndices(patterns.length, patternRowByIndex)

  if (eligibleIndices.length === 0) return 0

  const numberedPatterns = eligibleIndices
    .map(i => `${i}. ${patterns[i]}`)
    .join('\n')

  const toolContext = buildToolContext(connectedSlugs)
  const systemPrompt = `${employee?.systemPrompt ?? ''}

MONITORING MODE — you are running an unattended, read-only check. The owner is not present.

You are checking whether any of these watch patterns have genuinely triggered, using REAL data from connected tools:
${numberedPatterns}

RULES:
1. You may ONLY use http_request with GET — this pass never creates, sends, updates, or deletes anything, regardless of what a tool's API would otherwise allow.
2. Only report a pattern as triggered if you read real data supporting it. Never fabricate numbers or guess.
3. If a required tool for a pattern is not connected, silently skip that pattern — do not report it.
4. Call report_findings exactly once when done, even if findings is empty.
${toolContext}`

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Check the watch patterns now using the connected tools.' },
  ]

  let findings: Array<{ pattern_index: number; title: string; body: string; urgency: string }> = []
  let loopCount = 0

  try {
    while (loopCount < MAX_LOOPS) {
      loopCount++

      const finalMsg = await anthropic.messages.create({
        model: process.env.FALLBACK_REASONING_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        tools: [HTTP_REQUEST_TOOL, REPORT_TOOL],
        messages,
      })

      logUsage({
        userId, employeeSlug: slug, eventType: 'monitor',
        model: finalMsg.model,
        inputTokens: finalMsg.usage?.input_tokens ?? 0,
        outputTokens: finalMsg.usage?.output_tokens ?? 0,
      }).catch(() => {})

      const toolUseBlocks = finalMsg.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
      messages.push({ role: 'assistant', content: finalMsg.content })

      if (finalMsg.stop_reason !== 'tool_use' || toolUseBlocks.length === 0) break

      const toolResults: Anthropic.ToolResultBlockParam[] = []
      let done = false

      for (const block of toolUseBlocks) {
        if (block.name === 'report_findings') {
          const input = block.input as any
          findings = Array.isArray(input.findings) ? input.findings : []
          done = true
          break
        }

        if (block.name === 'http_request') {
          const input = block.input as any
          const method = (input.method ?? 'GET').toUpperCase()

          if (method !== 'GET') {
            toolResults.push({
              type: 'tool_result', tool_use_id: block.id,
              content: JSON.stringify({ error: 'Blocked: monitoring passes are read-only (GET only). This request was not made.' }),
            })
            continue
          }

          const conn = connectionMap.get(input.tool)
          if (!conn) {
            const toolDef = getTool(input.tool)
            toolResults.push({
              type: 'tool_result', tool_use_id: block.id,
              content: JSON.stringify({ error: `Tool "${input.tool}" is not connected.`, required_tool: input.tool }),
            })
            continue
          }

          const execResult = await executeHttpRequest(
            { tool: input.tool, method: 'GET', path: input.path, query: input.query },
            conn.key, conn.config
          )

          toolResults.push({
            type: 'tool_result', tool_use_id: block.id,
            content: JSON.stringify(execResult.ok ? execResult.data : { error: execResult.error }).slice(0, 6000),
          })
        }
      }

      if (done) break
      if (toolResults.length > 0) messages.push({ role: 'user', content: toolResults })
    }
  } catch (err) {
    console.error('[monitor] watch-pattern check failed', { userId, slug, err })
    return 0
  }

  let created = 0
  for (const finding of findings) {
    const row = patternRowByIndex.get(finding.pattern_index)
    if (!row) continue // stale index from the model, ignore rather than write garbage

    await supabase.from('employee_proactive_briefs').insert({
      user_id: userId,
      employee_slug: slug,
      watch_pattern_id: row.id,
      title: finding.title,
      body: finding.body,
      urgency: ['low', 'normal', 'high', 'critical'].includes(finding.urgency) ? finding.urgency : 'normal',
      signal_data: { pattern_index: finding.pattern_index, source: 'watch_pattern_monitor' },
      delivered: false,
    })

    // Awaited and separate from the update below on purpose — passing the
    // rpc() call's builder object directly as a field value in the SAME
    // update payload (the pre-existing pattern in proactive.ts) never
    // actually incremented anything; see migration 021's note.
    // .catch() chained directly on the query builder isn't a real function
    // here — it threw and crashed this whole check every time a pattern
    // actually fired, instead of the "best-effort" behavior intended.
    try {
      await supabase.rpc('increment_pattern_fire_count' as any, { pattern_id: row.id })
    } catch { /* non-fatal */ }

    await supabase.from('employee_watch_patterns').update({
      last_fired_at: new Date().toISOString(),
      last_checked_at: new Date().toISOString(),
    }).eq('id', row.id)

    created++
  }

  // Mark checked even for patterns that didn't fire, so last_checked_at is meaningful.
  const checkedIds = eligibleIndices.map(i => patternRowByIndex.get(i)?.id).filter(Boolean)
  if (checkedIds.length > 0) {
    await supabase.from('employee_watch_patterns')
      .update({ last_checked_at: new Date().toISOString() })
      .in('id', checkedIds as string[])
  }

  return created
}
