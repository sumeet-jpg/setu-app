// @ts-nocheck
'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { EMPLOYEE_BY_SLUG } from '@/lib/employees/profiles'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function InterviewClient({ slug }: { slug: string }) {
  const e = EMPLOYEE_BY_SLUG[slug]

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const MUTED = '#94A3B8'
  const BG = '#0F172A'
  const SURFACE = '#1E293B'
  const BORDER = 'rgba(148,163,184,0.1)'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

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

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setLoading(true)
    setStarted(true)

    const userMsg: Msg = { role: 'user', content: text }
    const history = [...msgs, userMsg]
    setMsgs(history)

    try {
      const res = await fetch('/api/employees/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: e.slug, messages: history }),
      })

      if (!res.ok) throw new Error('API error')
      if (!res.body) throw new Error('No body')

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let partial = ''
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
                setMsgs(prev => {
                  const next = [...prev]
                  next[next.length - 1] = { role: 'assistant', content: next[next.length - 1].content + delta }
                  return next
                })
              }
            } catch {}
          }
        }
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

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-inter)' }}>
      {/* Glassmorphic nav */}
      <div style={{
        borderBottom: `1px solid ${BORDER}`, padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href={`/employees/${e.slug}`} style={{ fontSize: 13, color: MUTED, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, background: 'rgba(148,163,184,0.06)', border: `1px solid ${BORDER}` }}>← Back</Link>
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
        <Link href={`/employees/${e.slug}/hire`} style={{ padding: '8px 18px', borderRadius: 9, background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.35)', fontFamily: 'var(--font-space)' }}>
          Hire {e.name} →
        </Link>
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
          <div key={i} style={{ display: 'flex', gap: 12, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
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
              {m.content}
              {i === msgs.length - 1 && m.role === 'assistant' && loading && <span style={{ opacity: 0.4 }}>▌</span>}
            </div>
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
