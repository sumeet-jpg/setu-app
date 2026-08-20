// @ts-nocheck
'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { EMPLOYEE_BY_SLUG } from '@/lib/employees/profiles'

type Msg = { role: 'user' | 'assistant'; content: string; actionId?: string }

// Proposed action attached to an assistant message
type ActionProposal = {
  id: string          // temp client-side id until server returns real id
  serverId?: string   // id from server after registration
  msgIndex: number    // which assistant message proposed this
  type: string
  title: string
  description: string
  payload?: Record<string, unknown>
  status: 'pending' | 'approved' | 'rejected'
  rejecting?: boolean
  approving?: boolean
}

const ACTION_LABELS: Record<string, string> = {
  draft_document:   'Draft Document',
  create_task:      'Create Task',
  send_email:       'Send Email',
  schedule_meeting: 'Schedule Meeting',
  update_record:    'Update Record',
  external_api:     'External API Call',
}

const ACTION_COLORS: Record<string, string> = {
  draft_document:   '#6366f1',
  create_task:      '#22c55e',
  send_email:       '#f59e0b',
  schedule_meeting: '#06b6d4',
  update_record:    '#8b5cf6',
  external_api:     '#ef4444',
}

const ACTION_RISK: Record<string, string> = {
  draft_document:   'low',
  create_task:      'low',
  send_email:       'high',
  schedule_meeting: 'medium',
  update_record:    'medium',
  external_api:     'high',
}

// Strip [ACTION:...] marker from display text
function stripActionMarker(text: string): string {
  return text.replace(/\[ACTION:\{[^}]+(?:\})+\]/gs, '').replace(/\n{3,}/g, '\n\n').trim()
}

// Extract [ACTION:...] payload from text
function extractActionProposal(text: string): { type: string; title: string; description: string; payload?: any } | null {
  const match = text.match(/\[ACTION:(\{[\s\S]*?\}(?:\})*)\]/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1])
    if (parsed.type && parsed.title && parsed.description) return parsed
    return null
  } catch {
    return null
  }
}

function getOrCreateId(key: string): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(key)
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id) }
  return id
}

export default function InterviewClient({ slug }: { slug: string }) {
  const e = EMPLOYEE_BY_SLUG[slug]

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [userId] = useState(() => getOrCreateId('setu_user_id'))
  const [sessionId] = useState(() => crypto.randomUUID())
  const [actions, setActions] = useState<ActionProposal[]>([])
  const [isHired, setIsHired] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!userId || !slug) return
    fetch(`/api/manage/subscription?userId=${userId}&slug=${slug}`)
      .then(r => r.json())
      .then(d => { if (d.status === 'trial' || d.status === 'active') setIsHired(true) })
      .catch(() => {})
  }, [userId, slug])

  const MUTED = '#94A3B8'
  const BG = '#0F172A'
  const SURFACE = '#1E293B'
  const BORDER = 'rgba(148,163,184,0.1)'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, actions])

  if (!e) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤔</div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Employee not found</h1>
          <Link href="/employees" style={{ color: '#818cf8', textDecoration: 'none', marginTop: 16, display: 'block' }}>← Back to employees</Link>
        </div>
      </div>
    )
  }

  async function approveAction(action: ActionProposal) {
    setActions(prev => prev.map(a => a.id === action.id ? { ...a, approving: true } : a))
    try {
      if (action.serverId) {
        await fetch('/api/employees/actions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, actionId: action.serverId, decision: 'approve' }),
        })
      }
      setActions(prev => prev.map(a => a.id === action.id ? { ...a, status: 'approved', approving: false } : a))
      // Send confirmation back to the conversation
      const confirmMsg = `I've approved your proposal: "${action.title}". Go ahead.`
      setInput(confirmMsg)
    } catch {
      setActions(prev => prev.map(a => a.id === action.id ? { ...a, approving: false } : a))
    }
  }

  async function rejectAction(action: ActionProposal) {
    const reason = prompt('Reason for rejection (optional):') ?? ''
    setActions(prev => prev.map(a => a.id === action.id ? { ...a, rejecting: true } : a))
    try {
      if (action.serverId) {
        await fetch('/api/employees/actions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, actionId: action.serverId, decision: 'reject', rejectionReason: reason }),
        })
      }
      setActions(prev => prev.map(a => a.id === action.id ? { ...a, status: 'rejected', rejecting: false } : a))
    } catch {
      setActions(prev => prev.map(a => a.id === action.id ? { ...a, rejecting: false } : a))
    }
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setLoading(true)
    setStarted(true)

    const userMsg: Msg = { role: 'user', content: text }
    const history = [...msgs, userMsg]
    setMsgs(history)

    const msgIndex = history.length  // index of the assistant message about to be added

    try {
      const res = await fetch('/api/employees/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: e.slug, messages: history, userId, sessionId }),
      })

      if (!res.ok) throw new Error('API error')
      if (!res.body) throw new Error('No body')

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let partial = ''
      let fullResponse = ''
      setMsgs(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        partial += dec.decode(value, { stream: true })
        const lines = partial.split('\n')
        partial = lines.pop() ?? ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const j = JSON.parse(data)
              const delta = j.choices?.[0]?.delta?.content ?? j.delta?.text ?? ''
              if (delta) {
                fullResponse += delta
                // Strip action marker from live display
                const displayContent = stripActionMarker(fullResponse)
                setMsgs(prev => {
                  const next = [...prev]
                  next[next.length - 1] = { role: 'assistant', content: displayContent }
                  return next
                })
              }
            } catch {}
          }
        }
      }

      // After stream: check for action proposal in full response
      const proposal = extractActionProposal(fullResponse)
      if (proposal) {
        const tempId = crypto.randomUUID()
        const newAction: ActionProposal = {
          id: tempId,
          msgIndex,
          type: proposal.type,
          title: proposal.title,
          description: proposal.description,
          payload: proposal.payload,
          status: 'pending',
        }
        setActions(prev => [...prev, newAction])

        // Fetch the server-registered action id so approve/reject work
        setTimeout(async () => {
          try {
            const r = await fetch(`/api/employees/actions?userId=${userId}&slug=${slug}&status=pending&limit=5`)
            if (r.ok) {
              const d = await r.json()
              const match = d.actions?.find((a: any) => a.title === proposal.title)
              if (match) {
                setActions(prev => prev.map(a => a.id === tempId ? { ...a, serverId: match.id } : a))
              }
            }
          } catch {}
        }, 1500)
      }
    } catch (err) {
      setMsgs(prev => {
        const next = [...prev]
        if (next.length > 0 && next[next.length - 1].role === 'assistant' && next[next.length - 1].content === '') {
          next[next.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.' }
        } else {
          next.push({ role: 'assistant', content: 'Something went wrong. Please try again.' })
        }
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  function handleKey(ev: React.KeyboardEvent) {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault()
      send()
    }
  }

  const starterQs = [
    `What's your biggest strength as ${e.title}?`,
    `Walk me through how you'd handle my first week.`,
    e.capabilities[0]?.scenarios[0]
      ? `Can you show me how you'd handle: "${e.capabilities[0].scenarios[0]}"?`
      : `How do you work day-to-day?`,
    e.capabilities[1]?.scenarios[0]
      ? `What does "${e.capabilities[1].scenarios[0]}" look like in practice?`
      : `What tools do you connect with?`,
  ]

  // Actions that are still pending (not yet decided)
  const pendingActions = actions.filter(a => a.status === 'pending')

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-inter)' }}>
      {/* Nav */}
      <div style={{
        borderBottom: `1px solid ${BORDER}`, padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href={isHired ? `/manage/${e.slug}` : `/employees/${e.slug}`} style={{ fontSize: 13, color: MUTED, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, background: 'rgba(148,163,184,0.06)', border: `1px solid ${BORDER}` }}>
            ← {isHired ? 'Manage' : 'Back'}
          </Link>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: `${e.color}20`, border: `1.5px solid ${e.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: `0 0 20px ${e.color}20` }}>{e.emoji}</div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-space)', letterSpacing: '-0.02em' }}>{e.name}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{e.title}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4, padding: '4px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.8)' }} />
            <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>Live interview</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {pendingActions.length > 0 && (
            <div style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
              {pendingActions.length} pending approval{pendingActions.length > 1 ? 's' : ''}
            </div>
          )}
          <Link href={`/employees/${e.slug}/memory`} style={{ padding: '7px 14px', borderRadius: 9, background: 'rgba(148,163,184,0.06)', border: `1px solid ${BORDER}`, color: MUTED, fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>
            🧠 Memory
          </Link>
          <Link href={`/employees/${e.slug}/hire`} style={{ padding: '8px 18px', borderRadius: 9, background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.35)', fontFamily: 'var(--font-space)' }}>
            Hire {e.name} →
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px', maxWidth: 800, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {!started && (
          <div style={{ textAlign: 'center', paddingTop: 56 }}>
            <div style={{
              width: 88, height: 88, borderRadius: 26, background: `${e.color}18`, border: `2px solid ${e.color}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 44, margin: '0 auto 24px', boxShadow: `0 0 50px ${e.color}20`,
            }}>{e.emoji}</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 10px', fontFamily: 'var(--font-space)', letterSpacing: '-0.04em' }}>Interview {e.name}</h2>
            <p style={{ fontSize: 14.5, color: MUTED, maxWidth: 420, margin: '0 auto 36px', lineHeight: 1.7 }}>
              Hi, I'm {e.name}, your AI {e.title}. I command {e.agentCount} specialized agents. Ask me anything — I'll show you exactly what I can do for your business.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, maxWidth: 560, margin: '0 auto' }}>
              {starterQs.map(q => (
                <button key={q} onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 0) }} style={{
                  padding: '12px 16px', borderRadius: 12,
                  background: SURFACE, border: `1px solid ${BORDER}`,
                  color: '#CBD5E1', fontSize: 12.5, textAlign: 'left',
                  cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.5,
                  transition: 'border-color 0.2s, background 0.2s',
                }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i}>
            <div style={{ display: 'flex', gap: 12, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'assistant' && (
                <div style={{
                  width: 32, height: 32, borderRadius: 10, background: `${e.color}18`,
                  border: `1.5px solid ${e.color}30`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 15, flexShrink: 0, marginTop: 2,
                  boxShadow: `0 0 16px ${e.color}18`,
                }}>{e.emoji}</div>
              )}
              <div style={{
                maxWidth: '72%', padding: '13px 18px',
                borderRadius: m.role === 'user' ? '20px 20px 5px 20px' : '5px 20px 20px 20px',
                background: m.role === 'user'
                  ? 'linear-gradient(135deg, #6366f1, #7c3aed)'
                  : SURFACE,
                border: m.role === 'assistant' ? `1px solid ${BORDER}` : 'none',
                fontSize: 14, color: '#F1F5F9', lineHeight: 1.7, whiteSpace: 'pre-wrap',
                boxShadow: m.role === 'user' ? '0 4px 16px rgba(99,102,241,0.3)' : undefined,
              }}>
                {m.content || (i === msgs.length - 1 && loading ? '' : '')}
                {i === msgs.length - 1 && m.role === 'assistant' && loading && <span style={{ opacity: 0.4 }}>▌</span>}
              </div>
            </div>

            {/* Action approval cards — shown right after the proposing message */}
            {m.role === 'assistant' && actions
              .filter(a => a.msgIndex === i)
              .map(action => {
                const color = ACTION_COLORS[action.type] ?? '#6366f1'
                const risk  = ACTION_RISK[action.type] ?? 'medium'
                const riskColor = risk === 'high' ? '#ef4444' : risk === 'medium' ? '#f59e0b' : '#22c55e'

                return (
                  <div key={action.id} style={{
                    marginTop: 10, marginLeft: 44,
                    background: action.status === 'approved' ? 'rgba(34,197,94,0.06)' : action.status === 'rejected' ? 'rgba(148,163,184,0.04)' : `${color}08`,
                    border: `1px solid ${action.status === 'approved' ? 'rgba(34,197,94,0.25)' : action.status === 'rejected' ? BORDER : color + '30'}`,
                    borderLeft: `3px solid ${action.status === 'approved' ? '#22c55e' : action.status === 'rejected' ? '#334155' : color}`,
                    borderRadius: 10, padding: '14px 16px', maxWidth: '72%',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#94a3b8', letterSpacing: '0.08em' }}>
                        ACTION PROPOSAL
                      </span>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color, background: color + '18', padding: '2px 7px', borderRadius: 4 }}>
                        {ACTION_LABELS[action.type] ?? action.type}
                      </span>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: riskColor, background: riskColor + '12', padding: '2px 7px', borderRadius: 4 }}>
                        {risk} risk
                      </span>
                      {action.status === 'approved' && (
                        <span style={{ fontSize: 10, color: '#22c55e', fontFamily: 'monospace' }}>✓ Approved</span>
                      )}
                      {action.status === 'rejected' && (
                        <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>✗ Rejected</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 5 }}>
                      {action.title}
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: action.status === 'pending' ? 12 : 0 }}>
                      {action.description}
                    </div>
                    {action.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => approveAction(action)}
                          disabled={action.approving}
                          style={{
                            padding: '6px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            background: action.approving ? SURFACE : '#22c55e', color: '#fff', border: 'none',
                            opacity: action.approving ? 0.6 : 1,
                          }}>
                          {action.approving ? 'Approving…' : '✓ Approve'}
                        </button>
                        <button
                          onClick={() => rejectAction(action)}
                          disabled={action.rejecting}
                          style={{
                            padding: '6px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            background: 'transparent', color: '#94a3b8',
                            border: `1px solid ${BORDER}`,
                            opacity: action.rejecting ? 0.6 : 1,
                          }}>
                          {action.rejecting ? 'Rejecting…' : 'Reject'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: '16px 24px', background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', flexShrink: 0 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={ev => setInput(ev.target.value)}
            onKeyDown={handleKey}
            placeholder={`Ask ${e.name} anything...`}
            rows={1}
            style={{
              flex: 1, padding: '12px 18px',
              background: SURFACE, border: `1px solid ${BORDER}`,
              borderRadius: 14, color: '#F1F5F9', fontSize: 14, outline: 'none',
              resize: 'none', fontFamily: 'inherit', lineHeight: 1.55,
              minHeight: 46, maxHeight: 120,
              transition: 'border-color 0.2s',
            }}
            onInput={ev => {
              const t = ev.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              width: 46, height: 46, borderRadius: 13,
              background: input.trim() && !loading ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : SURFACE,
              border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              color: '#fff', fontSize: 18, transition: 'background 0.2s',
              boxShadow: input.trim() && !loading ? '0 4px 16px rgba(99,102,241,0.35)' : 'none',
            }}
          >
            {loading ? '⏳' : '↑'}
          </button>
        </div>
        <div style={{ maxWidth: 800, margin: '8px auto 0', fontSize: 11, color: '#334155', textAlign: 'center', letterSpacing: '0.02em' }}>
          Interview is free · Hire {e.name} to activate all {e.agentCount} agents · {e.pricing.label}
        </div>
      </div>
    </div>
  )
}
