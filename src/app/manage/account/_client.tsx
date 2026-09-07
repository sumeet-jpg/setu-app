'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { authFetch } from '@/lib/manage-token-client'

function getUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('setu_user_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('setu_user_id', id) }
  return id
}

const C = {
  bg: '#0B0D14', surface: '#141620', card: '#1B1E2C',
  border: 'rgba(148,163,184,0.08)', text: '#E2E8F0', muted: '#64748B',
  accent: '#6366F1', green: '#22C55E', amber: '#F59E0B', red: '#EF4444',
}

export default function AccountClient() {
  const [userId] = useState(() => getUserId())
  const [employees, setEmployees] = useState<any[]>([])
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pendingDeletion, setPendingDeletion] = useState<{ purge_at: string } | null>(null)
  const [cancellingDeletion, setCancellingDeletion] = useState(false)

  useEffect(() => {
    if (!userId) return
    fetch(`/api/manage/my-employees?userId=${userId}`)
      .then(r => r.json())
      .then(d => setEmployees(d.subscriptions ?? []))
      .catch(() => {})
  }, [userId])

  const handleExport = async () => {
    setExporting(true)
    setExportError('')
    try {
      const res = await authFetch('/api/manage/export')
      if (!res.ok) {
        setExportError(res.status === 401
          ? 'Your session has expired — refresh the page and try again.'
          : 'Export failed — please try again.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `setu-data-export-${userId}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setExportError('Export failed — please try again.')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await authFetch('/api/manage/delete-account', { method: 'POST' })
      const d = await res.json()
      if (res.ok) setPendingDeletion({ purge_at: d.purge_at })
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelDeletion = async () => {
    setCancellingDeletion(true)
    try {
      await authFetch('/api/manage/delete-account', { method: 'DELETE' })
      setPendingDeletion(null)
    } finally {
      setCancellingDeletion(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 20px' }}>
        <Link href="/my-employees" style={{ color: C.muted, textDecoration: 'none', fontSize: 13 }}>← My Employees</Link>

        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', margin: '20px 0 6px' }}>Your account & data</h1>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 36, lineHeight: 1.6 }}>
          Everything Setu holds about you and your hired employees — export it, or delete it entirely.
        </p>

        {pendingDeletion && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: `1px solid ${C.red}40`, borderRadius: 12, padding: '18px 20px', marginBottom: 28 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Deletion scheduled</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>
              Your tool credentials are already removed and subscriptions cancelled. The rest of your data will be permanently deleted on{' '}
              <strong style={{ color: C.text }}>{new Date(pendingDeletion.purge_at).toLocaleDateString()}</strong>.
            </div>
            <button onClick={handleCancelDeletion} disabled={cancellingDeletion}
              style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '8px 16px',
                color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {cancellingDeletion ? 'Cancelling…' : 'Cancel deletion — keep my account'}
            </button>
          </div>
        )}

        {/* Export */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Export your data</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
            Downloads a single file with your task and chat history, memory, uploaded documents, usage records, and hire/subscription details — everything real about you across
            {' '}{employees.length || 'your'} hired employee{employees.length === 1 ? '' : 's'}. Never includes Setu's own system prompts, employee designs, or any decrypted credential.
          </div>
          <button onClick={handleExport} disabled={exporting}
            style={{ background: C.accent, border: 'none', borderRadius: 8, padding: '10px 20px',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {exporting ? 'Preparing export…' : 'Export my data →'}
          </button>
          {exportError && <div style={{ color: C.red, fontSize: 12, marginTop: 10 }}>{exportError}</div>}
        </div>

        {/* Delete */}
        {!pendingDeletion && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Delete your account</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
              Immediately removes your connected tool credentials and cancels every subscription. Everything else — chat history, memory, documents — is permanently deleted after a 7-day grace period, in case this was a mistake.
            </div>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                style={{ background: 'none', border: `1.5px solid ${C.red}`, borderRadius: 8, padding: '10px 20px',
                  color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Delete my account
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: C.text }}>Export your data first if you want a copy — this can't be undone after the grace period. Are you sure?</span>
                <button onClick={handleDelete} disabled={deleting}
                  style={{ background: C.red, border: 'none', borderRadius: 8, padding: '9px 16px',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {deleting ? 'Scheduling…' : 'Yes, delete my account'}
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  style={{ background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '9px 16px',
                    color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
