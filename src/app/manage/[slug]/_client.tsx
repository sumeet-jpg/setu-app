'use client'
// @ts-nocheck
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const BILLING_EMAIL = 'hello@setuagents.com'

function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return ''
  // If a recovery uid is present in the URL, restore it to localStorage
  const params = new URLSearchParams(window.location.search)
  const uidParam = params.get('uid')
  if (uidParam) {
    localStorage.setItem('setu_user_id', uidParam)
    // Clean the uid from the URL without triggering a navigation
    const clean = window.location.pathname
    window.history.replaceState({}, '', clean)
  }
  let id = localStorage.getItem('setu_user_id')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('setu_user_id', id) }
  return id
}

function daysRemaining(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000))
}

export default function ManageClient({
  slug, employeeName, employeeEmoji, employeeTitle, employeeColor, agentCount,
}: {
  slug: string
  employeeName: string
  employeeEmoji: string
  employeeTitle: string
  employeeColor: string
  agentCount: number
}) {
  const [userId] = useState(() => getOrCreateUserId())
  const [sub, setSub] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [calibration, setCalibration] = useState<any>(null)
  const [pendingActions, setPendingActions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showActivate, setShowActivate] = useState(false)
  const [showCancel, setShowCancel]     = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling]     = useState(false)
  const [cancelled, setCancelled]       = useState(false)

  const C = {
    bg:      '#0B0D14',
    surface: '#141620',
    card:    '#1B1E2C',
    border:  'rgba(148,163,184,0.08)',
    text:    '#E2E8F0',
    muted:   '#64748B',
    accent:  '#6366F1',
    green:   '#22C55E',
    amber:   '#F59E0B',
    red:     '#EF4444',
  }

  const loadAll = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      // Load in parallel
      const [subRes, beliefsRes, calRes, actionsRes] = await Promise.all([
        fetch(`/api/manage/subscription?userId=${userId}&slug=${slug}`),
        fetch(`/api/employees/beliefs?slug=${slug}&userId=${userId}&limit=1`),
        fetch(`/api/employees/calibration?userId=${userId}&slug=${slug}`),
        fetch(`/api/employees/actions?userId=${userId}&slug=${slug}&status=pending&limit=10`),
      ])

      if (subRes.ok) setSub(await subRes.json())
      if (beliefsRes.ok) {
        const d = await beliefsRes.json()
        setStats({ total_beliefs: d.total_beliefs ?? 0, conflicts: d.conflicts ?? 0 })
      }
      if (calRes.ok) {
        const d = await calRes.json()
        setCalibration(d.calibration)
      }
      if (actionsRes.ok) {
        const d = await actionsRes.json()
        setPendingActions(d.actions ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [userId, slug])

  useEffect(() => { loadAll() }, [loadAll])

  async function handleCancel() {
    setCancelling(true)
    try {
      await fetch('/api/manage/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, slug, action: 'cancel', reason: cancelReason }),
      })
      setCancelled(true)
      setShowCancel(false)
    } finally {
      setCancelling(false)
    }
  }

  const trialDays = sub?.trial_ends_at ? daysRemaining(sub.trial_ends_at) : null
  const isTrial = sub?.status === 'trial'
  const isActive = sub?.status === 'active'
  const isPaused = sub?.status === 'paused'
  const isCancelled = cancelled || sub?.status === 'cancelled'
  const monthlyPrice = sub?.monthly_price_cents ? (sub.monthly_price_cents / 100).toFixed(0) : '49'

  // Urgency: next month's price
  const nextMonthPrice = parseInt(monthlyPrice) + 10

  const navLinks = [
    { href: `/employees/${slug}/interview`, label: 'Chat', icon: '💬', desc: 'Start a session' },
    { href: `/employees/${slug}/memory`, label: 'Memory', icon: '🧠', desc: 'Beliefs, vault, alerts' },
    { href: `/employees/${slug}/memory#calibration`, label: 'Trust', icon: '⚙', desc: 'Autonomy dial' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.surface, padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/my-employees" style={{ fontSize: 12, color: C.muted, textDecoration: 'none', padding: '5px 10px', borderRadius: 7, border: `1px solid ${C.border}` }}>
            ← My Employees
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${employeeColor}18`, border: `1.5px solid ${employeeColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
              {employeeEmoji}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{employeeName}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{employeeTitle}</div>
            </div>
          </div>
        </div>

        {/* Status badge */}
        {isTrial && trialDays !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', fontSize: 12, color: C.amber, fontWeight: 600 }}>
              {trialDays}d left in trial
            </div>
            <button onClick={() => setShowActivate(true)} style={{ padding: '6px 14px', borderRadius: 8, background: C.accent, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>
              Activate — ${monthlyPrice}/mo
            </button>
          </div>
        )}
        {isActive && (
          <div style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', fontSize: 12, color: C.green, fontWeight: 600 }}>
            Active · ${monthlyPrice}/mo
          </div>
        )}
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 24px' }}>

        {/* Welcome banner — first visit */}
        {!loading && isTrial && (
          <div style={{
            background: `linear-gradient(135deg, ${employeeColor}18, ${C.accent}12)`,
            border: `1px solid ${employeeColor}30`,
            borderRadius: 16, padding: '28px 32px', marginBottom: 32,
            display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
                {employeeEmoji} {employeeName} is ready — 14 days free
              </div>
              <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 520 }}>
                Your employee is live. Start by chatting — every session teaches {employeeName} your preferences and builds the memory that makes them more useful over time.
                {trialDays !== null && trialDays <= 7 && (
                  <span style={{ color: C.amber, marginLeft: 6, fontWeight: 600 }}>
                    {trialDays} days left in your trial.
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontFamily: 'monospace' }}>YOUR LOCKED PRICE</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.text, letterSpacing: '-0.04em' }}>${monthlyPrice}<span style={{ fontSize: 14, fontWeight: 400, color: C.muted }}>/mo</span></div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Next month: ${nextMonthPrice}/mo for new signups</div>
            </div>
          </div>
        )}

        {/* Quick nav */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 22px', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{link.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{link.label}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{link.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 32 }}>
          {[
            { label: 'Agent fleet', value: agentCount.toLocaleString(), color: employeeColor },
            { label: 'Beliefs learned', value: loading ? '—' : (stats?.total_beliefs ?? 0), color: C.accent },
            { label: 'Trust level', value: loading ? '—' : (calibration?.autonomy_label ?? 'Guided'), color: C.green },
            { label: 'Pending approvals', value: loading ? '—' : pendingActions.length, color: pendingActions.length > 0 ? C.amber : C.muted },
          ].map(stat => (
            <div key={stat.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, color: stat.color, marginBottom: 4 }}>
                {String(stat.value)}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Pending action approvals */}
        {pendingActions.length > 0 && (
          <div style={{ background: C.card, border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 14, padding: 22, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: C.amber, letterSpacing: '0.08em' }}>
                PENDING APPROVALS · {pendingActions.length}
              </div>
              <Link href={`/employees/${slug}/interview`} style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>
                Go to chat →
              </Link>
            </div>
            {pendingActions.slice(0, 3).map((action: any) => (
              <div key={action.id} style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, marginTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>{action.title}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{action.action_type.replace(/_/g, ' ')} · proposed {new Date(action.proposed_at).toLocaleDateString()}</div>
              </div>
            ))}
            {pendingActions.length > 3 && (
              <div style={{ fontSize: 12, color: C.muted, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                +{pendingActions.length - 3} more — open chat to review them
              </div>
            )}
          </div>
        )}

        {/* How the memory builds — onboarding guide */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.muted, letterSpacing: '0.1em', marginBottom: 16 }}>
            HOW {employeeName.toUpperCase()} LEARNS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '💬', label: 'Chat', desc: `Every session with ${employeeName} is distilled into structured beliefs — your preferences, decisions, and working patterns.` },
              { icon: '🧠', label: 'Memory builds', desc: 'Beliefs compound over time. By session 10, the difference from session 1 is night and day. Confidence scores decay without reinforcement (Ebbinghaus curve).' },
              { icon: '📄', label: 'Upload documents', desc: 'Add your SOPs, playbooks, or product docs to the Vault. They stay separate from beliefs — always cited, never asserted.' },
              { icon: '⚙', label: 'Autonomy grows', desc: `${employeeName} earns autonomy based on your approval rate. The more you trust the proposals, the less approval overhead over time.` },
            ].map(step => (
              <div key={step.label} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{step.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>{step.label}</div>
                  <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.65 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing lock reminder + escalation */}
        {!loading && sub && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>Your price is locked</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, maxWidth: 440 }}>
                You signed up at ${monthlyPrice}/month. This rate is yours forever as long as you stay subscribed.
                New signups after next month will pay ${nextMonthPrice}/month and higher as we ship more.
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.muted, marginBottom: 6 }}>LOCKED RATE</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.04em' }}>
                ${monthlyPrice}<span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>/mo</span>
              </div>
              {isTrial && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>After {trialDays}d free trial</div>
              )}
            </div>
          </div>
        )}

        {/* Cancel / manage subscription */}
        {!loading && !isCancelled && (isTrial || isActive || isPaused) && (
          <div style={{ marginTop: 12, padding: '20px 24px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>Subscription settings</div>
              <div style={{ fontSize: 12, color: C.muted }}>
                {isTrial ? `Trial ends in ${trialDays} day${trialDays !== 1 ? 's' : ''}` : isActive ? `Active · $${monthlyPrice}/mo locked` : 'Paused — click Resume to reactivate'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {isPaused && (
                <button
                  onClick={async () => {
                    await fetch('/api/manage/subscription', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId, slug, action: 'resume' }),
                    })
                    loadAll()
                  }}
                  style={{ padding: '7px 16px', borderRadius: 9, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Resume
                </button>
              )}
              <button
                onClick={() => setShowCancel(true)}
                style={{ padding: '7px 16px', borderRadius: 9, background: 'transparent', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel subscription
              </button>
            </div>
          </div>
        )}

        {/* Cancelled state */}
        {isCancelled && (
          <div style={{ marginTop: 12, padding: '20px 24px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>Subscription cancelled</div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              Your access continues until the end of your current period. If this was a mistake, email <a href={`mailto:${BILLING_EMAIL}`} style={{ color: '#818cf8' }}>{BILLING_EMAIL}</a> and we'll restore it.
            </div>
          </div>
        )}

      </div>

      {/* Activation modal */}
      {showActivate && (
        <div onClick={() => setShowActivate(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20,
            padding: '36px 32px', maxWidth: 460, width: '100%',
          }}>
            <div style={{ fontSize: 36, marginBottom: 16, textAlign: 'center' }}>🔐</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 10px', textAlign: 'center' }}>
              Activate {employeeName}
            </h2>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, margin: '0 0 24px', textAlign: 'center' }}>
              Your locked rate is <strong style={{ color: C.text }}>${monthlyPrice}/month</strong> — permanently. New signups after next month pay more. Billing is handled by a human right now; we'll email you a payment link within a few hours.
            </p>

            <div style={{ background: C.card, borderRadius: 12, padding: '16px 18px', marginBottom: 24 }}>
              {[
                { label: 'Locked rate', value: `$${monthlyPrice}/month` },
                { label: 'Billing cycle', value: 'Monthly' },
                { label: 'Payment method', value: 'UPI / Card / Wire' },
                { label: 'Cancel anytime', value: 'Yes' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10, alignItems: 'center' }}>
                  <span style={{ color: C.muted }}>{r.label}</span>
                  <span style={{ color: C.text, fontWeight: 700 }}>{r.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a
                href={`https://wa.me/918951066630?text=${encodeURIComponent(`Hi Sumeet, I'd like to activate ${employeeName} at my locked rate of $${monthlyPrice}/month. Employee: ${slug}`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'block', textAlign: 'center', padding: '12px 20px', borderRadius: 11,
                  background: '#25D366', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
                }}
              >
                WhatsApp to activate →
              </a>
              <a
                href={`mailto:${BILLING_EMAIL}?subject=Activate ${employeeName} — $${monthlyPrice}/mo&body=Hi, I'd like to activate ${employeeName} at my locked rate of $${monthlyPrice}/month. My employee slug is: ${slug}.`}
                style={{
                  display: 'block', textAlign: 'center', padding: '12px 20px', borderRadius: 11,
                  background: 'transparent', border: `1px solid rgba(99,102,241,0.4)`,
                  color: '#818cf8', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                }}
              >
                Email instead →
              </a>
              <button onClick={() => setShowActivate(false)} style={{
                padding: '11px 20px', borderRadius: 11, background: 'transparent',
                border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Continue trial
              </button>
            </div>

            <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
              We'll set up automated billing soon. For now, reply to the email and we'll send a payment link within a few hours.
            </p>
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {showCancel && (
        <div onClick={() => setShowCancel(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20,
            padding: '32px 28px', maxWidth: 420, width: '100%',
          }}>
            <div style={{ fontSize: 30, marginBottom: 14, textAlign: 'center' }}>⚠️</div>
            <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px', textAlign: 'center' }}>
              Cancel subscription?
            </h2>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: '0 0 20px', textAlign: 'center' }}>
              You'll lose your locked rate of <strong style={{ color: C.text }}>${monthlyPrice}/month</strong> permanently. If you re-subscribe later, you'll pay the then-current rate.
            </p>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: C.muted, letterSpacing: '0.06em', fontFamily: 'monospace', display: 'block', marginBottom: 7 }}>REASON (OPTIONAL)</label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="What could we have done better?"
                rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{ padding: '12px 20px', borderRadius: 11, background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: cancelling ? 'wait' : 'pointer', opacity: cancelling ? 0.7 : 1, fontFamily: 'inherit' }}
              >
                {cancelling ? 'Cancelling…' : 'Yes, cancel subscription'}
              </button>
              <button
                onClick={() => setShowCancel(false)}
                style={{ padding: '11px 20px', borderRadius: 11, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Keep subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
