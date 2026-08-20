// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/governance/admin-guard'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

// GET /api/admin/subscriptions?status=trial|active|paused|cancelled
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('hired_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ subscriptions: data ?? [] })
  } catch (err) {
    console.error('[admin/subscriptions GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PATCH /api/admin/subscriptions — admin status override
// body: { id, status }
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id, status } = await req.json()

    const VALID = ['trial', 'active', 'paused', 'cancelled']
    if (!id || !status || !VALID.includes(status)) {
      return NextResponse.json({ error: 'id and valid status required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (status === 'active') {
      updates.activated_at = new Date().toISOString()
    }
    if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString()
      updates.cancel_reason = 'admin_override'
    }

    const { data: updated, error } = await supabase
      .from('hired_subscriptions')
      .update(updates)
      .eq('id', id)
      .select('owner_email, owner_name, employee_name, employee_slug, monthly_price_cents')
      .maybeSingle()

    if (error) throw error

    // Send activation confirmation email when admin marks active
    if (status === 'active' && updated?.owner_email && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const from = process.env.FROM_EMAIL ?? 'hello@setuagents.com'
        const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://setuagents.com'
        const firstName = (updated.owner_name ?? '').split(' ')[0] || 'there'
        const empName = updated.employee_name ?? updated.employee_slug
        const price = updated.monthly_price_cents ? Math.round(updated.monthly_price_cents / 100) : 49

        await resend.emails.send({
          from,
          to: updated.owner_email,
          subject: `${empName} is now live — you're all set`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0B0D14;border-radius:16px;overflow:hidden">
              <div style="padding:32px">
                <p style="color:#22c55e;font-size:13px;margin:0 0 4px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">✓ ACTIVE</p>
                <h2 style="font-size:20px;font-weight:800;color:#fff;margin:8px 0 16px;letter-spacing:-0.03em">
                  ${firstName}, ${empName} is now live
                </h2>
                <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 16px">
                  Your subscription is confirmed at <strong style="color:#fff">$${price}/month</strong>, locked forever at this rate. You'll receive your first billing summary at the end of the month.
                </p>
                <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px">
                  Head to the manage hub to upload context, adjust autonomy settings, and get your first task moving.
                </p>
                <a href="${base}/manage/${updated.employee_slug}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700">
                  Open ${empName}'s hub →
                </a>
                <p style="font-size:12px;color:#334155;margin:24px 0 0;line-height:1.6">Questions? Reply to this email.<br>Setu · setuagents.com</p>
              </div>
            </div>
          `,
        }).catch(() => {})
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({ ok: true, status })
  } catch (err) {
    console.error('[admin/subscriptions PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
