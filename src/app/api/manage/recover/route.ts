import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
// getServerEnv removed — reads env vars directly to avoid strict validation crash

// POST { email }
// Looks up all hired_subscriptions where contact_email matches,
// then emails the user their manage links.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: subs } = await supabase
      .from('hired_subscriptions')
      .select('user_id, employee_slug, employee_name, employee_title, status, trial_ends_at, monthly_price_cents')
      .eq('owner_email', email.trim().toLowerCase())

    if (!subs || subs.length === 0) {
      // Return success even if no match — don't leak whether an email exists
      return NextResponse.json({ ok: true })
    }

    const resend = new Resend(process.env.RESEND_API_KEY!)

    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://setuagents.com'

    const rows = subs.map(s => {
      const price = s.monthly_price_cents ? Math.round(s.monthly_price_cents / 100) : 49
      const daysLeft = s.trial_ends_at
        ? Math.max(0, Math.ceil((new Date(s.trial_ends_at).getTime() - Date.now()) / 86400000))
        : null
      const statusLabel = s.status === 'trial' && daysLeft !== null
        ? `Trial — ${daysLeft} days left`
        : s.status === 'active' ? 'Active' : s.status

      return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb">
            <strong style="color:#111">${s.employee_name ?? s.employee_slug}</strong>
            <div style="font-size:12px;color:#6b7280">${s.employee_title ?? ''}</div>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px">${statusLabel}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:13px">$${price}/mo</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb">
            <a href="${BASE_URL}/manage/${s.employee_slug}?uid=${encodeURIComponent(s.user_id)}" style="background:#111;color:#fff;padding:6px 14px;border-radius:7px;text-decoration:none;font-size:12px;font-weight:600">Manage →</a>
          </td>
        </tr>`
    }).join('')

    await resend.emails.send({
      from: process.env.FROM_EMAIL ?? 'hello@setuagents.com',
      to: email,
      subject: `Your Setu AI Employee links`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
          <h2 style="font-size:22px;font-weight:800;color:#111;margin:0 0 8px">Your AI Employees</h2>
          <p style="color:#6b7280;margin:0 0 28px;font-size:14px">Here are the management links for all employees you hired through Setu.</p>

          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
            <thead>
              <tr style="background:#f9fafb">
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.06em">EMPLOYEE</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.06em">STATUS</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.06em">RATE</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:0.06em">LINK</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <p style="font-size:12px;color:#9ca3af;margin-top:28px;line-height:1.6">
            These links contain a recovery token — clicking them restores your employee management access on any device. Bookmark them for quick access.<br><br>
            Questions? Reply to this email — we respond within a few hours.<br><br>
            <em>Setu · setuagents.com</em>
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[manage/recover POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
