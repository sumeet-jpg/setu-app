'use client'
// @ts-nocheck

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Belief {
  id: string
  category: string
  subject: string
  belief: string
  confidence: number
  evidence?: string
  last_validated_at: string
  reinforcement_count: number
  conflict_with_id?: string
  conflict_note?: string
  created_at: string
}

interface DistillRun {
  id: string
  status: string
  summary?: string
  beliefs_created: number
  beliefs_updated: number
  beliefs_conflicted: number
  skill_beliefs_extracted: number
  raw_message_count: number
  completed_at?: string
  created_at: string
}

interface MemoryData {
  slug: string
  total_beliefs: number
  conflicts: number
  stale: number
  grouped: Record<string, { label: string; beliefs: Belief[] }>
  category_order: string[]
  recent_runs: DistillRun[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('setu_user_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('setu_user_id', id) }
  return id
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

function freshnessBadge(iso: string): { label: string; color: string } {
  const d = daysSince(iso)
  if (d < 7)  return { label: 'fresh',   color: '#22c55e' }
  if (d < 30) return { label: 'aging',   color: '#f59e0b' }
  return             { label: 'stale',   color: '#ef4444' }
}

function confidenceBar(conf: number): string {
  const pct = Math.round(conf * 100)
  const color = conf > 0.75 ? '#6366f1' : conf > 0.5 ? '#f59e0b' : '#94a3b8'
  return `linear-gradient(to right, ${color} ${pct}%, rgba(148,163,184,0.12) ${pct}%)`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MemoryClient({
  slug,
  employeeName,
  employeeEmoji,
}: {
  slug: string
  employeeName: string
  employeeEmoji: string
}) {
  const [data, setData] = useState<MemoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showRuns, setShowRuns] = useState(false)
  const [tab, setTab] = useState<'beliefs' | 'timeline' | 'vault' | 'alerts' | 'cortex' | 'calibration'>('beliefs')
  const [timeline, setTimeline] = useState<any[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  // Alerts/PIN state
  const [briefs, setBriefs] = useState<any[]>([])
  const [briefsLoading, setBriefsLoading] = useState(false)
  // Vault state
  const [vaultDocs, setVaultDocs] = useState<any[]>([])
  const [vaultLoading, setVaultLoading] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadType, setUploadType] = useState('text')
  const [uploadContent, setUploadContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  // Cortex state
  const [cortexEntries, setCortexEntries] = useState<any[]>([])
  const [cortexLoading, setCortexLoading] = useState(false)
  // Calibration state
  const [calibration, setCalibration] = useState<any>(null)
  const [auditTrail, setAuditTrail] = useState<any[]>([])
  const [calLoading, setCalLoading] = useState(false)
  const [savingAutonomy, setSavingAutonomy] = useState(false)
  const [autonomyDial, setAutonomyDial] = useState(0.3)

  const userId = typeof window !== 'undefined' ? getUserId() : ''
  const [isHired, setIsHired] = useState(false)

  useEffect(() => {
    if (!userId || !slug) return
    fetch(`/api/manage/subscription?userId=${userId}&slug=${slug}`)
      .then(r => r.json())
      .then(d => { if (d.status === 'trial' || d.status === 'active') setIsHired(true) })
      .catch(() => {})
  }, [userId, slug])

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/employees/beliefs?slug=${slug}&userId=${userId}&limit=200`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [slug, userId])

  const loadTimeline = useCallback(async () => {
    if (!userId || timelineLoading) return
    setTimelineLoading(true)
    try {
      const res = await fetch(`/api/employees/beliefs/timeline?slug=${slug}&userId=${userId}&limit=40`)
      if (res.ok) {
        const d = await res.json()
        setTimeline(d.timeline ?? [])
      }
    } finally {
      setTimelineLoading(false)
    }
  }, [slug, userId])

  const loadBriefs = useCallback(async () => {
    if (!userId) return
    setBriefsLoading(true)
    try {
      const res = await fetch(`/api/employees/pin?userId=${userId}&slug=${slug}&unreadOnly=false&limit=20`)
      if (res.ok) { const d = await res.json(); setBriefs(d.briefs ?? []) }
    } finally { setBriefsLoading(false) }
  }, [slug, userId])

  const dismissBrief = useCallback(async (briefId: string) => {
    await fetch('/api/employees/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dismiss', userId, slug, briefId }),
    })
    setBriefs(prev => prev.filter(b => b.id !== briefId))
  }, [userId, slug])

  const loadCalibration = useCallback(async () => {
    if (!userId) return
    setCalLoading(true)
    try {
      const res = await fetch(`/api/employees/calibration?userId=${userId}&slug=${slug}&history=true`)
      if (res.ok) {
        const d = await res.json()
        setCalibration(d.calibration)
        setAuditTrail(d.audit_trail ?? [])
        if (d.calibration?.autonomy_level != null) {
          setAutonomyDial(d.calibration.autonomy_level)
        }
      }
    } finally {
      setCalLoading(false)
    }
  }, [slug, userId])

  const setAutonomy = useCallback(async (level: number) => {
    if (!userId) return
    setSavingAutonomy(true)
    try {
      await fetch('/api/employees/calibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, slug, action: 'set_autonomy', level }),
      })
      setAutonomyDial(level)
      await loadCalibration()
    } finally {
      setSavingAutonomy(false)
    }
  }, [userId, slug, loadCalibration])

  const resetAutonomy = useCallback(async () => {
    if (!userId) return
    setSavingAutonomy(true)
    try {
      await fetch('/api/employees/calibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, slug, action: 'reset' }),
      })
      await loadCalibration()
    } finally {
      setSavingAutonomy(false)
    }
  }, [userId, slug, loadCalibration])

  const loadCortex = useCallback(async () => {
    if (!userId) return
    setCortexLoading(true)
    try {
      const res = await fetch(`/api/employees/cortex?userId=${userId}&slug=${slug}&limit=30`)
      if (res.ok) {
        const d = await res.json()
        setCortexEntries(d.entries ?? [])
      }
    } finally {
      setCortexLoading(false)
    }
  }, [slug, userId])

  const loadVault = useCallback(async () => {
    if (!userId) return
    setVaultLoading(true)
    try {
      const res = await fetch(`/api/employees/vault?userId=${userId}&slug=${slug}`)
      if (res.ok) {
        const d = await res.json()
        setVaultDocs(d.documents ?? [])
      }
    } finally {
      setVaultLoading(false)
    }
  }, [slug, userId])

  const uploadDoc = useCallback(async () => {
    if (!uploadName.trim() || !uploadContent.trim()) {
      setUploadError('Document name and content are required.')
      return
    }
    setUploading(true)
    setUploadError('')
    setUploadSuccess('')
    try {
      const res = await fetch('/api/employees/vault/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          slug,
          sourceName: uploadName.trim(),
          sourceType: uploadType,
          content: uploadContent.trim(),
        }),
      })
      const d = await res.json()
      if (!res.ok) { setUploadError(d.error ?? 'Upload failed'); return }
      setUploadSuccess(`Uploaded — ${d.chunks_created} chunks, ${d.total_words} words`)
      setUploadName('')
      setUploadContent('')
      await loadVault()
    } finally {
      setUploading(false)
    }
  }, [userId, slug, uploadName, uploadType, uploadContent, loadVault])

  const deleteDoc = useCallback(async (sourceName: string) => {
    if (!confirm(`Remove "${sourceName}" from the vault?`)) return
    await fetch('/api/employees/vault', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, sourceName }),
    })
    await loadVault()
  }, [userId, loadVault])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (tab === 'timeline' && timeline.length === 0) loadTimeline()
    if (tab === 'vault' && vaultDocs.length === 0) loadVault()
    if (tab === 'alerts') loadBriefs()
    if (tab === 'cortex') loadCortex()
    if (tab === 'calibration') loadCalibration()
  }, [tab])

  async function deleteBelief(beliefId: string) {
    if (!confirm('Remove this belief? This cannot be undone.')) return
    setDeleting(beliefId)
    try {
      await fetch('/api/employees/beliefs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, beliefId }),
      })
      await load()
    } finally {
      setDeleting(null)
    }
  }

  async function overrideConfidence(beliefId: string, current: number) {
    const input = prompt(`Override confidence (0–100, current: ${Math.round(current * 100)}):`)
    if (!input) return
    const val = parseInt(input)
    if (isNaN(val) || val < 0 || val > 100) { alert('Enter a number between 0 and 100'); return }
    await fetch('/api/employees/beliefs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, beliefId, confidence: val / 100 }),
    })
    await load()
  }

  // ── Styles ──

  const C = {
    bg:      '#0B0D14',
    surface: '#141620',
    card:    '#1B1E2C',
    border:  'rgba(148,163,184,0.08)',
    text:    '#E2E8F0',
    muted:   '#64748B',
    accent:  '#6366F1',
    green:   '#22C55E',
    amber:   '#F59E0B',
    red:     '#EF4444',
  }

  const panelStyle: React.CSSProperties = {
    minHeight: '100vh', background: C.bg, color: C.text,
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
  }

  const headerStyle: React.CSSProperties = {
    borderBottom: `1px solid ${C.border}`, padding: '16px 28px',
    display: 'flex', alignItems: 'center', gap: 16, background: C.surface,
    position: 'sticky', top: 0, zIndex: 10,
  }

  const contentStyle: React.CSSProperties = {
    maxWidth: 900, margin: '0 auto', padding: '32px 24px',
  }

  const statStyle: React.CSSProperties = {
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 4,
  }

  // ── Empty state ──

  if (!loading && data && data.total_beliefs === 0) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <Link href={isHired ? `/manage/${slug}` : `/employees/${slug}`} style={{ color: C.muted, textDecoration: 'none', fontSize: 13 }}>← {isHired ? 'Manage' : 'Back'}</Link>
          <span style={{ fontSize: 20 }}>{employeeEmoji}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{employeeName}</div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>MEMORY · DISTILLATION ENGINE</div>
          </div>
        </div>
        <div style={{ ...contentStyle, textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No memories yet</div>
          <div style={{ color: C.muted, fontSize: 15, maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
            {employeeName} will begin learning from your conversations once you've exchanged at least 8 messages.
            Every session is distilled into structured beliefs — preferences, decisions, patterns — that compound over time.
          </div>
          <Link href={`/employees/${slug}/interview`}
            style={{ display: 'inline-block', marginTop: 28, background: C.accent, color: '#fff',
              padding: '10px 22px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            Start a conversation →
          </Link>
        </div>
      </div>
    )
  }

  const visibleCategories = data
    ? (data.category_order ?? []).filter(cat => data.grouped[cat])
    : []

  const activeGroup = activeCategory && data?.grouped[activeCategory]
  const displayGroups = activeCategory && activeGroup
    ? { [activeCategory]: activeGroup }
    : data?.grouped ?? {}

  return (
    <div style={panelStyle}>

      {/* Header */}
      <div style={headerStyle}>
        <Link href={`/employees/${slug}`} style={{ color: C.muted, textDecoration: 'none', fontSize: 13 }}>← Back</Link>
        <span style={{ fontSize: 20 }}>{employeeEmoji}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{employeeName} · Memory</div>
          <div style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace', letterSpacing: '0.08em' }}>
            S1 DISTILLATION ENGINE · S2 COMPOUNDING KNOWLEDGE GRAPH
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          {(['beliefs', 'timeline', 'vault', 'alerts', 'cortex', 'calibration'] as const).map(t => {
            const label = t === 'beliefs' ? 'Beliefs' : t === 'timeline' ? 'Timeline' : t === 'vault' ? '📄 Vault' : t === 'alerts' ? '🔔 Alerts' : t === 'cortex' ? '🧠 Team' : '⚙ Trust'
            const unread = t === 'alerts' && briefs.filter((b: any) => !b.read_at).length
            return (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: '5px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: 'none',
                  background: tab === t ? C.accent : 'transparent',
                  color: tab === t ? '#fff' : C.muted,
                  borderBottom: tab === t ? 'none' : `1px solid ${C.border}`,
                  position: 'relative' }}>
                {label}
                {unread ? <span style={{ position: 'absolute', top: -4, right: -4, background: C.red,
                  color: '#fff', borderRadius: '50%', width: 14, height: 14, fontSize: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{unread}</span> : null}
              </button>
            )
          })}
          <button onClick={() => { load(); if (tab === 'timeline') loadTimeline(); if (tab === 'vault') loadVault(); if (tab === 'alerts') loadBriefs(); if (tab === 'cortex') loadCortex(); if (tab === 'calibration') loadCalibration() }}
            style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted,
              padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginLeft: 4 }}>
            Refresh
          </button>
        </div>
      </div>

      <div style={contentStyle}>

        {/* Stats bar */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
            <div style={statStyle}>
              <span style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 600, color: C.accent }}>
                {data.total_beliefs}
              </span>
              <span style={{ fontSize: 12, color: C.muted }}>total beliefs</span>
            </div>
            <div style={statStyle}>
              <span style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 600, color: C.green }}>
                {Object.keys(data.grouped).length}
              </span>
              <span style={{ fontSize: 12, color: C.muted }}>categories</span>
            </div>
            <div style={statStyle}>
              <span style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 600, color: data.conflicts > 0 ? C.amber : C.muted }}>
                {data.conflicts}
              </span>
              <span style={{ fontSize: 12, color: C.muted }}>conflicts flagged</span>
            </div>
            <div style={statStyle}>
              <span style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 600, color: data.stale > 0 ? C.red : C.muted }}>
                {data.stale}
              </span>
              <span style={{ fontSize: 12, color: C.muted }}>stale (30+ days)</span>
            </div>
          </div>
        )}

        {/* Distillation runs (beliefs tab only) */}
        {tab === 'beliefs' && showRuns && data?.recent_runs?.length > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.muted, letterSpacing: '0.1em', marginBottom: 14 }}>
              RECENT DISTILLATION RUNS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.recent_runs.map(run => (
                <div key={run.id} style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: C.text, marginBottom: 3 }}>
                        {run.summary ?? 'No summary recorded.'}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted }}>
                        +{run.beliefs_created} created · ~{run.beliefs_updated} reinforced · {run.beliefs_conflicted} conflicts
                        {run.skill_beliefs_extracted > 0 && ` · ${run.skill_beliefs_extracted} skills learned`}
                        {' '}· {run.raw_message_count} messages processed
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                      {run.completed_at ? new Date(run.completed_at).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category filter pills (beliefs tab only) */}
        {tab === 'beliefs' && data && visibleCategories.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
            <button
              onClick={() => setActiveCategory(null)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: 'none',
                background: !activeCategory ? C.accent : C.card, color: !activeCategory ? '#fff' : C.muted,
              }}>
              All
            </button>
            {visibleCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: 'none',
                  background: activeCategory === cat ? C.accent : C.card,
                  color: activeCategory === cat ? '#fff' : C.muted,
                }}>
                {data.grouped[cat]?.label ?? cat} ({data.grouped[cat]?.beliefs.length ?? 0})
              </button>
            ))}
          </div>
        )}

        {/* ── Timeline tab ── */}
        {tab === 'timeline' && (
          <div>
            {timelineLoading && (
              <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>Loading timeline…</div>
            )}
            {!timelineLoading && timeline.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>
                No timeline events yet. The timeline populates as your employee learns from sessions.
              </div>
            )}
            {!timelineLoading && timeline.length > 0 && (
              <div style={{ position: 'relative', paddingLeft: 24 }}>
                {/* Vertical line */}
                <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 1, background: C.border }} />

                {timeline.map((ev: any, i: number) => {
                  const dot = ev.type === 'distill_session' ? C.accent
                    : ev.type === 'belief_conflict' ? C.amber : C.green
                  const at = new Date(ev.at)
                  const dateStr = at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  const timeStr = at.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

                  return (
                    <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start' }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: dot, flexShrink: 0,
                        marginTop: 3, position: 'relative', zIndex: 1, border: `2px solid ${C.bg}` }} />
                      <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '11px 14px' }}>
                        {ev.type === 'distill_session' && (
                          <>
                            <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.accent, marginBottom: 4 }}>
                              DISTILLATION SESSION · {dateStr} {timeStr}
                            </div>
                            <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>
                              {ev.run.summary ?? 'Session processed.'}
                            </div>
                            <div style={{ fontSize: 11, color: C.muted }}>
                              +{ev.run.beliefs_created} new · {ev.run.beliefs_updated ?? 0} reinforced
                              {ev.run.skill_beliefs_extracted > 0 && ` · ${ev.run.skill_beliefs_extracted} skills`}
                              {' '}· {ev.run.raw_message_count} messages
                            </div>
                          </>
                        )}
                        {ev.type === 'belief_new' && (
                          <>
                            <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.green, marginBottom: 4 }}>
                              NEW BELIEF · {ev.belief.category?.replace(/_/g, ' ')} · {dateStr}
                            </div>
                            <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 3 }}>
                              {ev.belief.subject}
                            </div>
                            <div style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6 }}>
                              {ev.belief.belief}
                            </div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                              Confidence {Math.round(ev.belief.confidence * 100)}%
                            </div>
                          </>
                        )}
                        {ev.type === 'belief_conflict' && (
                          <>
                            <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.amber, marginBottom: 4 }}>
                              ⚠ CONFLICT FLAGGED · {ev.belief.category?.replace(/_/g, ' ')} · {dateStr}
                            </div>
                            <div style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 3 }}>
                              {ev.belief.subject}
                            </div>
                            <div style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, marginBottom: 6 }}>
                              New: {ev.belief.belief}
                            </div>
                            {ev.belief.conflict_note && (
                              <div style={{ fontSize: 12, color: C.amber, background: 'rgba(245,158,11,0.06)',
                                border: `1px solid rgba(245,158,11,0.15)`, borderRadius: 5, padding: '6px 9px' }}>
                                {ev.belief.conflict_note}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Beliefs tab ── */}
        {tab === 'beliefs' && <>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading beliefs…</div>
        )}

        {/* Belief groups */}
        {!loading && Object.entries(displayGroups).map(([cat, group]) => (
          <div key={cat} style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.muted, letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>
              {group.label} · {group.beliefs.length}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.beliefs.map((b: Belief) => {
                const fresh = freshnessBadge(b.last_validated_at)
                const isConflict = !!b.conflict_with_id
                return (
                  <div key={b.id}
                    style={{
                      background: isConflict ? 'rgba(245,158,11,0.04)' : C.card,
                      border: `1px solid ${isConflict ? 'rgba(245,158,11,0.25)' : C.border}`,
                      borderRadius: 10, padding: '14px 16px',
                    }}>

                    {/* Subject + confidence bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>{b.subject}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{
                          fontSize: 10, fontFamily: 'monospace', padding: '2px 6px', borderRadius: 4,
                          background: `${fresh.color}18`, color: fresh.color,
                        }}>{fresh.label}</span>
                        {isConflict && (
                          <span style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 6px', borderRadius: 4,
                            background: 'rgba(245,158,11,0.12)', color: C.amber }}>conflict</span>
                        )}
                      </div>
                    </div>

                    {/* Belief text */}
                    <div style={{ fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.6, marginBottom: 10 }}>
                      {b.belief}
                    </div>

                    {/* Conflict note */}
                    {b.conflict_note && (
                      <div style={{ fontSize: 12, color: C.amber, background: 'rgba(245,158,11,0.06)',
                        border: `1px solid rgba(245,158,11,0.15)`, borderRadius: 6, padding: '7px 10px', marginBottom: 10 }}>
                        ⚠ {b.conflict_note}
                      </div>
                    )}

                    {/* Confidence bar */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ height: 3, borderRadius: 2, background: confidenceBar(b.confidence), marginBottom: 3 }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted }}>
                        <span>Confidence {Math.round(b.confidence * 100)}%</span>
                        <span>Reinforced {b.reinforcement_count}×</span>
                      </div>
                    </div>

                    {/* Meta + actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>
                        {daysSince(b.last_validated_at)}d ago · {b.evidence ?? '—'}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => overrideConfidence(b.id, b.confidence)}
                          style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted,
                            padding: '3px 9px', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>
                          Override
                        </button>
                        <button
                          onClick={() => deleteBelief(b.id)}
                          disabled={deleting === b.id}
                          style={{ background: 'transparent', border: `1px solid rgba(239,68,68,0.2)`, color: C.red,
                            padding: '3px 9px', borderRadius: 5, fontSize: 11, cursor: 'pointer', opacity: deleting === b.id ? 0.5 : 1 }}>
                          {deleting === b.id ? '…' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        </>}{/* end beliefs tab */}

        {/* ── Alerts tab (PIN) ── */}
        {tab === 'alerts' && (
          <div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.muted, letterSpacing: '0.1em', marginBottom: 14 }}>
              PROACTIVE ALERTS · {briefs.filter((b: any) => !b.read_at && !b.dismissed_at).length} UNREAD
            </div>
            {briefsLoading && <div style={{ color: C.muted, fontSize: 13, padding: 20 }}>Loading…</div>}
            {!briefsLoading && briefs.length === 0 && (
              <div style={{ color: C.muted, fontSize: 13, padding: 24, textAlign: 'center',
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                No alerts yet. After a few sessions, {employeeName} will proactively surface patterns, conflicts, and updates here.
              </div>
            )}
            {!briefsLoading && briefs.map((brief: any) => {
              const urgencyColor = { critical: C.red, high: C.amber, normal: C.accent, low: C.muted }[brief.urgency as string] ?? C.muted
              const isUnread = !brief.read_at && !brief.dismissed_at
              return (
                <div key={brief.id} style={{
                  background: isUnread ? `${urgencyColor}08` : C.card,
                  border: `1px solid ${isUnread ? urgencyColor + '30' : C.border}`,
                  borderLeft: `3px solid ${urgencyColor}`,
                  borderRadius: 10, padding: '14px 16px', marginBottom: 10,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: urgencyColor,
                          background: urgencyColor + '18', padding: '2px 7px', borderRadius: 4 }}>
                          {brief.urgency.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>
                          {new Date(brief.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                        {brief.title}
                      </div>
                      <div style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6 }}>
                        {brief.body}
                      </div>
                    </div>
                    <button onClick={() => dismissBrief(brief.id)}
                      style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted,
                        padding: '3px 9px', borderRadius: 5, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                      Dismiss
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Vault tab ── */}
        {tab === 'vault' && (
          <div>
            {/* Upload form */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.muted, letterSpacing: '0.1em', marginBottom: 16 }}>
                ADD DOCUMENT TO VAULT
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 10 }}>
                <input
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  placeholder="Document name (e.g. Company SOP, Product FAQ)"
                  style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: '9px 12px',
                    color: C.text, fontSize: 13, outline: 'none' }}
                />
                <select
                  value={uploadType}
                  onChange={e => setUploadType(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: '9px 12px',
                    color: C.text, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                  <option value="text">Plain text</option>
                  <option value="sop">SOP</option>
                  <option value="playbook">Playbook</option>
                  <option value="product_catalog">Product catalog</option>
                  <option value="org_chart">Org chart</option>
                  <option value="notion">Notion export</option>
                </select>
              </div>
              <textarea
                value={uploadContent}
                onChange={e => setUploadContent(e.target.value)}
                placeholder="Paste document content here…"
                rows={8}
                style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7,
                  padding: '10px 12px', color: C.text, fontSize: 13, lineHeight: 1.6, outline: 'none',
                  resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              {uploadError && (
                <div style={{ fontSize: 12, color: C.red, marginTop: 8 }}>{uploadError}</div>
              )}
              {uploadSuccess && (
                <div style={{ fontSize: 12, color: C.green, marginTop: 8 }}>✓ {uploadSuccess}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <div style={{ fontSize: 11, color: C.muted }}>
                  Max 50,000 words · Shared with {employeeName} only
                </div>
                <button onClick={uploadDoc} disabled={uploading}
                  style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 7,
                    padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.6 : 1 }}>
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </div>

            {/* Document list */}
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.muted, letterSpacing: '0.1em', marginBottom: 12 }}>
              VAULT CONTENTS · {vaultDocs.length} DOCUMENT{vaultDocs.length !== 1 ? 'S' : ''}
            </div>
            {vaultLoading && <div style={{ color: C.muted, fontSize: 13, padding: 20 }}>Loading…</div>}
            {!vaultLoading && vaultDocs.length === 0 && (
              <div style={{ color: C.muted, fontSize: 13, padding: 24, textAlign: 'center',
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                No documents yet. Upload a SOP, playbook, or any text and {employeeName} will reference it during conversations.
              </div>
            )}
            {!vaultLoading && vaultDocs.map((doc: any) => (
              <div key={doc.source_name}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
                  padding: '14px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>
                    {doc.source_name}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>
                    {doc.source_type} · {doc.total_chunks} chunk{doc.total_chunks !== 1 ? 's' : ''} · {doc.total_words.toLocaleString()} words
                    {' '}· {doc.employee_slug ? `${employeeName} only` : 'shared'} · {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={() => deleteDoc(doc.source_name)}
                  style={{ background: 'transparent', border: `1px solid rgba(239,68,68,0.2)`, color: C.red,
                    padding: '4px 11px', borderRadius: 5, fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>
                  Remove
                </button>
              </div>
            ))}

            <div style={{ marginTop: 20, fontSize: 11, color: C.muted, lineHeight: 1.8 }}>
              <strong style={{ color: '#94a3b8' }}>Security note:</strong> Documents are always untrusted — {employeeName} cites them
              but never asserts them as personal knowledge. If a document contradicts a belief, the conflict is surfaced to you.
            </div>
          </div>
        )}

        {/* ── Cortex tab (CEC) ── */}
        {tab === 'cortex' && (
          <div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.muted, letterSpacing: '0.1em', marginBottom: 14 }}>
              TEAM KNOWLEDGE · CROSS-EMPLOYEE CORTEX · {cortexEntries.length} ENTR{cortexEntries.length !== 1 ? 'IES' : 'Y'}
            </div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 20, maxWidth: 600 }}>
              When any AI employee learns something relevant to the whole organization — a market signal, a key decision,
              a product update — it's automatically shared here. Every employee reads the cortex before each session,
              so knowledge discovered by one propagates to all.
            </div>
            {cortexLoading && <div style={{ color: C.muted, fontSize: 13, padding: 20 }}>Loading…</div>}
            {!cortexLoading && cortexEntries.length === 0 && (
              <div style={{ color: C.muted, fontSize: 13, padding: 24, textAlign: 'center',
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                No shared intelligence yet. After sessions produce high-confidence business context or market signals,
                they'll appear here and be shared across all your AI employees.
              </div>
            )}
            {!cortexLoading && cortexEntries.map((entry: any) => {
              const typeColors: Record<string, string> = {
                org_decision:    C.accent,
                customer_insight:'#8b5cf6',
                market_signal:   C.amber,
                process_change:  '#06b6d4',
                product_update:  C.green,
                team_context:    '#64748b',
              }
              const typeColor = typeColors[entry.entry_type] ?? C.muted
              const typeLabel: Record<string, string> = {
                org_decision:    'Org Decision',
                customer_insight:'Customer Insight',
                market_signal:   'Market Signal',
                process_change:  'Process Change',
                product_update:  'Product Update',
                team_context:    'Team Context',
              }
              const consumed = entry.consumed_by_me
              const consumedCount = (entry.consumed_by ?? []).length

              return (
                <div key={entry.id} style={{
                  background: C.card, border: `1px solid ${consumed ? C.border : typeColor + '30'}`,
                  borderLeft: `3px solid ${typeColor}`,
                  borderRadius: 10, padding: '14px 16px', marginBottom: 10,
                  opacity: consumed ? 0.7 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: typeColor,
                          background: typeColor + '18', padding: '2px 7px', borderRadius: 4 }}>
                          {typeLabel[entry.entry_type] ?? entry.entry_type}
                        </span>
                        <span style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>
                          via {entry.source_employee_slug}
                        </span>
                        {consumed && (
                          <span style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>
                            · seen
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 5 }}>
                        {entry.title}
                      </div>
                      <div style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6 }}>
                        {entry.body}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 8, fontFamily: 'monospace' }}>
                        Confidence {Math.round(entry.confidence * 100)}%
                        · seen by {consumedCount} employee{consumedCount !== 1 ? 's' : ''}
                        · {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Calibration tab (S7 CAL) ── */}
        {tab === 'calibration' && (
          <div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.muted, letterSpacing: '0.1em', marginBottom: 14 }}>
              TRUST CALIBRATION · AUTONOMY ENGINE
            </div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 24, maxWidth: 600 }}>
              The system adjusts how much autonomy {employeeName} earns based on your approval patterns.
              The trust score evolves automatically — or you can override it with the dial below.
            </div>

            {calLoading && <div style={{ color: C.muted, fontSize: 13, padding: 20 }}>Loading…</div>}

            {!calLoading && calibration && (
              <>
                {/* Trust + Autonomy stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 22px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 600,
                      color: calibration.trust_color ?? C.accent, marginBottom: 4 }}>
                      {Math.round((calibration.trust_score ?? 0.5) * 100)}%
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>trust score</div>
                  </div>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 22px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 600, color: C.accent, marginBottom: 4 }}>
                      {calibration.autonomy_label ?? 'Guided'}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>autonomy level{calibration.system_managed ? ' · auto' : ' · pinned'}</div>
                  </div>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 22px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 600,
                      color: calibration.approval_rate != null ? C.green : C.muted, marginBottom: 4 }}>
                      {calibration.approval_rate != null ? `${calibration.approval_rate}%` : '—'}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>approval rate · {calibration.total_proposals ?? 0} actions</div>
                  </div>
                </div>

                {/* Autonomy dial */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 22, marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 16 }}>
                    Autonomy Dial
                    {calibration.system_managed && (
                      <span style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace', marginLeft: 10 }}>
                        SYSTEM MANAGED · adjusts automatically
                      </span>
                    )}
                    {!calibration.system_managed && (
                      <span style={{ fontSize: 10, color: C.amber, fontFamily: 'monospace', marginLeft: 10 }}>
                        OWNER OVERRIDE ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Visual dial track */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ height: 6, borderRadius: 3, background: C.border, position: 'relative', marginBottom: 6 }}>
                      <div style={{
                        position: 'absolute', left: 0, height: '100%', borderRadius: 3,
                        width: `${(autonomyDial ?? 0.3) * 100}%`,
                        background: `linear-gradient(to right, #22c55e, ${C.accent})`,
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>
                      <span>Supervised</span><span>Guided</span><span>Collaborative</span><span>Trusted</span><span>Autonomous</span>
                    </div>
                  </div>

                  <input
                    type="range" min={0} max={100} step={5}
                    value={Math.round((autonomyDial ?? 0.3) * 100)}
                    onChange={e => setAutonomyDial(parseInt(e.target.value) / 100)}
                    style={{ width: '100%', cursor: 'pointer', marginBottom: 14, accentColor: C.accent }}
                  />

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setAutonomy(autonomyDial)}
                      disabled={savingAutonomy}
                      style={{ padding: '7px 18px', borderRadius: 7, background: C.accent, color: '#fff', border: 'none',
                        fontSize: 12, fontWeight: 600, cursor: savingAutonomy ? 'not-allowed' : 'pointer', opacity: savingAutonomy ? 0.6 : 1 }}>
                      {savingAutonomy ? 'Saving…' : `Set to ${Math.round((autonomyDial ?? 0.3) * 100)}%`}
                    </button>
                    {!calibration.system_managed && (
                      <button
                        onClick={resetAutonomy}
                        disabled={savingAutonomy}
                        style={{ padding: '7px 18px', borderRadius: 7, background: 'transparent',
                          border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, cursor: 'pointer' }}>
                        Let system manage
                      </button>
                    )}
                  </div>
                </div>

                {/* Policy by action type */}
                {calibration.policy && (
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.muted, letterSpacing: '0.1em', marginBottom: 14 }}>
                      CURRENT POLICY BY ACTION TYPE
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(calibration.policy).map(([type, desc]) => (
                        <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                          <span style={{ fontSize: 12, color: C.text, fontFamily: 'monospace' }}>
                            {type.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: 12, color: C.muted }}>{String(desc)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!calLoading && !calibration && (
              <div style={{ color: C.muted, fontSize: 13, padding: 24, textAlign: 'center',
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                No calibration data yet. Starts accumulating after your first action proposal.
              </div>
            )}

            {/* Audit trail */}
            {auditTrail.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.muted, letterSpacing: '0.1em', marginBottom: 12 }}>
                  ACTION AUDIT TRAIL · {auditTrail.length} RECORDS
                </div>
                {auditTrail.map((action: any) => {
                  const statusColor: Record<string, string> = {
                    approved: C.green, done: C.green,
                    rejected: C.red,  failed: C.red,
                    pending: C.amber, executing: C.accent,
                  }
                  const color = statusColor[action.status] ?? C.muted
                  return (
                    <div key={action.id}
                      style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`,
                        borderRadius: 10, padding: '12px 16px', marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                            <span style={{ fontSize: 10, color, background: color + '18', fontFamily: 'monospace',
                              padding: '2px 7px', borderRadius: 4 }}>{action.status.toUpperCase()}</span>
                            <span style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>
                              {action.action_type.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>
                            {action.title}
                          </div>
                          {action.rejection_reason && (
                            <div style={{ fontSize: 12, color: C.muted }}>Reason: {action.rejection_reason}</div>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          {new Date(action.proposed_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* Explainer footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, marginTop: 16 }}>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.8, maxWidth: 620 }}>
            <strong style={{ color: '#94a3b8' }}>How this works:</strong> After every session, {employeeName} distills the conversation
            into structured beliefs — never storing what you said verbatim, only what was learned.
            Confidence decays weekly without reinforcement (Ebbinghaus forgetting curve).
            Conflicting beliefs are flagged rather than silently overwritten.
            You can remove any belief or override its confidence at any time.
          </div>
        </div>

      </div>
    </div>
  )
}
