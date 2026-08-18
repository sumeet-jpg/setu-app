// @ts-nocheck
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = ['pending', 'contacted', 'onboarding', 'active', 'churned'] as const

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  contacted:  'bg-blue-100 text-blue-700',
  onboarding: 'bg-violet-100 text-violet-700',
  active:     'bg-emerald-100 text-emerald-700',
  churned:    'bg-gray-100 text-gray-500',
}

export function HireStatusUpdater({ hire }: { hire: any }) {
  const router = useRouter()
  const [status, setStatus] = useState(hire.status)
  const [notes, setNotes] = useState(hire.admin_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await fetch(`/api/admin/hires/${hire.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: notes }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  const dirty = status !== hire.status || notes !== (hire.admin_notes ?? '')

  return (
    <div className="flex flex-col gap-2">
      <select
        value={status}
        onChange={e => setStatus(e.target.value)}
        className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {STATUSES.map(s => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
      {dirty && (
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
      )}
    </div>
  )
}

export function HireNotesEditor({ hire }: { hire: any }) {
  const router = useRouter()
  const [notes, setNotes] = useState(hire.admin_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await fetch(`/api/admin/hires/${hire.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: hire.status, admin_notes: notes }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={2}
        placeholder="Add internal notes…"
        className="w-full rounded-lg border border-border bg-muted px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
      />
      {notes !== (hire.admin_notes ?? '') && (
        <button
          onClick={save}
          disabled={saving}
          className="self-end rounded-lg bg-muted border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-primary/10 disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save notes'}
        </button>
      )}
    </div>
  )
}
