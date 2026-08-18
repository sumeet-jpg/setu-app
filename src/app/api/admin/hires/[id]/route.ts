// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUserOrNull } from '@/lib/governance/admin-guard'
import { updateHireStatus } from '@/lib/services/admin.service'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUserOrNull()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const { status, admin_notes } = await req.json()
    if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 })
    await updateHireStatus(id, status, admin_notes)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
