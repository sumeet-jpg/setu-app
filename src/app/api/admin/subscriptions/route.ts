import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

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

    const { data: sub, error } = await supabase
      .from('hired_subscriptions')
      .update(updates)
      .eq('id', id)
      .select('owner_name, owner_email, employee_name, employee_slug, monthly_price_cents')
      .maybeSingle()

    if (error) throw error

    // Send activation email to the subscriber
    if (status === 'active' && sub?.owner_email && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const from  = process.env.FROM_EMAIL ?? 'hello@setuagents.com'
        const base  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://setuagents.com'
        const price = sub.monthly_price_cents ? Math.round(sub.monthly_price_cents / 100) : 49
        const name  = (sub.owner_name ?? '').split(' ')[0] || 'there'

        await resend.emails.send({
          from,
          to: sub.owner_email,
          subject: `${sub.employee_name ?? 'Your AI Employee'} is now active — Setu`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
              <h2 style="font-size:22px;font-weight:800;color:#111;margin:0 0 8px">You're live, ${name} 🎉</h2>
              <p style="color:#6b7280;font-size:14px;margin:0 0 20px;line-height:1.7">
                <strong style="color:#111">${sub.employee_name ?? 'Your AI Employee'}</strong> is now fully active at your locked rate of
                <strong style="color:#111">$${price}/month</strong>.
                That rate is yours permanently — no surprises.
              </p>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px">
                <div style="font-size:13px;font-weight:700;color:#166534;margin-bottom:4px">Subscription active</div>
                <div style="font-size:13px;color:#166534">$${price}/month · billed monthly · cancel anytime</div>
              </div>
              <a href="${base}/manage/${sub.employee_slug}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700">
                Open manage hub →
              </a>
              <p style="font-size:12px;color:#9ca3af;margin-top:24px;line-height:1.6">
                Questions? Reply to this email.<br>
                Setu · setuagents.com
              </p>
            </div>
          `,
        }).catch(() => {})
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/subscriptions PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
