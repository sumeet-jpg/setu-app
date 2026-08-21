// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { withManageAuth } from '@/lib/manage-token'

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// /api/employees/beliefs/timeline
// Exposes the bitemporal CKG as a visible timeline.
//
// GET ?slug=&userId=&limit=
//   Returns belief change events in reverse chronological order:
//   new beliefs, reinforcements, confidence changes, conflicts flagged.
//   Used by the Owner Memory Panel to show "what your employee learned".
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function GET(req: NextRequest) {
  return withManageAuth(req, async (userId) => getTimeline(userId, req))
}

async function getTimeline(userId: string, req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const slug   = searchParams.get('slug')
    const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '30'))

    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Recent beliefs â€” ordered by ingestion_time (when we learned it, not when it happened)
    const { data: beliefs, error } = await supabase
      .from('employee_beliefs')
      .select(`
        id, category, subject, belief, confidence, reinforcement_count,
        event_time, ingestion_time, last_validated_at,
        supersedes_id, conflict_with_id, conflict_note,
        distillation_run_id, created_at
      `)
      .eq('user_id', userId)
      .eq('employee_slug', slug)
      .order('ingestion_time', { ascending: false })
      .limit(limit)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Distillation runs in the same window, for timeline interleaving
    const { data: runs } = await supabase
      .from('distillation_runs')
      .select('id, status, summary, beliefs_created, beliefs_updated, skill_beliefs_extracted, raw_message_count, completed_at')
      .eq('user_id', userId)
      .eq('employee_slug', slug)
      .eq('status', 'complete')
      .order('completed_at', { ascending: false })
      .limit(10)

    // Build a merged timeline of belief events + distillation sessions
    type TimelineEvent =
      | { type: 'belief_new';        at: string; belief: typeof beliefs[0] }
      | { type: 'belief_conflict';   at: string; belief: typeof beliefs[0] }
      | { type: 'distill_session';   at: string; run: typeof runs[0] }

    const events: TimelineEvent[] = []

    for (const b of beliefs ?? []) {
      if (b.conflict_with_id) {
        events.push({ type: 'belief_conflict', at: b.ingestion_time ?? b.created_at, belief: b })
      } else {
        events.push({ type: 'belief_new', at: b.ingestion_time ?? b.created_at, belief: b })
      }
    }

    for (const run of runs ?? []) {
      if (run.completed_at) {
        events.push({ type: 'distill_session', at: run.completed_at, run })
      }
    }

    events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

    return NextResponse.json({ timeline: events.slice(0, limit) })
  } catch (err) {
    console.error('[beliefs/timeline]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
