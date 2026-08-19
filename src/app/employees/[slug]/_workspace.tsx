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
      <div style={{ width: size, height: size, borderRadius: 4, background: '#334155',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.45, color: '#94A3B8', fontWeight: 700, flexShrink: 0 }}>
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 16,
        padding: 28, maxWidth: 480, width: '100%', color: '#E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <ToolLogo slug={toolSlug} name={toolDef.name} size={32} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Connect {toolDef.name}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{toolDef.category}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none',
            color: '#64748B', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16,
          background: '#1E293B', borderRadius: 8, padding: '10px 14px' }}>
          <strong style={{ color: '#E2E8F0' }}>How to get your key:</strong><br/>
          {toolDef.authHint}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
            {toolDef.authLabel}
          </label>
          <input
            value={key} onChange={e => setKey(e.target.value)}
            placeholder={toolDef.authPlaceholder} type="password"
            style={{ width: '100%', background: '#1E293B', border: '1px solid #334155',
              borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 13,
              outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {extras.map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 6 }}>{f.label}</label>
            <input value={config[f.key] ?? ''} onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              style={{ width: '100%', background: '#1E293B', border: '1px solid #334155',
                borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 13,
                outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}

        {error && <div style={{ color: '#F87171', fontSize: 12, marginBottom: 12 }}>{error}</div>}

        <div style={{ fontSize: 11, color: '#475569', marginBottom: 16 }}>
          🔒 Your key is AES-256-GCM encrypted at rest. It is never logged or sent to third parties.
        </div>

        <button onClick={handleConnect} disabled={loading}
          style={{ width: '100%', background: '#6366F1', color: '#fff', border: 'none',
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
    <div style={{ background: '#1E293B', border: '1px solid #F59E0B40', borderRadius: 12,
      padding: 16, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <span style={{ fontWeight: 700, color: '#F59E0B', fontSize: 14 }}>Approval Required</span>
        {!gate.reversible && (
          <span style={{ fontSize: 11, background: '#7F1D1D', color: '#FCA5A5',
            borderRadius: 4, padding: '2px 6px', marginLeft: 'auto' }}>Irreversible</span>
        )}
      </div>
      <div style={{ fontWeight: 600, fontSize: 14, color: '#E2E8F0', marginBottom: 8 }}>{gate.action}</div>
      <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 6, lineHeight: 1.6 }}>{gate.details}</div>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
        <strong style={{ color: '#94A3B8' }}>Affects:</strong> {gate.affected}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => decide('approved')} disabled={!!loading}
          style={{ flex: 1, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8,
            padding: '9px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            opacity: loading ? 0.6 : 1 }}>
          {loading === 'approved' ? 'Approving…' : '✓ Approve'}
        </button>
        <button onClick={() => decide('rejected')} disabled={!!loading}
          style={{ flex: 1, background: '#1E293B', color: '#94A3B8', border: '1px solid #334155',
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
    : event.ok === false ? '#EF4444' : '#6366F1'
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#020817', color: '#E2E8F0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Nav ── */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
        borderBottom: '1px solid #1E293B', flexShrink: 0 }}>
        <Link href="/employees" style={{ color: '#64748B', textDecoration: 'none', fontSize: 13 }}>← All Stuntmen</Link>
        <span style={{ color: '#1E293B' }}>/</span>
        <span style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>{e.name}</span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
          background: '#1E293B', color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {stuntTitle}
        </span>
        {streaming && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6366F1', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366F1', display: 'inline-block',
              animation: 'pulse 1s infinite' }} />
            Working…
          </span>
        )}
        <Link href={`/employees/${e.slug}/hire`}
          style={{ marginLeft: streaming ? 0 : 'auto', background: e.color + '18', color: e.color,
            border: `1px solid ${e.color}40`, borderRadius: 8, padding: '6px 14px',
            fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
          Hire {e.name}
        </Link>
      </nav>

      {/* ── Body: 3 panels ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 260px', flex: 1, overflow: 'hidden' }}>

        {/* ── LEFT: Tool connections ── */}
        <aside style={{ borderRight: '1px solid #1E293B', overflow: 'auto',
          padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: 12 }}>Tool Connections</div>

          {expectedSlugs.length === 0 ? (
            <div style={{ fontSize: 12, color: '#475569' }}>No tools mapped for this employee.</div>
          ) : expectedSlugs.map(slug => {
            const toolDef = TOOL_REGISTRY.find(t => t.slug === slug)
            if (!toolDef) return null
            const isConnected = connectedSlugs.has(slug)
            return (
              <div key={slug} style={{ display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8, marginBottom: 4,
                background: isConnected ? '#0F2419' : '#0F172A',
                border: `1px solid ${isConnected ? '#16A34A30' : '#1E293B'}` }}>
                <ToolLogo slug={slug} name={toolDef.name} size={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {toolDef.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>{toolDef.category}</div>
                </div>
                {isConnected ? (
                  <button onClick={() => disconnectTool(slug)}
                    title="Disconnect" style={{ background: 'none', border: 'none',
                      color: '#16A34A', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>✓</button>
                ) : (
                  <button onClick={() => setConnectingSlug(slug)}
                    style={{ background: '#1E293B', border: '1px solid #334155',
                      color: '#94A3B8', borderRadius: 6, padding: '3px 8px', fontSize: 11,
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
              <div style={{ fontSize: 10, color: '#334155', margin: '10px 0 8px',
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>Other connected</div>
              {connected.filter(c => !expectedSlugs.includes(c.slug)).map(c => (
                <div key={c.slug} style={{ display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8, marginBottom: 4,
                  background: '#0F2419', border: '1px solid #16A34A30' }}>
                  <ToolLogo slug={c.slug} name={c.name} size={22} />
                  <div style={{ flex: 1, fontSize: 12, color: '#94A3B8' }}>{c.name}</div>
                  <button onClick={() => disconnectTool(c.slug)}
                    title="Disconnect" style={{ background: 'none', border: 'none',
                      color: '#16A34A', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✓</button>
                </div>
              ))}
            </>
          )}

          {/* Employee info */}
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #1E293B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: e.color + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {e.emoji}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#E2E8F0' }}>{e.name}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{e.title} · {stuntTitle}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#64748B' }}>
              {e.agentCount} agents · {e.years} yrs exp
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: e.color, marginTop: 6 }}>{e.pricing.label}</div>
          </div>
        </aside>

        {/* ── CENTER: Chat ── */}
        <main style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', display: 'flex',
            flexDirection: 'column', gap: 16 }}>
            {msgs.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
                {msg.role === 'system' ? (
                  <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic', textAlign: 'center',
                    width: '100%', padding: '4px 0' }}>{msg.content}</div>
                ) : (
                  <div style={{ maxWidth: '80%' }}>
                    <div style={{
                      background: msg.role === 'user' ? e.color + '18' : '#0F172A',
                      border: `1px solid ${msg.role === 'user' ? e.color + '30' : '#1E293B'}`,
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '12px 16px', fontSize: 14, lineHeight: 1.7, color: '#E2E8F0',
                      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {msg.content || (streaming && i === msgs.length - 1 ? (
                        <span style={{ color: '#64748B', fontStyle: 'italic' }}>Thinking…</span>
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
          <div style={{ padding: '16px 24px', borderTop: '1px solid #1E293B', flexShrink: 0 }}>
            {/* Quick chips */}
            {msgs.length <= 1 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {[
                  `Plan a campaign for ${new Date().toLocaleString('default', { month: 'long' })}`,
                  'What tools do you need from me?',
                  'Show me what you can do with my connected tools',
                  'Audit my current setup and flag gaps',
                ].map(chip => (
                  <button key={chip} onClick={() => { setInput(chip) }}
                    style={{ background: '#0F172A', border: '1px solid #1E293B', color: '#94A3B8',
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
                style={{ flex: 1, background: '#0F172A', border: '1px solid #334155', borderRadius: 12,
                  padding: '12px 14px', color: '#E2E8F0', fontSize: 14, resize: 'none',
                  outline: 'none', lineHeight: 1.5, fontFamily: 'inherit' }}
              />
              <button onClick={handleSend} disabled={streaming || !input.trim()}
                style={{ background: streaming || !input.trim() ? '#1E293B' : e.color,
                  color: streaming || !input.trim() ? '#475569' : '#fff',
                  border: 'none', borderRadius: 10, width: 44, height: 44,
                  fontSize: 18, cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s' }}>
                {streaming ? '⏸' : '↑'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#334155', marginTop: 8, textAlign: 'center' }}>
              Real API calls · Approval required before any action · Keys encrypted
            </div>
          </div>
        </main>

        {/* ── RIGHT: Capabilities ── */}
        <aside style={{ borderLeft: '1px solid #1E293B', overflow: 'auto',
          padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: 4 }}>What I Can Do</div>

          {e.capabilities.map((cap, i) => (
            <details key={i} style={{ borderRadius: 8, background: '#0F172A',
              border: '1px solid #1E293B', padding: '10px 12px' }}>
              <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 12, fontWeight: 600, color: '#E2E8F0', listStyle: 'none' }}>
                <span>{cap.icon}</span>
                <span>{cap.area}</span>
              </summary>
              <ul style={{ margin: '10px 0 0', padding: '0 0 0 8px', listStyle: 'none',
                display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(cap.scenarios ?? []).map((s: string, j: number) => (
                  <li key={j} style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5,
                    cursor: 'pointer', padding: '2px 0' }}
                    onClick={() => { setInput(s); textareaRef.current?.focus() }}>
                    › {s}
                  </li>
                ))}
              </ul>
            </details>
          ))}

          {/* How it works */}
          <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: '#64748B',
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>How I Work</div>
          {e.howItWorks.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: e.color + '20',
                color: e.color, fontSize: 11, fontWeight: 700, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0' }}>{step.step}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, lineHeight: 1.5 }}>{step.detail}</div>
              </div>
            </div>
          ))}
        </aside>
      </div>

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
        textarea::placeholder { color: #475569; }
        details summary::-webkit-details-marker { display: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 2px; }
      `}</style>
    </div>
  )
}
