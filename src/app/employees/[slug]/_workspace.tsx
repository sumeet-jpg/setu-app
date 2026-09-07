'use client'
// @ts-nocheck

import { useState, useRef, useEffect, useCallback } from 'react'
import { getStuntTitle } from '@/lib/employees/profiles'
import { TOOL_REGISTRY, toolLogoUrl, employeeToolSlugs, splitToolsByConnectability } from '@/lib/tools/registry'
import Link from 'next/link'
import { authFetch } from '@/lib/manage-token-client'

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmployeeOpinion { belief: string; reality: string }
interface EmployeeCase { title: string; summary: string }
interface EmployeeMode { name: string; desc: string }
interface CharacterCore {
  opinions: EmployeeOpinion[]
  nonNegotiables: string[]
  modes: EmployeeMode[]
  cases: EmployeeCase[]
}
interface AutonomyMode { mode: string; tasks: string[] }

interface Employee {
  slug: string; name: string; title: string; dept: string; emoji: string
  color: string; years: number; tagline: string; intro: string
  agentCount: number; pricing: { monthly: number | 'custom'; label: string }
  knows: string[]; capabilities: any[]; tools: any[]; howItWorks: any[]
  // Apprenticeship Architecture — optional, populated per employee
  characterCore?: CharacterCore
  watchPatterns?: string[]
  kpis?: string[]
  autonomyModes?: AutonomyMode[]
}

interface ConnectedTool {
  slug: string; name: string; category: string; logo: string; domain: string
  connected_at: string; last_used_at?: string
}

interface ApprovalGate {
  tool_use_id: string; action: string; details: string
  affected: string; reversible: boolean
}

interface ChatMsg {
  role: 'user' | 'assistant' | 'system'
  content: string
  toolEvents?: ToolEvent[]
  approvalGate?: ApprovalGate
  taskId?: string
}

interface ToolEvent {
  type: 'executing' | 'result' | 'complete'
  tool?: string; method?: string; path?: string; label?: string; ok?: boolean; status?: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('setu_user_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('setu_user_id', id) }
  return id
}

// ── Logo component ────────────────────────────────────────────────────────────

function ToolLogo({ slug, name, size = 20 }: { slug: string; name: string; size?: number }) {
  const [err, setErr] = useState(false)
  const url = toolLogoUrl(slug)
  if (err || !url) {
    return (
      <div style={{ width: size, height: size, borderRadius: 4, background: '#E3E1DA',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.45, color: '#78746E', fontWeight: 700, flexShrink: 0 }}>
        {name[0]}
      </div>
    )
  }
  return (
    <img src={url} alt={name} width={size} height={size}
      style={{ borderRadius: 4, objectFit: 'contain', flexShrink: 0, background: '#fff' }}
      onError={() => setErr(true)} />
  )
}

// ── Connect modal ─────────────────────────────────────────────────────────────

function ConnectModal({ toolSlug, onClose, onConnected }: {
  toolSlug: string; onClose: () => void; onConnected: (slug: string) => void
}) {
  const toolDef = TOOL_REGISTRY.find(t => t.slug === toolSlug)
  const [key, setKey] = useState('')
  const [config, setConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!toolDef) return null

  // Extra config fields some tools need
  const extraFields: Record<string, { label: string; placeholder: string; key: string }[]> = {
    'mailchimp': [{ label: 'Datacenter (from end of API key, e.g. us21)', placeholder: 'us21', key: 'dc' }],
    'activecampaign': [{ label: 'Account URL (e.g. mycompany)', placeholder: 'mycompany', key: 'account' }],
    'shopify': [{ label: 'Store name (e.g. mystore)', placeholder: 'mystore', key: 'store' }],
    'chargebee': [{ label: 'Site name (e.g. mycompany-test)', placeholder: 'mycompany-test', key: 'site' }],
    'bamboohr': [{ label: 'Company subdomain', placeholder: 'mycompany', key: 'company' }],
    'zendesk': [{ label: 'Subdomain (e.g. mycompany)', placeholder: 'mycompany', key: 'subdomain' }],
    'freshdesk': [{ label: 'Domain (e.g. mycompany)', placeholder: 'mycompany', key: 'domain' }],
    'jira': [{ label: 'Domain (e.g. mycompany)', placeholder: 'mycompany', key: 'domain' }],
  }
  const extras = extraFields[toolSlug] ?? []

  const handleConnect = async () => {
    if (!key.trim()) { setError('API key is required'); return }
    setLoading(true); setError('')
    try {
      const res = await authFetch('/api/tools/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_slug: toolSlug, api_key: key.trim(), config }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to connect'); setLoading(false); return }
      onConnected(toolSlug)
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,12,9,0.55)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#FFFFFF', border: '1.5px solid #E3E1DA', borderRadius: 16,
        padding: 28, maxWidth: 480, width: '100%', color: '#0D0C09',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <ToolLogo slug={toolSlug} name={toolDef.name} size={32} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Connect {toolDef.name}</div>
            <div style={{ fontSize: 12, color: '#78746E' }}>{toolDef.category}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none',
            color: '#78746E', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ fontSize: 13, color: '#78746E', marginBottom: 16,
          background: '#F6F5F1', borderRadius: 8, padding: '10px 14px', border: '1px solid #E3E1DA' }}>
          <strong style={{ color: '#0D0C09' }}>How to get your key:</strong><br/>
          {toolDef.authHint}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: '#78746E', display: 'block', marginBottom: 6 }}>
            {toolDef.authLabel}
          </label>
          <input
            value={key} onChange={e => setKey(e.target.value)}
            placeholder={toolDef.authPlaceholder} type="password"
            style={{ width: '100%', background: '#F6F5F1', border: '1.5px solid #E3E1DA',
              borderRadius: 8, padding: '10px 12px', color: '#0D0C09', fontSize: 13,
              outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {extras.map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: '#78746E', display: 'block', marginBottom: 6 }}>{f.label}</label>
            <input value={config[f.key] ?? ''} onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              style={{ width: '100%', background: '#F6F5F1', border: '1.5px solid #E3E1DA',
                borderRadius: 8, padding: '10px 12px', color: '#0D0C09', fontSize: 13,
                outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}

        {error && <div style={{ color: '#DC2626', fontSize: 12, marginBottom: 12 }}>{error}</div>}

        <div style={{ fontSize: 11, color: '#9E9891', marginBottom: 16 }}>
          🔒 Your key is AES-256-GCM encrypted at rest. It is never logged or sent to third parties.
        </div>

        <button onClick={handleConnect} disabled={loading}
          style={{ width: '100%', background: '#0E5C34', color: '#fff', border: 'none',
            borderRadius: 8, padding: '11px 0', fontWeight: 700, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Connecting…' : `Connect ${toolDef.name}`}
        </button>
      </div>
    </div>
  )
}

// ── Approval card ─────────────────────────────────────────────────────────────

function ApprovalCard({ gate, taskId, onDecision }: {
  gate: ApprovalGate; taskId: string; onDecision: (decision: 'approved' | 'rejected') => void
}) {
  const [loading, setLoading] = useState<'approved' | 'rejected' | null>(null)

  const decide = async (decision: 'approved' | 'rejected') => {
    setLoading(decision)
    try {
      await fetch(`/api/tools/tasks/${taskId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: getUserId(), decision, tool_use_id: gate.tool_use_id }),
      })
      onDecision(decision)
    } finally { setLoading(null) }
  }

  return (
    <div style={{ background: '#FFFBEB', border: '1.5px solid #F59E0B40', borderRadius: 12,
      padding: 16, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <span style={{ fontWeight: 700, color: '#B45309', fontSize: 14 }}>Approval Required</span>
        {!gate.reversible && (
          <span style={{ fontSize: 11, background: '#FEE2E2', color: '#B91C1C',
            borderRadius: 4, padding: '2px 6px', marginLeft: 'auto' }}>Irreversible</span>
        )}
      </div>
      <div style={{ fontWeight: 600, fontSize: 14, color: '#0D0C09', marginBottom: 8 }}>{gate.action}</div>
      <div style={{ fontSize: 13, color: '#78746E', marginBottom: 6, lineHeight: 1.6 }}>{gate.details}</div>
      <div style={{ fontSize: 12, color: '#9E9891', marginBottom: 14 }}>
        <strong style={{ color: '#78746E' }}>Affects:</strong> {gate.affected}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => decide('approved')} disabled={!!loading}
          style={{ flex: 1, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8,
            padding: '9px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            opacity: loading ? 0.6 : 1 }}>
          {loading === 'approved' ? 'Approving…' : '✓ Approve'}
        </button>
        <button onClick={() => decide('rejected')} disabled={!!loading}
          style={{ flex: 1, background: '#F6F5F1', color: '#78746E', border: '1.5px solid #E3E1DA',
            borderRadius: 8, padding: '9px 0', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            opacity: loading ? 0.6 : 1 }}>
          {loading === 'rejected' ? 'Rejecting…' : '✕ Reject'}
        </button>
      </div>
    </div>
  )
}

// ── Tool event pill ───────────────────────────────────────────────────────────

function ToolEventPill({ event }: { event: ToolEvent }) {
  const color = event.type === 'complete' ? '#16A34A'
    : event.ok === false ? '#EF4444' : '#0E5C34'
  const icon = event.type === 'complete' ? '✓'
    : event.ok === false ? '✗' : '⟳'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11,
      background: color + '18', color, borderRadius: 20, padding: '3px 10px',
      border: `1px solid ${color}30`, marginBottom: 4 }}>
      <span style={{ fontWeight: 700 }}>{icon}</span>
      <span>{event.label ?? `${event.method ?? ''} ${event.tool ?? ''}`}</span>
      {event.status ? <span style={{ opacity: 0.7 }}>{event.status}</span> : null}
    </div>
  )
}

// ── Apprenticeship Architecture detail-panel helpers ─────────────────────────
// Small, shared building blocks for the tap-to-expand systems map — every
// system's detail content used the same header/label/grid shapes before,
// just copy-pasted 11 times; factored out here rather than repeated again.

function SystemHeader({ color, eyebrow, title, desc, badge, badgeColor, badgeBg, badgeBorder }: {
  color: string; eyebrow: string; title: string; desc: string
  badge: string; badgeColor: string; badgeBg: string; badgeBorder: string
}) {
  const INK = '#0D0C09'
  const MUTED = '#78746E'
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{eyebrow}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: INK, letterSpacing: '-0.04em', lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 8, lineHeight: 1.65, maxWidth: 560 }}>{desc}</div>
      </div>
      <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: badgeColor,
        background: badgeBg, padding: '5px 12px', borderRadius: 20, border: `1px solid ${badgeBorder}`, whiteSpace: 'nowrap' }}>{badge}</div>
    </div>
  )
}

function SectionLabel({ children, muted }: { children: React.ReactNode; muted: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{children}</div>
  )
}

function PlaceholderGrid({ items, color, bg, border }: {
  items: { icon: string; label: string; desc: string }[]
  color: string; bg?: string; border?: string
}) {
  const INK = '#0D0C09'
  const MUTED = '#78746E'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
      {items.map(item => (
        <div key={item.label} style={{ background: bg ?? color + '08', borderRadius: 10, padding: '14px 16px', border: `1px solid ${border ?? color + '20'}` }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>{item.icon}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: INK, marginBottom: 4 }}>{item.label}</div>
          <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{item.desc}</div>
        </div>
      ))}
    </div>
  )
}

// ── Main workspace ────────────────────────────────────────────────────────────

export default function EmployeeWorkspace({ employee: e }: { employee: Employee }) {
  const stuntTitle = getStuntTitle(e.name)
  const userId = typeof window !== 'undefined' ? getUserId() : ''

  // Subscription state — check if user has already hired this employee
  const [subStatus, setSubStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    fetch(`/api/manage/subscription?userId=${userId}&slug=${e.slug}`)
      .then(r => r.json())
      .then(d => { if (d.status) setSubStatus(d.status) })
      .catch(() => {})
  }, [userId, e.slug])

  const isHired = subStatus === 'trial' || subStatus === 'active' || subStatus === 'paused'

  // Tool state
  const [connected, setConnected] = useState<ConnectedTool[]>([])
  const [loadingTools, setLoadingTools] = useState(true)
  const [connectingSlug, setConnectingSlug] = useState<string | null>(null)

  // Chat state
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content: `Hi! I'm **${e.name}**, your ${e.title} ${stuntTitle}.\n\n${e.tagline}\n\nConnect your tools in the panel on the left, then tell me what you need — I'll plan it, get your approval on anything important, and execute it using your actual accounts.`,
    }
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState<{ gate: ApprovalGate; taskId: string } | null>(null)
  // Which node is expanded in the Apprenticeship Architecture systems map below.
  const [openSystem, setOpenSystem] = useState<number | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  // executeTask's useCallback deps don't include msgs (by design — see the
  // functional setMsgs updates throughout), so a plain read of msgs inside it
  // would be stale. This ref gives the interview-mode request body access to
  // the actual latest conversation without adding msgs as a dependency.
  const msgsRef = useRef<ChatMsg[]>(msgs)
  useEffect(() => { msgsRef.current = msgs }, [msgs])

  // Employee's expected tools
  const expectedSlugs = employeeToolSlugs(e.tools)
  // Split so we can be honest when an employee has claimed tool fluency the
  // platform can't actually back with a real integration — previously this
  // section just vanished silently when expectedSlugs was empty, while the
  // "How I Work" copy right below kept making unqualified automation claims.
  const { advisoryOnly: advisoryOnlyTools } = splitToolsByConnectability(e.tools)

  // Load connected tools on mount
  useEffect(() => {
    if (!userId) return
    authFetch(`/api/tools/connections?user_id=${userId}`)
      .then(r => r.json())
      .then(d => { setConnected(d.connections ?? []); setLoadingTools(false) })
      .catch(() => setLoadingTools(false))
  }, [userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  // ── Execute task ────────────────────────────────────────────────────────────

  const executeTask = useCallback(async (
    taskText: string,
    resumeTaskId?: string,
    approvalDecision?: { approved: boolean; tool_use_id: string }
  ) => {
    if ((!taskText.trim() && !approvalDecision) || streaming) return
    setStreaming(true)
    setPendingApproval(null)

    if (!resumeTaskId && !approvalDecision) {
      setMsgs(m => [...m, { role: 'user', content: taskText }])
    }

    let assistantContent = ''
    const toolEvents: ToolEvent[] = []
    let currentApproval: ApprovalGate | null = null
    let resolvedTaskId = resumeTaskId ?? null

    setMsgs(m => [...m, { role: 'assistant', content: '', toolEvents: [] }])

    abortRef.current = new AbortController()

    try {
      // Not-yet-hired visitors have no manage-token (only issued at hire —
      // see manage-token.ts) and can't run real tool actions anyway, so this
      // was previously always calling /execute regardless of hire state:
      // that route 401s hard for anyone without a token, and the response
      // was fed straight into the SSE reader below with no status check —
      // a 401 JSON body doesn't start with "data: ", so every line was
      // silently skipped and the assistant bubble just stayed empty forever,
      // with no error ever shown. The free "Interview" promised on this page
      // has its own real endpoint (/api/employees/interview — plain chat,
      // no tools, no approval gate, its own daily cap) which never needed a
      // manage-token; route to it here instead.
      const url = isHired ? `/api/employees/${e.slug}/execute` : '/api/employees/interview'
      const body: any = isHired
        ? (approvalDecision
            ? { task_id: resumeTaskId, approval_result: approvalDecision }
            : { task: taskText, ...(resumeTaskId ? { task_id: resumeTaskId } : {}) })
        : {
            slug: e.slug,
            userId,
            messages: [...msgsRef.current, { role: 'user', content: taskText }]
              .filter(m => m.role === 'user' || m.role === 'assistant')
              .map(m => ({ role: m.role, content: m.content })),
          }

      const res = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        let errMsg = 'Something went wrong. Please try again.'
        try {
          const errBody = await res.json()
          errMsg = res.status === 401
            ? (isHired ? 'Your session expired — please refresh the page and try again.'
                       : 'Free interview needs a moment to reconnect — please refresh the page and try again.')
            : (errBody.error || errMsg)
        } catch { /* body wasn't JSON — keep the generic message */ }
        setMsgs(m => {
          const copy = [...m]
          const last = copy[copy.length - 1]
          if (last?.role === 'assistant') last.content = errMsg
          return copy
        })
        setStreaming(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') break

          try {
            const event = JSON.parse(raw)

            if (!isHired) {
              // Interview mode is plain streamed text — no task lifecycle,
              // no tool calls, no approval gate (there's nothing real to
              // execute pre-hire). Different wire format from execute's
              // events: OpenAI-style delta chunks.
              const delta = event?.choices?.[0]?.delta?.content
              if (delta) {
                assistantContent += delta
                setMsgs(m => {
                  const copy = [...m]
                  const last = copy[copy.length - 1]
                  if (last?.role === 'assistant') last.content = assistantContent
                  return copy
                })
              }
              continue
            }

            if (event.type === 'task_created') {
              resolvedTaskId = event.task_id
              setCurrentTaskId(event.task_id)
            }

            if (event.type === 'text') {
              assistantContent += event.content
              setMsgs(m => {
                const copy = [...m]
                const last = copy[copy.length - 1]
                if (last?.role === 'assistant') last.content = assistantContent
                return copy
              })
            }

            if (event.type === 'executing') {
              const ev: ToolEvent = { type: 'executing', ...event }
              toolEvents.push(ev)
              setMsgs(m => {
                const copy = [...m]
                const last = copy[copy.length - 1]
                if (last?.role === 'assistant') last.toolEvents = [...toolEvents]
                return copy
              })
            }

            if (event.type === 'tool_result') {
              const last = toolEvents[toolEvents.length - 1]
              if (last) { last.ok = event.ok; last.status = event.status }
              setMsgs(m => {
                const copy = [...m]
                const lastMsg = copy[copy.length - 1]
                if (lastMsg?.role === 'assistant') lastMsg.toolEvents = [...toolEvents]
                return copy
              })
            }

            if (event.type === 'approval_required') {
              currentApproval = {
                tool_use_id: event.tool_use_id,
                action: event.action,
                details: event.details,
                affected: event.affected,
                reversible: event.reversible,
              }
              if (resolvedTaskId) {
                setPendingApproval({ gate: currentApproval, taskId: resolvedTaskId })
                setMsgs(m => {
                  const copy = [...m]
                  const lastMsg = copy[copy.length - 1]
                  if (lastMsg?.role === 'assistant') {
                    lastMsg.approvalGate = currentApproval!
                    lastMsg.taskId = resolvedTaskId!
                  }
                  return copy
                })
              }
            }

            if (event.type === 'complete') {
              setMsgs(m => {
                const copy = [...m]
                const lastMsg = copy[copy.length - 1]
                if (lastMsg?.role === 'assistant') {
                  lastMsg.toolEvents = [...toolEvents, { type: 'complete', label: 'Task complete' }]
                }
                return copy
              })
              setCurrentTaskId(null)
              setPendingApproval(null)
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMsgs(m => {
          const copy = [...m]
          const last = copy[copy.length - 1]
          if (last?.role === 'assistant' && !last.content) {
            last.content = 'Something went wrong. Please try again.'
          }
          return copy
        })
      }
    } finally {
      setStreaming(false)
    }
  }, [streaming, userId, e.slug, pendingApproval, isHired])

  const handleSend = () => {
    const text = input.trim()
    setInput('')
    if (text) executeTask(text)
  }

  const handleApprovalDecision = (decision: 'approved' | 'rejected') => {
    if (!pendingApproval) return
    const approved = decision === 'approved'
    setMsgs(m => [...m, { role: 'system', content: approved ? `✓ Approved: ${pendingApproval.gate.action}` : `✕ Rejected: ${pendingApproval.gate.action}` }])
    // Both branches call the server so the pending task_approvals row and
    // employee_tasks.status actually resolve — a reject that only updates
    // local UI state left the task stuck at 'awaiting_approval' forever
    // and Claude never learned the action was declined.
    executeTask('', pendingApproval.taskId, { approved, tool_use_id: pendingApproval.gate.tool_use_id })
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── Disconnect tool ──────────────────────────────────────────────────────────

  const disconnectTool = async (slug: string) => {
    await authFetch('/api/tools/connect', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_slug: slug }),
    })
    setConnected(c => c.filter(t => t.slug !== slug))
  }

  const connectedSlugs = new Set(connected.map(t => t.slug))

  // ── Render ───────────────────────────────────────────────────────────────────

  const scrollToInterview = () => {
    document.getElementById('interview-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  const BG = '#F6F5F1'
  const INK = '#0D0C09'
  const MUTED = '#78746E'
  const GRAY = '#E3E1DA'
  const DIM = '#9E9891'

  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @media (max-width: 768px) {
          .setu-ws-nav-mid { display: none !important; }
          .setu-ws-nav-mem { display: none !important; }
          .setu-ws-hero { grid-template-columns: 1fr !important; gap: 24px !important; }
          .setu-ws-pricing-card { position: static !important; }
          .setu-ws-caps { grid-template-columns: 1fr !important; }
          .setu-ws-pad { padding: 28px 16px 0 !important; }
          .setu-ws-sys-header { flex-direction: column !important; gap: 8px !important; }
          .setu-ws-trust-grid { grid-template-columns: repeat(2,1fr) !important; }
          .setu-ws-chat-layout { grid-template-columns: 1fr !important; height: auto !important; min-height: 600px !important; }
          .setu-ws-chat-layout > aside { border-right: none !important; border-bottom: 1.5px solid #E3E1DA !important; max-height: 180px; overflow: auto; }
          .setu-ws-chat-layout > aside:last-child { display: none; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
        height: 56, borderBottom: `1px solid ${GRAY}`, background: '#fff', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/employees" style={{ color: MUTED, textDecoration: 'none', fontSize: 13, whiteSpace: 'nowrap' }}>← All Employees</Link>
        <span className="setu-ws-nav-mid" style={{ color: GRAY }}>/</span>
        <span className="setu-ws-nav-mid" style={{ color: INK, fontSize: 13, fontWeight: 600 }}>{e.name}</span>
        <span className="setu-ws-nav-mid" style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
          background: e.color + '14', color: e.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {stuntTitle}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href={`/employees/${e.slug}/memory`} className="setu-ws-nav-mem"
            style={{ background: 'none', border: `1.5px solid ${GRAY}`, borderRadius: 8, padding: '6px 14px',
              fontWeight: 500, fontSize: 12, textDecoration: 'none', color: MUTED, display: 'flex', alignItems: 'center', gap: 5 }}>
            🧠 Memory
          </Link>
          <button onClick={scrollToInterview}
            style={{ background: 'none', border: `1.5px solid ${GRAY}`, borderRadius: 8, padding: '6px 16px',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', color: INK, whiteSpace: 'nowrap' }}>
            Interview Free
          </button>
          <Link href={`/employees/${e.slug}/hire`}
            style={{ background: e.color, color: '#fff', border: 'none', borderRadius: 8,
              padding: '7px 18px', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-block', whiteSpace: 'nowrap' }}>
            Hire →
          </Link>
        </div>
      </nav>

      {/* ── PROSPECTUS ── */}
      <div className="setu-ws-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 32px 0' }}>

        {/* Hero row */}
        <div className="setu-ws-hero" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48, alignItems: 'flex-start', marginBottom: 56 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: e.color + '14',
                border: `2px solid ${e.color}25`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 34, flexShrink: 0 }}>
                {e.emoji}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: e.color, letterSpacing: '0.08em',
                  textTransform: 'uppercase', marginBottom: 4 }}>{e.dept}</div>
                <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.05em', margin: 0,
                  color: INK, lineHeight: 1.0 }}>{e.name}</h1>
                <div style={{ fontSize: 16, color: MUTED, marginTop: 4 }}>{e.title} · {stuntTitle}</div>
              </div>
            </div>

            <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.75, margin: '0 0 28px', maxWidth: 560 }}>
              {e.intro}
            </p>

            <div style={{ display: 'flex', gap: 28, paddingTop: 20, borderTop: `1px solid ${GRAY}` }}>
              {[
                { label: 'Experience', value: `${e.years} years` },
                { label: 'Agents commanded', value: `${e.agentCount}` },
                { label: 'Department', value: e.dept },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: INK, letterSpacing: '-0.04em' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: DIM, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing card */}
          <div style={{ background: '#fff', border: `1.5px solid ${GRAY}`, borderRadius: 20,
            padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: e.color }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: '0.08em',
              textTransform: 'uppercase', marginBottom: 6 }}>Pricing</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: INK, letterSpacing: '-0.05em', marginBottom: 2 }}>
              $49<span style={{ fontSize: 16, fontWeight: 400, color: MUTED }}>/month</span>
            </div>
            <div style={{ fontSize: 12, color: '#0E5C34', fontWeight: 700, marginBottom: 4 }}>
              Price locked at hire — rises $10/month for new signups
            </div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.6 }}>
              14-day free trial · No credit card needed
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isHired ? (
                <>
                  <Link href={`/manage/${e.slug}`}
                    style={{ display: 'block', textAlign: 'center', background: '#0E5C34',
                      color: '#fff', borderRadius: 10, padding: '13px 0', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                    Manage {e.name} →
                  </Link>
                  <button onClick={scrollToInterview}
                    style={{ width: '100%', background: 'transparent', color: INK, border: `1.5px solid ${e.color}30`,
                      borderRadius: 10, padding: '12px 0', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer' }}>
                    Chat now →
                  </button>
                </>
              ) : (
                <>
                  <button onClick={scrollToInterview}
                    style={{ width: '100%', background: INK, color: '#fff', border: 'none',
                      borderRadius: 10, padding: '13px 0', fontWeight: 700, fontSize: 14,
                      cursor: 'pointer', letterSpacing: '-0.01em' }}>
                    Interview for Free →
                  </button>
                  <Link href={`/employees/${e.slug}/hire`}
                    style={{ display: 'block', textAlign: 'center', background: e.color + '10',
                      color: e.color, border: `1.5px solid ${e.color}30`, borderRadius: 10,
                      padding: '12px 0', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                    Start free trial →
                  </Link>
                </>
              )}
            </div>
            <div style={{ fontSize: 11, color: DIM, marginTop: 14, textAlign: 'center' }}>
              {isHired ? `${subStatus === 'trial' ? 'Trial active' : 'Subscription active'} · Price locked` : 'Interview is free · No card needed · Cancel anytime'}
            </div>
          </div>
        </div>

        {/* Capabilities */}
        {e.capabilities.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: e.color, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 16 }}>What {e.name} Can Do</div>
            <div className="setu-ws-caps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {e.capabilities.map((cap, i) => (
                <div key={i} style={{ background: '#fff', border: `1.5px solid ${GRAY}`, borderRadius: 14,
                  padding: '20px', cursor: 'pointer' }} onClick={scrollToInterview}>
                  <div style={{ fontSize: 22, marginBottom: 10 }}>{cap.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 10,
                    letterSpacing: '-0.02em' }}>{cap.area}</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex',
                    flexDirection: 'column', gap: 4 }}>
                    {(cap.scenarios ?? []).slice(0, 3).map((s: string, j: number) => (
                      <li key={j} style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                        · {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools */}
        {expectedSlugs.length > 0 && (
          <div style={{ marginBottom: advisoryOnlyTools.length > 0 ? 16 : 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: e.color, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 16 }}>Tools {e.name} Can Connect &amp; Automate</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {expectedSlugs.map(slug => {
                const toolDef = TOOL_REGISTRY.find(t => t.slug === slug)
                if (!toolDef) return null
                return (
                  <div key={slug} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff',
                    border: `1.5px solid ${GRAY}`, borderRadius: 8, padding: '7px 14px' }}>
                    <ToolLogo slug={slug} name={toolDef.name} size={18} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{toolDef.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Advisory-only tools — honesty disclosure. Previously, when an
            employee had zero connectable tools, this whole area rendered
            nothing at all while the "How I Work" copy below kept making
            unqualified automation promises. */}
        {advisoryOnlyTools.length > 0 && (
          <div style={{ marginBottom: 48, background: '#FEF9EC', border: '1px solid #F5E3B3', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#92702A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Advisory only — not yet automatable
            </div>
            <div style={{ fontSize: 13, color: '#5C4A1E', lineHeight: 1.6 }}>
              {e.name} can strategize, draft, and advise on <strong>{advisoryOnlyTools.join(', ')}</strong> using its expertise, but can't yet connect to {advisoryOnlyTools.length === 1 ? 'it' : 'them'} directly or take real automated actions there.
              {expectedSlugs.length === 0 && ' None of this employee\'s listed tools are connectable through the platform yet — every task is advisory.'}
            </div>
          </div>
        )}

        {/* ── Apprenticeship Architecture — interactive systems map ── */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: e.color, letterSpacing: '0.1em',
              textTransform: 'uppercase' }}>The Apprenticeship Architecture</div>
          </div>
          <div style={{ fontSize: 11, color: DIM, marginBottom: 24 }}>how {e.name} thinks, learns, and acts — tap a node to see how it works</div>

          {(() => {
            const SYSTEMS = [
              { id: 0, group: 'WHO', icon: '🧬', color: e.color, title: 'Character Core', status: 'live' },
              { id: 1, group: 'WHO', icon: '📚', color: e.color, title: 'Domain Mastery', status: 'live' },
              { id: 2, group: 'WHO', icon: '🗄️', color: '#F59E0B', title: 'Intelligence Vault', status: 'live' },
              { id: 3, group: 'MEMORY', icon: '⚗️', color: '#4F46E5', title: 'Distillation Engine', status: 'live' },
              { id: 4, group: 'MEMORY', icon: '🕸️', color: '#7C3AED', title: 'Knowledge Graph', status: 'live' },
              { id: 5, group: 'MEMORY', icon: '💞', color: '#EC4899', title: 'Relationship Memory', status: 'soon' },
              { id: 6, group: 'DOES', icon: '📡', color: '#06B6D4', title: 'Proactive Network', status: 'live' },
              { id: 7, group: 'DOES', icon: '🪜', color: '#16A34A', title: 'Trust Ladder', status: 'live' },
              { id: 8, group: 'DOES', icon: '📅', color: '#059669', title: 'Meeting Intelligence', status: 'soon' },
              { id: 9, group: 'GROWS', icon: '🎯', color: '#D97706', title: 'Outcome Attribution', status: 'live' },
              { id: 10, group: 'GROWS', icon: '🧠', color: '#8B5CF6', title: 'Cross-Employee Cortex', status: 'live' },
            ]
            const GROUPS: [string, string][] = [
              ['WHO', `WHO ${e.name.toUpperCase()} IS`],
              ['MEMORY', `WHAT ${e.name.toUpperCase()} REMEMBERS`],
              ['DOES', `WHAT ${e.name.toUpperCase()} DOES`],
              ['GROWS', `HOW ${e.name.toUpperCase()} GROWS`],
            ]
            const active = SYSTEMS.find(s => s.id === openSystem)

            return (<>
              {GROUPS.map(([key, label]) => (
                <div key={key} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ height: 1, width: 24, background: GRAY }} />
                    <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</div>
                    <div style={{ flex: 1, height: 1, background: GRAY }} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {SYSTEMS.filter(s => s.group === key).map(s => {
                      const isOpen = openSystem === s.id
                      const isSoon = s.status === 'soon'
                      return (
                        <button key={s.id} onClick={() => setOpenSystem(isOpen ? null : s.id)}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                            width: 92, padding: '12px 6px 8px', borderRadius: 14, cursor: 'pointer',
                            fontFamily: 'inherit', background: isOpen ? s.color + '12' : '#fff',
                            border: isOpen ? `2px solid ${s.color}` : `1.5px ${isSoon ? 'dashed' : 'solid'} ${isSoon ? GRAY : s.color + '35'}`,
                            transition: 'transform 0.12s, border-color 0.12s', transform: isOpen ? 'scale(1.04)' : 'scale(1)' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, background: isSoon ? '#F8F7F4' : s.color + '15', border: `1.5px solid ${isSoon ? GRAY : s.color + '30'}`,
                            opacity: isSoon ? 0.7 : 1 }}>
                            {s.icon}
                          </div>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: isSoon ? MUTED : INK, textAlign: 'center', lineHeight: 1.25 }}>{s.title}</div>
                          {isSoon && (
                            <div style={{ fontSize: 8, fontWeight: 700, color: MUTED, letterSpacing: '0.04em', textTransform: 'uppercase',
                              background: GRAY, padding: '1px 6px', borderRadius: 8 }}>Coming soon</div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* ── Detail panel — shows whichever node is tapped ── */}
              {active ? (
                <div style={{ background: '#fff', border: `2px solid ${active.color}30`, borderRadius: 16,
                  padding: '28px 32px', position: 'relative', overflow: 'hidden', marginTop: 20 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: active.color }} />
                  <button onClick={() => setOpenSystem(null)}
                    style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 13, color: MUTED, fontWeight: 600 }}>✕ close</button>

                  {active.id === 0 && (<>
                    <SystemHeader color={active.color} eyebrow="Character Core (PIC)"
                      title={`Immutable identity — opinions, convictions, and the lines ${e.name} won't cross`}
                      desc={`Not a system prompt you can override. ${e.name}'s character is architectural — baked in before they see your company context. They push back. They refuse. That's the point.`}
                      badge="● Immutable" badgeColor="#16A34A" badgeBg="#DCFCE7" badgeBorder="#BBF7D0" />
                    {e.characterCore ? (<>
                      <SectionLabel muted={MUTED}>3 opinions {e.name} holds with conviction</SectionLabel>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                        {e.characterCore.opinions.map((op, i) => (
                          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start',
                            background: active.color + '08', border: `1px solid ${active.color}20`, borderRadius: 10, padding: '14px 16px' }}>
                            <div style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#DC2626',
                              background: '#FEE2E2', padding: '3px 8px', borderRadius: 6, marginTop: 2, letterSpacing: '0.04em' }}>MYTH</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 4 }}>{op.belief}</div>
                              <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{op.reality}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <SectionLabel muted={MUTED}>3 lines {e.name} will not cross</SectionLabel>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                        {e.characterCore.nonNegotiables.map((nn, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start',
                            background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '12px 14px' }}>
                            <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: '#C2410C', marginTop: 1 }}>#{i + 1}</div>
                            <div style={{ fontSize: 12, color: INK, lineHeight: 1.55 }}>{nn}</div>
                          </div>
                        ))}
                      </div>
                      <SectionLabel muted={MUTED}>2 operating modes</SectionLabel>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                        {e.characterCore.modes.map((m, i) => (
                          <div key={i} style={{ background: i === 0 ? active.color + '0D' : '#F8F7F4',
                            border: `1px solid ${i === 0 ? active.color + '30' : GRAY}`, borderRadius: 10, padding: '14px 16px' }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: INK, marginBottom: 6 }}>{m.name}</div>
                            <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{m.desc}</div>
                          </div>
                        ))}
                      </div>
                      <SectionLabel muted={MUTED}>5 narrative cases — tacit knowledge encoded</SectionLabel>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {e.characterCore.cases.map((c, i) => (
                          <div key={i} style={{ background: '#F8F7F4', border: `1px solid ${GRAY}`,
                            borderRadius: 10, padding: '12px 14px', flex: '1 1 200px', minWidth: 180 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: INK, marginBottom: 4 }}>{c.title}</div>
                            <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{c.summary}</div>
                          </div>
                        ))}
                      </div>
                    </>) : <PlaceholderGrid color={active.color} items={[
                      { icon: '🧠', label: '3 core opinions', desc: 'Held with conviction — will push back on the conventional wisdom in their field' },
                      { icon: '🚫', label: '3 non-negotiables', desc: 'Hard stops: will refuse rather than violate, every time' },
                      { icon: '⚡', label: '2 operating modes', desc: 'Strategic vs Execution — context-switches cleanly between them' },
                      { icon: '📖', label: '5 narrative cases', desc: 'Tacit knowledge from years of real work, encoded as judgment' },
                    ]} />}
                  </>)}

                  {active.id === 1 && (<>
                    <SystemHeader color={active.color} eyebrow="Domain Mastery"
                      title={`${e.years} years of ${e.dept} expertise — baked in at deploy`}
                      desc={`Named frameworks, tools at feature depth, hard-won judgment from ${e.years} years in the field. What ${e.name} knows without you telling them anything.`}
                      badge="● Live" badgeColor="#16A34A" badgeBg="#DCFCE7" badgeBorder="#BBF7D0" />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {e.knows.slice(0, 12).map((k: string) => (
                        <span key={k} style={{ fontSize: 11, padding: '5px 11px', borderRadius: 8,
                          background: active.color + '0D', border: `1px solid ${active.color}25`, color: active.color, fontWeight: 600 }}>{k}</span>
                      ))}
                    </div>
                  </>)}

                  {active.id === 2 && (<>
                    <SystemHeader color={active.color} eyebrow="Company Intelligence Vault (CIV)"
                      title="Documents cited, never blindly absorbed — your context, always available"
                      desc={`Feed ${e.name} your SOPs, product catalog, website, and org chart. Every citation is traceable to source. Documents are held as an untrusted channel — referenced, not merged into core beliefs, so a bad document can't corrupt ${e.name}'s judgment.`}
                      badge="Configure after hire" badgeColor="#B45309" badgeBg="#FFFBEB" badgeBorder="#FDE68A" />
                    <PlaceholderGrid color={active.color} bg="#FFFBEB" border="#FDE68A50" items={[
                      { icon: '📄', label: 'Documents', desc: 'PDFs, Notion, Google Docs — chunked and indexed' },
                      { icon: '🌐', label: 'Website', desc: 'Your site, read each session for current context' },
                      { icon: '📋', label: 'SOPs & playbooks', desc: 'Standard processes, always on' },
                      { icon: '🏢', label: 'Org structure', desc: 'Who is who, roles and reporting lines' },
                      { icon: '📦', label: 'Product catalog', desc: "What you sell, how it's positioned" },
                    ]} />
                  </>)}

                  {active.id === 3 && (<>
                    <SystemHeader color={active.color} eyebrow="Distillation Engine"
                      title="Sessions compressed into wisdom — raw conversations never stored"
                      desc="After every session, a background job distills what was learned: preferences revealed, decisions made, beliefs updated. The raw transcript is discarded. Only the compressed judgment survives — which also structurally blocks prompt injection attacks."
                      badge="After every session" badgeColor="#4338CA" badgeBg="#EEF2FF" badgeBorder="#C7D2FE" />
                    <PlaceholderGrid color={active.color} bg="#EEF2FF" border="#E0E7FF" items={[
                      { icon: '⚗️', label: 'Preference extraction', desc: 'Communication style, format preferences, quality standards — extracted, not copied' },
                      { icon: '🔒', label: 'Injection barrier', desc: 'Schema-level protection — injected instructions structurally cannot survive distillation' },
                      { icon: '📐', label: 'Decision capture', desc: 'What was approved, rejected, or escalated — and why' },
                      { icon: '🔄', label: 'Belief updates', desc: 'What was learned this session, and how it updates the working model' },
                    ]} />
                  </>)}

                  {active.id === 4 && (<>
                    <SystemHeader color={active.color} eyebrow="Compounding Knowledge Graph (CKG)"
                      title="Beliefs that decay, compound, and never silently overwrite each other"
                      desc={`Bitemporal storage — every belief has an event_time and ingestion_time, so you can replay ${e.name}'s state at any past moment. Ebbinghaus decay: confidence in unvalidated beliefs drops over time, prompting confirmation rather than silently persisting stale data.`}
                      badge="Compounds over time" badgeColor="#7C3AED" badgeBg="#F5F3FF" badgeBorder="#DDD6FE" />
                    <PlaceholderGrid color={active.color} bg="#F5F3FF" border="#EDE9FE" items={[
                      { icon: '🕰️', label: 'Bitemporal storage', desc: 'Time-travel debugging — replay any past belief state' },
                      { icon: '📉', label: 'Confidence decay', desc: 'Stale beliefs lose confidence until re-validated by new sessions' },
                      { icon: '⚠️', label: 'Conflict detection', desc: 'New beliefs flag contradictions — never a silent overwrite' },
                      { icon: '🧬', label: 'Belief evolution', desc: 'Full audit of how the working model changed over months' },
                    ]} />
                  </>)}

                  {active.id === 5 && (<>
                    <SystemHeader color={active.color} eyebrow="Relationship Memory + Emotional Intelligence"
                      title="Knows everyone in your world — and never forgets the context that matters"
                      desc={`Every customer, lead, partner, and stakeholder will accumulate context over time — communication style, interaction history, relationship dynamics — so ${e.name} never re-introduces anyone. On the roadmap, not yet live: no build has shipped for this one, so it's shown honestly as coming soon rather than claimed as active.`}
                      badge="Coming soon" badgeColor={MUTED} badgeBg="#F8F7F4" badgeBorder={GRAY} />
                    <PlaceholderGrid color={active.color} bg="#FDF2F8" border="#FBCFE850" items={[
                      { icon: '🎯', label: 'Leads & prospects', desc: 'Qualification history, interaction log, next steps' },
                      { icon: '🤝', label: 'Customers', desc: 'Deal context, preferences, relationship health' },
                      { icon: '🔗', label: 'Partners', desc: 'Context, agreements, relationship dynamics' },
                      { icon: '💭', label: 'Communication style', desc: 'How each person prefers to be spoken with' },
                    ]} />
                  </>)}

                  {active.id === 6 && (<>
                    <SystemHeader color={active.color} eyebrow="Proactive Intelligence Network (PIN)"
                      title={`${e.name} watches specific signals — and briefs you before you ask`}
                      desc={`Event subscriptions, not cron polls. ${e.name} watches domain-specific signals that actually matter for their function. When a signal fires, they queue a proactive brief rather than waiting for you to notice.`}
                      badge="Always watching" badgeColor="#0E7490" badgeBg="#ECFEFF" badgeBorder="#A5F3FC" />
                    {e.watchPatterns ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <SectionLabel muted={MUTED}>{e.name}'s {e.watchPatterns.length} active watch patterns</SectionLabel>
                        {e.watchPatterns.map((wp, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start',
                            background: '#ECFEFF', border: '1px solid #A5F3FC50', borderRadius: 8, padding: '10px 14px' }}>
                            <div style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#0E7490',
                              background: '#CFFAFE', padding: '2px 7px', borderRadius: 4, marginTop: 1, letterSpacing: '0.04em' }}>WATCH</div>
                            <div style={{ fontSize: 12, color: INK, lineHeight: 1.55 }}>{wp}</div>
                          </div>
                        ))}
                      </div>
                    ) : <PlaceholderGrid color={active.color} bg="#ECFEFF" border="#A5F3FC50" items={[
                      { icon: '📡', label: 'Domain signals', desc: 'Industry news filtered for what matters to this function' },
                      { icon: '🏴', label: 'Competitor moves', desc: 'Tracked and summarized proactively' },
                      { icon: '⚡', label: 'Trigger events', desc: 'Signals that mean the moment to act is now' },
                      { icon: '📊', label: 'Performance alerts', desc: 'Metrics that deviate from expected range' },
                    ]} />}
                  </>)}

                  {active.id === 7 && (<>
                    <SystemHeader color={active.color} eyebrow="Action Layer — Trust Ladder"
                      title="Autonomy modes — capabilities earn trust, not time"
                      desc={`${e.name} starts at Research Only. Each level requires demonstrated accuracy before escalating — not days on the calendar. Even at the highest level, anything irreversible or spending real money always comes back for your approval — no exceptions, ever. You can also grant or revoke autonomy per-task type at any time.`}
                      badge="Starts: Research Only" badgeColor="#15803D" badgeBg="#F0FDF4" badgeBorder="#BBF7D0" />
                    {e.autonomyModes ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {e.autonomyModes.map((am, i) => {
                          const colors = [
                            { bg: '#F0FDF4', border: '#BBF7D0', label: '#15803D' },
                            { bg: '#EEF2FF', border: '#C7D2FE', label: '#4338CA' },
                            { bg: '#FFFBEB', border: '#FDE68A', label: '#92400E' },
                            { bg: '#FFF1F2', border: '#FECDD3', label: '#9F1239' },
                          ]
                          const c = colors[i] || colors[0]
                          return (
                            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start',
                              background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: '14px 16px' }}>
                              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: c.label, marginBottom: 4, letterSpacing: '0.04em' }}>L{i + 1}</div>
                                <div style={{ fontSize: 9, color: MUTED, letterSpacing: '0.02em' }}>{'●'.repeat(i + 1)}{'○'.repeat(Math.max(0, e.autonomyModes.length - 1 - i))}</div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 8 }}>{am.mode}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                  {am.tasks.map((t, j) => (
                                    <span key={j} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6,
                                      background: 'rgba(0,0,0,0.05)', color: MUTED }}>{t}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {['Research Only', 'Draft for Approval', 'Act with Notification', 'Trusted — Standing Rules Only'].map((m, i) => (
                          <div key={m} style={{ background: i === 0 ? '#F0FDF4' : '#F8F7F4',
                            border: `1px solid ${i === 0 ? '#BBF7D0' : GRAY}`, borderRadius: 10, padding: '14px 12px',
                            opacity: i > 0 ? 0.55 : 1 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, marginBottom: 6 }}>{'●'.repeat(i + 1)}{'○'.repeat(3 - i)}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: INK }}>{m}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>)}

                  {active.id === 8 && (<>
                    <SystemHeader color={active.color} eyebrow="Meeting Intelligence Loop"
                      title="Pre-brief → live notes → action items owned to completion"
                      desc={`The goal: most AI tools stop at the meeting. ${e.name} would brief you before, capture decisions during, extract action items after, and follow each item to completion. This is a real, designed feature — the database schema for it already exists — but it isn't wired up yet, so it's shown honestly as coming soon rather than claimed as live.`}
                      badge="Coming soon" badgeColor={MUTED} badgeBg="#F8F7F4" badgeBorder={GRAY} />
                    <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, flexWrap: 'wrap' }}>
                      {[
                        { step: 'Before', icon: '📋', title: 'Pre-brief', desc: 'Agenda, context, objectives — in your inbox before you walk in' },
                        { step: 'During', icon: '✍️', title: 'Live notes', desc: 'Structured notes with decision markers and open questions flagged' },
                        { step: 'After', icon: '✅', title: 'Action items', desc: 'Extracted decisions, assigned owners, deadlines — pushed to your tools' },
                        { step: 'Until done', icon: '🔄', title: 'Follow-through', desc: 'Tracks each item to closure. Flags stalled items before they become forgotten commitments' },
                      ].map((s, i) => (
                        <div key={i} style={{ flex: '1 1 160px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1, background: '#F8F7F4', borderRadius: 10, padding: '14px 12px', border: `1px dashed ${GRAY}`, opacity: 0.8 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.step}</div>
                            <div style={{ fontSize: 16, marginBottom: 6 }}>{s.icon}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: INK, marginBottom: 4 }}>{s.title}</div>
                            <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{s.desc}</div>
                          </div>
                          {i < 3 && <div style={{ fontSize: 12, color: DIM, alignSelf: 'center', flexShrink: 0 }}>→</div>}
                        </div>
                      ))}
                    </div>
                  </>)}

                  {active.id === 9 && (<>
                    <SystemHeader color={active.color} eyebrow="Outcome Attribution"
                      title="Tracks what worked, what failed, and why — so mistakes don't repeat"
                      desc={`${e.name} owns their KPIs. Every outcome — good or bad — feeds back into their judgment. Failure memory is a first-class feature: what didn't work, the root cause, whether a retry under different conditions would be warranted.`}
                      badge="Self-reporting" badgeColor="#92400E" badgeBg="#FFFBEB" badgeBorder="#FDE68A" />
                    {e.kpis ? (<>
                      <SectionLabel muted={MUTED}>{e.name}'s {e.kpis.length} owned KPIs</SectionLabel>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {e.kpis.map((kpi, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center',
                            background: '#FFFBEB', border: '1px solid #FDE68A50', borderRadius: 8, padding: '10px 14px' }}>
                            <div style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#92400E',
                              background: '#FEF3C7', padding: '2px 7px', borderRadius: 4, letterSpacing: '0.04em' }}>KPI</div>
                            <div style={{ fontSize: 12, color: INK, lineHeight: 1.55 }}>{kpi}</div>
                          </div>
                        ))}
                      </div>
                    </>) : <PlaceholderGrid color={active.color} bg="#FFFBEB" border="#FDE68A50" items={[
                      { icon: '📊', label: 'KPI ownership', desc: 'Specific metrics tied to function outcomes, not activity volume' },
                      { icon: '🧠', label: 'Failure memory', desc: "What didn't work, why, and whether to retry under different conditions" },
                      { icon: '📈', label: 'Performance trend', desc: 'Week 10 is measurably better than week 1 — verifiable, not claimed' },
                    ]} />}
                  </>)}

                  {active.id === 10 && (<>
                    <SystemHeader color={active.color} eyebrow="Cross-Employee Cortex (CEC)"
                      title="Persistent shared intelligence across every employee you hire"
                      desc={`When ${e.name} discovers something that changes how the business should operate, that organizational intelligence is available to every other employee — without a meeting, without a memo, without anyone remembering to tell anyone.`}
                      badge="Grows with team" badgeColor="#6D28D9" badgeBg="#F5F3FF" badgeBorder="#DDD6FE" />
                    <PlaceholderGrid color={active.color} bg="#F5F3FF" border="#EDE9FE" items={[
                      { icon: '🧠', label: 'Shared org memory', desc: 'What the business knows — not what one employee knows' },
                      { icon: '🤝', label: 'Handoff intelligence', desc: 'Pipeline context passed automatically to the next employee who needs it' },
                      { icon: '⚡', label: 'No duplicate work', desc: 'Research done once is available to all employees on the team' },
                      { icon: '📡', label: 'Team-aware decisions', desc: 'Each employee knows what the rest of the team is working on' },
                    ]} />
                  </>)}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: DIM, fontSize: 12, padding: '18px 0' }}>
                  Tap any node above to see how it works.
                </div>
              )}
            </>)
          })()}
        </div>

        {/* Interview CTA banner */}
        <div style={{ background: INK, borderRadius: 20, padding: '36px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 24, marginBottom: 0, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 6 }}>
              Interview {e.name} — free, right now
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
              No account needed. Ask anything. See exactly how they think before you hire.
            </div>
          </div>
          <button onClick={scrollToInterview}
            style={{ background: '#fff', color: INK, border: 'none', borderRadius: 100,
              padding: '13px 32px', fontWeight: 800, fontSize: 14, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0 }}>
            Start Interview ↓
          </button>
        </div>
      </div>

      {/* ── INTERVIEW SECTION ── */}
      <div id="interview-section" style={{ background: '#F6F5F1', marginTop: 64, borderTop: '1.5px solid #E3E1DA' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0 16px',
            borderBottom: '1.5px solid #E3E1DA' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0D0C09' }}>
              {e.name} is live — interview or hire
            </span>
            {streaming && (
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#0E5C34', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0E5C34', display: 'inline-block' }} />
                Working…
              </span>
            )}
          </div>
        </div>

      {/* ── Body: 3 panels ── */}
      <div className="setu-ws-chat-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr 260px', height: '80vh', maxWidth: 1100, margin: '0 auto', padding: '0 32px' }}>

        {/* ── LEFT: Tool connections ── */}
        <aside style={{ borderRight: '1.5px solid #E3E1DA', overflow: 'auto',
          padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 0,
          background: '#FFFFFF' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#78746E', letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: 12 }}>Connect Your Tools</div>

          {expectedSlugs.length === 0 ? (
            <div style={{ fontSize: 12, color: '#9E9891' }}>No tools mapped for this employee.</div>
          ) : expectedSlugs.map(slug => {
            const toolDef = TOOL_REGISTRY.find(t => t.slug === slug)
            if (!toolDef) return null
            const isConnected = connectedSlugs.has(slug)
            return (
              <div key={slug} style={{ display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8, marginBottom: 4,
                background: isConnected ? '#EAF5EE' : '#F6F5F1',
                border: `1.5px solid ${isConnected ? '#16A34A30' : '#E3E1DA'}` }}>
                <ToolLogo slug={slug} name={toolDef.name} size={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0D0C09',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {toolDef.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#78746E' }}>{toolDef.category}</div>
                </div>
                {isConnected ? (
                  <button onClick={() => disconnectTool(slug)}
                    title="Disconnect" style={{ background: 'none', border: 'none',
                      color: '#16A34A', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>✓</button>
                ) : (
                  <button onClick={() => setConnectingSlug(slug)}
                    style={{ background: '#FFFFFF', border: '1.5px solid #E3E1DA',
                      color: '#78746E', borderRadius: 6, padding: '3px 8px', fontSize: 11,
                      cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    + Add
                  </button>
                )}
              </div>
            )
          })}

          {/* Separator */}
          {connected.some(c => !expectedSlugs.includes(c.slug)) && (
            <>
              <div style={{ fontSize: 10, color: '#9E9891', margin: '10px 0 8px',
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>Other connected</div>
              {connected.filter(c => !expectedSlugs.includes(c.slug)).map(c => (
                <div key={c.slug} style={{ display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8, marginBottom: 4,
                  background: '#EAF5EE', border: '1.5px solid #16A34A30' }}>
                  <ToolLogo slug={c.slug} name={c.name} size={22} />
                  <div style={{ flex: 1, fontSize: 12, color: '#0D0C09' }}>{c.name}</div>
                  <button onClick={() => disconnectTool(c.slug)}
                    title="Disconnect" style={{ background: 'none', border: 'none',
                      color: '#16A34A', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✓</button>
                </div>
              ))}
            </>
          )}

          {/* Employee info */}
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1.5px solid #E3E1DA' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: e.color + '14',
                border: `1.5px solid ${e.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {e.emoji}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0D0C09' }}>{e.name}</div>
                <div style={{ fontSize: 11, color: '#78746E' }}>{e.title} · {stuntTitle}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#78746E' }}>
              {e.agentCount} agents · {e.years} yrs exp
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: e.color, marginTop: 6 }}>{e.pricing.label}</div>
          </div>
        </aside>

        {/* ── CENTER: Chat ── */}
        <main style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F6F5F1' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', display: 'flex',
            flexDirection: 'column', gap: 16 }}>
            {msgs.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
                {msg.role === 'system' ? (
                  <div style={{ fontSize: 12, color: '#9E9891', fontStyle: 'italic', textAlign: 'center',
                    width: '100%', padding: '4px 0' }}>{msg.content}</div>
                ) : (
                  <div style={{ maxWidth: '80%' }}>
                    <div style={{
                      background: msg.role === 'user' ? e.color + '12' : '#FFFFFF',
                      border: `1.5px solid ${msg.role === 'user' ? e.color + '30' : '#E3E1DA'}`,
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '12px 16px', fontSize: 14, lineHeight: 1.7, color: '#0D0C09',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}>
                      {msg.content || (streaming && i === msgs.length - 1 ? (
                        <span style={{ color: '#9E9891', fontStyle: 'italic' }}>Thinking…</span>
                      ) : null)}
                    </div>

                    {/* Tool events */}
                    {msg.toolEvents && msg.toolEvents.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {msg.toolEvents.map((ev, j) => <ToolEventPill key={j} event={ev} />)}
                      </div>
                    )}

                    {/* Approval gate */}
                    {msg.approvalGate && msg.taskId && (
                      <ApprovalCard gate={msg.approvalGate} taskId={msg.taskId}
                        onDecision={handleApprovalDecision} />
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '16px 24px', borderTop: '1.5px solid #E3E1DA', flexShrink: 0, background: '#FFFFFF' }}>
            {/* Quick chips */}
            {msgs.length <= 1 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {[
                  ...(e.capabilities[0]?.scenarios?.slice(0, 1) ?? []),
                  ...(e.capabilities[1]?.scenarios?.slice(0, 1) ?? []),
                  'What tools do you need to get started?',
                  'Walk me through how you work',
                ].slice(0, 4).map(chip => (
                  <button key={chip} onClick={() => { setInput(chip) }}
                    style={{ background: '#F6F5F1', border: '1.5px solid #E3E1DA', color: '#78746E',
                      borderRadius: 20, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                ref={textareaRef}
                value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder={`Tell ${e.name} what to work on…`} rows={2}
                style={{ flex: 1, background: '#F6F5F1', border: '1.5px solid #E3E1DA', borderRadius: 12,
                  padding: '12px 14px', color: '#0D0C09', fontSize: 14, resize: 'none',
                  outline: 'none', lineHeight: 1.5, fontFamily: 'inherit' }}
              />
              <button onClick={handleSend} disabled={streaming || !input.trim()}
                style={{ background: streaming || !input.trim() ? '#E3E1DA' : e.color,
                  color: streaming || !input.trim() ? '#9E9891' : '#fff',
                  border: 'none', borderRadius: 10, width: 44, height: 44,
                  fontSize: 18, cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s' }}>
                {streaming ? '⏸' : '↑'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#9E9891', marginTop: 8, textAlign: 'center' }}>
              Real API calls · Approval required before any action · Keys encrypted
            </div>
          </div>
        </main>

        {/* ── RIGHT: Capabilities ── */}
        <aside style={{ borderLeft: '1.5px solid #E3E1DA', overflow: 'auto',
          padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 10,
          background: '#FFFFFF' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#78746E', letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: 4 }}>What I Can Do</div>

          {e.capabilities.map((cap, i) => (
            <details key={i} style={{ borderRadius: 8, background: '#F6F5F1',
              border: '1.5px solid #E3E1DA', padding: '10px 12px' }}>
              <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 12, fontWeight: 600, color: '#0D0C09', listStyle: 'none' }}>
                <span>{cap.icon}</span>
                <span>{cap.area}</span>
              </summary>
              <ul style={{ margin: '10px 0 0', padding: '0 0 0 8px', listStyle: 'none',
                display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(cap.scenarios ?? []).map((s: string, j: number) => (
                  <li key={j} style={{ fontSize: 11, color: '#78746E', lineHeight: 1.5,
                    cursor: 'pointer', padding: '2px 0' }}
                    onClick={() => { setInput(s); textareaRef.current?.focus() }}>
                    › {s}
                  </li>
                ))}
              </ul>
            </details>
          ))}

          {/* How it works */}
          <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: '#78746E',
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>How I Work</div>
          {e.howItWorks.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: e.color + '14',
                color: e.color, fontSize: 11, fontWeight: 700, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0D0C09' }}>{step.step}</div>
                <div style={{ fontSize: 11, color: '#78746E', marginTop: 2, lineHeight: 1.5 }}>{step.detail}</div>
              </div>
            </div>
          ))}
        </aside>
      </div>
      </div>{/* /interview-section */}

      {/* Connect modal */}
      {connectingSlug && (
        <ConnectModal
          toolSlug={connectingSlug}
          onClose={() => setConnectingSlug(null)}
          onConnected={slug => {
            const toolDef = TOOL_REGISTRY.find(t => t.slug === slug)
            if (toolDef) {
              setConnected(c => [...c.filter(x => x.slug !== slug), {
                slug, name: toolDef.name, category: toolDef.category,
                logo: toolLogoUrl(slug), domain: toolDef.domain,
                connected_at: new Date().toISOString(),
              }])
            }
          }}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        textarea::placeholder { color: #9E9891; }
        details summary::-webkit-details-marker { display: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E3E1DA; border-radius: 2px; }
      `}</style>
    </div>
  )
}
