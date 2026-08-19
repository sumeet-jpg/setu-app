'use client'
// @ts-nocheck

import { useState, useRef, useEffect, useCallback } from 'react'
import { getStuntTitle } from '@/lib/employees/profiles'
import { TOOL_REGISTRY, toolLogoUrl } from '@/lib/tools/registry'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Employee {
  slug: string; name: string; title: string; dept: string; emoji: string
  color: string; years: number; tagline: string; intro: string
  agentCount: number; pricing: { monthly: number | 'custom'; label: string }
  knows: string[]; capabilities: any[]; tools: any[]; howItWorks: any[]
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

function employeeToolSlugs(toolGroups: any[]): string[] {
  const nameMap: Record<string, string> = {
    'HubSpot': 'hubspot', 'Salesforce': 'salesforce', 'Marketo': 'marketo',
    'ActiveCampaign': 'activecampaign', 'Mailchimp': 'mailchimp', 'Klaviyo': 'klaviyo',
    'Customer.io': 'customer-io', 'SendGrid': 'sendgrid', 'Google Ads': 'google-ads',
    'Meta Ads': 'meta-ads', 'LinkedIn Ads': 'linkedin-ads', 'TikTok Ads': 'tiktok-ads',
    'Semrush': 'semrush', 'SEMrush': 'semrush', 'Ahrefs': 'ahrefs',
    'Search Console': 'search-console', 'GA4': 'ga4', 'Mixpanel': 'mixpanel',
    'Amplitude': 'amplitude', 'Looker': 'looker', 'WhatsApp Business API': 'whatsapp-api',
    'Twilio': 'twilio', 'Shopify': 'shopify', 'WooCommerce': 'woocommerce',
    'Razorpay': 'razorpay', 'PayU': 'payu', 'CleverTap': 'clevertap',
    'MoEngage': 'moengage', 'Slack': 'slack', 'Intercom': 'intercom',
    'Zendesk': 'zendesk', 'Freshdesk': 'freshdesk', 'Jira': 'jira',
    'GitHub': 'github', 'Sentry': 'sentry', 'DataDog': 'datadog', 'Datadog': 'datadog',
    'Linear': 'linear', 'Notion': 'notion', 'Asana': 'asana', 'Figma': 'figma',
    'BambooHR': 'bamboohr', 'Rippling': 'rippling', 'Darwinbox': 'darwinbox',
    'Stripe': 'stripe', 'QuickBooks': 'quickbooks', 'Xero': 'xero',
    'Chargebee': 'chargebee', 'Outreach': 'outreach', 'Salesloft': 'salesloft',
    'Apollo': 'apollo', 'Pipedrive': 'pipedrive', 'Canva': 'canva',
    'Buffer': 'buffer', 'Hootsuite': 'hootsuite', 'Monday.com': 'monday',
    'Monday': 'monday', 'ClickUp': 'clickup', 'Airtable': 'airtable',
    'Google Workspace': 'google-workspace', 'PostHog': 'posthog', 'Hotjar': 'hotjar',
    'Tableau': 'tableau', 'Zoho CRM': 'zoho-crm',
  }
  const slugs = new Set<string>()
  for (const group of toolGroups) {
    for (const t of group.tools ?? []) {
      const s = nameMap[t]
      if (s) slugs.add(s)
    }
  }
  return [...slugs]
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
      const res = await fetch('/api/tools/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: getUserId(), tool_slug: toolSlug, api_key: key.trim(), config }),
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

// ── Main workspace ────────────────────────────────────────────────────────────

export default function EmployeeWorkspace({ employee: e }: { employee: Employee }) {
  const stuntTitle = getStuntTitle(e.name)
  const userId = typeof window !== 'undefined' ? getUserId() : ''

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

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Employee's expected tools
  const expectedSlugs = employeeToolSlugs(e.tools)

  // Load connected tools on mount
  useEffect(() => {
    if (!userId) return
    fetch(`/api/tools/connections?user_id=${userId}`)
      .then(r => r.json())
      .then(d => { setConnected(d.connections ?? []); setLoadingTools(false) })
      .catch(() => setLoadingTools(false))
  }, [userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  // ── Execute task ────────────────────────────────────────────────────────────

  const executeTask = useCallback(async (taskText: string, resumeTaskId?: string) => {
    if (!taskText.trim() || streaming) return
    setStreaming(true)
    setPendingApproval(null)

    if (!resumeTaskId) {
      setMsgs(m => [...m, { role: 'user', content: taskText }])
    }

    let assistantContent = ''
    const toolEvents: ToolEvent[] = []
    let currentApproval: ApprovalGate | null = null
    let resolvedTaskId = resumeTaskId ?? null

    setMsgs(m => [...m, { role: 'assistant', content: '', toolEvents: [] }])

    abortRef.current = new AbortController()

    try {
      const body: any = { task: taskText, user_id: userId }
      if (resumeTaskId) body.task_id = resumeTaskId
      if (pendingApproval) {
        body.approval_result = { approved: true, tool_use_id: pendingApproval.gate.tool_use_id }
      }

      const res = await fetch(`/api/employees/${e.slug}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      })

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
  }, [streaming, userId, e.slug, pendingApproval])

  const handleSend = () => {
    const text = input.trim()
    setInput('')
    if (text) executeTask(text)
  }

  const handleApprovalDecision = (decision: 'approved' | 'rejected') => {
    if (!pendingApproval) return
    if (decision === 'approved') {
      // Resume execution with a continuation message
      executeTask(`[APPROVAL_GRANTED] Continue executing. The user approved: ${pendingApproval.gate.action}`, pendingApproval.taskId)
    } else {
      setMsgs(m => [...m, { role: 'system', content: '✕ Action rejected. What would you like to do instead?' }])
      setPendingApproval(null)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── Disconnect tool ──────────────────────────────────────────────────────────

  const disconnectTool = async (slug: string) => {
    await fetch('/api/tools/connect', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, tool_slug: slug }),
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

      {/* ── Nav ── */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px',
        height: 56, borderBottom: `1px solid ${GRAY}`, background: '#fff', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/employees" style={{ color: MUTED, textDecoration: 'none', fontSize: 13 }}>← All Employees</Link>
        <span style={{ color: GRAY }}>/</span>
        <span style={{ color: INK, fontSize: 13, fontWeight: 600 }}>{e.name}</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
          background: e.color + '14', color: e.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {stuntTitle}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={scrollToInterview}
            style={{ background: 'none', border: `1.5px solid ${GRAY}`, borderRadius: 8, padding: '6px 16px',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', color: INK }}>
            Interview Free
          </button>
          <Link href={`/employees/${e.slug}/hire`}
            style={{ background: e.color, color: '#fff', border: 'none', borderRadius: 8,
              padding: '7px 18px', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-block' }}>
            Hire {e.name} →
          </Link>
        </div>
      </nav>

      {/* ── PROSPECTUS ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 32px 0' }}>

        {/* Hero row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48, alignItems: 'flex-start', marginBottom: 56 }}>
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
            <div style={{ fontSize: 32, fontWeight: 800, color: INK, letterSpacing: '-0.05em', marginBottom: 4 }}>
              {e.pricing.label}
            </div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 24, lineHeight: 1.6 }}>
              BYOK — use your own API keys. Setu charges for orchestration only.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                Hire {e.name}
              </Link>
            </div>
            <div style={{ fontSize: 11, color: DIM, marginTop: 14, textAlign: 'center' }}>
              Interview is free · No account needed · Cancel anytime
            </div>
          </div>
        </div>

        {/* Capabilities */}
        {e.capabilities.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: e.color, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 16 }}>What {e.name} Can Do</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
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
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: e.color, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 16 }}>Tools {e.name} Uses</div>
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

        {/* ── Brain Architecture ── */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: e.color, letterSpacing: '0.1em',
              textTransform: 'uppercase' }}>How {e.name} Thinks</div>
            <div style={{ fontSize: 11, color: DIM }}>6-layer intelligence architecture</div>
          </div>

          {/* ─ Layer 1: Domain Mastery ─ */}
          <div style={{ background: '#fff', border: `2px solid ${e.color}30`,
            borderRadius: '16px 16px 4px 4px', padding: '28px 32px',
            position: 'relative', overflow: 'hidden', marginBottom: 2 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: e.color }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: e.color, letterSpacing: '0.1em',
                  textTransform: 'uppercase', marginBottom: 6 }}>Layer 1 · Domain Mastery</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: INK, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                  {e.years} years of {e.dept} expertise — baked in at deploy
                </div>
                <div style={{ fontSize: 13, color: MUTED, marginTop: 8, lineHeight: 1.65, maxWidth: 560 }}>
                  Named frameworks, tools at feature depth, hard-won judgment from {e.years} years in the field.
                  What {e.name} knows without you telling them anything.
                </div>
              </div>
              <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#16A34A',
                background: '#DCFCE7', padding: '5px 12px', borderRadius: 20, border: '1px solid #BBF7D0' }}>● Live</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {e.knows.slice(0, 10).map((k: string) => (
                <span key={k} style={{ fontSize: 11, padding: '5px 11px', borderRadius: 8,
                  background: e.color + '0D', border: `1px solid ${e.color}25`, color: e.color, fontWeight: 600 }}>{k}</span>
              ))}
            </div>
          </div>

          {/* connector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 28, background: BG,
            borderLeft: `1.5px solid ${GRAY}`, borderRight: `1.5px solid ${GRAY}` }}>
            <div style={{ flex: 1, height: 1, background: GRAY }} />
            <div style={{ fontSize: 10, color: DIM, whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>↓  remembered in</div>
            <div style={{ flex: 1, height: 1, background: GRAY }} />
          </div>

          {/* ─ Layer 2: Episodic Memory ─ */}
          <div style={{ background: '#fff', border: '1.5px solid #EDE9FE',
            borderRadius: 4, padding: '28px 32px', position: 'relative', overflow: 'hidden', marginBottom: 2 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#6366F1' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6366F1', letterSpacing: '0.1em',
                  textTransform: 'uppercase', marginBottom: 6 }}>Layer 2 · Episodic Memory</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: INK, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                  Remembers every conversation, task, and outcome — forever
                </div>
                <div style={{ fontSize: 13, color: MUTED, marginTop: 8, lineHeight: 1.65, maxWidth: 560 }}>
                  No re-briefing, no context loss. Every session starts exactly where the last ended. The longer you work together, the sharper {e.name} gets.
                </div>
              </div>
              <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#6366F1',
                background: '#EDE9FE', padding: '5px 12px', borderRadius: 20, border: '1px solid #C4B5FD' }}>Builds after hire</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              {[
                { icon: '💬', label: 'Conversation log', desc: 'Full history of every exchange' },
                { icon: '✅', label: 'Task record', desc: 'What was done and when' },
                { icon: '🔐', label: 'Decision log', desc: 'Approvals, overrides — auditable' },
                { icon: '📊', label: 'Outcome tracking', desc: 'What worked, what didn\'t' },
              ].map(item => (
                <div key={item.label} style={{ background: '#F5F3FF', borderRadius: 10, padding: '14px 16px', border: '1px solid #EDE9FE' }}>
                  <div style={{ fontSize: 18, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: INK, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* connector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 28, background: BG,
            borderLeft: `1.5px solid ${GRAY}`, borderRight: `1.5px solid ${GRAY}` }}>
            <div style={{ flex: 1, height: 1, background: GRAY }} />
            <div style={{ fontSize: 10, color: DIM, whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>↓  grounded in</div>
            <div style={{ flex: 1, height: 1, background: GRAY }} />
          </div>

          {/* ─ Layer 3: Company Intelligence ─ */}
          <div style={{ background: '#fff', border: '1.5px solid #FEF3C7',
            borderRadius: 4, padding: '28px 32px', position: 'relative', overflow: 'hidden', marginBottom: 2 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#F59E0B' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#B45309', letterSpacing: '0.1em',
                  textTransform: 'uppercase', marginBottom: 6 }}>Layer 3 · Company Intelligence</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: INK, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                  Learns your business from everything you share
                </div>
                <div style={{ fontSize: 13, color: MUTED, marginTop: 8, lineHeight: 1.65, maxWidth: 560 }}>
                  Feed {e.name} your documents, website, SOPs, product catalog, and org chart. Indexed and drawn on when making every decision — your business context, always available.
                </div>
              </div>
              <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#B45309',
                background: '#FFFBEB', padding: '5px 12px', borderRadius: 20, border: '1px solid #FDE68A' }}>Configure after hire</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              {[
                { icon: '📄', label: 'Documents', desc: 'PDFs, Notion pages, Google Docs' },
                { icon: '🌐', label: 'Your website', desc: 'Indexed and read each session' },
                { icon: '📋', label: 'SOPs & playbooks', desc: 'Standard processes, always on' },
                { icon: '🏢', label: 'Org chart', desc: 'Who\'s who in your company' },
                { icon: '📦', label: 'Product catalog', desc: 'What you sell, how it\'s positioned' },
              ].map(item => (
                <div key={item.label} style={{ background: '#FFFBEB', borderRadius: 10, padding: '14px 16px', border: '1px solid #FDE68A50' }}>
                  <div style={{ fontSize: 18, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: INK, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* connector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 28, background: BG,
            borderLeft: `1.5px solid ${GRAY}`, borderRight: `1.5px solid ${GRAY}` }}>
            <div style={{ flex: 1, height: 1, background: GRAY }} />
            <div style={{ fontSize: 10, color: DIM, whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>↓  knows by name</div>
            <div style={{ flex: 1, height: 1, background: GRAY }} />
          </div>

          {/* ─ Layer 4: Relationship Memory ─ */}
          <div style={{ background: '#fff', border: '1.5px solid #FCE7F3',
            borderRadius: 4, padding: '28px 32px', position: 'relative', overflow: 'hidden', marginBottom: 2 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#EC4899' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#BE185D', letterSpacing: '0.1em',
                  textTransform: 'uppercase', marginBottom: 6 }}>Layer 4 · Relationship Memory</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: INK, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                  Knows who's in your world — and their full history
                </div>
                <div style={{ fontSize: 13, color: MUTED, marginTop: 8, lineHeight: 1.65, maxWidth: 560 }}>
                  Every customer, lead, partner, and stakeholder accumulates context over time. {e.name} remembers names, histories, and preferences so you never re-introduce anyone.
                </div>
              </div>
              <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#BE185D',
                background: '#FDF2F8', padding: '5px 12px', borderRadius: 20, border: '1px solid #FBCFE8' }}>Builds after hire</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              {[
                { icon: '🤝', label: 'Customers', desc: 'History, preferences, deal context' },
                { icon: '🎯', label: 'Leads', desc: 'Qualification notes and touchpoints' },
                { icon: '🔗', label: 'Partners', desc: 'Relationship context and agreements' },
                { icon: '👥', label: 'Stakeholders', desc: 'Internal contacts and their priorities' },
              ].map(item => (
                <div key={item.label} style={{ background: '#FDF2F8', borderRadius: 10, padding: '14px 16px', border: '1px solid #FBCFE850' }}>
                  <div style={{ fontSize: 18, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: INK, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* connector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 28, background: BG,
            borderLeft: `1.5px solid ${GRAY}`, borderRight: `1.5px solid ${GRAY}` }}>
            <div style={{ flex: 1, height: 1, background: GRAY }} />
            <div style={{ fontSize: 10, color: DIM, whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>↓  monitors</div>
            <div style={{ flex: 1, height: 1, background: GRAY }} />
          </div>

          {/* ─ Layer 5: Market Intelligence ─ */}
          <div style={{ background: '#fff', border: '1.5px solid #CFFAFE',
            borderRadius: 4, padding: '28px 32px', position: 'relative', overflow: 'hidden', marginBottom: 2 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#06B6D4' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#0E7490', letterSpacing: '0.1em',
                  textTransform: 'uppercase', marginBottom: 6 }}>Layer 5 · Market Intelligence</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: INK, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                  Always watching {e.dept.toLowerCase()} signals — never running on stale knowledge
                </div>
                <div style={{ fontSize: 13, color: MUTED, marginTop: 8, lineHeight: 1.65, maxWidth: 560 }}>
                  {e.name} monitors industry news, competitor moves, and regulatory changes in their domain. Every session starts with current intelligence — not frozen training data.
                </div>
              </div>
              <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#0E7490',
                background: '#ECFEFF', padding: '5px 12px', borderRadius: 20, border: '1px solid #A5F3FC' }}>Live feed</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              {[
                { icon: '📰', label: 'Industry signals', desc: 'Domain news filtered for relevance' },
                { icon: '🏴', label: 'Competitor moves', desc: 'Tracked and summarised weekly' },
                { icon: '⚖️', label: 'Regulatory updates', desc: 'Compliance changes in your sector' },
                { icon: '📈', label: 'Trend alerts', desc: 'Emerging shifts before they peak' },
              ].map(item => (
                <div key={item.label} style={{ background: '#ECFEFF', borderRadius: 10, padding: '14px 16px', border: '1px solid #A5F3FC50' }}>
                  <div style={{ fontSize: 18, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: INK, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* connector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 28, background: BG,
            borderLeft: `1.5px solid ${GRAY}`, borderRight: `1.5px solid ${GRAY}` }}>
            <div style={{ flex: 1, height: 1, background: GRAY }} />
            <div style={{ fontSize: 10, color: DIM, whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>↓  calibrates to</div>
            <div style={{ flex: 1, height: 1, background: GRAY }} />
          </div>

          {/* ─ Layer 6: Learning Loop ─ */}
          <div style={{ background: '#fff', border: '1.5px solid #EDE9FE',
            borderRadius: '4px 4px 16px 16px', padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#8B5CF6' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', letterSpacing: '0.1em',
                  textTransform: 'uppercase', marginBottom: 6 }}>Layer 6 · Learning Loop</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: INK, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                  Gets sharper every session — calibrated to you specifically
                </div>
                <div style={{ fontSize: 13, color: MUTED, marginTop: 8, lineHeight: 1.65, maxWidth: 560 }}>
                  {e.name} tracks what approaches worked for YOUR business specifically. Communication style, decision thresholds, quality standards — all adapt over time. Week 10 is measurably better than week 1.
                </div>
              </div>
              <div style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#7C3AED',
                background: '#F5F3FF', padding: '5px 12px', borderRadius: 20, border: '1px solid #DDD6FE' }}>Compounds over time</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              {[
                { icon: '🎨', label: 'Style calibration', desc: 'Tone and format matched to your team' },
                { icon: '⚡', label: 'Workflow preferences', desc: 'How you like to work, learned over time' },
                { icon: '🏆', label: 'Quality benchmarks', desc: 'Your standards, remembered forever' },
              ].map(item => (
                <div key={item.label} style={{ background: '#F5F3FF', borderRadius: 10, padding: '14px 16px', border: '1px solid #EDE9FE' }}>
                  <div style={{ fontSize: 18, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: INK, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
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
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 260px', height: '80vh', maxWidth: 1100, margin: '0 auto', padding: '0 32px' }}>

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
