// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { EMPLOYEE_BY_SLUG } from '@/lib/employees/profiles'
import { SetuLogo } from '@/components/SetuLogo'
import { setManageToken } from '@/lib/manage-token-client'
import { track } from '@/lib/posthog/client'

import { useRouter } from 'next/navigation'

type Status = 'idle' | 'loading' | 'success' | 'error'

function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('setu_user_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('setu_user_id', id) }
  return id
}

export default function HireClient({ slug, currentPriceCents = 4900 }: { slug: string; currentPriceCents?: number }) {
  const currentPrice = Math.round(currentPriceCents / 100)
  const e = EMPLOYEE_BY_SLUG[slug]
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', company: '', role: '', size: '', use_case: '', timeline: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [errMsg, setErrMsg] = useState('')
  const [alreadyHired, setAlreadyHired] = useState(false)

  useEffect(() => {
    track('hire_form_opened', getOrCreateUserId(), { employee_slug: slug })
  }, [slug])

  useEffect(() => {
    const userId = getOrCreateUserId()
    if (!userId || !slug) return
    fetch(`/api/manage/subscription?userId=${userId}&slug=${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'trial' || d.status === 'active' || d.status === 'paused') {
          setAlreadyHired(true)
        }
      })
      .catch(() => {})
  }, [slug])

  const BG = '#F6F5F1'
  const WHITE = '#FFFFFF'
  const INK = '#0D0C09'
  const GREEN = '#0E5C34'
  const GRAY = '#E3E1DA'
  const MUTED = '#78746E'
  const DIM = '#9E9891'

  if (!e) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', color: INK, fontFamily: 'var(--font-jakarta)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤔</div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Employee not found</h1>
          <Link href="/employees" style={{ color: GREEN, textDecoration: 'none', marginTop: 16, display: 'block' }}>← Back to employees</Link>
        </div>
      </div>
    )
  }

  if (alreadyHired) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', color: INK, fontFamily: 'var(--font-jakarta)', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: `${e.color}15`, border: `2px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 20px' }}>
            {e.emoji}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.05em', margin: '0 0 10px' }}>
            You've already hired {e.name}
          </h1>
          <p style={{ fontSize: 15, color: MUTED, margin: '0 0 32px', lineHeight: 1.7 }}>
            {e.name} is part of your team. Head to the management hub to chat, review memory, and calibrate trust.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 280, margin: '0 auto' }}>
            <Link href={`/manage/${slug}`} style={{
              display: 'block', textAlign: 'center', padding: '13px 24px', borderRadius: 12,
              background: GREEN, color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none',
              boxShadow: '0 4px 18px rgba(14,92,52,0.25)',
            }}>
              Go to manage hub →
            </Link>
            <Link href={`/employees/${slug}/interview`} style={{
              display: 'block', textAlign: 'center', padding: '11px 24px', borderRadius: 12,
              background: WHITE, border: `1.5px solid ${GRAY}`, color: MUTED, fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>
              Chat with {e.name}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.name || !form.email || !form.company || !form.use_case) return
    setStatus('loading')
    try {
      const userId = getOrCreateUserId()
      const res = await fetch('/api/employees/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, employee_slug: e.slug, employee_name: e.name, employee_title: e.title, userId }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'Failed')
      setManageToken(j.manage_token)
      track('hire_form_submitted', userId, { employee_slug: e.slug })
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', { content_name: e.name, content_category: e.dept })
      }
      // Redirect to self-service management hub
      router.push(`/employees/${e.slug}/onboard`)
      setStatus('success')
    } catch (err: any) {
      setErrMsg(err.message ?? 'Something went wrong')
      setStatus('error')
    }
  }

  function field(key: keyof typeof form, label: string, placeholder: string, required = false, multiline = false) {
    const Tag = multiline ? 'textarea' : 'input'
    return (
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 7 }}>
          {label} {required && <span style={{ color: e.color }}>*</span>}
        </label>
        <Tag
          value={form[key]}
          onChange={(ev: any) => setForm(f => ({ ...f, [key]: ev.target.value }))}
          placeholder={placeholder}
          required={required}
          type={key === 'email' ? 'email' : 'text'}
          rows={multiline ? 4 : undefined}
          style={{ width: '100%', padding: '11px 16px', background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 11, color: INK, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: multiline ? 'vertical' : undefined, boxSizing: 'border-box', transition: 'border-color 0.2s' }}
        />
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-jakarta)', color: INK }}>
        <div style={{ textAlign: 'center', maxWidth: 500, padding: '0 24px' }}>
          <div style={{ width: 88, height: 88, borderRadius: 28, background: 'rgba(14,92,52,0.10)', border: '2px solid rgba(14,92,52,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, margin: '0 auto 28px' }}>✅</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.05em', margin: '0 0 14px', color: INK }}>{e.name} is live right now.</h1>
          <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 36 }}>
            Your 14-day free trial of <strong style={{ color: INK }}>{e.name}</strong> as your {e.title} started the moment you submitted. Open the management hub to start chatting — no waiting on a call.
          </p>
          <div style={{ background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 18, padding: 24, marginBottom: 32, textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Get started in 3 steps</div>
            {[
              { step: '1', detail: `Chat first — ask ${e.name} something real and see how they think` },
              { step: '2', detail: 'Upload context — SOPs, docs, or brand voice, so they know your business' },
              { step: '3', detail: `Activate before your trial ends to lock in $${currentPrice}/mo forever` },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: e.color, minWidth: 20 }}>{s.step}</span>
                <span style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{s.detail}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/employees" style={{ padding: '11px 22px', borderRadius: 10, background: WHITE, border: `1.5px solid ${GRAY}`, color: MUTED, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Browse more employees</Link>
            <Link href={`/employees/${e.slug}/onboard`} style={{ padding: '11px 22px', borderRadius: 10, background: GREEN, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(14,92,52,0.28)' }}>Get set up →</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: 'var(--font-jakarta)' }}>
      <nav style={{
        borderBottom: `1px solid ${GRAY}`, padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: WHITE,
      }}>
        <SetuLogo href="/" size={30} color={GREEN} wordColor={INK} />
        <Link href={`/employees/${e.slug}/interview`} style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${GRAY}` }}>
          Interview {e.name} first (free)
        </Link>
      </nav>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '56px 32px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40, alignItems: 'start' }}>
        <div>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: e.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Hire Request</div>
            <h1 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '0 0 10px', color: INK, lineHeight: 1.1 }}>Hire {e.name} as your {e.title}</h1>
            <p style={{ fontSize: 15, color: MUTED, margin: 0, lineHeight: 1.65 }}>Your 14-day trial starts the moment you submit — no waiting on a call. No credit card needed to start.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {field('name', 'Your Name', 'Jane Smith', true)}
              {field('email', 'Work Email', 'jane@company.com', true)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {field('company', 'Company', 'Acme Inc.', true)}
              {field('role', 'Your Role', 'CEO, VP Sales, Founder…')}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 7 }}>Company Size</label>
              <select value={form.size} onChange={ev => setForm(f => ({ ...f, size: ev.target.value }))} style={{ width: '100%', padding: '11px 14px', background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 11, color: form.size ? INK : MUTED, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}>
                <option value="">Select size</option>
                {['1-10', '11-50', '51-200', '201-1000', '1000+'].map(s => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>
            {field('use_case', `What will ${e.name} handle for you?`, `E.g. "I need ${e.name} to handle our weekly reporting"`, true, true)}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 7 }}>When do you want to go live?</label>
              <select value={form.timeline} onChange={ev => setForm(f => ({ ...f, timeline: ev.target.value }))} style={{ width: '100%', padding: '11px 14px', background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 11, color: form.timeline ? INK : MUTED, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}>
                <option value="">Select timeline</option>
                {['ASAP (this week)', 'Next 2 weeks', 'Next month', 'Just exploring'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {status === 'error' && (
              <div style={{ padding: '12px 16px', borderRadius: 11, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#b91c1c', fontSize: 13 }}>
                {errMsg || 'Something went wrong. Please try again.'}
              </div>
            )}

            <button type="submit" disabled={status === 'loading'} style={{
              padding: '14px 24px', borderRadius: 13,
              background: GREEN,
              color: '#fff', fontSize: 15, fontWeight: 700, border: 'none',
              cursor: status === 'loading' ? 'wait' : 'pointer',
              letterSpacing: '-0.01em',
              opacity: status === 'loading' ? 0.7 : 1,
              boxShadow: '0 6px 20px rgba(14,92,52,0.28)',
            }}>
              {status === 'loading' ? 'Submitting…' : `Start 14-day free trial →`}
            </button>
            <p style={{ fontSize: 11, color: DIM, textAlign: 'center', margin: 0 }}>No credit card required · 14 days free · ${currentPrice}/mo after, locked at this price</p>
            <p style={{ fontSize: 11, color: DIM, textAlign: 'center', margin: 0 }}>
              By starting a trial you agree to Setu's <Link href="/terms" style={{ color: MUTED, textDecoration: 'underline' }}>Terms</Link> and <Link href="/privacy" style={{ color: MUTED, textDecoration: 'underline' }}>Privacy Policy</Link>.
            </p>
          </form>
        </div>

        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: WHITE, border: `1.5px solid ${e.color}28`, borderRadius: 22, padding: 26, marginBottom: 12, boxShadow: `0 0 32px ${e.color}10` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, paddingBottom: 22, borderBottom: `1px solid ${GRAY}` }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `${e.color}18`, border: `1.5px solid ${e.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: `0 0 24px ${e.color}20` }}>{e.emoji}</div>
              <div>
                <div style={{ fontSize: 16.5, fontWeight: 700, color: INK, letterSpacing: '-0.02em' }}>{e.name}</div>
                <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{e.title}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[
                { label: '14-day free trial', value: 'No card needed' },
                { label: `Then $${currentPrice}/month`, value: 'price locked at hire' },
                { label: 'Agent fleet', value: `${e.agentCount} agents` },
                { label: 'Department', value: e.dept },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'center' }}>
                  <span style={{ color: MUTED }}>{r.label}</span>
                  <span style={{ color: INK, fontWeight: 700 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 18, padding: 22, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 14, letterSpacing: '-0.02em' }}>What's included</div>
            {[`${e.agentCount} pre-trained AI agents`, 'Onboarding call with Sumeet', 'Custom workflow configuration', 'Email + Slack integration', 'Weekly performance reports', '30-day satisfaction guarantee'].map(f => (
              <div key={f} style={{ display: 'flex', gap: 9, fontSize: 12.5, color: MUTED, marginBottom: 9 }}>
                <span style={{ color: GREEN, flexShrink: 0, marginTop: 1 }}>✓</span> {f}
              </div>
            ))}
          </div>

          <div style={{ padding: '13px 16px', borderRadius: 13, background: 'rgba(14,92,52,0.06)', border: '1px solid rgba(14,92,52,0.18)', fontSize: 12.5, color: MUTED, lineHeight: 1.65 }}>
            Not sure yet? <Link href={`/employees/${e.slug}/interview`} style={{ color: GREEN, fontWeight: 700, textDecoration: 'none' }}>Interview {e.name} free</Link> — no commitment.
          </div>
        </div>
      </div>
    </div>
  )
}
