import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

// /api/cron/trials — daily trial lifecycle management
// Secured by CRON_SECRET.
// Runs every day at 8am UTC (see vercel.json)

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  const from  = process.env.FROM_EMAIL ?? 'hello@setuagents.com'
  const base  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://setuagents.com'

  let expiredCount = 0
  let emailCount   = 0

  // ── 1. Auto-cancel expired trials + send re-engagement email ──────────
  try {
    // Fetch before cancelling so we have the subscriber details for re-engagement
    const { data: expiring } = await supabase
      .from('hired_subscriptions')
      .select('id, owner_email, owner_name, employee_name, employee_slug, monthly_price_cents')
      .eq('status', 'trial')
      .lt('trial_ends_at', now.toISOString())

    if (expiring && expiring.length > 0) {
      const ids = expiring.map(r => r.id)
      await supabase
        .from('hired_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: now.toISOString(),
          cancel_reason: 'trial_expired',
          updated_at: now.toISOString(),
        })
        .in('id', ids)
      expiredCount = expiring.length

      // Re-engagement emails — only if Resend is available (checked below)
      if (resend) {
        for (const sub of expiring) {
          if (!sub.owner_email) continue
          const firstName = (sub.owner_name ?? '').split(' ')[0] || 'there'
          const price     = sub.monthly_price_cents ? Math.round(sub.monthly_price_cents / 100) : 49
          const empName   = sub.employee_name ?? sub.employee_slug

          await resend.emails.send({
            from,
            to: sub.owner_email,
            subject: `Your ${empName} trial ended — your rate is still locked`,
            html: `
              <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0B0D14;border-radius:16px;overflow:hidden">
                <div style="padding:32px">
                  <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">SETU · Trial ended</p>
                  <h2 style="font-size:20px;font-weight:800;color:#fff;margin:8px 0 16px;letter-spacing:-0.03em">
                    ${firstName}, your ${empName} trial has ended
                  </h2>
                  <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 16px">
                    Your 14-day trial is over, but your locked rate of <strong style="color:#fff">$${price}/month</strong> is still yours if you reactivate within the next 30 days.
                  </p>
                  <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
                    New signups now pay more. If you come back later, you'll pay the then-current rate — not your locked price.
                  </p>
                  <a href="${base}/employees/${sub.employee_slug}/hire" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700">
                    Reactivate at $${price}/mo →
                  </a>
                  <p style="font-size:12px;color:#334155;margin:24px 0 0;line-height:1.6">Questions? Reply to this email.<br>Setu · setuagents.com</p>
                </div>
              </div>
            `,
          }).catch(e => console.error('[trials cron expiry email]', sub.owner_email, e))
          emailCount++
        }
      }
    }
  } catch (e) {
    console.error('[trials cron expiry]', e)
  }

  if (!resend) {
    return NextResponse.json({ ok: true, expired: expiredCount, emails: 0, note: 'no RESEND_API_KEY' })
  }

  // Email windows: one-day windows so daily cron sends each exactly once
  // Day 3 window: started between 2d 12h ago and 3d 12h ago
  // Day 10 window: started between 9d 12h ago and 10d 12h ago
  // Day 7-expiry reminder: expires 6d 12h → 7d 12h from now
  const h = 3600000
  const d = 86400000

  const emailJobs: {
    label: string
    fromDate: Date
    toDate: Date
    subject: (n: string, en: string, p: number) => string
    html: (n: string, en: string, p: number, slug: string) => string
  }[] = [
    {
      label: 'day3',
      fromDate: new Date(now.getTime() - 3 * d - 12 * h),
      toDate:   new Date(now.getTime() - 2 * d - 12 * h),
      subject: (n, en) => `${en} check-in — how's it going?`,
      html: (n, en, p, slug) => `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0B0D14;border-radius:16px;overflow:hidden">
          <div style="padding:32px">
            <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">SETU · Day 3 check-in</p>
            <h2 style="font-size:20px;font-weight:800;color:#fff;margin:8px 0 16px;letter-spacing:-0.03em">
              How is ${en} working out, ${n}?
            </h2>
            <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px">
              Three days in is where the magic starts — every conversation teaches ${en} your preferences, decisions, and working style. By session 5 you'll notice a real difference.
            </p>
            <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
              Haven't had a chance yet? Open the hub and send ${en} your first real task — they're ready.
            </p>
            <a href="${base}/manage/${slug}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700">
              Open ${en}'s hub →
            </a>
            <p style="font-size:12px;color:#334155;margin:24px 0 0;line-height:1.6">Questions? Reply to this email.<br>Setu · setuagents.com</p>
          </div>
        </div>
      `,
    },
    {
      label: 'day10',
      fromDate: new Date(now.getTime() - 10 * d - 12 * h),
      toDate:   new Date(now.getTime() - 9 * d - 12 * h),
      subject: (n, en, p) => `${n}, 4 days left — lock in $${p}/mo forever`,
      html: (n, en, p, slug) => `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0B0D14;border-radius:16px;overflow:hidden">
          <div style="padding:32px">
            <p style="color:#f59e0b;font-size:13px;margin:0 0 4px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">⚠️ 4 days left</p>
            <h2 style="font-size:20px;font-weight:800;color:#fff;margin:8px 0 16px;letter-spacing:-0.03em">
              Your ${en} trial ends in 4 days
            </h2>
            <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 16px">
              Activate before your trial ends and you keep <strong style="color:#fff">$${p}/month locked in forever</strong>. New signups after October pay $${p + 10}/month — and it rises $10 every month after that.
            </p>
            <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:18px;margin-bottom:24px">
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
                <span style="color:#64748b">Your locked rate</span>
                <strong style="color:#fff">$${p}/month</strong>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px">
                <span style="color:#64748b">If you re-subscribe later</span>
                <strong style="color:#f59e0b">$${p + 10}+/month</strong>
              </div>
            </div>
            <a href="${base}/manage/${slug}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700">
              Activate now →
            </a>
            <p style="font-size:12px;color:#334155;margin:24px 0 0;line-height:1.6">Questions? Reply to this email.<br>Setu · setuagents.com</p>
          </div>
        </div>
      `,
    },
    {
      label: 'day7reminder',
      fromDate: new Date(now.getTime() + 6 * d + 12 * h),  // trial_ends_at > 6.5 days from now
      toDate:   new Date(now.getTime() + 7 * d + 12 * h),  // trial_ends_at < 7.5 days from now
      subject: (n, en, p) => `${en} trial ending in 7 days — $${p}/mo locked`,
      html: (n, en, p, slug) => {
        const endDate = new Date(now.getTime() + 7 * d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
        return `
          <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0B0D14;border-radius:16px;overflow:hidden">
            <div style="padding:32px">
              <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">SETU · Trial reminder</p>
              <h2 style="font-size:20px;font-weight:800;color:#fff;margin:8px 0 16px;letter-spacing:-0.03em">
                ${n}, your trial ends ${endDate}
              </h2>
              <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
                7 days left. Activate to keep your <strong style="color:#fff">$${p}/month</strong> rate locked forever. If you cancel and re-subscribe later, you'll pay the then-current rate.
              </p>
              <a href="${base}/manage/${slug}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700">
                Go to manage hub →
              </a>
              <p style="font-size:12px;color:#334155;margin:24px 0 0;line-height:1.6">Questions? Reply to this email.<br>Setu · setuagents.com</p>
            </div>
          </div>
        `
      },
    },
  ]

  for (const job of emailJobs) {
    try {
      let query = supabase
        .from('hired_subscriptions')
        .select('owner_email, owner_name, employee_name, employee_slug, monthly_price_cents')
        .eq('status', 'trial')

      if (job.label === 'day7reminder') {
        // Trials expiring soon: trial_ends_at between fromDate and toDate
        query = query.gt('trial_ends_at', job.fromDate.toISOString()).lt('trial_ends_at', job.toDate.toISOString())
      } else {
        // Trials that started around the target day
        query = query.gt('trial_started_at', job.fromDate.toISOString()).lt('trial_started_at', job.toDate.toISOString())
      }

      const { data: targets } = await query

      for (const sub of (targets ?? [])) {
        if (!sub.owner_email) continue
        const firstName = (sub.owner_name ?? '').split(' ')[0] || 'there'
        const price = sub.monthly_price_cents ? Math.round(sub.monthly_price_cents / 100) : 49
        const empName = sub.employee_name ?? sub.employee_slug

        await resend.emails.send({
          from,
          to: sub.owner_email,
          subject: job.subject(firstName, empName, price),
          html: job.html(firstName, empName, price, sub.employee_slug),
        }).catch(e => console.error(`[trials cron ${job.label}]`, sub.owner_email, e))
        emailCount++
      }
    } catch (e) {
      console.error(`[trials cron ${job.label}]`, e)
    }
  }

  return NextResponse.json({
    ok: true,
    expired: expiredCount,
    emails_sent: emailCount,
    ran_at: now.toISOString(),
  })
}

export async function GET(req: NextRequest) {
  return POST(req)
}
