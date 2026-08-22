'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTool, toolLogoUrl, employeeToolSlugs } from '@/lib/tools/registry'
import { authFetch } from '@/lib/manage-token-client'

const C = {
  bg: '#0B0D14', surface: '#141620', card: '#1B1E2C', border: 'rgba(148,163,184,0.08)',
  text: '#E2E8F0', muted: '#64748B', accent: '#6366F1', green: '#22C55E', amber: '#F59E0B',
}

function getUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('setu_user_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('setu_user_id', id) }
  return id
}

const STEPS = ['Context', 'KPIs', 'Tools', 'Launch'] as const

export default function OnboardClient({
  slug, employeeName, employeeEmoji, employeeTitle, employeeColor, tools,
}: {
  slug: string; employeeName: string; employeeEmoji: string; employeeTitle: string; employeeColor: string
  tools: { category: string; icon: string; tools: string[] }[]
}) {
  const [userId] = useState(() => getUserId())
  const [step, setStep] = useState(0)

  // Step 1 — context doc
  const [docName, setDocName] = useState('')
  const [docContent, setDocContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  // Step 2 — KPIs
  const [kpis, setKpis] = useState(['', '', ''])
  const [savingKpis, setSavingKpis] = useState(false)
  const [kpisSaved, setKpisSaved] = useState(false)

  // Step 3 — tools
  const relevantSlugs = employeeToolSlugs(tools).slice(0, 6)
  const relevantTools = relevantSlugs.map(s => getTool(s)).filter(Boolean) as NonNullable<ReturnType<typeof getTool>>[]
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connectKey, setConnectKey] = useState('')
  const [connected, setConnected] = useState<Set<string>>(new Set())
  const [connectError, setConnectError] = useState('')

  useEffect(() => {
    authFetch(`/api/tools/connections?user_id=${userId}`)
      .then(r => r.ok ? r.json() : { connections: [] })
      .then(d => setConnected(new Set((d.connections ?? []).map((c: any) => c.slug))))
      .catch(() => {})
  }, [userId])

  async function uploadDoc() {
    if (!docName.trim() || !docContent.trim()) return
    setUploading(true)
    try {
      const res = await authFetch('/api/employees/vault/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, sourceName: docName.trim(), sourceType: 'text', content: docContent.trim() }),
      })
      if (res.ok) setUploaded(true)
    } finally {
      setUploading(false)
    }
  }

  async function saveKpis() {
    setSavingKpis(true)
    try {
      const res = await authFetch('/api/manage/kpis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, kpis: kpis.filter(Boolean) }),
      })
      if (res.ok) setKpisSaved(true)
    } finally {
      setSavingKpis(false)
    }
  }

  async function connectTool(toolSlug: string) {
    if (!connectKey.trim()) { setConnectError('API key required'); return }
    setConnectError('')
    try {
      const res = await authFetch('/api/tools/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_slug: toolSlug, api_key: connectKey.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setConnectError(data.error ?? 'Failed to connect'); return }
      setConnected(prev => new Set(prev).add(toolSlug))
      setConnecting(null)
      setConnectKey('')
    } catch {
      setConnectError('Failed to connect')
    }
  }

  const btnStyle = (disabled?: boolean): React.CSSProperties => ({
    padding: '11px 24px', borderRadius: 10, background: C.accent, color: '#fff',
    fontSize: 13, fontWeight: 700, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1, fontFamily: 'inherit',
  })
  const skipStyle: React.CSSProperties = {
    padding: '11px 20px', borderRadius: 10, background: 'transparent', border: `1px solid ${C.border}`,
    color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 14, background: C.surface }}>
        <Link href={`/manage/${slug}`} style={{ color: C.muted, textDecoration: 'none', fontSize: 13 }}>← Manage</Link>
        <span style={{ fontSize: 20 }}>{employeeEmoji}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Getting {employeeName} set up</div>
          <div style={{ fontSize: 11, color: C.muted }}>{employeeTitle}</div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 2, background: i <= step ? employeeColor : C.border, marginBottom: 6, transition: 'background 0.2s' }} />
              <div style={{ fontSize: 10, fontFamily: 'monospace', color: i === step ? C.text : C.muted, letterSpacing: '0.06em' }}>{s.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Step 1: Context */}
        {step === 0 && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px' }}>Give {employeeName} some context</h1>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: '0 0 24px' }}>
              Paste an SOP, brand voice guide, product doc — anything that helps {employeeName} sound like you from message one. You can add more later from the Memory page.
            </p>
            <input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Document name (e.g. Brand voice guide)"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
            <textarea value={docContent} onChange={e => setDocContent(e.target.value)} placeholder="Paste content here…" rows={8}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            {uploaded && <div style={{ fontSize: 12, color: C.green, marginTop: 8 }}>✓ Saved to {employeeName}'s vault</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={async () => { await uploadDoc(); setStep(1) }} disabled={uploading} style={btnStyle(uploading)}>
                {uploading ? 'Saving…' : docContent.trim() ? 'Save & continue →' : 'Continue →'}
              </button>
              <button onClick={() => setStep(1)} style={skipStyle}>Skip for now</button>
            </div>
          </div>
        )}

        {/* Step 2: KPIs */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px' }}>What should {employeeName} move?</h1>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: '0 0 24px' }}>
              Name up to 3 metrics you actually care about — real numbers, not vague goals. This shapes what gets prioritized.
            </p>
            {kpis.map((k, i) => (
              <input key={i} value={k} onChange={e => setKpis(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                placeholder={['e.g. Reply time under 3 minutes', 'e.g. Qualified leads per week', 'e.g. Monthly recurring revenue'][i]}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
            ))}
            {kpisSaved && <div style={{ fontSize: 12, color: C.green, marginTop: 4 }}>✓ Saved</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={async () => { await saveKpis(); setStep(2) }} disabled={savingKpis} style={btnStyle(savingKpis)}>
                {savingKpis ? 'Saving…' : 'Continue →'}
              </button>
              <button onClick={() => setStep(2)} style={skipStyle}>Skip for now</button>
            </div>
          </div>
        )}

        {/* Step 3: Tools */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px' }}>Connect your tools</h1>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: '0 0 24px' }}>
              {relevantTools.length > 0
                ? `Tools ${employeeName} is fluent in. Connect what you already use — the rest can wait.`
                : `You can connect tools anytime from your workspace — nothing required here.`}
            </p>
            {relevantTools.map(tool => {
              const isConnected = connected.has(tool.slug)
              const isConnecting = connecting === tool.slug
              return (
                <div key={tool.slug} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={toolLogoUrl(tool.slug)} alt="" width={22} height={22} style={{ borderRadius: 5 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{tool.name}</div>
                    </div>
                    {isConnected ? (
                      <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>✓ Connected</span>
                    ) : (
                      <button onClick={() => { setConnecting(isConnecting ? null : tool.slug); setConnectError('') }}
                        style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>
                        {isConnecting ? 'Cancel' : 'Connect'}
                      </button>
                    )}
                  </div>
                  {isConnecting && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{tool.authHint}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="password" value={connectKey} onChange={e => setConnectKey(e.target.value)} placeholder={tool.authPlaceholder}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, outline: 'none' }} />
                        <button onClick={() => connectTool(tool.slug)} style={{ padding: '8px 16px', borderRadius: 8, background: C.accent, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          Save
                        </button>
                      </div>
                      {connectError && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>{connectError}</div>}
                    </div>
                  )}
                </div>
              )
            })}
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setStep(3)} style={btnStyle(false)}>Continue →</button>
              <button onClick={() => setStep(3)} style={skipStyle}>Skip for now</button>
            </div>
          </div>
        )}

        {/* Step 4: Launch */}
        {step === 3 && (
          <div style={{ textAlign: 'center', paddingTop: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>{employeeEmoji}</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px' }}>{employeeName} is ready.</h1>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, margin: '0 auto 32px', maxWidth: 400 }}>
              Everything you set up here — context, KPIs, connected tools — is already live. Start with a real task.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link href={`/employees/${slug}/interview`} style={{ padding: '13px 26px', borderRadius: 10, background: employeeColor, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                Start chatting →
              </Link>
              <Link href={`/manage/${slug}`} style={{ padding: '13px 26px', borderRadius: 10, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Go to manage hub
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
