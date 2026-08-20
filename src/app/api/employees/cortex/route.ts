// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// /api/employees/cortex â€” Cross-Employee Cortex (CEC)
//
// Persistent shared organizational intelligence. Not orchestration â€” shared memory.
// What one employee learns that every employee in this org should know.
//
// GET  ?userId=&slug=&limit=
//   Returns org_cortex_entries relevant to this employee.
//   Includes entries that haven't been consumed by this slug yet.
//
// POST body: { userId, sourceSlug, entryType, title, body, relevantTo?, confidence? }
//   Publishes a new org-wide insight from an employee.
//   relevantTo: [] = visible to all employees; ['cfo', 'cmo'] = specific employees.
//
// DELETE body: { userId, entryId }
//   Deactivates a cortex entry (soft delete).
//
// PATCH body: { userId, entryId, slug }
//   Marks an entry as consumed by a specific employee slug.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const VALID_ENTRY_TYPES = [
  'org_decision', 'customer_insight', 'market_signal',
  'process_change', 'product_update', 'team_context',
] as const

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const slug   = searchParams.get('slug') ?? undefined
    const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '30'))

    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const supabase = createAdminClient()

    let query = supabase
      .from('org_cortex_entries')
      .select('id, entry_type, title, body, source_employee_slug, relevant_to, consumed_by, confidence, created_at, updated_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Annotate each entry with whether this employee has consumed it
    const annotated = (data ?? []).map(entry => ({
      ...entry,
      consumed_by_me: slug ? (entry.consumed_by ?? []).includes(slug) : false,
      visible_to_all: !entry.relevant_to || entry.relevant_to.length === 0,
    }))

    return NextResponse.json({ entries: annotated })
  } catch (err) {
    console.error('[cortex GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId, sourceSlug, entryType, title, body,
      relevantTo, confidence, sourceSessionId,
    } = await req.json()

    if (!userId || !sourceSlug || !entryType || !title || !body) {
      return NextResponse.json({ error: 'userId, sourceSlug, entryType, title, body required' }, { status: 400 })
    }

    if (!VALID_ENTRY_TYPES.includes(entryType)) {
      return NextResponse.json({ error: `Invalid entryType. Must be one of: ${VALID_ENTRY_TYPES.join(', ')}` }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('org_cortex_entries')
      .insert({
        user_id:             userId,
        entry_type:          entryType,
        title:               title.slice(0, 200),
        body:                body.slice(0, 2000),
        source_employee_slug: sourceSlug,
        source_session_id:   sourceSessionId ?? null,
        relevant_to:         relevantTo ?? [],
        consumed_by:         [sourceSlug],  // source employee has already "consumed" their own insight
        confidence:          Math.max(0.5, Math.min(1.0, confidence ?? 0.9)),
        is_active:           true,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, id: data?.id })
  } catch (err) {
    console.error('[cortex POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, entryId } = await req.json()
    if (!userId || !entryId) {
      return NextResponse.json({ error: 'userId and entryId required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('org_cortex_entries')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', entryId)
      .eq('user_id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cortex DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId, entryId, slug } = await req.json()
    if (!userId || !entryId || !slug) {
      return NextResponse.json({ error: 'userId, entryId, slug required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Append slug to consumed_by array (idempotent via array_append + distinct)
    const { error } = await supabase.rpc('mark_cortex_consumed' as any, {
      p_entry_id: entryId,
      p_user_id:  userId,
      p_slug:     slug,
    }).maybeSingle()

    if (error) {
      // Fallback: fetch + update if RPC doesn't exist yet
      const { data: entry } = await supabase
        .from('org_cortex_entries')
        .select('consumed_by')
        .eq('id', entryId)
        .eq('user_id', userId)
        .single()

      if (entry) {
        const consumed = [...new Set([...(entry.consumed_by ?? []), slug])]
        await supabase
          .from('org_cortex_entries')
          .update({ consumed_by: consumed, updated_at: new Date().toISOString() })
          .eq('id', entryId)
          .eq('user_id', userId)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cortex PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
