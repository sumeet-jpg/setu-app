// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import DodoPayments from 'dodopayments'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, employee_slug } = await req.json()

    if (!user_id || !employee_slug) {
      return NextResponse.json({ error: 'user_id and employee_slug required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: sub, error } = await supabase
      .from('hired_subscriptions')
      .select('owner_name, owner_email, monthly_price_cents, status')
      .eq('user_id', user_id)
      .eq('employee_slug', employee_slug)
      .maybeSingle()

    if (error || !sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    if (sub.status === 'active') {
      return NextResponse.json({ error: 'Already active' }, { status: 409 })
    }

    const dodo = new DodoPayments({
      bearerToken: process.env.DODO_API_KEY!,
      environment: (process.env.DODO_ENV ?? 'live_mode') as 'live_mode' | 'test_mode',
    })

    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://setuagents.com'

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: process.env.DODO_PRODUCT_ID!, quantity: 1 }],
      customer: {
        email: sub.owner_email,
        name:  sub.owner_name,
      },
      return_url: `${base}/manage/${employee_slug}?uid=${user_id}&paid=1`,
      cancel_url: `${base}/manage/${employee_slug}?uid=${user_id}`,
      metadata: {
        user_id,
        employee_slug,
        monthly_price_cents: String(sub.monthly_price_cents ?? 4900),
      },
    })

    return NextResponse.json({ checkout_url: session.checkout_url })
  } catch (err: any) {
    console.error('[checkout/dodo]', err)
    return NextResponse.json({ error: err.message ?? 'Checkout failed' }, { status: 500 })
  }
}
