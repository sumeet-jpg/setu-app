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

    // Return stub if not found (pre-migration or not yet hired)
    if (!data) {
      return NextResponse.json({
        user_id: userId,
        employee_slug: slug,
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
        monthly_price_cents: 4900,
        billing_months: 0,
        activated_at: null,
      })
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

    const statusMap: Record<string, string> = {
      cancel: 'cancelled',
      pause:  'paused',
      resume: 'trial',
    }
    const newStatus = statusMap[action]

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

    // Notify admin when someone cancels so Sumeet can follow up
    if (action === 'cancel' && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const adminEmail = process.env.ADMIN_ALERT_EMAIL ?? 'sumeet@setuagents.com'
        const from      = process.env.FROM_EMAIL ?? 'hello@setuagents.com'
        const price     = updated?.monthly_price_cents ? Math.round(updated.monthly_price_cents / 100) : 49

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
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({ ok: true, status: newStatus })
  } catch (err) {
    console.error('[manage/subscription PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
