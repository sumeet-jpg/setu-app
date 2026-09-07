import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { withManageAuth } from '@/lib/manage-token'
import { escapeHtml as esc } from '@/lib/email/escape-html'
import { auditLog } from '@/lib/governance/audit-logger'
import { purgeCredentialsAndCancel, DELETION_GRACE_PERIOD_MS } from '@/lib/manage/data-scope'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/manage/delete-account — the "resign" action.
// Immediately purges the highest-risk data (encrypted tool credentials) and
// cancels active subscriptions; everything else is hard-deleted after a
// 7-day grace window by the daily purge-deleted-accounts cron, so one
// accidental click (or a support dispute) isn't unrecoverable same-second.
export async function POST(req: NextRequest) {
  return withManageAuth(req, async (userId) => {
    const supabase = getSupabase()

    const { data: subs } = await supabase
      .from('hired_subscriptions')
      .select('owner_email, employee_slug, employee_name')
      .eq('user_id', userId)

    const ownerEmail = subs?.find((s: any) => s.owner_email)?.owner_email ?? null
    const employeeSlugs = (subs ?? []).map((s: any) => s.employee_slug)

    await purgeCredentialsAndCancel(supabase, userId)

    const purgeAt = new Date(Date.now() + DELETION_GRACE_PERIOD_MS).toISOString()
    await supabase.from('pending_account_deletions').upsert({
      user_id: userId,
      owner_email: ownerEmail,
      purge_at: purgeAt,
      employee_slugs: employeeSlugs,
    })

    auditLog.accountDeletionRequested(userId, purgeAt).catch(() => {})

    if (ownerEmail && process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const from = process.env.FROM_EMAIL ?? 'hello@setuagents.com'
        await resend.emails.send({
          from,
          to: ownerEmail,
          subject: 'Your Setu account deletion is scheduled',
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#0B0D14;border-radius:16px;overflow:hidden">
              <div style="padding:32px">
                <p style="color:#94a3b8;font-size:13px;margin:0 0 4px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">SETU · Account deletion scheduled</p>
                <h2 style="font-size:20px;font-weight:800;color:#fff;margin:8px 0 16px;letter-spacing:-0.03em">Your data will be permanently deleted on ${esc(new Date(purgeAt).toLocaleDateString())}</h2>
                <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 16px">
                  Your connected tool credentials have already been removed and your subscriptions cancelled. Your task history, memory, and documents will be permanently deleted after a 7-day grace period — this gives you a window to change your mind.
                </p>
                <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:0 0 16px">
                  Changed your mind? Reply to this email before ${esc(new Date(purgeAt).toLocaleDateString())} and we'll cancel the deletion.
                </p>
              </div>
            </div>
          `,
        }).catch(() => {})
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({ ok: true, purge_at: purgeAt })
  })
}

// DELETE /api/manage/delete-account — cancel a pending deletion within the
// grace window. Credentials already purged by the POST above are NOT
// restored (the customer needs to reconnect tools either way), but their
// remaining data is spared from the scheduled hard-delete.
export async function DELETE(req: NextRequest) {
  return withManageAuth(req, async (userId) => {
    const supabase = getSupabase()
    await supabase.from('pending_account_deletions').delete().eq('user_id', userId)
    return NextResponse.json({ ok: true })
  })
}
