import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────────────────────────────────
// /api/employees/calibration — S7 Calibration Engine
//
// GET  ?userId=&slug=
//   Returns the current calibration state for one or all employees.
//   Includes: autonomy_level, trust_score, approval_rate, action counts,
//   autonomy label, and the full action audit trail.
//
// POST body: { userId, slug, action: 'recalibrate' | 'set_autonomy' | 'rate_outcome' | 'reset' }
//   recalibrate  — recalculate trust score and nudge autonomy from action history
//   set_autonomy — owner pins the autonomy dial (0.0–1.0)
//   rate_outcome — owner rates the quality of a completed action
//   reset        — clear the owner override so system resumes self-management
// ─────────────────────────────────────────────────────────────────────────────

// Map autonomy_level (0–1) to a human label
function autonomyLabel(level: number): string {
  if (level < 0.2) return 'Supervised'
  if (level < 0.4) return 'Guided'
  if (level < 0.6) return 'Collaborative'
  if (level < 0.8) return 'Trusted'
  return 'Autonomous'
}

// Map trust_score to a color
function trustColor(score: number): string {
  if (score >= 0.75) return '#22c55e'
  if (score >= 0.5)  return '#6366f1'
  if (score >= 0.3)  return '#f59e0b'
  return '#ef4444'
}

// What the autonomy level means for each action type's default behavior
function autonomyPolicy(level: number) {
  return {
    draft_document:   level >= 0.3 ? 'can propose freely' : 'propose with justification',
    create_task:      level >= 0.3 ? 'can propose freely' : 'propose with justification',
    send_email:       level >= 0.8 ? 'can propose, owner reviews text' : 'always requires explicit approval',
    schedule_meeting: level >= 0.6 ? 'can propose, fast-track approval' : 'requires approval',
    update_record:    level >= 0.7 ? 'can propose, fast-track approval' : 'requires approval',
    external_api:     level >= 0.9 ? 'can propose with full context' : 'always requires explicit approval',
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const slug   = searchParams.get('slug')
    const withHistory = searchParams.get('history') === 'true'

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const supabase = createAdminClient()

    let calQuery = supabase
      .from('employee_calibration')
      .select('*')
      .eq('user_id', userId)
      .order('trust_score', { ascending: false })

    if (slug) calQuery = calQuery.eq('employee_slug', slug)

    const { data: calRows, error } = await calQuery
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // If no record exists yet for this employee, return a default
    const rows = calRows && calRows.length > 0 ? calRows : (slug ? [{
      user_id: userId, employee_slug: slug,
      autonomy_level: 0.3, trust_score: 0.5, owner_override: null,
      total_proposals: 0, total_approved: 0, total_rejected: 0, total_done: 0, total_failed: 0,
      last_recalibrated: null,
    }] : [])

    const annotated = rows.map(row => ({
      ...row,
      autonomy_label:  autonomyLabel(row.autonomy_level),
      trust_color:     trustColor(row.trust_score),
      approval_rate:   row.total_proposals > 0
        ? Math.round((row.total_approved / row.total_proposals) * 100)
        : null,
      system_managed:  row.owner_override == null,
      policy:          autonomyPolicy(row.autonomy_level),
    }))

    // Action audit trail for single-employee view
    let auditTrail: any[] = []
    if (slug && withHistory) {
      const { data: actions } = await supabase
        .from('employee_actions')
        .select('id, action_type, title, status, proposed_at, approved_at, rejected_at, executed_at, rejection_reason, result')
        .eq('user_id', userId)
        .eq('employee_slug', slug)
        .order('proposed_at', { ascending: false })
        .limit(30)

      auditTrail = actions ?? []
    }

    return NextResponse.json({
      calibration: slug ? (annotated[0] ?? null) : annotated,
      audit_trail: auditTrail,
    })
  } catch (err) {
    console.error('[calibration GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, slug, action } = body

    if (!userId || !slug || !action) {
      return NextResponse.json({ error: 'userId, slug, action required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // ── recalibrate ──────────────────────────────────────────────────────────
    if (action === 'recalibrate') {
      const { data, error } = await supabase.rpc('recalibrate_employee' as any, {
        p_user_id: userId,
        p_slug:    slug,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      const row = Array.isArray(data) ? data[0] : data
      return NextResponse.json({
        ok: true,
        autonomy_level: row?.autonomy_level ?? 0.3,
        trust_score:    row?.trust_score    ?? 0.5,
        approval_rate:  row?.approval_rate  ?? null,
        autonomy_label: autonomyLabel(row?.autonomy_level ?? 0.3),
      })
    }

    // ── set_autonomy (owner pins the dial) ───────────────────────────────────
    if (action === 'set_autonomy') {
      const { level } = body
      if (typeof level !== 'number' || level < 0 || level > 1) {
        return NextResponse.json({ error: 'level must be 0.0–1.0' }, { status: 400 })
      }
      const { error } = await supabase
        .from('employee_calibration')
        .upsert({
          user_id:        userId,
          employee_slug:  slug,
          owner_override: level,
          autonomy_level: level,
          updated_at:     new Date().toISOString(),
        }, { onConflict: 'user_id,employee_slug' })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, autonomy_level: level, autonomy_label: autonomyLabel(level) })
    }

    // ── reset (remove owner override, return to system management) ───────────
    if (action === 'reset') {
      const { error } = await supabase
        .from('employee_calibration')
        .update({ owner_override: null, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('employee_slug', slug)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, system_managed: true })
    }

    // ── rate_outcome ─────────────────────────────────────────────────────────
    if (action === 'rate_outcome') {
      const { actionId, score, note } = body
      if (!actionId || typeof score !== 'number' || score < 0 || score > 1) {
        return NextResponse.json({ error: 'actionId and score (0–1) required' }, { status: 400 })
      }

      // Verify the action belongs to this user/slug
      const { data: act } = await supabase
        .from('employee_actions')
        .select('id, status')
        .eq('id', actionId)
        .eq('user_id', userId)
        .eq('employee_slug', slug)
        .single()

      if (!act) return NextResponse.json({ error: 'Action not found' }, { status: 404 })
      if (!['done', 'failed'].includes(act.status)) {
        return NextResponse.json({ error: 'Can only rate completed actions' }, { status: 409 })
      }

      // Upsert outcome rating (one rating per action)
      const { error: rateErr } = await supabase
        .from('action_outcomes')
        .upsert({
          action_id:     actionId,
          user_id:       userId,
          employee_slug: slug,
          outcome_score: score,
          note:          note ?? null,
          rated_at:      new Date().toISOString(),
        }, { onConflict: 'action_id' })

      if (rateErr) return NextResponse.json({ error: rateErr.message }, { status: 500 })

      // Trigger recalibration after a rating
      await supabase.rpc('recalibrate_employee' as any, { p_user_id: userId, p_slug: slug }).catch(() => {})

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[calibration POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
