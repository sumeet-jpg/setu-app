import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withManageAuth } from '@/lib/manage-token'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// PATCH { slug, kpis: string[] } — the 2-3 metrics an owner wants this
// employee to move, set during onboarding. Gated: derives userId from the
// manage-token, never trusts a client-supplied userId.
export async function PATCH(req: NextRequest) {
  return withManageAuth(req, async (userId) => setKpis(userId, req))
}

async function setKpis(userId: string, req: NextRequest): Promise<NextResponse> {
  try {
    const { slug, kpis } = await req.json()
    if (!slug || !Array.isArray(kpis)) {
      return NextResponse.json({ error: 'slug and kpis[] required' }, { status: 400 })
    }
    const cleaned = kpis.map(k => String(k).trim()).filter(Boolean).slice(0, 3)

    const supabase = getSupabase()
    const { error } = await supabase
      .from('hired_subscriptions')
      .update({ top_kpis: cleaned, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('employee_slug', slug)

    if (error) {
      console.error('[manage/kpis]', error.message)
      return NextResponse.json({ error: 'Could not save' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, kpis: cleaned })
  } catch (err) {
    console.error('[manage/kpis]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
