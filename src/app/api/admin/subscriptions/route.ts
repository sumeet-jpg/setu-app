import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET — list all subscriptions (admin only, no auth check in MVP)
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const status = new URL(req.url).searchParams.get('status')

    let query = supabase
      .from('hired_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ subscriptions: data ?? [] })
  } catch (err) {
    console.error('[admin/subscriptions GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PATCH — update subscription status
// body: { id, status: 'trial' | 'active' | 'paused' | 'cancelled', notes? }
export async function PATCH(req: NextRequest) {
  try {
    const { id, status, notes } = await req.json()
    if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

    const supabase = createAdminClient()
    const updates: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (status === 'active') updates.activated_at = new Date().toISOString()
    if (status === 'cancelled') updates.cancelled_at = new Date().toISOString()
    if (notes !== undefined) updates.cancel_reason = notes

    const { error } = await supabase
      .from('hired_subscriptions')
      .update(updates)
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/subscriptions PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
