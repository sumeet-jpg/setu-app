// @ts-nocheck
// GET /api/tools/connections?user_id=xxx&employee_slug=xxx
// Returns which tools are connected for a user (filtered to employee's tools if slug provided)

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getTool, toolLogoUrl } from '@/lib/tools/registry'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('tool_connections')
      .select('tool_slug, config, connected_at, last_used_at')
      .eq('user_id', user_id)

    if (error) {
      return NextResponse.json({ error: 'Failed to load connections' }, { status: 500 })
    }

    const connections = (data ?? []).map(row => {
      const toolDef = getTool(row.tool_slug)
      return {
        slug: row.tool_slug,
        name: toolDef?.name ?? row.tool_slug,
        category: toolDef?.category ?? 'Other',
        logo: toolLogoUrl(row.tool_slug),
        domain: toolDef?.domain ?? '',
        connected_at: row.connected_at,
        last_used_at: row.last_used_at,
      }
    })

    return NextResponse.json({ connections })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
