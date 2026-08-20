import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/governance/admin-guard'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/subscriptions?status=trial|active|paused|cancelled
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('hired_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ subscriptions: data ?? [] })
  } catch (err) {
    console.error('[admin/subscriptions GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PATCH /api/admin/subscriptions — admin status override
// body: { id, status }
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id, status } = await req.json()

    const VALID = ['trial', 'active', 'paused', 'cancelled']
    if (!id || !status || !VALID.includes(status)) {
      return NextResponse.json({ error: 'id and valid status required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (status === 'active') {
      updates.activated_at = new Date().toISOString()
    }
    if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString()
      updates.cancel_reason = 'admin_override'
    }

    const { error } = await supabase
      .from('hired_subscriptions')
      .update(updates)
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ ok: true, status })
  } catch (err) {
    console.error('[admin/subscriptions PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
