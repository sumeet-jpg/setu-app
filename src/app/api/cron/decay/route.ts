import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

// ─────────────────────────────────────────────────────────────────────────────
// /api/cron/decay — Ebbinghaus belief decay
//
// Called weekly via Vercel Cron (vercel.json) or any external cron.
// Applies decay_rate to beliefs not validated in > 7 days.
// Secured by CRON_SECRET.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('apply_belief_decay')

    if (error) {
      console.error('[decay cron] RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = Array.isArray(data) ? data[0] : data
    console.log('[decay cron] Complete:', result)

    // ── Mark expired trials as cancelled ────────────────────────────────────
    let expiredCount = 0
    try {
      const { data: expiredTrials, error: expErr } = await supabase
        .from('hired_subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: 'trial_expired', updated_at: new Date().toISOString() })
        .eq('status', 'trial')
        .lt('trial_ends_at', new Date().toISOString())
        .select('id')
      if (!expErr) expiredCount = expiredTrials?.length ?? 0
    } catch (e) {
      console.error('[decay cron trial expiry]', e)
    }

    // ── Day-3 and Day-10 follow-up emails ───────────────────────────────────
    let followupCount = 0
    try {
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const from  = process.env.FROM_EMAIL ?? 'hello@setuagents.com'
        const base  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://setuagents.com'
        const now   = new Date()

        for (const [minDays, maxDays, subject, body] of [
          [2, 4,
           'How is {employee_name} working out?',
           '<p style="color:#6b7280;font-size:14px;margin:0 0 16px;line-height:1.7">You hired <strong style="color:#111">{employee_name}</strong> 3 days ago. Have you had a chance to chat?</p><p style="color:#6b7280;font-size:14px;margin:0 0 20px;line-height:1.7">The first few sessions are where the magic starts — {employee_name} learns your preferences, your tools, and how you work. By session 5, you\'ll notice a real difference.</p>',
          ],
          [9, 11,
           '{name} trial: 4 days left — lock in ${price}/mo forever',
           '<p style="color:#6b7280;font-size:14px;margin:0 0 16px;line-height:1.7">Your free trial of <strong style="color:#111">{employee_name}</strong> ends in 4 days.</p><p style="color:#6b7280;font-size:14px;margin:0 0 20px;line-height:1.7">Activate before it expires and you keep <strong style="color:#111">${price}/month</strong> locked in forever. New signups after October pay $10 more — and every month after that is $10 higher still.</p>',
          ],
        ] as any) {
          const from_date = new Date(now.getTime() - maxDays * 86400000)
          const to_date   = new Date(now.getTime() - minDays * 86400000)

          const { data: followups } = await supabase
            .from('hired_subscriptions')
            .select('owner_email, owner_name, employee_name, employee_slug, monthly_price_cents')
            .eq('status', 'trial')
            .gt('trial_started_at', from_date.toISOString())
            .lte('trial_started_at', to_date.toISOString())

          for (const sub of (followups ?? [])) {
            if (!sub.owner_email) continue
            const firstName = (sub.owner_name ?? '').split(' ')[0] || 'there'
            const price = sub.monthly_price_cents ? Math.round(sub.monthly_price_cents / 100) : 49
            const subjectFilled = (subject as string).replace('{name}', firstName).replace('{employee_name}', sub.employee_name ?? sub.employee_slug).replace('{price}', String(price))
            const bodyFilled = (body as string).replace(/{name}/g, firstName).replace(/{employee_name}/g, sub.employee_name ?? sub.employee_slug).replace(/{price}/g, String(price))

            await resend.emails.send({
              from,
              to: sub.owner_email,
              subject: subjectFilled,
              html: `
                <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
                  <h2 style="font-size:20px;font-weight:800;color:#111;margin:0 0 12px">Hi ${firstName} 👋</h2>
                  ${bodyFilled}
                  <a href="${base}/manage/${sub.employee_slug}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700">
                    Open manage hub →
                  </a>
                  <p style="font-size:12px;color:#9ca3af;margin-top:24px;line-height:1.6">
                    Questions? Reply to this email.<br>Setu · setuagents.com
                  </p>
                </div>
              `,
            }).catch(() => {})
            followupCount++
          }
        }
      }
    } catch (e) {
      console.error('[decay cron followups]', e)
    }

    // ── Trial expiry reminders ───────────────────────────────────────────────
    let remindedCount = 0
    try {
      const now = new Date()
      const in7d = new Date(now.getTime() + 7 * 86400000)

      const { data: expiringTrials } = await supabase
        .from('hired_subscriptions')
        .select('owner_email, owner_name, employee_name, employee_slug, trial_ends_at, monthly_price_cents')
        .eq('status', 'trial')
        .gt('trial_ends_at', now.toISOString())
        .lte('trial_ends_at', in7d.toISOString())

      if (expiringTrials && expiringTrials.length > 0 && process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const from = process.env.FROM_EMAIL ?? 'hello@setuagents.com'
        const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://setuagents.com'

        for (const sub of expiringTrials) {
          const daysLeft = Math.max(1, Math.ceil((new Date(sub.trial_ends_at).getTime() - now.getTime()) / 86400000))
          const price = sub.monthly_price_cents ? Math.round(sub.monthly_price_cents / 100) : 49
          if (!sub.owner_email) continue

          await resend.emails.send({
            from,
            to: sub.owner_email,
            subject: `Your ${sub.employee_name ?? 'AI Employee'} trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
            html: `
              <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
                <h2 style="font-size:20px;font-weight:800;color:#111;margin:0 0 8px">
                  ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in your trial
                </h2>
                <p style="color:#6b7280;margin:0 0 20px;font-size:14px;line-height:1.7">
                  Hi${sub.owner_name ? ` ${sub.owner_name.split(' ')[0]}` : ''},<br><br>
                  Your 14-day free trial of <strong style="color:#111">${sub.employee_name ?? 'your AI Employee'}</strong> ends on
                  <strong style="color:#111">${new Date(sub.trial_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</strong>.
                  Your locked rate is <strong style="color:#111">$${price}/month</strong> — new signups pay more.
                </p>
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px">
                  <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                    <span style="font-size:13px;color:#6b7280">Your locked rate</span>
                    <strong style="font-size:13px;color:#111">$${price}/month</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between">
                    <span style="font-size:13px;color:#6b7280">Trial ends</span>
                    <strong style="font-size:13px;color:#111">${new Date(sub.trial_ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>
                  </div>
                </div>
                <a href="${base}/manage/${sub.employee_slug}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700;margin-bottom:16px">
                  Activate to keep your rate →
                </a>
                <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.6">
                  Questions? Reply to this email — we respond within a few hours.<br>
                  Setu · setuagents.com
                </p>
              </div>
            `,
          }).catch(e => console.error('[decay cron trial reminder]', e))
          remindedCount++
        }
      }
    } catch (e) {
      console.error('[decay cron trial reminders]', e)
    }

    return NextResponse.json({
      ok: true,
      decayed: result?.decayed_count ?? 0,
      at_floor: result?.zeroed_count ?? 0,
      trials_expired: expiredCount,
      followup_emails_sent: followupCount,
      trial_reminders_sent: remindedCount,
      ran_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[decay cron] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Also allow GET for Vercel Cron (which uses GET by default)
export async function GET(req: NextRequest) {
  return POST(req)
}
