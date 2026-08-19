// @ts-nocheck
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { EMPLOYEE_BY_SLUG } from '@/lib/employees/profiles'
import { SetuLogo } from '@/components/SetuLogo'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function HireClient({ slug }: { slug: string }) {
  const e = EMPLOYEE_BY_SLUG[slug]
  const [form, setForm] = useState({ name: '', email: '', company: '', role: '', size: '', use_case: '', timeline: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [errMsg, setErrMsg] = useState('')

  const BG = '#0F172A'
  const BORDER = 'rgba(148,163,184,0.1)'
  const SURFACE = '#1E293B'
  const MUTED = '#94A3B8'
  const DIM = '#475569'

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
          style={{ width: '100%', padding: '11px 16px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 11, color: '#F1F5F9', fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: multiline ? 'vertical' : undefined, boxSizing: 'border-box', transition: 'border-color 0.2s' }}
        />
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-inter)', color: '#F1F5F9' }}>
        <div style={{ textAlign: 'center', maxWidth: 500, padding: '0 24px' }}>
          <div style={{ width: 88, height: 88, borderRadius: 28, background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, margin: '0 auto 28px', boxShadow: '0 0 40px rgba(34,197,94,0.15)' }}>✅</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.05em', margin: '0 0 14px', fontFamily: 'var(--font-space)' }}>{e.name} is on their way!</h1>
          <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 36 }}>
            Your request to hire <strong style={{ color: '#fff' }}>{e.name}</strong> as your {e.title} has been received. Sumeet from Setu will reach out within 24 hours.
          </p>
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 24, marginBottom: 32, textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-space)' }}>What happens next</div>
            {[
              { step: '24 hours', detail: 'Sumeet reaches out to confirm your requirements' },
              { step: 'Day 2-3', detail: `${e.name}'s ${e.agentCount} agents are configured for your stack` },
              { step: 'Day 4-5', detail: 'Onboarding call — go live, first workflow runs' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: e.color, minWidth: 60, fontFamily: 'var(--font-space)' }}>{s.step}</span>
                <span style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.5 }}>{s.detail}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/employees" style={{ padding: '11px 22px', borderRadius: 10, background: SURFACE, border: `1px solid ${BORDER}`, color: MUTED, fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-space)' }}>Browse more employees</Link>
            <Link href={`/employees/${e.slug}/interview`} style={{ padding: '11px 22px', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-space)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>Chat with {e.name}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#F1F5F9', fontFamily: 'var(--font-inter)' }}>
      <nav style={{
        borderBottom: `1px solid ${BORDER}`, padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <SetuLogo href="/" size={30} color="#22c55e" wordColor="#F1F5F9" />
        <Link href={`/employees/${e.slug}/interview`} style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '7px 14px', borderRadius: 8, border: `1px solid ${BORDER}`, fontFamily: 'var(--font-space)' }}>
          Interview {e.name} first (free)
        </Link>
      </nav>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '56px 32px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40, alignItems: 'start' }}>
        <div>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: e.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-space)' }}>Hire Request</div>
            <h1 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '0 0 10px', color: '#fff', fontFamily: 'var(--font-space)', lineHeight: 1.1 }}>Hire {e.name} as your {e.title}</h1>
            <p style={{ fontSize: 15, color: MUTED, margin: 0, lineHeight: 1.65 }}>Fill out this form and Sumeet will reach out within 24 hours. No credit card needed to start.</p>
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
              <select value={form.size} onChange={ev => setForm(f => ({ ...f, size: ev.target.value }))} style={{ width: '100%', padding: '11px 14px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 11, color: form.size ? '#fff' : MUTED, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}>
                <option value="">Select size</option>
                {['1-10', '11-50', '51-200', '201-1000', '1000+'].map(s => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>
            {field('use_case', `What will ${e.name} handle for you?`, `E.g. "I need ${e.name} to handle our weekly reporting"`, true, true)}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 7 }}>When do you want to go live?</label>
              <select value={form.timeline} onChange={ev => setForm(f => ({ ...f, timeline: ev.target.value }))} style={{ width: '100%', padding: '11px 14px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 11, color: form.timeline ? '#fff' : MUTED, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}>
                <option value="">Select timeline</option>
                {['ASAP (this week)', 'Next 2 weeks', 'Next month', 'Just exploring'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {status === 'error' && (
              <div style={{ padding: '12px 16px', borderRadius: 11, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: 13 }}>
                {errMsg || 'Something went wrong. Please try again.'}
              </div>
            )}

            <button type="submit" disabled={status === 'loading'} style={{
              padding: '14px 24px', borderRadius: 13,
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              color: '#fff', fontSize: 15, fontWeight: 700, border: 'none',
              cursor: status === 'loading' ? 'wait' : 'pointer',
              fontFamily: 'var(--font-space)', letterSpacing: '-0.01em',
              opacity: status === 'loading' ? 0.7 : 1,
              boxShadow: '0 6px 24px rgba(99,102,241,0.4)',
            }}>
              {status === 'loading' ? 'Submitting…' : `Hire ${e.name} — ${e.pricing.label} →`}
            </button>
            <p style={{ fontSize: 11, color: DIM, textAlign: 'center', margin: 0 }}>No credit card required. Sumeet reaches out within 24 hours.</p>
          </form>
        </div>

        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: SURFACE, border: `1px solid ${e.color}28`, borderRadius: 22, padding: 26, marginBottom: 12, boxShadow: `0 0 32px ${e.color}10` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, paddingBottom: 22, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `${e.color}18`, border: `1.5px solid ${e.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: `0 0 24px ${e.color}20` }}>{e.emoji}</div>
              <div>
                <div style={{ fontSize: 16.5, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-space)', letterSpacing: '-0.02em' }}>{e.name}</div>
                <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{e.title}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[
                { label: 'Starting price', value: e.pricing.label },
                { label: 'Agent fleet', value: `${e.agentCount} agents` },
                { label: 'Experience', value: `${e.years} years` },
                { label: 'Department', value: e.dept },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'center' }}>
                  <span style={{ color: MUTED }}>{r.label}</span>
                  <span style={{ color: '#fff', fontWeight: 700, fontFamily: 'var(--font-space)' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 22, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14, fontFamily: 'var(--font-space)', letterSpacing: '-0.02em' }}>What's included</div>
            {[`${e.agentCount} pre-trained AI agents`, 'Onboarding call with Sumeet', 'Custom workflow configuration', 'Email + Slack integration', 'Weekly performance reports', '30-day satisfaction guarantee'].map(f => (
              <div key={f} style={{ display: 'flex', gap: 9, fontSize: 12.5, color: '#CBD5E1', marginBottom: 9 }}>
                <span style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }}>✓</span> {f}
              </div>
            ))}
          </div>

          <div style={{ padding: '13px 16px', borderRadius: 13, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: 12.5, color: '#818cf8', lineHeight: 1.65 }}>
            Not sure yet? <Link href={`/employees/${e.slug}/interview`} style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>Interview {e.name} free</Link> — no commitment.
          </div>
        </div>
      </div>
    </div>
  )
}
