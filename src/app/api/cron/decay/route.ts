import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────────────────────────────────
// /api/cron/decay — Ebbinghaus belief decay
//
// Called weekly via Vercel Cron (vercel.json) or any external cron.
// Applies decay_rate to beliefs not validated in > 7 days.
// Secured by CRON_SECRET.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('apply_belief_decay')

    if (error) {
      console.error('[decay cron] RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = Array.isArray(data) ? data[0] : data
    console.log('[decay cron] Complete:', result)

    return NextResponse.json({
      ok: true,
      decayed: result?.decayed_count ?? 0,
      at_floor: result?.zeroed_count ?? 0,
      ran_at: new Date().toISOString(),
      note: 'trial lifecycle managed by /api/cron/trials (daily)',
    })
  } catch (err) {
    console.error('[decay cron] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// Also allow GET for Vercel Cron (which uses GET by default)
export async function GET(req: NextRequest) {
  return POST(req)
}
