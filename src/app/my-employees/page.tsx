// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { EMPLOYEE_BY_SLUG } from '@/lib/employees/profiles'
import { SetuLogo } from '@/components/SetuLogo'

function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('setu_user_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('setu_user_id', id) }
  return id
}

function daysRemaining(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))
}

const BG     = '#F6F5F1'
const WHITE  = '#FFFFFF'
const INK    = '#0D0C09'
const GREEN  = '#0E5C34'
const GREEN_L = '#EAF5EE'
const GRAY   = '#E3E1DA'
const MUTED  = '#78746E'
const DIM    = '#9E9891'
const AMBER  = '#D97706'

export default function MyEmployeesPage() {
  const [userId, setUserId] = useState('')
  const [subs, setSubs]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    const id = getOrCreateUserId()
    setUserId(id)
    fetch(`/api/manage/my-employees?userId=${id}`)
      .then(r => r.json())
      .then(d => setSubs(d.subscriptions ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function sendRecoveryLink(ev: React.FormEvent) {
    ev.preventDefault()
    if (!email) return
    setSubmitting(true)
    try {
      await fetch('/api/manage/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setEmailSent(true)
    } finally {
      setSubmitting(false)
    }
  }

  const hasEmployees = !loading && subs.length > 0

  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: 'var(--font-jakarta)' }}>
      {/* Nav */}
      <nav style={{
        borderBottom: `1px solid ${GRAY}`, padding: '0 28px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: WHITE, position: 'sticky', top: 0, zIndex: 50,
      }}>
        <SetuLogo size={30} color={GREEN} wordColor={INK} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/employees" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '7px 14px', borderRadius: 8, border: `1px solid ${GRAY}` }}>Browse employees</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '56px 24px 80px' }}>
        <h1 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 900, letterSpacing: '-0.06em', margin: '0 0 6px', color: INK }}>
          Your AI Employees
        </h1>
        <p style={{ fontSize: 15, color: MUTED, margin: '0 0 40px', lineHeight: 1.6 }}>
          All your hired employees and their current status.
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED, fontSize: 14 }}>Loading…</div>
        )}

        {!loading && hasEmployees && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {subs.map((sub: any) => {
              const profile = EMPLOYEE_BY_SLUG[sub.employee_slug]
              const isTrial = sub.status === 'trial'
              const isActive = sub.status === 'active'
              const trialDays = sub.trial_ends_at ? daysRemaining(sub.trial_ends_at) : null
              const price = sub.monthly_price_cents ? Math.round(sub.monthly_price_cents / 100) : 49

              return (
                <div key={sub.id ?? sub.employee_slug} style={{
                  background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 20,
                  padding: '22px 24px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                      background: profile ? `${profile.color}15` : '#eee',
                      border: `1.5px solid ${profile ? `${profile.color}30` : GRAY}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                    }}>
                      {profile?.emoji ?? '🤖'}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: INK, letterSpacing: '-0.02em' }}>
                        {sub.employee_name ?? profile?.name ?? sub.employee_slug}
                      </div>
                      <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>
                        {sub.employee_title ?? profile?.title}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {isTrial && trialDays !== null && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: AMBER, background: '#fef3c7', padding: '3px 9px', borderRadius: 12 }}>
                            {trialDays}d left in trial
                          </span>
                        )}
                        {isActive && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#166534', background: GREEN_L, padding: '3px 9px', borderRadius: 12 }}>
                            Active
                          </span>
                        )}
                        {sub.status === 'paused' && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, background: '#f4f4f4', padding: '3px 9px', borderRadius: 12 }}>
                            Paused
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: DIM, padding: '3px 9px', borderRadius: 12, border: `1px solid ${GRAY}` }}>
                          ${price}/mo{isTrial ? ' (locked)' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    <Link href={`/manage/${sub.employee_slug}`} style={{
                      padding: '9px 18px', borderRadius: 10, background: INK, color: '#fff',
                      fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
                    }}>
                      Manage →
                    </Link>
                    <Link href={`/employees/${sub.employee_slug}/interview`} style={{
                      padding: '7px 14px', borderRadius: 9, background: WHITE, border: `1.5px solid ${GRAY}`,
                      color: MUTED, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
                    }}>
                      Chat
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && !hasEmployees && (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: WHITE, borderRadius: 20, border: `1.5px solid ${GRAY}` }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🏢</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 12px', color: INK }}>
              No employees hired yet
            </h2>
            <p style={{ fontSize: 14, color: MUTED, margin: '0 auto 32px', maxWidth: 380, lineHeight: 1.7 }}>
              Browse 100 AI Employees across every business function. Start with a free interview — no account needed.
            </p>
            <Link href="/employees" style={{
              padding: '12px 28px', borderRadius: 11, background: GREEN, color: '#fff',
              fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(14,92,52,0.25)',
            }}>
              Browse employees →
            </Link>
          </div>
        )}

        {/* Recovery section: if on a different device, email the links */}
        {!loading && (
          <div style={{ marginTop: 40, padding: '28px 28px', background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 8 }}>
              Looking for employees hired on another device?
            </div>
            <p style={{ fontSize: 13, color: MUTED, margin: '0 0 16px', lineHeight: 1.65 }}>
              Enter your email and we'll send links to all your management hubs.
            </p>
            {emailSent ? (
              <div style={{ fontSize: 13, color: '#166534', background: GREEN_L, padding: '10px 16px', borderRadius: 10 }}>
                ✓ Email sent — check your inbox.
              </div>
            ) : (
              <form onSubmit={sendRecoveryLink} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" required
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${GRAY}`, background: BG, fontSize: 14, color: INK, outline: 'none', fontFamily: 'inherit' }}
                />
                <button type="submit" disabled={submitting} style={{
                  padding: '10px 18px', borderRadius: 10, background: INK, color: '#fff',
                  fontSize: 13, fontWeight: 700, border: 'none', cursor: submitting ? 'wait' : 'pointer',
                  opacity: submitting ? 0.7 : 1, fontFamily: 'inherit',
                }}>
                  {submitting ? 'Sending…' : 'Send links'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* CTA: hire another */}
        {hasEmployees && (
          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <Link href="/employees" style={{ fontSize: 14, color: MUTED, textDecoration: 'none', padding: '10px 20px', borderRadius: 10, border: `1.5px solid ${GRAY}`, display: 'inline-block' }}>
              + Hire another employee
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
