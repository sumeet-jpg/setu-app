// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { EMPLOYEES } from '@/lib/employees/profiles'

/* ─── Design tokens ─── */
const BG = '#080E1E'
const SURFACE = '#0F172A'
const CARD = '#141E32'
const BORDER = 'rgba(148,163,184,0.1)'
const TEXT = '#F1F5F9'
const MUTED = '#94A3B8'
const DIM = '#475569'
const ACCENT = '#6366F1'

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  contacted: '#3B82F6',
  onboarding: '#8B5CF6',
  active: '#22C55E',
  churned: '#EF4444',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  contacted: 'Being Contacted',
  onboarding: 'Onboarding',
  active: 'Active',
  churned: 'Ended',
}

interface Hire {
  id: string
  created_at: string
  name: string
  email: string
  company: string
  use_case: string
  employee_slug: string
  employee_name: string
  employee_title: string
  status: string
  admin_notes?: string
}

interface UserInfo {
  email?: string
  name?: string
  avatar?: string
}

export default function DashboardClient({ user }: { user: UserInfo }) {
  const router = useRouter()
  const [hires, setHires] = useState<Hire[]>([])
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    fetch('/api/customer/hires')
      .then(r => r.json())
      .then(d => setHires(d.hires ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/signin')
  }

  const activeHires = hires.filter(h => h.status === 'active')
  const pendingHires = hires.filter(h => h.status !== 'active' && h.status !== 'churned')
  const firstName = user.name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'there'

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'var(--font-inter)' }}>
      <style>{`
        .dash-card { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .dash-card:hover { border-color: rgba(99,102,241,0.25) !important; }
        .dash-employee-link { text-decoration: none; transition: opacity 0.2s; }
        .dash-employee-link:hover { opacity: 0.8; }
        .dash-hire-btn { transition: all 0.2s ease; }
        .dash-hire-btn:hover { background: rgba(99,102,241,0.15) !important; }
        .sign-out-btn { transition: all 0.2s ease; }
        .sign-out-btn:hover { background: rgba(239,68,68,0.1) !important; border-color: rgba(239,68,68,0.3) !important; color: #FCA5A5 !important; }
      `}</style>

      {/* Nav */}
      <nav style={{
        borderBottom: `1px solid ${BORDER}`,
        padding: '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(8,14,30,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
          }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-space)' }}>S</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT, letterSpacing: '-0.03em', fontFamily: 'var(--font-space)' }}>Setu</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name ?? 'User'} style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid rgba(99,102,241,0.4)` }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#a5b4fc' }}>
                {firstName[0]?.toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: 13, color: MUTED, display: 'none' }}>{user.email}</span>
          </div>
          <button
            className="sign-out-btn"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              background: 'transparent',
              border: `1px solid ${BORDER}`,
              color: MUTED,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-space)',
            }}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Welcome header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-space)' }}>Your Dashboard</div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '0 0 8px', color: '#fff', fontFamily: 'var(--font-space)', lineHeight: 1.1 }}>
            Hello, {firstName} 👋
          </h1>
          <p style={{ fontSize: 15, color: MUTED, margin: 0 }}>
            {hires.length === 0
              ? 'You haven't hired any AI Employees yet. Browse the team and hire your first one.'
              : `You have ${hires.length} hire request${hires.length > 1 ? 's' : ''} — ${activeHires.length} active.`}
          </p>
        </div>

        {/* Stats */}
        {hires.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 40 }}>
            {[
              { label: 'Total Hires', value: hires.length },
              { label: 'Active', value: activeHires.length },
              { label: 'In Progress', value: pendingHires.length },
              { label: 'Monthly Spend', value: activeHires.reduce((sum, h) => {
                const profile = EMPLOYEES.find(e => e.slug === h.employee_slug)
                return sum + (profile?.pricing?.monthly ?? 0)
              }, 0) === 0 ? '—' : `$${activeHires.reduce((sum, h) => {
                const profile = EMPLOYEES.find(e => e.slug === h.employee_slug)
                return sum + (profile?.pricing?.monthly ?? 0)
              }, 0).toLocaleString()}` },
            ].map(stat => (
              <div key={stat.label} className="dash-card" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 20px' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-space)', letterSpacing: '-0.03em' }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24, height: 200, opacity: 0.5 }}>
                <div style={{ width: '60%', height: 16, background: DIM, borderRadius: 8, marginBottom: 12 }} />
                <div style={{ width: '80%', height: 12, background: DIM, borderRadius: 8, marginBottom: 8 }} />
                <div style={{ width: '50%', height: 12, background: DIM, borderRadius: 8 }} />
              </div>
            ))}
          </div>
        ) : hires.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 24, border: `1px dashed rgba(99,102,241,0.2)`, background: 'rgba(99,102,241,0.03)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 10px', fontFamily: 'var(--font-space)', letterSpacing: '-0.03em' }}>No employees hired yet</h2>
            <p style={{ fontSize: 14, color: MUTED, margin: '0 0 28px', lineHeight: 1.7, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
              Browse 100 AI Employees across every business function — from WhatsApp automation to CMO and COO. Interview any of them free before hiring.
            </p>
            <Link href="/employees" style={{
              padding: '13px 28px', borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 8px 28px rgba(99,102,241,0.35)',
              fontFamily: 'var(--font-space)', display: 'inline-block',
            }}>
              Browse AI Employees →
            </Link>
          </div>
        ) : (
          <>
            {/* Active hires section */}
            {activeHires.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.8)' }} />
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0, fontFamily: 'var(--font-space)' }}>Active Employees</h2>
                  <span style={{ fontSize: 12, color: MUTED, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', padding: '2px 8px', borderRadius: 12 }}>{activeHires.length}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                  {activeHires.map(h => <HireCard key={h.id} hire={h} />)}
                </div>
              </div>
            )}

            {/* In-progress hires */}
            {pendingHires.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: 0, fontFamily: 'var(--font-space)' }}>In Progress</h2>
                  <span style={{ fontSize: 12, color: MUTED, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '2px 8px', borderRadius: 12 }}>{pendingHires.length}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                  {pendingHires.map(h => <HireCard key={h.id} hire={h} />)}
                </div>
              </div>
            )}
          </>
        )}

        {/* CTA to hire more */}
        <div style={{
          marginTop: 60, borderRadius: 24,
          border: '1px solid rgba(99,102,241,0.2)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.03) 100%)',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          alignItems: 'flex-start',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-20%', right: '5%', width: '300px', height: '250px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-space)' }}>Hire More</div>
            <h3 style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 8px', color: '#fff', fontFamily: 'var(--font-space)' }}>
              Need another AI Employee?
            </h3>
            <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.65 }}>
              100 AI Employees covering every business function — from ₹199/mo WhatsApp bots to $2,999/mo C-Suite executives.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/employees" style={{
              padding: '12px 24px', borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
              fontFamily: 'var(--font-space)', boxShadow: '0 6px 20px rgba(99,102,241,0.3)',
            }}>
              Browse all 100 employees →
            </Link>
            <Link href="/flows" style={{
              padding: '12px 24px', borderRadius: 10,
              background: 'transparent', border: `1px solid rgba(99,102,241,0.3)`,
              color: '#a5b4fc', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              fontFamily: 'var(--font-space)',
            }}>
              Build a custom employee
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function HireCard({ hire }: { hire: Hire }) {
  const profile = EMPLOYEES.find(e => e.slug === hire.employee_slug)
  const statusColor = STATUS_COLORS[hire.status] ?? '#94A3B8'
  const statusLabel = STATUS_LABELS[hire.status] ?? hire.status

  return (
    <div className="dash-card" style={{
      background: CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: 20,
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: profile ? `${profile.color}15` : 'rgba(99,102,241,0.1)',
          border: `1.5px solid ${profile ? `${profile.color}30` : 'rgba(99,102,241,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, flexShrink: 0,
        }}>
          {profile?.emoji ?? '🤖'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: profile?.color ?? '#818cf8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3, fontFamily: 'var(--font-space)' }}>
            {profile?.dept ?? 'AI Employee'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', fontFamily: 'var(--font-space)' }}>{hire.employee_name}</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{hire.employee_title}</div>
        </div>

        {/* Status badge */}
        <div style={{
          flexShrink: 0,
          padding: '4px 10px', borderRadius: 20,
          background: `${statusColor}15`,
          border: `1px solid ${statusColor}30`,
          color: statusColor,
          fontSize: 11, fontWeight: 700,
          fontFamily: 'var(--font-space)',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
          {statusLabel}
        </div>
      </div>

      {/* Use case */}
      <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.6, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {hire.use_case}
      </p>

      {/* Admin notes shown when active */}
      {hire.admin_notes && (
        <div style={{ fontSize: 12, color: '#C7D2FE', padding: '10px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
          {hire.admin_notes}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 11, color: DIM }}>
          Hired {new Date(hire.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
        {profile && (
          <Link
            href={`/employees/${hire.employee_slug}`}
            className="dash-employee-link"
            style={{
              fontSize: 12, fontWeight: 600, color: profile.color,
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font-space)',
            }}
          >
            View profile →
          </Link>
        )}
      </div>
    </div>
  )
}
