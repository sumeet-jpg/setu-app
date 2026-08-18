// @ts-nocheck
'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { EMPLOYEE_BY_SLUG } from '@/lib/employees/profiles'

type Msg = { role: 'user' | 'assistant'; content: string }

export default function InterviewPage() {
  const { slug } = useParams()
  const e = EMPLOYEE_BY_SLUG[slug as string]

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const MUTED = '#71717a'
  const BG = '#09090b'
  const BORDER = 'rgba(255,255,255,0.08)'

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
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
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
    `How many agents do you actually command and what do they each do?`,
    `What metrics do you track daily?`,
  ]

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-inter)' }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(16px)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={`/employees/${e.slug}`} style={{ fontSize: 12, color: MUTED, textDecoration: 'none' }}>←</Link>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `${e.color}20`, border: `1px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{e.emoji}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{e.name}</div>
            <div style={{ fontSize: 11, color: MUTED }}>{e.title}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 11, color: '#22c55e' }}>Online</span>
          </div>
        </div>
        <Link href={`/employees/${e.slug}/hire`} style={{ padding: '7px 16px', borderRadius: 8, background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
          Hire {e.name} →
        </Link>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: 780, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {!started && (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: `${e.color}20`, border: `2px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 20px' }}>{e.emoji}</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>Interview {e.name}</h2>
            <p style={{ fontSize: 14, color: MUTED, maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6 }}>
              Hi, I'm {e.name}, your AI {e.title}. I command {e.agentCount} specialized agents. Ask me anything — I'll show you exactly what I can do for your business.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, maxWidth: 560, margin: '0 auto' }}>
              {starterQs.map(q => (
                <button key={q} onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 0) }} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, color: '#a1a1aa', fontSize: 12, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.4 }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 30, height: 30, borderRadius: 9, background: `${e.color}20`, border: `1px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginTop: 2 }}>{e.emoji}</div>
            )}
            <div style={{ maxWidth: '72%', padding: '12px 16px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px', background: m.role === 'user' ? '#6366f1' : 'rgba(255,255,255,0.06)', fontSize: 14, color: '#fff', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {m.content}
              {i === msgs.length - 1 && m.role === 'assistant' && loading && <span style={{ opacity: 0.5 }}>▌</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: '16px 24px', background: 'rgba(9,9,11,0.95)', flexShrink: 0 }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Ask ${e.name} anything...`}
            rows={1}
            style={{ flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, minHeight: 44, maxHeight: 120 }}
            onInput={ev => {
              const t = ev.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 120) + 'px'
            }}
          />
          <button onClick={send} disabled={loading || !input.trim()} style={{ width: 44, height: 44, borderRadius: 12, background: input.trim() && !loading ? '#6366f1' : 'rgba(255,255,255,0.06)', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: 18, transition: 'background 0.2s' }}>
            {loading ? '⏳' : '↑'}
          </button>
        </div>
        <div style={{ maxWidth: 780, margin: '8px auto 0', fontSize: 11, color: '#3f3f46', textAlign: 'center' }}>
          Interview is free. Hire {e.name} to activate all {e.agentCount} agents. · {e.pricing.label}
        </div>
      </div>
    </div>
  )
}
