// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// /api/employees/actions â€” S6 Action Layer
//
// GET  ?userId=&slug=&status=pending&limit=20
//   Returns action proposals, filtered by status (default: all non-failed).
//
// POST body: { userId, slug, sessionId, actionType, title, description, payload? }
//   Employee proposes an action. Status starts at 'pending'.
//   Creates an audit log entry.
//
// PATCH body: { userId, actionId, decision: 'approve'|'reject', rejectionReason? }
//   Owner approves or rejects. Updates status and timestamps.
//   Approval = status â†’ 'approved'. Employee is responsible for execution.
//   The execution layer (S6b) will call PATCH again with { decision: 'done'|'failed', result? }.
//
// DELETE body: { userId, actionId }
//   Hard-deletes a pending action (owner clears noise).
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// The canonical action type registry â€” what employees are allowed to propose.
// Each type defines the trust level and what payload fields are expected.
export const ACTION_TYPES = {
  draft_document: {
    label:       'Draft Document',
    description: 'Prepare a written document, email draft, or template for owner review',
    trust_level: 'low',       // no external side effects
    payload_fields: ['content', 'format', 'recipient'],
  },
  create_task: {
    label:       'Create Task',
    description: 'Add a task or reminder to a project tracker',
    trust_level: 'low',
    payload_fields: ['task_title', 'due_date', 'priority', 'project'],
  },
  send_email: {
    label:       'Send Email',
    description: 'Send an email to a contact on behalf of the owner',
    trust_level: 'high',      // external side effect â€” always requires approval
    payload_fields: ['to', 'subject', 'body', 'cc'],
  },
  schedule_meeting: {
    label:       'Schedule Meeting',
    description: 'Create a calendar event or send a meeting invite',
    trust_level: 'medium',
    payload_fields: ['title', 'attendees', 'datetime', 'duration_minutes', 'location'],
  },
  external_api: {
    label:       'External API Call',
    description: 'Make a call to an external service or tool',
    trust_level: 'high',
    payload_fields: ['service', 'endpoint', 'params'],
  },
  update_record: {
    label:       'Update Record',
    description: 'Modify a CRM record, spreadsheet cell, or database entry',
    trust_level: 'medium',
    payload_fields: ['system', 'record_id', 'field', 'new_value'],
  },
}

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'executing', 'done', 'failed'] as const

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const slug   = searchParams.get('slug')
    const status = searchParams.get('status')   // 'pending' | 'approved' | 'all'
    const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const supabase = createAdminClient()

    let query = supabase
      .from('employee_actions')
      .select('id, employee_slug, action_type, title, description, payload, status, proposed_at, approved_at, rejected_at, rejection_reason, executed_at, result, error, created_at')
      .eq('user_id', userId)
      .order('proposed_at', { ascending: false })
      .limit(limit)

    if (slug) query = query.eq('employee_slug', slug)

    if (status === 'pending') {
      query = query.eq('status', 'pending')
    } else if (status && VALID_STATUSES.includes(status as any)) {
      query = query.eq('status', status)
    } else if (status !== 'all') {
      // Default: exclude failed (noise) â€” show actionable + recent history
      query = query.neq('status', 'failed')
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Annotate with action type metadata
    const annotated = (data ?? []).map(action => ({
      ...action,
      type_meta: ACTION_TYPES[action.action_type as keyof typeof ACTION_TYPES] ?? null,
    }))

    return NextResponse.json({ actions: annotated, total: annotated.length })
  } catch (err) {
    console.error('[actions GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, slug, sessionId, actionType, title, description, payload } = await req.json()

    if (!userId || !slug || !actionType || !title || !description) {
      return NextResponse.json({ error: 'userId, slug, actionType, title, description required' }, { status: 400 })
    }

    if (!ACTION_TYPES[actionType as keyof typeof ACTION_TYPES]) {
      return NextResponse.json({
        error: `Invalid actionType. Must be one of: ${Object.keys(ACTION_TYPES).join(', ')}`
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('employee_actions')
      .insert({
        user_id:      userId,
        employee_slug: slug,
        session_id:   sessionId ?? null,
        action_type:  actionType,
        title:        title.slice(0, 200),
        description:  description.slice(0, 1000),
        payload:      payload ?? {},
        status:       'pending',
        proposed_at:  new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Audit log
    await supabase.from('employee_action_log').insert({
      action_id: data!.id,
      user_id:   userId,
      event:     'proposed',
      note:      `Proposed by ${slug}`,
    }).catch(() => {})

    return NextResponse.json({ ok: true, id: data!.id })
  } catch (err) {
    console.error('[actions POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, actionId, decision, rejectionReason, result, error: execError } = await req.json()

    if (!userId || !actionId || !decision) {
      return NextResponse.json({ error: 'userId, actionId, decision required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('employee_actions')
      .select('id, status, employee_slug')
      .eq('id', actionId)
      .eq('user_id', userId)
      .single()

    if (!existing) return NextResponse.json({ error: 'Action not found' }, { status: 404 })

    const now = new Date().toISOString()
    let update: Record<string, unknown> = { updated_at: now }
    let logEvent: string

    if (decision === 'approve') {
      if (existing.status !== 'pending') {
        return NextResponse.json({ error: `Action is already ${existing.status}` }, { status: 409 })
      }
      update = { ...update, status: 'approved', approved_at: now }
      logEvent = 'approved'
    } else if (decision === 'reject') {
      if (existing.status !== 'pending') {
        return NextResponse.json({ error: `Action is already ${existing.status}` }, { status: 409 })
      }
      update = { ...update, status: 'rejected', rejected_at: now, rejection_reason: rejectionReason ?? null }
      logEvent = 'rejected'
    } else if (decision === 'done') {
      update = { ...update, status: 'done', executed_at: now, result: result ?? null }
      logEvent = 'done'
    } else if (decision === 'failed') {
      update = { ...update, status: 'failed', executed_at: now, error: execError ?? 'Unknown error' }
      logEvent = 'failed'
    } else {
      return NextResponse.json({ error: 'decision must be approve | reject | done | failed' }, { status: 400 })
    }

    const { error: updateErr } = await supabase
      .from('employee_actions')
      .update(update)
      .eq('id', actionId)
      .eq('user_id', userId)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    await supabase.from('employee_action_log').insert({
      action_id: actionId,
      user_id:   userId,
      event:     logEvent,
      note:      decision === 'reject' ? (rejectionReason ?? null) : null,
    }).catch(() => {})

    // S7: Recalibrate trust score after every owner decision (fire-and-forget)
    if (decision === 'approve' || decision === 'reject') {
      supabase.rpc('recalibrate_employee' as any, {
        p_user_id: userId,
        p_slug:    existing.employee_slug,
      }).then(() => {}).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[actions PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, actionId } = await req.json()
    if (!userId || !actionId) {
      return NextResponse.json({ error: 'userId and actionId required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('employee_actions')
      .delete()
      .eq('id', actionId)
      .eq('user_id', userId)
      .eq('status', 'pending')  // only pending actions can be hard-deleted

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[actions DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
