// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { recordCronRun } from '@/lib/cron-heartbeat'
import { auditLog } from '@/lib/governance/audit-logger'
import { hardDeleteUserData } from '@/lib/manage/data-scope'

// ──────────────────────────────────────────────────────────────────────────
// /api/cron/purge-deleted-accounts — the other half of the "resign" flow.
//
// /api/manage/delete-account (POST) purges tool credentials and cancels
// subscriptions immediately, then rows a pending_account_deletions entry
// with a 7-day purge_at. This cron runs daily, finds anything past its
// purge_at, hard-deletes every remaining table for that userId (see
// data-scope.ts — same table list the export route reads from), and
// removes the pending_account_deletions row. Secured by CRON_SECRET, same
// as every other cron.
// ──────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const { data: due, error } = await supabase
      .from('pending_account_deletions')
      .select('user_id')
      .lte('purge_at', new Date().toISOString())

    if (error) {
      await recordCronRun('purge-deleted-accounts', 'failed', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let purged = 0
    const failures: Record<string, unknown> = {}

    for (const row of due ?? []) {
      const tableErrors = await hardDeleteUserData(supabase, row.user_id)
      if (Object.keys(tableErrors).length) failures[row.user_id] = tableErrors
      await supabase.from('pending_account_deletions').delete().eq('user_id', row.user_id)
      auditLog.accountDeleted(row.user_id).catch(() => {})
      purged++
    }

    await recordCronRun(
      'purge-deleted-accounts',
      'success',
      `purged=${purged}${Object.keys(failures).length ? ` partial_failures=${Object.keys(failures).length}` : ''}`
    )

    return NextResponse.json({ ok: true, purged, ...(Object.keys(failures).length ? { failures } : {}) })
  } catch (err) {
    await recordCronRun('purge-deleted-accounts', 'failed', err instanceof Error ? err.message : 'unknown error')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
