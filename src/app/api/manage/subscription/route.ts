import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET ?userId=&slug=
// Returns the subscription record for this user+employee.
// If no record exists, returns a synthetic "first-visit" record so the UI
// can still show the management hub (the hire form creates the record,
// but someone navigating directly also gets a sensible response).

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const slug   = searchParams.get('slug')

    if (!userId || !slug) {
      return NextResponse.json({ error: 'userId and slug required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data } = await supabase
      .from('hired_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('employee_slug', slug)
      .single()

    if (!data) {
      // No subscription yet — return a minimal stub so the page renders
      return NextResponse.json({
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
        monthly_price_cents: 4900,
        price_locked_at: new Date().toISOString(),
      })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[manage/subscription GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
