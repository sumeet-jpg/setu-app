import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET — fetch subscription for a userId + slug
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const slug   = searchParams.get('slug')

    if (!userId || !slug) {
      return NextResponse.json({ error: 'userId and slug required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('hired_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('employee_slug', slug)
      .maybeSingle()

    if (error) throw error

    // Return stub if not found (pre-migration or not yet hired)
    if (!data) {
      return NextResponse.json({
        user_id: userId,
        employee_slug: slug,
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
        monthly_price_cents: 4900,
        billing_months: 0,
        activated_at: null,
      })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[manage/subscription GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PATCH — self-service cancel or pause
// body: { userId, slug, action: 'cancel' | 'pause' | 'resume', reason? }
export async function PATCH(req: NextRequest) {
  try {
    const { userId, slug, action, reason } = await req.json()

    if (!userId || !slug || !action) {
      return NextResponse.json({ error: 'userId, slug, and action required' }, { status: 400 })
    }

    const VALID_ACTIONS = ['cancel', 'pause', 'resume']
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: `Invalid action — must be one of: ${VALID_ACTIONS.join(', ')}` }, { status: 400 })
    }

    const supabase = getSupabase()

    const statusMap: Record<string, string> = {
      cancel: 'cancelled',
      pause:  'paused',
      resume: 'trial',
    }
    const newStatus = statusMap[action]

    const updates: Record<string, unknown> = {
      status:     newStatus,
      updated_at: new Date().toISOString(),
    }
    if (action === 'cancel') {
      updates.cancelled_at = new Date().toISOString()
      if (reason) updates.cancel_reason = reason
    }

    const { error } = await supabase
      .from('hired_subscriptions')
      .update(updates)
      .eq('user_id', userId)
      .eq('employee_slug', slug)

    if (error) throw error

    return NextResponse.json({ ok: true, status: newStatus })
  } catch (err) {
    console.error('[manage/subscription PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
