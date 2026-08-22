import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET ?userId=
// Returns all hired_subscriptions for this userId with employee metadata.
// Scoped to non-PII columns only — this list renders on /my-employees for
// whoever holds the bare userId, same tradeoff as manage/subscription GET.
export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('hired_subscriptions')
      .select('id, employee_slug, employee_name, employee_title, status, trial_ends_at, activated_at, monthly_price_cents, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ subscriptions: data ?? [] })
  } catch (err) {
    console.error('[manage/my-employees GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
