// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { recordCronRun } from '@/lib/cron-heartbeat'
import { seedWatchPatterns, checkPatterns } from '@/lib/employees/proactive'

// ─────────────────────────────────────────────────────────────────────────
// /api/cron/pin-check — Proactive Intelligence Network, on a schedule
//
// Before this route existed, seedWatchPatterns/checkPatterns only ran as a
// side effect of someone opening an interview chat (see the comment that
// used to sit above them in src/app/api/employees/pin/route.ts). A hired
// employee whose owner hadn't talked to it in weeks generated zero
// proactive briefs — not because nothing was worth flagging, but because
// nothing was ever there to trigger the check. "Proactive" required the
// owner to proactively show up first.
//
// This sweeps every trial/active/paused subscription daily and runs the
// same checkPatterns() the interview flow uses, so a brief like "no new
// learning sessions in 2 weeks" can actually surface on its own instead of
// only appearing after the owner already started the next session.
//
// Called daily via Vercel Cron (vercel.json). Secured by CRON_SECRET.
// ─────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    const { data: subs, error } = await supabase
      .from('hired_subscriptions')
      .select('user_id, employee_slug')
      .in('status', ['trial', 'active', 'paused'])

    if (error) {
      await recordCronRun('pin-check', 'failed', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let checked = 0
    let briefsCreated = 0
    let failed = 0

    for (const sub of subs ?? []) {
      try {
        // Idempotent — safe to reseed every run in case an employee's
        // static watchPatterns changed since the last seed.
        await seedWatchPatterns(supabase, sub.user_id, sub.employee_slug)
        briefsCreated += await checkPatterns(supabase, sub.user_id, sub.employee_slug)
        checked++
      } catch {
        // One customer's failure shouldn't stop the sweep for everyone else.
        failed++
      }
    }

    const detail = `checked=${checked} briefs_created=${briefsCreated} failed=${failed}`
    await recordCronRun('pin-check', 'success', detail)

    return NextResponse.json({ ok: true, checked, briefs_created: briefsCreated, failed, ran_at: new Date().toISOString() })
  } catch (err) {
    console.error('[pin-check cron] Unexpected error:', err)
    await recordCronRun('pin-check', 'failed', err instanceof Error ? err.message : 'unknown error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Vercel Cron uses GET by default.
export async function GET(req: NextRequest) {
  return POST(req)
}
