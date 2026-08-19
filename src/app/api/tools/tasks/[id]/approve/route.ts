// @ts-nocheck
// POST /api/tools/tasks/[id]/approve — approve or reject a pending approval gate
// After approval, the agentic loop must be resumed by the client via /execute

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const { user_id, decision, tool_use_id } = await req.json()

    if (!user_id || !decision || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json({ error: 'user_id and decision (approved|rejected) required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify task belongs to user
    const { data: task, error: taskErr } = await supabase
      .from('employee_tasks')
      .select('id, user_id, status, messages, employee_slug')
      .eq('id', taskId)
      .single()

    if (taskErr || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    if (task.user_id !== user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (task.status !== 'awaiting_approval') {
      return NextResponse.json({ error: `Task status is "${task.status}", not awaiting approval` }, { status: 409 })
    }

    // Update approval record
    await supabase
      .from('task_approvals')
      .update({ status: decision, decided_at: new Date().toISOString() })
      .eq('task_id', taskId)
      .eq('status', 'pending')

    if (decision === 'rejected') {
      await supabase
        .from('employee_tasks')
        .update({ status: 'paused', updated_at: new Date().toISOString() })
        .eq('id', taskId)

      return NextResponse.json({ ok: true, decision: 'rejected', message: 'Task paused. You can give new instructions.' })
    }

    // Approved — update status back to executing
    // The client must re-POST to /execute with task_id to resume the loop
    await supabase
      .from('employee_tasks')
      .update({ status: 'executing', updated_at: new Date().toISOString() })
      .eq('id', taskId)

    return NextResponse.json({
      ok: true,
      decision: 'approved',
      task_id: taskId,
      employee_slug: task.employee_slug,
      message: 'Approved. Resume the task by calling /execute with the task_id and approval_result.',
      resume: {
        tool_use_id,
        approved: true,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
