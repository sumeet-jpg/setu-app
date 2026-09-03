// @ts-nocheck
// ── Setu Employee Context Loaders ───────────────────────────────────────────
// Shared between the interview route (conversation) and the execute route
// (real task execution). Originally lived only in interview/route.ts — the
// execute loop ran every task with zero awareness of anything the employee
// had learned about the business, which real world in exchange for zero context
// undermines the "gets better over time" pitch: the employee that just talks
// remembers everything, the employee that does the work forgot it all.

import { createAdminClient } from '@/lib/supabase/server'

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
  'and', 'or', 'but', 'not', 'this', 'that', 'these', 'those', 'it', 'its',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'they', 'them', 'their',
  'what', 'how', 'when', 'where', 'why', 'who', 'which', 'there', 'here',
])

export function extractKeywords(messages: { role: string; content: string }[]): Set<string> {
  const recent = messages.slice(-4).map(m => m.content).join(' ')
  return new Set(
    recent.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w))
  )
}

const CATEGORY_PRIORITY: Record<string, number> = {
  skill_learned: 1.4,
  failure_pattern: 1.3,
  success_pattern: 1.2,
  owner_preference: 1.1,
  decision: 1.0,
  business_context: 1.0,
  relationship: 0.9,
  market_signal: 0.9,
  domain_update: 0.8,
}

const CATEGORY_LABELS: Record<string, string> = {
  owner_preference: 'Owner preferences & working style',
  business_context: 'Business context',
  decision: 'Decisions made',
  relationship: 'Relationship context',
  market_signal: 'Market signals',
  failure_pattern: 'What has not worked',
  success_pattern: 'What has worked',
  domain_update: 'Domain updates',
  skill_learned: 'Learned skills & procedures',
}

// CKG: context-aware belief selection. Loads up to 120 beliefs, scores each
// by relevance to the current conversation/task, then selects the top 30.
// Priority categories (skill_learned, failure_pattern, success_pattern) are
// always foregrounded regardless of keyword match. No extra LLM call.
export async function loadWisdom(
  userId: string,
  slug: string,
  currentMessages: { role: string; content: string }[]
): Promise<string> {
  try {
    const supabase = createAdminClient()

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

    const scored = data.map(b => {
      const haystack = `${b.subject} ${b.belief}`.toLowerCase()
      const relevance = keywords.size > 0 && [...keywords].some(kw => haystack.includes(kw)) ? 1.5 : 1.0
      const categoryMult = CATEGORY_PRIORITY[b.category] ?? 1.0
      const reinforceMult = Math.log((b.reinforcement_count ?? 1) + 1) + 1
      const score = b.confidence * reinforceMult * relevance * categoryMult
      return { ...b, score }
    })

    const priority = scored.filter(b => b.category === 'skill_learned' || b.category === 'failure_pattern')
    const rest = scored
      .filter(b => b.category !== 'skill_learned' && b.category !== 'failure_pattern')
      .sort((a, b) => b.score - a.score)
      .slice(0, 30 - priority.length)

    const selected = [...priority, ...rest]

    const grouped: Record<string, typeof selected> = {}
    for (const b of selected) {
      if (!grouped[b.category]) grouped[b.category] = []
      grouped[b.category].push(b)
    }

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

// Short-term window: the last few raw exchanges, separate from distilled beliefs.
export async function loadRecentContext(userId: string, slug: string): Promise<string> {
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

// CIV: keyword retrieval from the Company Intelligence Vault. Documents are
// UNTRUSTED — always cited, never asserted as the employee's own knowledge.
export async function loadVaultContext(
  userId: string,
  slug: string,
  currentMessages: { role: string; content: string }[]
): Promise<string> {
  try {
    const keywords = extractKeywords(currentMessages)
    if (keywords.size === 0) return ''

    const supabase = createAdminClient()

    const kwList = [...keywords].slice(0, 6)
    const ilikeFilter = kwList.map(kw => `content.ilike.%${kw}%`).join(',')

    const { data } = await supabase
      .from('company_documents')
      .select('source_name, source_type, content, chunk_index')
      .eq('user_id', userId)
      .or(`employee_slug.eq.${slug},employee_slug.is.null`)
      .or(ilikeFilter)
      .limit(8)

    if (!data || data.length === 0) return ''

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

// CEC: org-wide shared intelligence from a customer's OTHER AI employees.
// Marks entries consumed by this employee slug after loading.
export async function loadCortexContext(userId: string, slug: string): Promise<string> {
  try {
    const supabase = createAdminClient()

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

    const unconsumed = data.filter(e => !(e.consumed_by ?? []).includes(slug))
    if (unconsumed.length === 0) return ''

    const typeLabels: Record<string, string> = {
      org_decision: 'Org decision',
      customer_insight: 'Customer insight',
      market_signal: 'Market signal',
      process_change: 'Process change',
      product_update: 'Product update',
      team_context: 'Team context',
    }

    const items = unconsumed.slice(0, 6).map(e =>
      `[${typeLabels[e.entry_type] ?? e.entry_type} — via ${e.source_employee_slug}] ${e.title}: ${e.body}`
    )

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

// Combined loader for anything that just wants "everything the employee
// knows about this owner" in one call — used by the execute loop.
export async function loadEmployeeContext(
  userId: string,
  slug: string,
  currentMessages: { role: string; content: string }[]
): Promise<string> {
  const [wisdom, vault, cortex, recent] = await Promise.all([
    loadWisdom(userId, slug, currentMessages),
    loadVaultContext(userId, slug, currentMessages),
    loadCortexContext(userId, slug),
    loadRecentContext(userId, slug),
  ])
  return wisdom + vault + cortex + recent
}
