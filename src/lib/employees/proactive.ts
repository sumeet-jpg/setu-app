// @ts-nocheck
// ── Setu Proactive Intelligence Network (PIN) ───────────────────────────────
// Shared between /api/employees/pin (the per-employee UI: seed/check/dismiss)
// and /api/cron/pin-check (the scheduled sweep across every real customer).
//
// This used to only run as a side effect of someone opening an interview
// chat — a hired employee with a customer who hadn't talked to it in weeks
// generated zero briefs, because nothing was ever there to trigger a check.
// "Proactive" only worked if the owner proactively showed up first. The
// cron closes that gap for the built-in evaluators below.
//
// Real caveat, worth keeping in view: these four evaluators are all about
// the EMPLOYEE'S OWN state (memory staleness, belief conflicts, confidence
// decay, empty vault) — they nudge the owner to keep feeding it context.
// None of them watch the outside world. Each employee profile also carries
// a static `watchPatterns` list (e.g. "watches competitor pricing changes")
// that gets seeded into `employee_watch_patterns` but has no evaluator
// wired to it at all — there's no real signal source for those yet. That's
// a separate, larger project (real data feeds per pattern type), not
// something this file pretends to solve.

import { createAdminClient } from '@/lib/supabase/server'
import { getEmployee } from '@/lib/employees/profiles'

type BriefPayload = {
  title: string
  body: string
  urgency: 'low' | 'normal' | 'high' | 'critical'
  signal_data?: Record<string, unknown>
}

type Supa = ReturnType<typeof createAdminClient>

async function evalMemoryStaleness(supabase: Supa, userId: string, slug: string): Promise<BriefPayload | null> {
  const { data } = await supabase
    .from('distillation_runs')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('employee_slug', slug)
    .eq('status', 'complete')
    .order('completed_at', { ascending: false })
    .limit(1)

  const lastRun = data?.[0]
  if (!lastRun) return null

  const daysSince = (Date.now() - new Date(lastRun.completed_at).getTime()) / 86400000
  if (daysSince < 14) return null

  return {
    title: 'No new learning sessions in 2 weeks',
    body: `Your last deep conversation with me was ${Math.round(daysSince)} days ago. The more we work together, the better I understand your preferences and business context. Consider starting a session to keep my knowledge fresh.`,
    urgency: daysSince > 30 ? 'high' : 'normal',
    signal_data: { days_since_last_distillation: Math.round(daysSince) },
  }
}

async function evalBeliefConflicts(supabase: Supa, userId: string, slug: string): Promise<BriefPayload | null> {
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

async function evalConfidenceDrift(supabase: Supa, userId: string, slug: string): Promise<BriefPayload | null> {
  const { data } = await supabase
    .from('employee_beliefs')
    .select('subject, confidence, reinforcement_count')
    .eq('user_id', userId)
    .eq('employee_slug', slug)
    .lt('confidence', 0.4)
    .gt('reinforcement_count', 2)
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

async function evalVaultEmpty(supabase: Supa, userId: string, slug: string): Promise<BriefPayload | null> {
  const { count: beliefCount } = await supabase
    .from('employee_beliefs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('employee_slug', slug)

  if (!beliefCount || beliefCount < 10) return null

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

export const EVALUATORS = [
  { key: 'memory_staleness', fn: evalMemoryStaleness },
  { key: 'belief_conflicts', fn: evalBeliefConflicts },
  { key: 'confidence_drift', fn: evalConfidenceDrift },
  { key: 'vault_empty', fn: evalVaultEmpty },
]

export async function seedWatchPatterns(supabase: Supa, userId: string, slug: string) {
  const employee = getEmployee(slug)
  if (!employee?.watchPatterns) return

  const rows = (employee.watchPatterns as string[]).map((pattern: string, i: number) => ({
    user_id: userId,
    employee_slug: slug,
    pattern_key: `static_${i}`,
    pattern_label: pattern.slice(0, 80),
    pattern_description: pattern,
    is_active: true,
  }))

  await supabase
    .from('employee_watch_patterns')
    .upsert(rows, { onConflict: 'user_id,employee_slug,pattern_key', ignoreDuplicates: true })

  const internalRows = EVALUATORS.map(e => ({
    user_id: userId,
    employee_slug: slug,
    pattern_key: e.key,
    pattern_label: e.key.replace(/_/g, ' '),
    pattern_description: `Internal signal: ${e.key}`,
    is_active: true,
  }))

  await supabase
    .from('employee_watch_patterns')
    .upsert(internalRows, { onConflict: 'user_id,employee_slug,pattern_key', ignoreDuplicates: true })
}

export async function checkPatterns(supabase: Supa, userId: string, slug: string): Promise<number> {
  let created = 0

  for (const { key, fn } of EVALUATORS) {
    try {
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

      const { data: pattern } = await supabase
        .from('employee_watch_patterns')
        .select('id')
        .eq('user_id', userId)
        .eq('employee_slug', slug)
        .eq('pattern_key', key)
        .single()

      await supabase.from('employee_proactive_briefs').insert({
        user_id: userId,
        employee_slug: slug,
        watch_pattern_id: pattern?.id ?? null,
        title: result.title,
        body: result.body,
        urgency: result.urgency,
        signal_data: result.signal_data ?? {},
        delivered: false,
      })

      if (pattern?.id) {
        // Awaited and separate from the update below — passing the rpc()
        // call's builder object directly as a field value here never
        // actually incremented fire_count; the RPC also didn't exist
        // anywhere in the migrations until 021. See its note for detail.
        // .catch() chained directly on the query builder isn't a real
        // function here — it threw and crashed this whole check every time
        // a pattern actually fired, instead of the "best-effort" behavior
        // intended.
        try {
          await supabase.rpc('increment_pattern_fire_count' as any, { pattern_id: pattern.id })
        } catch { /* non-fatal */ }

        await supabase.from('employee_watch_patterns').update({
          last_fired_at: new Date().toISOString(),
          last_checked_at: new Date().toISOString(),
        }).eq('id', pattern.id)
      }

      created++
    } catch {
      // Non-fatal — one evaluator failing doesn't block the rest
    }
  }

  await supabase.from('employee_watch_patterns').update({
    last_checked_at: new Date().toISOString(),
  }).eq('user_id', userId).eq('employee_slug', slug)

  return created
}
