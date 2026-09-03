// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { recordCronRun } from '@/lib/cron-heartbeat'
import { runWatchPatternCheck } from '@/lib/employees/monitor'

// ─────────────────────────────────────────────────────────────────────────
// /api/cron/watch-check — real watch-pattern monitoring, on a schedule
//
// Every employee profile ships with a specific watchPatterns list (e.g.
// "MQL-to-SQL conversion rate dropping >15%"). Before this route existed,
// those strings were seeded into employee_watch_patterns and then never
// evaluated — only the 4 generic introspective signals in
// /api/cron/pin-check ever fired. This runs the real check: a read-only
// Claude pass against each customer's actually-connected tools (see
// src/lib/employees/monitor.ts for the safety rails — GET-only enforced in
// code, capped under the same monthly budget as real task execution,
// skipped entirely for customers with nothing connected).
//
// Only iterates customers who have at least one tool_connections row —
// there's nothing real to check for anyone else, so no Claude call is
// wasted on them.
//
// Called daily via Vercel Cron (vercel.json). Secured by CRON_SECRET.
// If on a plan with a cron-job-count limit, this is now a 4th job
// alongside decay/trials/pin-check — check your plan before deploying.
// ─────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    const { data: connectedUsers, error: connErr } = await supabase
      .from('tool_connections')
      .select('user_id')

    if (connErr) {
      await recordCronRun('watch-check', 'failed', connErr.message)
      return NextResponse.json({ error: connErr.message }, { status: 500 })
    }

    const userIds = [...new Set((connectedUsers ?? []).map(c => c.user_id))]

    if (userIds.length === 0) {
      await recordCronRun('watch-check', 'success', 'checked=0 briefs_created=0 (no customer has any tool connected)')
      return NextResponse.json({ ok: true, checked: 0, briefs_created: 0, ran_at: new Date().toISOString() })
    }

    const { data: subs, error: subErr } = await supabase
      .from('hired_subscriptions')
      .select('user_id, employee_slug')
      .in('status', ['trial', 'active', 'paused'])
      .in('user_id', userIds)

    if (subErr) {
      await recordCronRun('watch-check', 'failed', subErr.message)
      return NextResponse.json({ error: subErr.message }, { status: 500 })
    }

    let checked = 0
    let briefsCreated = 0
    let failed = 0

    for (const sub of subs ?? []) {
      try {
        briefsCreated += await runWatchPatternCheck(sub.user_id, sub.employee_slug)
        checked++
      } catch {
        failed++
      }
    }

    const detail = `checked=${checked} briefs_created=${briefsCreated} failed=${failed} customers_with_tools=${userIds.length}`
    await recordCronRun('watch-check', 'success', detail)

    return NextResponse.json({ ok: true, checked, briefs_created: briefsCreated, failed, ran_at: new Date().toISOString() })
  } catch (err) {
    console.error('[watch-check cron] Unexpected error:', err)
    await recordCronRun('watch-check', 'failed', err instanceof Error ? err.message : 'unknown error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Vercel Cron uses GET by default.
export async function GET(req: NextRequest) {
  return POST(req)
}
