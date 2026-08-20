// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import DodoPayments from 'dodopayments'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Dodo sends raw JSON body; we must not parse it before signature verification
export const config = { api: { bodyParser: false } }

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    const dodo = new DodoPayments({
      bearerToken: process.env.DODO_API_KEY!,
      environment: (process.env.DODO_ENV ?? 'live_mode') as 'live_mode' | 'test_mode',
    })

    // Collect all headers as plain strings for verification
    const headers: Record<string, string> = {}
    req.headers.forEach((v, k) => { headers[k] = v })

    const webhookSecret = process.env.DODO_WEBHOOK_SECRET
    let event: any

    if (webhookSecret) {
      event = dodo.webhooks.unwrap(rawBody, { headers, key: webhookSecret })
    } else {
      // No secret configured — accept without verification (dev/testing only)
      event = dodo.webhooks.unsafeUnwrap(rawBody)
    }

    const type = event?.type as string | undefined

    if (type === 'payment.succeeded' || type === 'subscription.active') {
      const metadata = event?.data?.metadata ?? event?.data?.payment?.metadata ?? {}
      const user_id        = metadata.user_id
      const employee_slug  = metadata.employee_slug

      if (user_id && employee_slug) {
        const supabase = getSupabase()
        await supabase
          .from('hired_subscriptions')
          .update({
            status:     'active',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user_id)
          .eq('employee_slug', employee_slug)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[webhooks/dodo]', err)
    return NextResponse.json({ error: err.message ?? 'Webhook error' }, { status: 400 })
  }
}
