// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getEmployee } from '@/lib/employees/profiles'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── CKG: context-aware belief selection ─────────────────────────────────────
// Loads up to 120 beliefs, scores each by relevance to the current conversation,
// then selects the top 30. Priority categories (skill_learned, failure_pattern,
// success_pattern) are always foregrounded regardless of keyword match.
//
// Score = confidence × log(reinforcement + 1) × relevanceMultiplier × categoryMultiplier
// No extra LLM call — keyword extraction is pure string ops.

const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall','can',
  'to','of','in','for','on','with','at','by','from','as','into','through',
  'and','or','but','not','this','that','these','those','it','its',
  'i','me','my','we','our','you','your','he','she','they','them','their',
  'what','how','when','where','why','who','which','there','here',
])

function extractKeywords(messages: { role: string; content: string }[]): Set<string> {
  const recent = messages.slice(-4).map(m => m.content).join(' ')
  return new Set(
    recent.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w))
  )
}

const CATEGORY_PRIORITY: Record<string, number> = {
  skill_learned:    1.4,
  failure_pattern:  1.3,
  success_pattern:  1.2,
  owner_preference: 1.1,
  decision:         1.0,
  business_context: 1.0,
  relationship:     0.9,
  market_signal:    0.9,
  domain_update:    0.8,
}

const CATEGORY_LABELS: Record<string, string> = {
  owner_preference: 'Owner preferences & working style',
  business_context: 'Business context',
  decision:         'Decisions made',
  relationship:     'Relationship context',
  market_signal:    'Market signals',
  failure_pattern:  'What has not worked',
  success_pattern:  'What has worked',
  domain_update:    'Domain updates',
  skill_learned:    'Learned skills & procedures',
}

async function loadWisdom(
  userId: string,
  slug: string,
  currentMessages: { role: string; content: string }[]
): Promise<string> {
  try {
    const supabase = createAdminClient()

    // Wider net — score and select, not just take top-N
    const { data } = await supabase
      .from('employee_beliefs')
      .select('category, subject, belief, confidence, reinforcement_count, last_validated_at')
      .eq('user_id', userId)
      .eq('employee_slug', slug)
      .gt('confidence', 0.3)
      .order('confidence', { ascending: false })
      .limit(120)

    if (!data || data.length === 0) return ''

    const keywords = extractKeywords(currentMessages)

    // Score each belief
    const scored = data.map(b => {
      const haystack = `${b.subject} ${b.belief}`.toLowerCase()
      const relevance = keywords.size > 0 && [...keywords].some(kw => haystack.includes(kw)) ? 1.5 : 1.0
      const categoryMult = CATEGORY_PRIORITY[b.category] ?? 1.0
      const reinforceMult = Math.log((b.reinforcement_count ?? 1) + 1) + 1
      const score = b.confidence * reinforceMult * relevance * categoryMult
      return { ...b, score }
    })

    // Sort and take top 30 — but always include all skill_learned + failure_pattern
    const priority = scored.filter(b => b.category === 'skill_learned' || b.category === 'failure_pattern')
    const rest = scored
      .filter(b => b.category !== 'skill_learned' && b.category !== 'failure_pattern')
      .sort((a, b) => b.score - a.score)
      .slice(0, 30 - priority.length)

    const selected = [...priority, ...rest]

    // Group by category
    const grouped: Record<string, typeof selected> = {}
    for (const b of selected) {
      if (!grouped[b.category]) grouped[b.category] = []
      grouped[b.category].push(b)
    }

    // Category display order: priority categories first
    const orderedCats = Object.keys(CATEGORY_PRIORITY).filter(c => grouped[c])

    const sections = orderedCats.map(cat => {
      const label = CATEGORY_LABELS[cat] ?? cat
      const beliefs = grouped[cat].sort((a, b) => b.score - a.score)
      const lines = beliefs.map(b => `• ${b.subject}: ${b.belief}`)
      return `${label}:\n${lines.join('\n')}`
    })

    return `\n\n---\nWhat you know about this owner (distilled from working history):\n${sections.join('\n\n')}\n---\n`
  } catch {
    return ''
  }
}

// Load the last N raw messages for immediate session context (short-term window only)
async function loadRecentContext(userId: string, slug: string): Promise<string> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('employee_memories')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .eq('employee_slug', slug)
      .eq('type', 'message')
      .order('created_at', { ascending: false })
      .limit(8)

    if (!data || data.length === 0) return ''

    const items = data.reverse()
    const lines = items.map(m => `${m.role === 'user' ? 'Owner' : 'You'}: ${m.content.slice(0, 500)}`)
    return `\n\n---\nMost recent exchanges:\n${lines.join('\n')}\n---\n`
  } catch {
    return ''
  }
}

// ── CIV: keyword retrieval from Company Intelligence Vault ──────────────────
// Fetches relevant document chunks based on the current conversation keywords.
// Documents are UNTRUSTED — always cited, never asserted as the employee's knowledge.
// If a document contradicts a CKG belief, the employee surfaces the contradiction.

async function loadVaultContext(
  userId: string,
  slug: string,
  currentMessages: { role: string; content: string }[]
): Promise<string> {
  try {
    const keywords = extractKeywords(currentMessages)
    if (keywords.size === 0) return ''

    const supabase = createAdminClient()

    // Search for chunks matching any keyword — shared docs (null slug) + employee-specific
    // PostgreSQL ILIKE with OR across keywords
    const kwList = [...keywords].slice(0, 6)  // cap to 6 keywords for query efficiency
    const ilikeFilter = kwList.map(kw => `content.ilike.%${kw}%`).join(',')

    const { data } = await supabase
      .from('company_documents')
      .select('source_name, source_type, content, chunk_index')
      .eq('user_id', userId)
      .or(`employee_slug.eq.${slug},employee_slug.is.null`)
      .or(ilikeFilter)
      .limit(8)

    if (!data || data.length === 0) return ''

    // Score by keyword hit count, take top 5 most relevant chunks
    const scored = data.map(chunk => {
      const haystack = chunk.content.toLowerCase()
      const hits = kwList.filter(kw => haystack.includes(kw)).length
      return { ...chunk, hits }
    }).sort((a, b) => b.hits - a.hits).slice(0, 5)

    const sections = scored.map(chunk =>
      `[From: ${chunk.source_name}${chunk.chunk_index > 0 ? ` (part ${chunk.chunk_index + 1})` : ''}]\n${chunk.content.slice(0, 800)}`
    )

    return `\n\n---\nRelevant company documents (cite the source; do not assert as your own knowledge; flag if any contradicts your beliefs):\n\n${sections.join('\n\n')}\n---\n`
  } catch {
    return ''
  }
}

// ── CEC: load org-wide shared intelligence into every session ────────────────
// Entries relevant to this employee (or all employees) that haven't been consumed yet.
// After loading, mark them consumed so subsequent sessions don't repeat them
// unless they haven't been seen in a long time.

async function loadCortexContext(userId: string, slug: string): Promise<string> {
  try {
    const supabase = createAdminClient()

    // Load entries: visible to all (relevant_to = []) or specifically this slug
    const { data } = await supabase
      .from('org_cortex_entries')
      .select('id, entry_type, title, body, source_employee_slug, consumed_by, confidence')
      .eq('user_id', userId)
      .eq('is_active', true)
      .or(`relevant_to.eq.{},relevant_to.cs.{${slug}}`)
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10)

    if (!data || data.length === 0) return ''

    // Separate unconsumed (new to this employee) from already seen
    const unconsumed = data.filter(e => !(e.consumed_by ?? []).includes(slug))
    if (unconsumed.length === 0) return ''

    const typeLabels: Record<string, string> = {
      org_decision:    'Org decision',
      customer_insight:'Customer insight',
      market_signal:   'Market signal',
      process_change:  'Process change',
      product_update:  'Product update',
      team_context:    'Team context',
    }

    const items = unconsumed.slice(0, 6).map(e =>
      `[${typeLabels[e.entry_type] ?? e.entry_type} — via ${e.source_employee_slug}] ${e.title}: ${e.body}`
    )

    // Mark as consumed (fire-and-forget)
    const ids = unconsumed.slice(0, 6).map(e => e.id)
    supabase
      .from('org_cortex_entries')
      .select('id, consumed_by')
      .in('id', ids)
      .then(({ data: entries }) => {
        for (const entry of entries ?? []) {
          const updated = [...new Set([...(entry.consumed_by ?? []), slug])]
          supabase.from('org_cortex_entries')
            .update({ consumed_by: updated })
            .eq('id', entry.id)
            .then(() => {})
        }
      })

    return `\n\n---\nOrganizational intelligence from your other AI employees (context shared automatically):\n${items.join('\n\n')}\n---\n`
  } catch {
    return ''
  }
}

// ── PIN: load unread proactive briefs into the session context ───────────────
// The employee is told: "You have a proactive update to surface early."
// This turns the PIN from a push notification into a natural conversation opener.

async function loadProactiveBriefs(userId: string, slug: string): Promise<string> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('employee_proactive_briefs')
      .select('id, title, body, urgency')
      .eq('user_id', userId)
      .eq('employee_slug', slug)
      .is('read_at', null)
      .is('dismissed_at', null)
      .order('urgency', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3)

    if (!data || data.length === 0) return ''

    const urgencyOrder = ['critical', 'high', 'normal', 'low']
    const sorted = data.sort((a, b) => urgencyOrder.indexOf(a.urgency) - urgencyOrder.indexOf(b.urgency))

    const items = sorted.map(b => `[${b.urgency.toUpperCase()}] ${b.title}: ${b.body}`).join('\n\n')

    // Mark as delivered (not read — owner hasn't seen them yet)
    await supabase
      .from('employee_proactive_briefs')
      .update({ delivered: true, delivered_at: new Date().toISOString() })
      .in('id', data.map(b => b.id))

    return `\n\n---\nProactive updates you should surface early in this conversation (work them in naturally, don't read them verbatim):\n${items}\n---\n`
  } catch {
    return ''
  }
}

// ── S6 ACT: inject available actions + pending count into every session ──────
// The employee knows: which tools it can propose, how many proposals are pending,
// and the exact syntax to use when it wants to propose an action.
// Actions are parsed client-side from the stream using a marker pattern.

const ACTION_REGISTRY_PROMPT = `
You have access to an Action Layer. When you believe the owner would benefit from you taking a specific action, you may propose it — but NEVER execute without explicit owner approval.

To propose an action, include this marker anywhere in your response (only when genuinely helpful, never automatically):

[ACTION:{"type":"<action_type>","title":"<short title>","description":"<what you propose to do and why, 1-2 sentences>","payload":{}}]

Available action types:
- draft_document: Prepare a written document, email draft, or template for owner review (low risk)
- create_task: Add a task or reminder to a project tracker (low risk)
- send_email: Send an email to a contact — ALWAYS requires approval (high risk)
- schedule_meeting: Create a calendar event or meeting invite (medium risk)
- update_record: Modify a CRM, spreadsheet, or database entry (medium risk)
- external_api: Call an external service or tool (high risk, always requires approval)

Rules:
- Only propose when you have specific, actionable information from this conversation
- Include only ONE action per response — don't batch multiple
- The [ACTION:...] marker is stripped from display and shown as an approval card
- Never propose the same action twice if it's already pending
- If an action was rejected, do not re-propose it in the same session without addressing the rejection reason
`

async function loadActionContext(userId: string, slug: string): Promise<string> {
  try {
    const supabase = createAdminClient()

    // Count pending actions (ones awaiting owner decision)
    const { count: pendingCount } = await supabase
      .from('employee_actions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('employee_slug', slug)
      .eq('status', 'pending')

    // Load recently rejected (so employee doesn't re-propose them)
    const { data: recentRejected } = await supabase
      .from('employee_actions')
      .select('title, rejection_reason')
      .eq('user_id', userId)
      .eq('employee_slug', slug)
      .eq('status', 'rejected')
      .gte('rejected_at', new Date(Date.now() - 3 * 86400000).toISOString())
      .limit(5)

    let ctx = ACTION_REGISTRY_PROMPT

    if (pendingCount && pendingCount > 0) {
      ctx += `\n\nYou currently have ${pendingCount} pending action proposal${pendingCount > 1 ? 's' : ''} awaiting owner approval. Do not re-propose them.`
    }

    if (recentRejected && recentRejected.length > 0) {
      const rejectedList = recentRejected.map(a =>
        `• "${a.title}"${a.rejection_reason ? ` — reason: ${a.rejection_reason}` : ''}`
      ).join('\n')
      ctx += `\n\nRecently rejected proposals (do not re-propose without addressing the reason):\n${rejectedList}`
    }

    return ctx
  } catch {
    return ACTION_REGISTRY_PROMPT
  }
}

// Write one memory entry (silent fail — never blocks the stream)
async function writeMemory(
  userId: string,
  slug: string,
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
) {
  try {
    const supabase = createAdminClient()
    await supabase.from('employee_memories').insert({
      user_id: userId,
      employee_slug: slug,
      session_id: sessionId,
      type: 'message',
      role,
      content: content.slice(0, 4000),
      importance: 5,
    })
  } catch {
    // intentional silent fail
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slug, messages, userId, sessionId } = await req.json()

    if (!slug || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const employee = getEmployee(slug)
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Build context: distilled CKG wisdom + vault docs + proactive briefs + recent exchanges
    let memoryContext = ''
    if (userId) {
      const [wisdom, recent, vault, briefsText, cortex, actionCtx] = await Promise.all([
        loadWisdom(userId, slug, messages),
        loadRecentContext(userId, slug),
        loadVaultContext(userId, slug, messages),
        loadProactiveBriefs(userId, slug),
        loadCortexContext(userId, slug),
        loadActionContext(userId, slug),
      ])
      memoryContext = wisdom + vault + cortex + briefsText + actionCtx + recent

      // Seed watch patterns on first message (idempotent, fire-and-forget)
      if (messages.length <= 1) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
        fetch(`${baseUrl}/api/employees/pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'seed', userId, slug }),
        }).catch(() => {})
      }
    }
    const systemPrompt = employee.systemPrompt + memoryContext

    const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const model = process.env.FALLBACK_REASONING_MODEL ?? 'claude-sonnet-4-6'

    const stream = await client.messages.stream({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    })

    // Buffer the full assistant response so we can persist it after streaming
    let assistantResponse = ''

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              assistantResponse += chunk.delta.text
              const data = `data: ${JSON.stringify({ choices: [{ delta: { content: chunk.delta.text } }] })}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

          // Persist both sides after the stream completes
          if (userId && sessionId) {
            const lastUserMsg = messages[messages.length - 1]
            if (lastUserMsg?.role === 'user') {
              await writeMemory(userId, slug, sessionId, 'user', lastUserMsg.content)
            }
            if (assistantResponse) {
              await writeMemory(userId, slug, sessionId, 'assistant', assistantResponse)
            }

            // S6: Parse and register any action proposal in the assistant response
            const actionMatch = assistantResponse.match(/\[ACTION:(\{[^}]+\}(?:\})*)\]/s)
            if (actionMatch) {
              try {
                const proposal = JSON.parse(actionMatch[1])
                if (proposal.type && proposal.title && proposal.description) {
                  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
                  fetch(`${baseUrl}/api/employees/actions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId,
                      slug,
                      sessionId,
                      actionType: proposal.type,
                      title: proposal.title,
                      description: proposal.description,
                      payload: proposal.payload ?? {},
                    }),
                  }).catch(() => {})
                }
              } catch {
                // Malformed JSON in action marker — ignore
              }
            }

            // Trigger distillation after sufficient session depth (fire-and-forget)
            // Runs in background — does not block the response
            if (messages.length >= 8) {
              const distillPayload = {
                userId,
                slug,
                sessionId,
                messages: [
                  ...messages.slice(-20),
                  { role: 'assistant', content: assistantResponse },
                ],
              }
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
              fetch(`${baseUrl}/api/employees/distill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(distillPayload),
              }).catch(() => {}) // intentional silent fail

              // PIN: check patterns after session (fire-and-forget)
              fetch(`${baseUrl}/api/employees/pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check', userId, slug }),
              }).catch(() => {})
            }
          }
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err: any) {
    console.error('[Setu interview API]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
