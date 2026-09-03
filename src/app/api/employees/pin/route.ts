// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { withManageAuth, verifyManageToken, signManageToken } from '@/lib/manage-token'
import { seedWatchPatterns, checkPatterns } from '@/lib/employees/proactive'

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// /api/employees/pin â€” Proactive Intelligence Network
//
// GET  ?userId=&slug=&unreadOnly=true
//   Returns proactive briefs for this employee â€” unread by default.
//
// POST body: { action: 'seed' | 'check' | 'dismiss', userId, slug, briefId? }
//   seed   â€” seeds watch patterns from the employee's static profile (idempotent)
//   check  â€” evaluates all active patterns and creates briefs for triggered ones
//   dismiss â€” marks a brief as dismissed by the owner
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€ Route handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function GET(req: NextRequest) {
  return withManageAuth(req, async (userId) => getPins(userId, req))
}

async function getPins(userId: string, req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const slug      = searchParams.get('slug')
    const unreadOnly = searchParams.get('unreadOnly') !== 'false'
    const limit     = Math.min(20, parseInt(searchParams.get('limit') ?? '10'))

    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    let query = supabase
      .from('employee_proactive_briefs')
      .select('id, title, body, urgency, signal_data, delivered, read_at, dismissed_at, created_at')
      .eq('user_id', userId)
      .eq('employee_slug', slug)
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) query = query.is('read_at', null)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ briefs: data ?? [] })
  } catch (err) {
    console.error('[pin GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// 'seed' and 'check' are triggered server-to-server as a fire-and-forget side
// effect of the anonymous interview flow (src/app/api/employees/interview/route.ts)
// — no user is at the keyboard, so there's no token to send. They stay on the
// bare userId the same way interview/distill do; worst case someone triggers
// idempotent background computation for a UUID they know, which returns no
// data and is already rate-limited (skips if a brief fired in the last 7
// days). 'dismiss' and 'read' are real user actions from the memory page and
// mutate a specific person's brief state, so those require a verified token —
// and use the token's userId, not whatever the client sent.
export async function POST(req: NextRequest) {
  try {
    const { action, userId, slug, briefId } = await req.json()

    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    if (action === 'seed') {
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
      await seedWatchPatterns(supabase, userId, slug)
      return NextResponse.json({ ok: true })
    }

    if (action === 'check') {
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
      const count = await checkPatterns(supabase, userId, slug)
      return NextResponse.json({ ok: true, briefs_created: count })
    }

    if (action === 'dismiss' || action === 'read') {
      if (!briefId) return NextResponse.json({ error: 'briefId required' }, { status: 400 })
      const token = req.headers.get('x-manage-token') ?? new URL(req.url).searchParams.get('mt')
      const authedUserId = verifyManageToken(token)
      if (!authedUserId) {
        return NextResponse.json({ error: 'Unauthorized — missing or expired session token' }, { status: 401 })
      }

      const updates = action === 'dismiss'
        ? { dismissed_at: new Date().toISOString() }
        : { read_at: new Date().toISOString(), delivered: true }

      await supabase.from('employee_proactive_briefs').update(updates)
        .eq('id', briefId).eq('user_id', authedUserId)

      const res = NextResponse.json({ ok: true })
      res.headers.set('x-manage-token', signManageToken(authedUserId))
      return res
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('[pin POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
