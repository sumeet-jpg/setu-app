// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

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

    // Save to Supabase
    const supabase = getSupabase()
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

    // Create subscription record with 14-day trial + price lock
    // userId from the client (localStorage-based anonymous id)
    const userId = body.userId ?? null
    if (userId) {
      const trialEnd = new Date(Date.now() + 14 * 86400000).toISOString()
      await supabase
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
          monthly_price_cents: 4900,   // $49 — launch price, locked at hire time
          price_locked_at: new Date().toISOString(),
          updated_at:      new Date().toISOString(),
        }, { onConflict: 'user_id,employee_slug' })
        .catch(e => console.error('[hire subscription]', e))
    }

    if (dbErr) {
      console.error('[Setu hire DB] FAILED TO SAVE — hire lost from DB:', dbErr.message, { name, email, company, employee_slug })
      // Continue sending emails so the prospect gets a response,
      // but admin email subject will flag the DB failure
    }

    const fromEmail = process.env.FROM_EMAIL ?? 'hello@setuagents.com'
    const adminEmail = process.env.ADMIN_ALERT_EMAIL ?? 'sumeet@setuagents.com'

    const resend = getResend()

    // Admin notification
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `🎉 New Hire Request: ${name} wants to hire ${employee_name}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:580px;margin:0 auto;background:#09090b;color:#fafafa;border-radius:16px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 32px 24px">
            <div style="font-size:28px;font-weight:900;letter-spacing:-0.03em">Setu</div>
            <div style="font-size:13px;opacity:0.7;margin-top:4px">AI Employees Platform</div>
          </div>
          <div style="padding:32px">
            <div style="font-size:18px;font-weight:700;margin-bottom:4px">🎉 New AI Employee Hire Request</div>
            <div style="font-size:14px;color:#71717a;margin-bottom:24px">${name} wants to hire <strong style="color:#a78bfa">${employee_name}</strong> as their ${employee_title}</div>

            <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
              ${[
                ['Name', name],
                ['Email', email],
                ['Company', company],
                ['Role', role || '—'],
                ['Team Size', size || '—'],
                ['Timeline', timeline || '—'],
              ].map(([k, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#71717a;width:120px">${k}</td><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#fafafa">${v}</td></tr>`).join('')}
            </table>

            <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px;margin-bottom:24px">
              <div style="font-size:11px;font-weight:700;color:#a78bfa;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px">Use Case</div>
              <div style="font-size:14px;color:#e4e4e7;line-height:1.65">${use_case}</div>
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
      subject: `${employee_name} is live — your 14-day trial starts now`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:0">
          <div style="background:#0B0D14;border-radius:16px 16px 0 0;padding:32px 32px 24px">
            <div style="font-size:13px;font-weight:800;color:#fff;letter-spacing:0.04em">SETU</div>
          </div>
          <div style="background:#141620;padding:32px;border-left:1px solid rgba(99,102,241,0.2);border-right:1px solid rgba(99,102,241,0.2)">
            <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.03em;margin-bottom:6px">
              ${name.split(' ')[0]}, ${employee_name} is live right now.
            </div>
            <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin:0 0 24px">
              Your 14-day free trial started the moment you hit submit. No waiting — open the management hub and start chatting.
            </p>

            <a href="https://setuagents.com/manage/${employee_slug}" style="display:block;text-align:center;padding:14px 24px;background:#6366f1;color:#fff;border-radius:12px;text-decoration:none;font-size:15px;font-weight:800;letter-spacing:-0.01em;margin-bottom:20px">
              Open ${employee_name}'s management hub →
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
              ['Chat first', `Ask ${employee_name} something real — a strategy question, a task, a review. See how they think.`],
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

    return NextResponse.json({ success: true, id: hire?.id ?? null, db_saved: !dbErr, manage_url: `/manage/${employee_slug}` })
  } catch (err: any) {
    console.error('[Setu hire API]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
