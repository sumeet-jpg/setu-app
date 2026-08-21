import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

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

    // Not found — user hasn't hired this employee
    if (!data) {
      return NextResponse.json({ status: null, _not_hired: true })
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

    // For resume: determine correct target status from the subscription record
    let newStatus: string
    if (action === 'cancel') {
      newStatus = 'cancelled'
    } else if (action === 'pause') {
      newStatus = 'paused'
    } else {
      // resume only un-pauses an already-paid subscription — it must never be
      // the path that grants 'active' for free. A cancelled or trial-expired
      // subscription has to go through real Dodo checkout (/api/checkout/dodo)
      // to become active again.
      const { data: current } = await supabase
        .from('hired_subscriptions')
        .select('status, trial_ends_at')
        .eq('user_id', userId)
        .eq('employee_slug', slug)
        .maybeSingle()

      if (current?.status !== 'paused') {
        return NextResponse.json(
          { error: 'Only a paused subscription can be resumed. Activate via checkout instead.' },
          { status: 400 }
        )
      }
      const trialStillValid = current?.trial_ends_at && new Date(current.trial_ends_at) > new Date()
      newStatus = trialStillValid ? 'trial' : 'active'
    }

    const updates: Record<string, unknown> = {
      status:     newStatus,
      updated_at: new Date().toISOString(),
    }
    if (action === 'cancel') {
      updates.cancelled_at = new Date().toISOString()
      if (reason) updates.cancel_reason = reason
    }

    const { data: updated, error } = await supabase
      .from('hired_subscriptions')
      .update(updates)
      .eq('user_id', userId)
      .eq('employee_slug', slug)
      .select('owner_name, owner_email, employee_name, monthly_price_cents')
      .maybeSingle()

    if (error) throw error

    // Send emails on cancel: admin alert + subscriber confirmation
    if (action === 'cancel' && process.env.RESEND_API_KEY) {
      try {
        const resend    = new Resend(process.env.RESEND_API_KEY)
        const adminEmail = process.env.ADMIN_ALERT_EMAIL ?? 'sumeet@setuagents.com'
        const from      = process.env.FROM_EMAIL ?? 'hello@setuagents.com'
        const base      = process.env.NEXT_PUBLIC_APP_URL ?? 'https://setuagents.com'
        const price     = updated?.monthly_price_cents ? Math.round(updated.monthly_price_cents / 100) : 49

        // Admin alert
        await resend.emails.send({
          from,
          to: adminEmail,
          subject: `⚠️ Cancellation: ${updated?.owner_name ?? 'A user'} cancelled ${updated?.employee_name ?? slug}`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:540px;margin:0 auto;padding:28px 20px">
              <h2 style="font-size:18px;font-weight:800;color:#111;margin:0 0 6px">Subscription cancelled</h2>
              <p style="color:#6b7280;font-size:14px;margin:0 0 20px">A user self-cancelled their subscription. This is worth a follow-up.</p>
              <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
                ${[
                  ['Name',      updated?.owner_name ?? '—'],
                  ['Email',     updated?.owner_email ?? '—'],
                  ['Employee',  updated?.employee_name ?? slug],
                  ['Rate',      `$${price}/mo (locked)`],
                  ['Reason',    reason || '(no reason given)'],
                ].map(([k, v]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#6b7280;width:100px">${k}</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:13px;color:#111">${v}</td></tr>`).join('')}
              </table>
              <a href="https://setuagents.com/admin/subscriptions" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;border-radius:9px;text-decoration:none;font-size:13px;font-weight:700">View in Admin →</a>
            </div>
          `,
        }).catch(() => {})

        // Subscriber confirmation
        if (updated?.owner_email) {
          const firstName = (updated.owner_name ?? '').split(' ')[0] || 'there'
          const empName   = updated.employee_name ?? slug
          await resend.emails.send({
            from,
            to: updated.owner_email,
            subject: `${empName} subscription cancelled`,
            html: `
              <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0B0D14;border-radius:16px;overflow:hidden">
                <div style="padding:32px">
                  <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">SETU · Cancellation confirmed</p>
                  <h2 style="font-size:20px;font-weight:800;color:#fff;margin:8px 0 16px;letter-spacing:-0.03em">
                    ${firstName}, your ${empName} subscription has been cancelled
                  </h2>
                  <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 16px">
                    Your subscription is now cancelled. You won't be billed going forward.
                  </p>
                  <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
                    If you change your mind, your locked rate of <strong style="color:#fff">$${price}/month</strong> is still available if you reactivate within 30 days. After that, you'll pay the then-current rate.
                  </p>
                  <a href="${base}/employees/${slug}/hire" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700">
                    Reactivate at $${price}/mo →
                  </a>
                  <p style="font-size:12px;color:#334155;margin:24px 0 0;line-height:1.6">Questions? Reply to this email.<br>Setu · setuagents.com</p>
                </div>
              </div>
            `,
          }).catch(() => {})
        }
      } catch { /* non-fatal */ }
    }

    // Pause confirmation email
    if (action === 'pause' && updated?.owner_email && process.env.RESEND_API_KEY) {
      try {
        const resend    = new Resend(process.env.RESEND_API_KEY)
        const from      = process.env.FROM_EMAIL ?? 'hello@setuagents.com'
        const base      = process.env.NEXT_PUBLIC_APP_URL ?? 'https://setuagents.com'
        const firstName = (updated.owner_name ?? '').split(' ')[0] || 'there'
        const empName   = updated.employee_name ?? slug
        const price     = updated.monthly_price_cents ? Math.round(updated.monthly_price_cents / 100) : 49

        await resend.emails.send({
          from,
          to: updated.owner_email,
          subject: `${empName} paused — your rate is still locked`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0B0D14;border-radius:16px;overflow:hidden">
              <div style="padding:32px">
                <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">SETU · Paused</p>
                <h2 style="font-size:20px;font-weight:800;color:#fff;margin:8px 0 16px;letter-spacing:-0.03em">
                  ${firstName}, ${empName} is paused
                </h2>
                <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 16px">
                  Your subscription is paused. You won't be billed while paused, and your locked rate of <strong style="color:#fff">$${price}/month</strong> is preserved — resume anytime and you pick up exactly where you left off.
                </p>
                <a href="${base}/manage/${slug}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700">
                  Resume ${empName} →
                </a>
                <p style="font-size:12px;color:#334155;margin:24px 0 0;line-height:1.6">Questions? Reply to this email.<br>Setu · setuagents.com</p>
              </div>
            </div>
          `,
        }).catch(() => {})
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({ ok: true, status: newStatus })
  } catch (err) {
    console.error('[manage/subscription PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
