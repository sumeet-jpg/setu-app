import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getEmployee } from '@/lib/employees/profiles'

// ─────────────────────────────────────────────────────────────────────────────
// /api/employees/pin — Proactive Intelligence Network
//
// GET  ?userId=&slug=&unreadOnly=true
//   Returns proactive briefs for this employee — unread by default.
//
// POST body: { action: 'seed' | 'check' | 'dismiss', userId, slug, briefId? }
//   seed   — seeds watch patterns from the employee's static profile (idempotent)
//   check  — evaluates all active patterns and creates briefs for triggered ones
//   dismiss — marks a brief as dismissed by the owner
// ─────────────────────────────────────────────────────────────────────────────

// ── Pattern evaluators ───────────────────────────────────────────────────────
// Each evaluator receives DB data and returns { triggered, title, body, urgency }
// or null if the pattern hasn't fired.

type BriefPayload = {
  title: string
  body: string
  urgency: 'low' | 'normal' | 'high' | 'critical'
  signal_data?: Record<string, unknown>
}

async function evalMemoryStaleness(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  slug: string
): Promise<BriefPayload | null> {
  const { data } = await supabase
    .from('distillation_runs')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('employee_slug', slug)
    .eq('status', 'complete')
    .order('completed_at', { ascending: false })
    .limit(1)

  const lastRun = data?.[0]
  if (!lastRun) return null  // never distilled — no signal yet

  const daysSince = (Date.now() - new Date(lastRun.completed_at).getTime()) / 86400000
  if (daysSince < 14) return null

  return {
    title: 'No new learning sessions in 2 weeks',
    body: `Your last deep conversation with me was ${Math.round(daysSince)} days ago. The more we work together, the better I understand your preferences and business context. Consider starting a session to keep my knowledge fresh.`,
    urgency: daysSince > 30 ? 'high' : 'normal',
    signal_data: { days_since_last_distillation: Math.round(daysSince) },
  }
}

async function evalBeliefConflicts(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  slug: string
): Promise<BriefPayload | null> {
  const { count } = await supabase
    .from('employee_beliefs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('employee_slug', slug)
    .not('conflict_with_id', 'is', null)

  if (!count || count < 2) return null

  return {
    title: `${count} conflicting beliefs need your review`,
    body: `I've encountered ${count} situations where new information contradicted what I previously understood. I've flagged them rather than overwriting — but you should review them to make sure my understanding stays accurate.`,
    urgency: count >= 5 ? 'high' : 'normal',
    signal_data: { conflict_count: count },
  }
}

async function evalConfidenceDrift(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  slug: string
): Promise<BriefPayload | null> {
  // Find high-value beliefs (originally high confidence) that have decayed below 0.4
  const { data } = await supabase
    .from('employee_beliefs')
    .select('subject, confidence, reinforcement_count')
    .eq('user_id', userId)
    .eq('employee_slug', slug)
    .lt('confidence', 0.4)
    .gt('reinforcement_count', 2)  // was reinforced multiple times — was once important
    .limit(5)

  if (!data || data.length === 0) return null

  const subjects = data.map(b => b.subject).slice(0, 3).join(', ')
  return {
    title: `${data.length} previously strong belief${data.length > 1 ? 's have' : ' has'} faded`,
    body: `Beliefs I once held with high confidence have decayed without recent reinforcement: ${subjects}. A session to revisit these topics would help me stay accurate.`,
    urgency: 'low',
    signal_data: { faded_subjects: data.map(b => b.subject) },
  }
}

async function evalVaultEmpty(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  slug: string
): Promise<BriefPayload | null> {
  // Only fire if there are already some beliefs (employee is being used)
  const { count: beliefCount } = await supabase
    .from('employee_beliefs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('employee_slug', slug)

  if (!beliefCount || beliefCount < 10) return null  // too early

  const { count: docCount } = await supabase
    .from('company_documents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .or(`employee_slug.eq.${slug},employee_slug.is.null`)

  if (docCount && docCount > 0) return null

  return {
    title: 'No company documents in my vault',
    body: `I can give much more accurate, company-specific answers when I have access to your SOPs, product documentation, playbooks, or org context. Uploading even one document makes a significant difference.`,
    urgency: 'normal',
    signal_data: { belief_count: beliefCount },
  }
}

const EVALUATORS = [
  { key: 'memory_staleness',       fn: evalMemoryStaleness },
  { key: 'belief_conflicts',       fn: evalBeliefConflicts },
  { key: 'confidence_drift',       fn: evalConfidenceDrift },
  { key: 'vault_empty',            fn: evalVaultEmpty },
]

// ── Seed watch patterns from static profile ──────────────────────────────────

async function seedWatchPatterns(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  slug: string
) {
  const employee = getEmployee(slug)
  if (!employee?.watchPatterns) return

  const rows = (employee.watchPatterns as string[]).map((pattern: string, i: number) => ({
    user_id:             userId,
    employee_slug:       slug,
    pattern_key:         `static_${i}`,
    pattern_label:       pattern.slice(0, 80),
    pattern_description: pattern,
    is_active:           true,
  }))

  // Upsert — idempotent re-seeds
  await supabase
    .from('employee_watch_patterns')
    .upsert(rows, { onConflict: 'user_id,employee_slug,pattern_key', ignoreDuplicates: true })

  // Also ensure the internal evaluator patterns are registered
  const internalRows = EVALUATORS.map(e => ({
    user_id:             userId,
    employee_slug:       slug,
    pattern_key:         e.key,
    pattern_label:       e.key.replace(/_/g, ' '),
    pattern_description: `Internal signal: ${e.key}`,
    is_active:           true,
  }))

  await supabase
    .from('employee_watch_patterns')
    .upsert(internalRows, { onConflict: 'user_id,employee_slug,pattern_key', ignoreDuplicates: true })
}

// ── Check patterns and create briefs ─────────────────────────────────────────

async function checkPatterns(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  slug: string
): Promise<number> {
  let created = 0

  for (const { key, fn } of EVALUATORS) {
    try {
      // Skip if a brief for this pattern was created in the last 7 days
      const { data: recentBrief } = await supabase
        .from('employee_proactive_briefs')
        .select('id')
        .eq('user_id', userId)
        .eq('employee_slug', slug)
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .ilike('title', `%${key.replace(/_/g, ' ').slice(0, 20)}%`)
        .limit(1)

      if (recentBrief && recentBrief.length > 0) continue

      const result = await fn(supabase, userId, slug)
      if (!result) continue

      // Get watch_pattern_id
      const { data: pattern } = await supabase
        .from('employee_watch_patterns')
        .select('id')
        .eq('user_id', userId)
        .eq('employee_slug', slug)
        .eq('pattern_key', key)
        .single()

      await supabase.from('employee_proactive_briefs').insert({
        user_id:          userId,
        employee_slug:    slug,
        watch_pattern_id: pattern?.id ?? null,
        title:            result.title,
        body:             result.body,
        urgency:          result.urgency,
        signal_data:      result.signal_data ?? {},
        delivered:        false,
      })

      // Update last_fired_at on the pattern
      if (pattern?.id) {
        await supabase.from('employee_watch_patterns').update({
          last_fired_at: new Date().toISOString(),
          fire_count:    supabase.rpc('increment_pattern_fire_count' as any, { pattern_id: pattern.id }),
          last_checked_at: new Date().toISOString(),
        }).eq('id', pattern.id)
      }

      created++
    } catch {
      // Non-fatal — one evaluator failing doesn't block the rest
    }
  }

  // Update last_checked_at on all patterns
  await supabase.from('employee_watch_patterns').update({
    last_checked_at: new Date().toISOString(),
  }).eq('user_id', userId).eq('employee_slug', slug)

  return created
}

// ── Route handlers ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId    = searchParams.get('userId')
    const slug      = searchParams.get('slug')
    const unreadOnly = searchParams.get('unreadOnly') !== 'false'
    const limit     = Math.min(20, parseInt(searchParams.get('limit') ?? '10'))

    if (!userId || !slug) {
      return NextResponse.json({ error: 'userId and slug required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    let query = supabase
      .from('employee_proactive_briefs')
      .select('id, title, body, urgency, signal_data, delivered, read_at, dismissed_at, created_at')
      .eq('user_id', userId)
      .eq('employee_slug', slug)
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) query = query.is('read_at', null)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ briefs: data ?? [] })
  } catch (err) {
    console.error('[pin GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, userId, slug, briefId } = await req.json()

    if (!userId || !slug) {
      return NextResponse.json({ error: 'userId and slug required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    if (action === 'seed') {
      await seedWatchPatterns(supabase, userId, slug)
      return NextResponse.json({ ok: true })
    }

    if (action === 'check') {
      const count = await checkPatterns(supabase, userId, slug)
      return NextResponse.json({ ok: true, briefs_created: count })
    }

    if (action === 'dismiss' && briefId) {
      await supabase.from('employee_proactive_briefs').update({
        dismissed_at: new Date().toISOString(),
      }).eq('id', briefId).eq('user_id', userId)
      return NextResponse.json({ ok: true })
    }

    if (action === 'read' && briefId) {
      await supabase.from('employee_proactive_briefs').update({
        read_at:   new Date().toISOString(),
        delivered: true,
      }).eq('id', briefId).eq('user_id', userId)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('[pin POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
