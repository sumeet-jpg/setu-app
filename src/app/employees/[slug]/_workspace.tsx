// @ts-nocheck
'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { SetuLogo } from '@/components/SetuLogo'
import { getStuntTitle } from '@/lib/employees/profiles'

/* ─── Types ──────────────────────────────────────────────────── */
interface PlanStep {
  id: number
  label: string
  tool: string | null
  detail: string
  status: 'pending' | 'running' | 'done' | 'error'
}

interface Plan {
  summary: string
  steps: PlanStep[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  plan?: Plan
  planState?: 'awaiting_approval' | 'running' | 'done' | 'cancelled'
}

interface ToolEntry {
  name: string
  icon: string
  category: string
  apiKeyLabel?: string
  oauthLabel?: string
  placeholder?: string
}

/* ─── Extract tool list from employee tools config ───────────── */
function extractTools(toolGroups: any[]): ToolEntry[] {
  const icons: Record<string, string> = {
    HubSpot: '🟠', Salesforce: '🔵', Pipedrive: '🟢', 'Close.io': '⚫', Copper: '🟤',
    Mailchimp: '🐒', Klaviyo: '📧', SendGrid: '📨', 'ActiveCampaign': '⚡', Brevo: '📬',
    Stripe: '💳', PayPal: '🅿️', Razorpay: '🔴', Chargebee: '💰', Recurly: '🔄',
    Slack: '💬', Gmail: '📮', Outlook: '📧', Notion: '📓', Airtable: '🗂️',
    'Google Analytics': '📊', 'Mixpanel': '📉', Amplitude: '📈', PostHog: '🦔',
    Jira: '🐞', Linear: '〰️', Asana: '🎯', Trello: '📋', Monday: '📆',
    GitHub: '🐙', GitLab: '🦊', Vercel: '▲', AWS: '☁️', GCP: '🌐',
    Ahrefs: '🔍', SEMrush: '🔎', 'Google Search Console': '🔬', Moz: '🌎',
    'Google Ads': '🔷', 'Meta Ads': '🔵', 'LinkedIn Ads': '🔗', 'Twitter Ads': '🐦',
    Shopify: '🛒', WooCommerce: '🛍️', Amazon: '📦', Flipkart: '📱',
    QuickBooks: '📒', Xero: '📗', Zoho: '🔵', Freshbooks: '📘',
    Workday: '🏢', Darwinbox: '🦕', BambooHR: '🎋', Rippling: '🌊',
    Twilio: '📞', WhatsApp: '💚', Intercom: '💙', Zendesk: '🎫', Freshdesk: '🌿',
  }
  const out: ToolEntry[] = []
  for (const group of (toolGroups ?? [])) {
    for (const tool of (group.tools ?? [])) {
      if (!out.find(t => t.name === tool)) {
        out.push({
          name: tool,
          icon: icons[tool] ?? '🔧',
          category: group.category,
          apiKeyLabel: `${tool} API Key`,
          placeholder: `Enter your ${tool} API key...`,
        })
      }
    }
  }
  return out
}

/* ─── Parse plan from streamed content ───────────────────────── */
function parsePlan(content: string): { text: string; plan: Plan | null } {
  const planMatch = content.match(/<plan>([\s\S]*?)<\/plan>/)
  if (!planMatch) return { text: content, plan: null }
  try {
    const plan: Plan = JSON.parse(planMatch[1].trim())
    plan.steps = plan.steps.map(s => ({ ...s, status: 'pending' }))
    const text = content.replace(/<plan>[\s\S]*?<\/plan>/, '').trim()
    return { text, plan }
  } catch {
    return { text: content, plan: null }
  }
}

/* ─── Token colors ───────────────────────────────────────────── */
const BG       = '#0C0F1A'
const SURFACE  = '#151824'
const BORDER   = 'rgba(148,163,184,0.10)'
const BORDER2  = 'rgba(148,163,184,0.16)'
const MUTED    = '#64748B'
const TEXT     = '#F1F5F9'
const DIM      = '#475569'
const F        = 'var(--font-jakarta, system-ui)'

/* ─── Main Workspace ─────────────────────────────────────────── */
export default function EmployeeWorkspace({ employee }: { employee: any }) {
  const e = employee

  /* state */
  const [msgs, setMsgs] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [connectedTools, setConnectedTools] = useState<Record<string, string>>({})
  const [connectModal, setConnectModal] = useState<ToolEntry | null>(null)
  const [apiKeyDraft, setApiKeyDraft] = useState('')
  const [listening, setListening] = useState(false)
  const [runningPlanIdx, setRunningPlanIdx] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  const toolList = extractTools(e.tools)
  const stuntTitle = getStuntTitle(e.name)

  /* load connections from localStorage */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`setu_tools_${e.slug}`)
      if (saved) setConnectedTools(JSON.parse(saved))
    } catch {}
  }, [e.slug])

  /* scroll to bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  /* initial greeting */
  useEffect(() => {
    setMsgs([{
      role: 'assistant',
      content: `Hi! I'm ${e.name}, your ${e.title} ${stuntTitle}. ${e.tagline}\n\nTell me what you need done — I'll create a plan and start executing immediately.`,
    }])
  }, [e.slug])

  /* ── send message ── */
  const send = useCallback(async (text?: string) => {
    const txt = (text ?? input).trim()
    if (!txt || streaming) return
    setInput('')
    setStreaming(true)

    const userMsg: Message = { role: 'user', content: txt }
    const history = [...msgs, userMsg]
    setMsgs(history)

    const connected = Object.entries(connectedTools)
      .filter(([, v]) => v)
      .map(([k]) => k)

    try {
      const res = await fetch('/api/employees/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: e.slug,
          messages: history.map(m => ({ role: m.role, content: m.content })),
          connectedTools: connected,
        }),
      })

      if (!res.body) throw new Error('No response body')
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let partial = ''
      let accumulated = ''

      setMsgs(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        partial += dec.decode(value, { stream: true })
        const lines = partial.split('\n')
        partial = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const d = line.slice(6)
          if (d === '[DONE]') continue
          try {
            const j = JSON.parse(d)
            const delta = j.choices?.[0]?.delta?.content ?? ''
            if (!delta) continue
            accumulated += delta
            const { text: displayText, plan } = parsePlan(accumulated)
            setMsgs(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                role: 'assistant',
                content: displayText,
                ...(plan ? { plan, planState: 'awaiting_approval' } : {}),
              }
              return updated
            })
          } catch {}
        }
      }
    } catch (err) {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again.' }])
    } finally {
      setStreaming(false)
    }
  }, [input, msgs, streaming, connectedTools, e.slug])

  /* ── keyboard handler ── */
  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  /* ── voice input ── */
  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = true
    rec.onresult = (ev: any) => {
      const transcript = Array.from(ev.results).map((r: any) => r[0].transcript).join('')
      setInput(transcript)
    }
    rec.onend = () => {
      setListening(false)
    }
    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }

  /* ── connect a tool ── */
  function saveConnection() {
    if (!connectModal) return
    const updated = { ...connectedTools, [connectModal.name]: apiKeyDraft }
    setConnectedTools(updated)
    localStorage.setItem(`setu_tools_${e.slug}`, JSON.stringify(updated))
    setConnectModal(null)
    setApiKeyDraft('')
  }

  function disconnectTool(name: string) {
    const updated = { ...connectedTools }
    delete updated[name]
    setConnectedTools(updated)
    localStorage.setItem(`setu_tools_${e.slug}`, JSON.stringify(updated))
  }

  /* ── execute a plan ── */
  async function approvePlan(msgIdx: number) {
    const msg = msgs[msgIdx]
    if (!msg.plan) return

    setRunningPlanIdx(msgIdx)
    const steps = msg.plan.steps.map(s => ({ ...s, status: 'pending' as const }))

    setMsgs(prev => {
      const updated = [...prev]
      updated[msgIdx] = { ...updated[msgIdx], planState: 'running', plan: { ...updated[msgIdx].plan!, steps } }
      return updated
    })

    for (let i = 0; i < steps.length; i++) {
      /* mark step running */
      setMsgs(prev => {
        const updated = [...prev]
        const p = { ...updated[msgIdx].plan! }
        p.steps = p.steps.map((s, si) => si === i ? { ...s, status: 'running' } : s)
        updated[msgIdx] = { ...updated[msgIdx], plan: p }
        return updated
      })

      /* simulate execution (1.2–2s per step) */
      await delay(1200 + Math.random() * 800)

      /* mark step done */
      setMsgs(prev => {
        const updated = [...prev]
        const p = { ...updated[msgIdx].plan! }
        p.steps = p.steps.map((s, si) => si === i ? { ...s, status: 'done' } : s)
        updated[msgIdx] = { ...updated[msgIdx], plan: p }
        return updated
      })
    }

    /* plan complete — add summary message */
    setMsgs(prev => {
      const updated = [...prev]
      updated[msgIdx] = { ...updated[msgIdx], planState: 'done' }
      return [
        ...updated,
        {
          role: 'assistant',
          content: `All done! ✅ ${msg.plan!.summary} — everything is set up and running. Check your connected tools for results. Need anything else?`,
        },
      ]
    })
    setRunningPlanIdx(null)
  }

  function cancelPlan(msgIdx: number) {
    setMsgs(prev => {
      const updated = [...prev]
      updated[msgIdx] = { ...updated[msgIdx], planState: 'cancelled' }
      return updated
    })
  }

  const connectedCount = Object.values(connectedTools).filter(Boolean).length

  /* ─── Render ─── */
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: BG, color: TEXT, fontFamily: F, overflow: 'hidden' }}>
      {/* ── NAV ── */}
      <nav style={{ height: 52, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, background: SURFACE, flexShrink: 0, zIndex: 20 }}>
        <SetuLogo size={26} color="#22c55e" wordColor={TEXT} />
        <div style={{ width: 1, height: 22, background: BORDER2, margin: '0 4px' }} />
        <Link href="/employees" style={{ fontSize: 12, color: MUTED, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Employees
        </Link>
        <span style={{ fontSize: 12, color: MUTED }}>/</span>
        <span style={{ fontSize: 12, color: DIM }}>{e.emoji} {e.name}</span>
        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: MUTED, fontWeight: 600 }}>{stuntTitle}</span>

        <div style={{ flex: 1 }} />

        <Link href={`/employees/${e.slug}/interview`} style={{ padding: '6px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${BORDER2}`, color: MUTED, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
          Interview free
        </Link>
        <Link href={`/employees/${e.slug}/hire`} style={{ padding: '6px 16px', borderRadius: 8, background: e.color, color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
          Hire {e.name} →
        </Link>
      </nav>

      {/* ── THREE-PANEL BODY ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr 260px', overflow: 'hidden' }}>

        {/* ── LEFT: Tools + Employee ── */}
        <div style={{ background: SURFACE, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Employee header */}
          <div style={{ padding: '20px 18px 16px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: e.color + '18', border: `1.5px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {e.emoji}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, letterSpacing: '-0.02em' }}>{e.name}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{e.title} {stuntTitle}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { v: e.agentCount, l: 'agents' },
                { v: e.years + 'yr', l: 'exp' },
              ].map(s => (
                <div key={s.l} style={{ flex: 1, background: BG, borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: e.color, letterSpacing: '-0.04em' }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: MUTED, marginTop: 1 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tools panel */}
          <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Integrations</div>
              <div style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: connectedCount > 0 ? '#22c55e18' : BG, color: connectedCount > 0 ? '#22c55e' : MUTED, fontWeight: 600 }}>
                {connectedCount}/{toolList.length} connected
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {toolList.map(tool => {
                const isConnected = !!connectedTools[tool.name]
                return (
                  <div
                    key={tool.name}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                      borderRadius: 8, background: BG, border: `1px solid ${isConnected ? e.color + '30' : BORDER}`,
                      cursor: 'pointer', transition: 'border-color 0.15s',
                    }}
                    onClick={() => {
                      if (isConnected) {
                        if (confirm(`Disconnect ${tool.name}?`)) disconnectTool(tool.name)
                      } else {
                        setConnectModal(tool)
                        setApiKeyDraft('')
                      }
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{tool.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tool.name}</div>
                      <div style={{ fontSize: 9, color: MUTED }}>{tool.category}</div>
                    </div>
                    {isConnected ? (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0, boxShadow: '0 0 6px #22c55e80' }} />
                    ) : (
                      <span style={{ fontSize: 10, color: e.color, fontWeight: 600, flexShrink: 0 }}>+ API</span>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ padding: '12px 0', color: MUTED, fontSize: 10, lineHeight: 1.6 }}>
              Connect your tools above. {e.name} will use them to execute tasks — no extra setup needed.
            </div>
          </div>

          {/* Pricing */}
          <div style={{ padding: '12px 14px', borderTop: `1px solid ${BORDER}`, background: BG }}>
            <div style={{ fontSize: 10, color: MUTED, marginBottom: 2 }}>Starting at</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, letterSpacing: '-0.04em' }}>{e.pricing.label}/mo</div>
          </div>
        </div>

        {/* ── CENTER: Chat ── */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: BG }}>
          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {msgs.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', ...(msg.role === 'user' ? { flexDirection: 'row-reverse' } : {}) }}>
                {/* Avatar */}
                {msg.role === 'assistant' && (
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: e.color + '18', border: `1.5px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, marginTop: 2 }}>
                    {e.emoji}
                  </div>
                )}

                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Message bubble */}
                  {msg.content && (
                    <div style={{
                      padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                      background: msg.role === 'user' ? e.color : SURFACE,
                      color: msg.role === 'user' ? '#fff' : TEXT,
                      fontSize: 14, lineHeight: 1.72,
                      border: msg.role === 'assistant' ? `1px solid ${BORDER}` : 'none',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {msg.content}
                      {streaming && idx === msgs.length - 1 && msg.role === 'assistant' && !msg.plan && (
                        <span style={{ display: 'inline-block', width: 8, height: 14, background: e.color, borderRadius: 2, marginLeft: 4, animation: 'blink 0.8s step-end infinite', verticalAlign: 'middle' }} />
                      )}
                    </div>
                  )}

                  {/* Plan card */}
                  {msg.plan && msg.planState !== 'cancelled' && (
                    <PlanCard
                      plan={msg.plan}
                      planState={msg.planState ?? 'awaiting_approval'}
                      accent={e.color}
                      onApprove={() => approvePlan(idx)}
                      onCancel={() => cancelPlan(idx)}
                    />
                  )}
                  {msg.plan && msg.planState === 'cancelled' && (
                    <div style={{ fontSize: 12, color: MUTED, fontStyle: 'italic' }}>Plan cancelled.</div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {streaming && msgs[msgs.length - 1]?.role !== 'assistant' && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: e.color + '18', border: `1.5px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {e.emoji}
                </div>
                <div style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: SURFACE, border: `1px solid ${BORDER}`, display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: MUTED, animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Input area ── */}
          <div style={{ borderTop: `1px solid ${BORDER}`, padding: '16px 20px', background: SURFACE }}>
            {/* Quick prompts (only show if no messages yet beyond greeting) */}
            {msgs.length <= 1 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {getQuickPrompts(e).map(p => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    style={{ fontSize: 11, padding: '5px 11px', borderRadius: 20, background: BG, border: `1px solid ${BORDER2}`, color: MUTED, cursor: 'pointer', fontFamily: F, transition: 'border-color 0.15s' }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={ev => setInput(ev.target.value)}
                  onKeyDown={onKey}
                  placeholder={`Ask ${e.name} anything, or describe a task to execute...`}
                  disabled={streaming}
                  rows={1}
                  style={{
                    width: '100%', padding: '11px 44px 11px 16px',
                    background: BG, border: `1px solid ${BORDER2}`,
                    borderRadius: 12, color: TEXT, fontSize: 14, outline: 'none',
                    fontFamily: F, resize: 'none', lineHeight: 1.5, boxSizing: 'border-box',
                    maxHeight: 120, overflowY: 'auto',
                    transition: 'border-color 0.2s',
                  }}
                />
                {/* Voice button inside input */}
                <button
                  onClick={toggleVoice}
                  style={{
                    position: 'absolute', right: 10, bottom: 9,
                    width: 28, height: 28, borderRadius: 8,
                    background: listening ? e.color : 'transparent',
                    border: `1px solid ${listening ? e.color : BORDER2}`,
                    color: listening ? '#fff' : MUTED,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, transition: 'all 0.2s',
                  }}
                  title="Voice input"
                >
                  🎙️
                </button>
              </div>
              <button
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: input.trim() && !streaming ? e.color : SURFACE,
                  border: `1px solid ${input.trim() && !streaming ? e.color : BORDER2}`,
                  color: input.trim() && !streaming ? '#fff' : MUTED,
                  cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, transition: 'all 0.2s',
                }}
              >
                ↑
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: DIM, textAlign: 'center' }}>
              Powered by Claude Sonnet · Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>

        {/* ── RIGHT: Capabilities + CTA ── */}
        <div style={{ background: SURFACE, borderLeft: `1px solid ${BORDER}`, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: DIM, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>What {e.name} does</div>

            {e.capabilities.map((cap: any) => (
              <CapabilityBlock key={cap.area} cap={cap} accent={e.color} />
            ))}
          </div>

          {/* Sticky CTA */}
          <div style={{ marginTop: 'auto', padding: '16px', borderTop: `1px solid ${BORDER}`, background: BG }}>
            <div style={{ fontSize: 12, color: MUTED, marginBottom: 10, lineHeight: 1.6 }}>
              This is a free demo. Hire your {e.title} {stuntTitle} to run your workflows automatically, 24/7.
            </div>
            <Link href={`/employees/${e.slug}/hire`} style={{ display: 'block', padding: '11px', borderRadius: 10, background: e.color, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center', marginBottom: 6 }}>
              Hire {e.name} — {e.pricing.label}/mo →
            </Link>
            <div style={{ fontSize: 10, color: DIM, textAlign: 'center' }}>
              {e.agentCount} agents · Cancel anytime
            </div>
          </div>
        </div>
      </div>

      {/* ── Connect modal ── */}
      {connectModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          onClick={ev => { if (ev.target === ev.currentTarget) setConnectModal(null) }}
        >
          <div style={{ background: SURFACE, border: `1px solid ${BORDER2}`, borderRadius: 20, padding: 28, width: 420, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 24 }}>{connectModal.icon}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Connect {connectModal.name}</div>
                <div style={{ fontSize: 12, color: MUTED }}>{connectModal.category}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8 }}>
                {connectModal.apiKeyLabel ?? `${connectModal.name} API Key`}
              </label>
              <input
                type="password"
                value={apiKeyDraft}
                onChange={ev => setApiKeyDraft(ev.target.value)}
                onKeyDown={ev => ev.key === 'Enter' && saveConnection()}
                placeholder={connectModal.placeholder ?? 'Enter your API key...'}
                autoFocus
                style={{ width: '100%', padding: '11px 14px', background: BG, border: `1px solid ${BORDER2}`, borderRadius: 10, color: TEXT, fontSize: 14, outline: 'none', fontFamily: F, boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ fontSize: 12, color: DIM, marginBottom: 20, lineHeight: 1.7 }}>
              Your API key is stored only in your browser (localStorage). It is never sent to our servers — {e.name} uses it to call {connectModal.name}'s API directly.
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setConnectModal(null)}
                style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'transparent', border: `1px solid ${BORDER2}`, color: MUTED, cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={saveConnection}
                disabled={!apiKeyDraft.trim()}
                style={{ flex: 2, padding: '10px', borderRadius: 10, background: apiKeyDraft.trim() ? e.color : SURFACE, border: 'none', color: '#fff', cursor: apiKeyDraft.trim() ? 'pointer' : 'not-allowed', fontFamily: F, fontSize: 13, fontWeight: 700 }}
              >
                Connect {connectModal.name}
              </button>
            </div>

            <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: DIM }}>
              Don't have an API key?{' '}
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(connectModal.name + ' API key')}`}
                target="_blank" rel="noopener"
                style={{ color: e.color, textDecoration: 'none', fontWeight: 600 }}
              >
                Get one here →
              </a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100% { opacity: 1 } 50% { opacity: 0 } }
        @keyframes bounce { 0%,80%,100% { transform: translateY(0) } 40% { transform: translateY(-6px) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
      `}</style>
    </div>
  )
}

/* ─── Plan card component ─────────────────────────────────────── */
function PlanCard({ plan, planState, accent, onApprove, onCancel }: {
  plan: Plan
  planState: string
  accent: string
  onApprove: () => void
  onCancel: () => void
}) {
  return (
    <div style={{ background: '#0A0F1E', border: `1.5px solid ${accent}30`, borderRadius: 14, overflow: 'hidden', animation: 'fadeIn 0.25s ease-out' }}>
      {/* Plan header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: planState === 'done' ? '#22c55e' : planState === 'running' ? accent : '#F59E0B', animation: planState === 'running' ? 'pulse 1s ease-in-out infinite' : 'none' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>
          {planState === 'done' ? '✅ Completed' : planState === 'running' ? '⚡ Running' : planState === 'awaiting_approval' ? '📋 Action Plan' : 'Plan'}
        </span>
        <span style={{ fontSize: 11, color: MUTED, marginLeft: 4 }}>{plan.summary}</span>
      </div>

      {/* Steps */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {plan.steps.map((step, i) => (
          <div key={step.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            {/* Step status icon */}
            <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, marginTop: 1,
              background: step.status === 'done' ? '#22c55e18' : step.status === 'running' ? accent + '20' : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${step.status === 'done' ? '#22c55e' : step.status === 'running' ? accent : 'rgba(255,255,255,0.12)'}`,
              color: step.status === 'done' ? '#22c55e' : step.status === 'running' ? accent : MUTED,
            }}>
              {step.status === 'done' ? '✓' : step.status === 'running' ? (
                <div style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${accent}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              ) : i + 1}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: step.status === 'done' ? MUTED : TEXT }}>{step.label}</div>
              {step.tool && (
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>via {step.tool}</div>
              )}
              {step.detail && step.status === 'running' && (
                <div style={{ fontSize: 11, color: accent, marginTop: 2 }}>{step.detail}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Approval buttons */}
      {planState === 'awaiting_approval' && (
        <div style={{ padding: '12px 16px', borderTop: `1px solid rgba(255,255,255,0.06)`, display: 'flex', gap: 8 }}>
          <button
            onClick={onApprove}
            style={{ flex: 2, padding: '9px 16px', borderRadius: 8, background: accent, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}
          >
            ▶ Approve & Run
          </button>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '9px 14px', borderRadius: 8, background: 'transparent', border: `1px solid rgba(255,255,255,0.12)`, color: MUTED, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Capability block ───────────────────────────────────────── */
function CapabilityBlock({ cap, accent }: { cap: any; accent: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: 6 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 8, background: open ? accent + '12' : 'transparent', border: `1px solid ${open ? accent + '30' : BORDER}`, cursor: 'pointer', fontFamily: F, textAlign: 'left', transition: 'all 0.15s' }}
      >
        <span style={{ fontSize: 16 }}>{cap.icon}</span>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: TEXT }}>{cap.area}</span>
        <span style={{ fontSize: 10, color: MUTED }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '8px 10px 4px', animation: 'fadeIn 0.15s ease-out' }}>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 6, lineHeight: 1.5 }}>{cap.blurb}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {cap.scenarios.slice(0, 4).map((s: string) => (
              <div key={s} style={{ fontSize: 11, color: DIM, display: 'flex', gap: 5 }}>
                <span style={{ color: accent }}>›</span> {s}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Quick prompts by dept ──────────────────────────────────── */
function getQuickPrompts(e: any): string[] {
  const d = e.dept
  if (d === 'Marketing' || e.title.includes('CMO') || e.title.includes('Brand')) {
    return ['Write a weekly email campaign', 'Analyze my top campaigns', 'Create a content calendar']
  }
  if (d === 'Finance' || e.title.includes('CFO')) {
    return ['Generate a P&L summary', 'Forecast next quarter cash flow', 'Prepare board financials']
  }
  if (d === 'Sales') {
    return ['Review my pipeline', 'Write 5 outreach emails', 'Analyze this quarter\'s deals']
  }
  if (d === 'Messaging & Commerce' || e.title.includes('WhatsApp')) {
    return ['Set up a lead qualification flow', 'Write a broadcast campaign', 'Analyze response rates']
  }
  if (d === 'HR & People' || d === 'People Operations') {
    return ['Post a job description', 'Screen 10 applicants', 'Create onboarding plan']
  }
  if (d === 'Analytics') {
    return ['Run a cohort analysis', 'Build a retention report', 'Find conversion drop-offs']
  }
  if (d === 'Customer Success' || d === 'Customer Support') {
    return ['Show me NPS trends', 'Summarize open tickets', 'Generate health scores']
  }
  if (d === 'Engineering' || d === 'IT Operations') {
    return ['Review open PRs', 'Create a sprint plan', 'Analyze system performance']
  }
  return ['What can you do?', 'Show me a weekly report', 'Give me a task plan']
}

/* ─── Util ───────────────────────────────────────────────────── */
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
