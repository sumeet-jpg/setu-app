// @ts-nocheck
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { EMPLOYEE_BY_SLUG } from '@/lib/employees/profiles'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function HirePage() {
  const { slug } = useParams()
  const e = EMPLOYEE_BY_SLUG[slug as string]

  const [form, setForm] = useState({ name: '', email: '', company: '', role: '', size: '', use_case: '', timeline: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [errMsg, setErrMsg] = useState('')

  const BG = '#09090b'
  const BORDER = 'rgba(255,255,255,0.08)'
  const SURFACE = 'rgba(255,255,255,0.04)'
  const MUTED = '#71717a'

  if (!e) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--font-inter)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤔</div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Employee not found</h1>
          <Link href="/employees" style={{ color: '#818cf8', textDecoration: 'none', marginTop: 16, display: 'block' }}>← Back to employees</Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.name || !form.email || !form.company || !form.use_case) return
    setStatus('loading')
    try {
      const res = await fetch('/api/employees/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, employee_slug: e.slug, employee_name: e.name, employee_title: e.title }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'Failed')
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
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
          {label} {required && <span style={{ color: e.color }}>*</span>}
        </label>
        <Tag
          value={form[key]}
          onChange={(ev: any) => setForm(f => ({ ...f, [key]: ev.target.value }))}
          placeholder={placeholder}
          required={required}
          rows={multiline ? 4 : undefined}
          style={{ width: '100%', padding: '11px 14px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: multiline ? 'vertical' : undefined, boxSizing: 'border-box' }}
        />
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-inter)', color: '#fff' }}>
        <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px' }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: '#22c55e15', border: '2px solid #22c55e40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 24px' }}>✅</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px' }}>
            {e.name} is on their way!
          </h1>
          <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 32 }}>
            We've received your request to hire <strong style={{ color: '#fff' }}>{e.name}</strong> as your {e.title}. Sumeet from Setu will reach out within 24 hours to set up your onboarding call and activate your {e.agentCount} agents.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 32, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa', marginBottom: 12 }}>What happens next</div>
            {[
              { step: '24 hours', detail: 'Sumeet reaches out to confirm your requirements' },
              { step: 'Day 2-3', detail: `${e.name}'s ${e.agentCount} agents are configured for your stack` },
              { step: 'Day 4-5', detail: 'Onboarding call — go live, first workflow runs' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: e.color, minWidth: 56 }}>{s.step}</span>
                <span style={{ fontSize: 13, color: '#a1a1aa' }}>{s.detail}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/employees" style={{ padding: '10px 20px', borderRadius: 10, background: SURFACE, border: `1px solid ${BORDER}`, color: '#a1a1aa', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Browse more employees
            </Link>
            <Link href={`/employees/${e.slug}/interview`} style={{ padding: '10px 20px', borderRadius: 10, background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Chat with {e.name}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fafafa', fontFamily: 'var(--font-inter)' }}>
      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href={`/employees/${e.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#fafafa' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>S</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>Setu</span>
        </Link>
        <Link href={`/employees/${e.slug}/interview`} style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '6px 12px' }}>
          Interview {e.name} first (free)
        </Link>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>

        {/* Form */}
        <div>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: e.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Hire Request</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px', color: '#fff' }}>
              Hire {e.name} as your {e.title}
            </h1>
            <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.6 }}>
              Fill out this form and Sumeet will reach out within 24 hours to set up onboarding. No credit card needed to start.
            </p>
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
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>Company Size</label>
              <select value={form.size} onChange={ev => setForm(f => ({ ...f, size: ev.target.value }))} style={{ width: '100%', padding: '11px 14px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, color: form.size ? '#fff' : MUTED, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}>
                <option value="">Select size</option>
                {['1-10', '11-50', '51-200', '201-1000', '1000+'].map(s => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>
            {field('use_case', `What will ${e.name} handle for you?`, `E.g. "I need ${e.name} to handle our weekly reporting and vendor communication"`, true, true)}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>When do you want to go live?</label>
              <select value={form.timeline} onChange={ev => setForm(f => ({ ...f, timeline: ev.target.value }))} style={{ width: '100%', padding: '11px 14px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, color: form.timeline ? '#fff' : MUTED, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}>
                <option value="">Select timeline</option>
                {['ASAP (this week)', 'Next 2 weeks', 'Next month', 'Just exploring'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {status === 'error' && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: 13 }}>
                {errMsg || 'Something went wrong. Please try again.'}
              </div>
            )}

            <button type="submit" disabled={status === 'loading'} style={{ padding: '14px 24px', borderRadius: 12, background: '#6366f1', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: status === 'loading' ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: status === 'loading' ? 0.7 : 1 }}>
              {status === 'loading' ? 'Submitting…' : `Hire ${e.name} — ${e.pricing.label} →`}
            </button>
            <p style={{ fontSize: 11, color: '#3f3f46', textAlign: 'center', margin: 0 }}>No credit card required. Sumeet will reach out within 24 hours to start onboarding.</p>
          </form>
        </div>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: SURFACE, border: `1px solid ${e.color}25`, borderRadius: 20, padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${e.color}20`, border: `2px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{e.emoji}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{e.name}</div>
                <div style={{ fontSize: 12, color: MUTED }}>{e.title}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Starting price', value: e.pricing.label },
                { label: 'Agent fleet', value: `${e.agentCount} agents` },
                { label: 'Experience', value: `${e.years} years` },
                { label: 'Department', value: e.dept },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: MUTED }}>{r.label}</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 12 }}>What's included</div>
            {[
              `${e.agentCount} pre-trained AI agents`,
              'Onboarding call with Sumeet',
              'Custom workflow configuration',
              'Email + Slack integration',
              'Weekly performance reports',
              '30-day satisfaction guarantee',
            ].map(f => (
              <div key={f} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#a1a1aa', marginBottom: 8 }}>
                <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span> {f}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: 12, color: '#818cf8', lineHeight: 1.6 }}>
            Not sure yet? <Link href={`/employees/${e.slug}/interview`} style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>Interview {e.name} free</Link> — no commitment, no credit card.
          </div>
        </div>
      </div>
    </div>
  )
}
