// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import DodoPayments from 'dodopayments'
import { createClient } from '@supabase/supabase-js'
import { withManageAuth } from '@/lib/manage-token'
import { tierProductEnvVar, BASE_PRICE_CENTS } from '@/lib/pricing/tiers'

export const runtime = 'nodejs'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Previously trusted a bare client-supplied user_id — no harm from creating
// a checkout session itself (someone still has to pay), but the 404-vs-409
// response gave an unauthenticated oracle for guessing valid user_id +
// employee_slug pairs and their activation status. Now requires a verified
// manage-token, same as every other route touching a specific subscription.
export async function POST(req: NextRequest) {
  return withManageAuth(req, async (user_id) => createCheckout(user_id, req))
}

async function createCheckout(user_id: string, req: NextRequest): Promise<NextResponse> {
  try {
    const { employee_slug } = await req.json()

    if (!employee_slug) {
      return NextResponse.json({ error: 'employee_slug required' }, { status: 400 })
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

    // Dodo has no per-subscription price override on checkout — the locked
    // price previously rode along as metadata only and was never actually
    // charged; the real charge was whatever DODO_PRODUCT_ID's dashboard price
    // was. Each tier now needs its own real Dodo product; pick the one that
    // matches this subscription's locked price. Falls back to the base
    // product (never blocks a sale) but logs loudly so a missing tier
    // product gets noticed before the next price step-up date.
    const lockedPriceCents = sub.monthly_price_cents ?? BASE_PRICE_CENTS
    const tierEnvVar = tierProductEnvVar(lockedPriceCents)
    let productId = process.env[tierEnvVar]
    if (!productId) {
      console.error(`[checkout/dodo] Missing ${tierEnvVar} for locked price ${lockedPriceCents}¢ — falling back to base product. Customer will be charged the base tier price, not their locked rate. Set this env var before the next price step-up.`)
      productId = process.env.DODO_PRODUCT_ID
    }
    if (!productId) {
      return NextResponse.json({ error: 'Checkout is not configured. Please contact support.' }, { status: 503 })
    }

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
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
