// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { signManageToken } from '@/lib/manage-token'
import { escapeHtml as esc } from '@/lib/email/escape-html'
import { RATE_LIMITS, getClientIp } from '@/lib/security/rate-limiter'

export const runtime = 'nodejs'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rateCheck = RATE_LIMITS.leadCapture(ip)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again in a bit.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { name, email, company, role, size, use_case, timeline, employee_slug, employee_name, employee_title } = body

    if (!name || !email || !company || !use_case || !employee_slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRx.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // userId (localStorage-based anonymous id) is required — without it there's
    // no way to create the hired_subscriptions row that actually grants the
    // trial, and no way to ever issue this person a manage-token. Previously
    // this was optional and a missing userId silently skipped subscription
    // creation entirely while still returning success.
    const userId = body.userId ?? null
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Double-click / accidental-resubmit guard: if the exact same email+slug
    // was already submitted in the last 2 minutes, don't create a second lead
    // row or send a second round of emails — just report success again.
    // Deliberately NOT a DB-level UNIQUE(email, employee_slug): that would
    // also block a legitimate re-hire from someone who churned and came back
    // months later, which the founder would actually want to know about.
    const { data: recentDup } = await supabase
      .from('employee_hires')
      .select('id')
      .eq('email', email)
      .eq('employee_slug', employee_slug)
      .gte('created_at', new Date(Date.now() - 2 * 60000).toISOString())
      .limit(1)
      .maybeSingle()

    if (recentDup) {
      const manage_token = signManageToken(userId)
      return NextResponse.json({ success: true, id: recentDup.id, db_saved: true, manage_url: `/manage/${employee_slug}`, manage_token, duplicate: true })
    }

    // Save to Supabase — fatal on failure. Previously a DB error here still
    // sent the client a success response and both emails, so the prospect
    // believed they'd hired someone while nothing was actually saved.
    const { data: hire, error: dbErr } = await supabase
      .from('employee_hires')
      .insert({
        name,
        email,
        company,
        role: role || null,
        company_size: size || null,
        use_case,
        timeline: timeline || null,
        employee_slug,
        employee_name,
        employee_title,
        status: 'pending',
      })
      .select()
      .single()

    if (dbErr) {
      console.error('[Setu hire DB] FAILED TO SAVE:', dbErr.message, { name, email, company, employee_slug })
      return NextResponse.json({ error: 'Could not save your request. Please try again.' }, { status: 500 })
    }

    // Create subscription record with 14-day trial + price lock — also fatal.
    // Get current platform price (step-up model: $49 at launch, +$10/month from Oct 2026)
    let priceCents = 4900
    try {
      const { data: priceRow } = await supabase.rpc('current_platform_price_cents')
      if (typeof priceRow === 'number' && priceRow >= 4900) priceCents = priceRow
    } catch { /* migration not yet applied — use launch price */ }

    const trialEnd = new Date(Date.now() + 14 * 86400000).toISOString()
    const { error: subErr } = await supabase
      .from('hired_subscriptions')
      .upsert({
        user_id:         userId,
        employee_slug,
        employee_name:   employee_name ?? null,
        employee_title:  employee_title ?? null,
        owner_name:      name,
        owner_email:     email,
        owner_company:   company,
        owner_role:      role ?? null,
        company_size:    size ?? null,
        use_case:        use_case ?? null,
        timeline:        timeline ?? null,
        status:          'trial',
        trial_started_at: new Date().toISOString(),
        trial_ends_at:   trialEnd,
        monthly_price_cents: priceCents,  // locked at hire time, steps up $10/month from Oct
        price_locked_at: new Date().toISOString(),
        updated_at:      new Date().toISOString(),
      }, { onConflict: 'user_id,employee_slug' })

    if (subErr) {
      console.error('[Setu hire subscription] FAILED TO SAVE:', subErr.message, { userId, employee_slug })
      return NextResponse.json({ error: 'Could not start your trial. Please try again.' }, { status: 500 })
    }

    const fromEmail = process.env.FROM_EMAIL ?? 'hello@setuagents.com'
    const adminEmail = process.env.ADMIN_ALERT_EMAIL ?? 'sumeet@setuagents.com'

    const resend = getResend()

    // Admin notification
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `🎉 New Hire Request: ${esc(name)} wants to hire ${esc(employee_name)}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:580px;margin:0 auto;background:#09090b;color:#fafafa;border-radius:16px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 32px 24px">
            <div style="font-size:28px;font-weight:900;letter-spacing:-0.03em">Setu</div>
            <div style="font-size:13px;opacity:0.7;margin-top:4px">AI Employees Platform</div>
          </div>
          <div style="padding:32px">
            <div style="font-size:18px;font-weight:700;margin-bottom:4px">🎉 New AI Employee Hire Request</div>
            <div style="font-size:14px;color:#71717a;margin-bottom:24px">${esc(name)} wants to hire <strong style="color:#a78bfa">${esc(employee_name)}</strong> as their ${esc(employee_title)}</div>

            <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
              ${[
                ['Name', name],
                ['Email', email],
                ['Company', company],
                ['Role', role || '—'],
                ['Team Size', size || '—'],
                ['Timeline', timeline || '—'],
              ].map(([k, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#71717a;width:120px">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#fafafa">${esc(v)}</td></tr>`).join('')}
            </table>

            <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px;margin-bottom:24px">
              <div style="font-size:11px;font-weight:700;color:#a78bfa;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px">Use Case</div>
              <div style="font-size:14px;color:#e4e4e7;line-height:1.65">${esc(use_case)}</div>
            </div>

            <a href="https://setuagents.com/admin/hires" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700">View in Admin →</a>
          </div>
          <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#3f3f46">
            Setu · SignalPulse Technologies LLC · Wyoming, USA
          </div>
        </div>
      `,
    }).catch(err => console.error('[Setu hire admin email]', err))

    // Prospect confirmation
    const trialEndDate = new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `${esc(employee_name)} is live — your 14-day trial starts now`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:0">
          <div style="background:#0B0D14;border-radius:16px 16px 0 0;padding:32px 32px 24px">
            <div style="font-size:13px;font-weight:800;color:#fff;letter-spacing:0.04em">SETU</div>
          </div>
          <div style="background:#141620;padding:32px;border-left:1px solid rgba(99,102,241,0.2);border-right:1px solid rgba(99,102,241,0.2)">
            <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.03em;margin-bottom:6px">
              ${esc(name.split(' ')[0])}, ${esc(employee_name)} is live right now.
            </div>
            <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 24px">
              Your 14-day free trial started the moment you hit submit. No waiting — open the management hub and start chatting.
            </p>

            <a href="https://setuagents.com/manage/${encodeURIComponent(employee_slug)}" style="display:block;text-align:center;padding:14px 24px;background:#6366f1;color:#fff;border-radius:12px;text-decoration:none;font-size:15px;font-weight:800;letter-spacing:-0.01em;margin-bottom:20px">
              Open ${esc(employee_name)}'s management hub →
            </a>

            <div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);border-radius:12px;padding:20px;margin-bottom:24px">
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)">
                <span style="color:#64748b">Your locked rate</span>
                <strong style="color:#fff">$49/month</strong>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)">
                <span style="color:#64748b">Trial ends</span>
                <strong style="color:#fff">${trialEndDate}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px">
                <span style="color:#64748b">Cancel anytime</span>
                <strong style="color:#22c55e">Yes</strong>
              </div>
            </div>

            <div style="font-size:12px;font-weight:700;color:#6366f1;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px">Get started in 3 steps</div>
            ${[
              ['Chat first', `Ask ${esc(employee_name)} something real — a strategy question, a task, a review. See how they think.`],
              ['Upload context', 'Add your SOPs, product docs, or brand voice to the Vault so they have real context.'],
              ['Activate before trial ends', `Your $49/month rate is locked in forever if you activate by ${trialEndDate}.`],
            ].map(([step, detail], i) => `
              <div style="display:flex;gap:14px;margin-bottom:14px;align-items:flex-start">
                <div style="width:24px;height:24px;border-radius:7px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#818cf8;flex-shrink:0">${i + 1}</div>
                <div>
                  <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:3px">${step}</div>
                  <div style="font-size:12px;color:#64748b;line-height:1.6">${detail}</div>
                </div>
              </div>
            `).join('')}

            <p style="font-size:12px;color:#475569;margin:20px 0 0;line-height:1.6">
              Questions? Reply to this email. Sumeet reads every one.<br>
              Setu · setuagents.com
            </p>
          </div>
          <div style="background:#0B0D14;border-radius:0 0 16px 16px;padding:14px 32px">
            <p style="font-size:11px;color:#334155;margin:0">Setu · SignalPulse Technologies LLC · Wyoming, USA</p>
          </div>
        </div>
      `,
    }).catch(err => console.error('[Setu hire prospect email]', err))

    const manage_token = signManageToken(userId)

    return NextResponse.json({ success: true, id: hire?.id ?? null, db_saved: !dbErr, manage_url: `/manage/${employee_slug}`, manage_token })
  } catch (err: any) {
    console.error('[Setu hire API]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
