// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// /api/employees/beliefs
// Owner Memory Panel API â€” read, correct, or delete what an employee believes.
//
// GET  ?slug=&userId=&category=&limit=&offset=
//   Returns beliefs grouped by category, ordered by confidence desc.
//   Also returns the last 5 distillation runs for this employee.
//
// DELETE  body: { userId, beliefId }
//   Owner removes an incorrect belief. Hard delete â€” irreversible.
//
// PATCH  body: { userId, beliefId, confidence?, note? }
//   Owner overrides confidence or adds a correction note.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CATEGORY_LABELS: Record<string, string> = {
  owner_preference:  'Your preferences & working style',
  business_context:  'Business context',
  decision:          'Decisions made',
  relationship:      'Relationship context',
  market_signal:     'Market signals',
  failure_pattern:   'What hasn\'t worked',
  success_pattern:   'What has worked',
  domain_update:     'Domain updates',
  skill_learned:     'Learned skills & procedures',
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug   = searchParams.get('slug')
    const userId = searchParams.get('userId')
    const category = searchParams.get('category') ?? undefined
    const limit  = Math.min(200, parseInt(searchParams.get('limit') ?? '100'))
    const offset = parseInt(searchParams.get('offset') ?? '0')

    if (!slug || !userId) {
      return NextResponse.json({ error: 'slug and userId required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    let query = supabase
      .from('employee_beliefs')
      .select(`
        id, category, subject, belief, confidence, evidence,
        event_time, last_validated_at, reinforcement_count, decay_rate,
        conflict_with_id, conflict_note, supersedes_id,
        session_id, created_at
      `)
      .eq('user_id', userId)
      .eq('employee_slug', slug)
      .order('confidence', { ascending: false })
      .order('last_validated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) query = query.eq('category', category)

    const { data: beliefs, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Group by category
    const grouped: Record<string, { label: string; beliefs: typeof beliefs }> = {}
    for (const b of beliefs ?? []) {
      if (!grouped[b.category]) {
        grouped[b.category] = {
          label: CATEGORY_LABELS[b.category] ?? b.category,
          beliefs: [],
        }
      }
      grouped[b.category].beliefs.push(b)
    }

    // Last 5 distillation runs
    const { data: runs } = await supabase
      .from('distillation_runs')
      .select('id, status, summary, beliefs_created, beliefs_updated, beliefs_conflicted, skill_beliefs_extracted, raw_message_count, completed_at, created_at')
      .eq('user_id', userId)
      .eq('employee_slug', slug)
      .order('created_at', { ascending: false })
      .limit(5)

    // Totals
    const totalBeliefs = beliefs?.length ?? 0
    const conflicts    = beliefs?.filter(b => b.conflict_with_id).length ?? 0
    const stale        = beliefs?.filter(b => {
      const days = (Date.now() - new Date(b.last_validated_at).getTime()) / 86400000
      return days > 30
    }).length ?? 0

    return NextResponse.json({
      slug,
      total_beliefs: totalBeliefs,
      conflicts,
      stale,
      grouped,
      category_order: Object.keys(CATEGORY_LABELS),
      recent_runs: runs ?? [],
    })
  } catch (err) {
    console.error('[beliefs GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, beliefId } = await req.json()
    if (!userId || !beliefId) {
      return NextResponse.json({ error: 'userId and beliefId required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify ownership before delete
    const { data: belief } = await supabase
      .from('employee_beliefs')
      .select('id, user_id')
      .eq('id', beliefId)
      .eq('user_id', userId)
      .single()

    if (!belief) {
      return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 })
    }

    const { error } = await supabase
      .from('employee_beliefs')
      .delete()
      .eq('id', beliefId)
      .eq('user_id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[beliefs DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, beliefId, confidence, note } = await req.json()
    if (!userId || !beliefId) {
      return NextResponse.json({ error: 'userId and beliefId required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (typeof confidence === 'number') {
      updates.confidence = Math.max(0, Math.min(1, confidence))
      updates.last_validated_at = new Date().toISOString()
    }
    if (note !== undefined) {
      updates.conflict_note = note
    }

    const { error } = await supabase
      .from('employee_beliefs')
      .update(updates)
      .eq('id', beliefId)
      .eq('user_id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[beliefs PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
