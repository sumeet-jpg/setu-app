// @ts-nocheck
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { EMPLOYEES, DEPT_ORDER } from '@/lib/employees/profiles'

/* ─── Design tokens ─── */
const BG      = '#0F172A'
const SURFACE = '#1E293B'
const BORDER  = 'rgba(148,163,184,0.1)'
const TEXT    = '#F1F5F9'
const MUTED   = '#94A3B8'
const DIM     = '#475569'

export default function EmployeesClient() {
  const [dept, setDept] = useState('All')
  const [search, setSearch] = useState('')

  const depts = ['All', ...DEPT_ORDER.filter(d => EMPLOYEES.some(e => e.dept === d))]

  const filtered = EMPLOYEES.filter(e => {
    const matchDept = dept === 'All' || e.dept === dept
    const q = search.toLowerCase()
    const matchSearch = !q || e.name.toLowerCase().includes(q) || e.title.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q) || e.tagline.toLowerCase().includes(q)
    return matchDept && matchSearch
  })

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'var(--font-inter)' }}>
      <style>{`
        .setu-card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .setu-card-hover:hover { transform: translateY(-3px); box-shadow: 0 0 40px rgba(99,102,241,0.15), 0 20px 40px rgba(0,0,0,0.3); border-color: rgba(99,102,241,0.3) !important; }
        .setu-dept-btn { transition: all 0.15s ease; }
        .setu-dept-btn:hover { border-color: rgba(99,102,241,0.5) !important; color: #c7d2fe !important; }
        .setu-input:focus { border-color: rgba(99,102,241,0.5) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important; outline: none; }
        .setu-interview-btn { transition: all 0.2s ease; }
        .setu-interview-btn:hover { background: rgba(99,102,241,0.12) !important; }
      `}</style>

      {/* Glassmorphic Nav */}
      <nav style={{
        borderBottom: `1px solid ${BORDER}`,
        padding: '0 32px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(15,23,42,0.85)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link href="/flows" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '8px 14px', borderRadius: 8, letterSpacing: '-0.01em' }}>Build your own</Link>
          <Link href="/mcp" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '8px 14px', borderRadius: 8, letterSpacing: '-0.01em' }}>MCP</Link>
        </div>
      </nav>

      {/* Header */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '400px', background: 'radial-gradient(ellipse at center top, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 40px', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, padding: '5px 14px', borderRadius: 24, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', fontFamily: 'var(--font-space)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.8)', display: 'inline-block' }} />
            AI Employees
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h1 style={{ fontSize: 'clamp(32px,4.5vw,54px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '0 0 12px', color: '#fff', fontFamily: 'var(--font-space)', lineHeight: 1.04 }}>
                100 AI Employees,<br />ready to hire
              </h1>
              <p style={{ fontSize: 15, color: MUTED, margin: 0, lineHeight: 1.65 }}>Interview any employee free. Hire when you're ready. Or build your own with the canvas.</p>
            </div>
            <Link href="/flows" style={{
              flexShrink: 0,
              padding: '12px 24px', borderRadius: 12,
              background: SURFACE, border: `1px solid ${BORDER}`,
              color: TEXT, fontSize: 13, fontWeight: 600, textDecoration: 'none',
              fontFamily: 'var(--font-space)', letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}>
              + Build your own employee
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 80px' }}>

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 36, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 0 }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DIM, fontSize: 15, pointerEvents: 'none' }}>⌕</div>
            <input
              className="setu-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, role, or department..."
              style={{
                width: '100%',
                padding: '11px 16px 11px 38px',
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                color: TEXT,
                fontSize: 14,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {depts.map(d => (
              <button
                key={d}
                className="setu-dept-btn"
                onClick={() => setDept(d)}
                style={{
                  padding: '8px 16px', borderRadius: 24, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: '1px solid', fontFamily: 'var(--font-space)',
                  background: dept === d ? 'rgba(99,102,241,0.2)' : 'transparent',
                  borderColor: dept === d ? 'rgba(99,102,241,0.5)' : BORDER,
                  color: dept === d ? '#c7d2fe' : MUTED,
                  letterSpacing: '-0.01em',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div style={{ marginBottom: 20, fontSize: 12, color: DIM, fontFamily: 'var(--font-space)', letterSpacing: '0.02em' }}>
          {filtered.length} employee{filtered.length !== 1 ? 's' : ''} {dept !== 'All' ? `in ${dept}` : 'across all departments'}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map(e => (
            <EmployeeCard key={e.slug} e={e} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 0', color: MUTED }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 16, margin: '0 0 16px', fontFamily: 'var(--font-space)', fontWeight: 600, color: TEXT }}>No employees found</p>
            <p style={{ fontSize: 14, color: MUTED, margin: '0 0 24px' }}>Try a different search term or department</p>
            <button
              onClick={() => { setDept('All'); setSearch('') }}
              style={{
                color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                cursor: 'pointer', fontFamily: 'var(--font-space)', fontSize: 14, fontWeight: 600,
                padding: '10px 24px', borderRadius: 10,
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Canvas CTA */}
        <div style={{
          marginTop: 80, borderRadius: 24,
          border: '1px solid rgba(99,102,241,0.2)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.03) 100%)',
          padding: '44px 40px',
          display: 'grid', gridTemplateColumns: '1fr auto',
          gap: 32, alignItems: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-30%', right: '5%', width: '300px', height: '250px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-space)' }}>Canvas Builder</div>
            <h3 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 10px', color: '#fff', fontFamily: 'var(--font-space)' }}>Don't see the right employee?</h3>
            <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.65, maxWidth: 460 }}>Use our visual canvas to wire up any AI Employee for any workflow unique to your business.</p>
          </div>
          <div style={{ flexShrink: 0, position: 'relative' }}>
            <Link href="/flows" style={{
              padding: '13px 28px', borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
              whiteSpace: 'nowrap', textAlign: 'center', display: 'block',
              boxShadow: '0 8px 28px rgba(99,102,241,0.35)',
              fontFamily: 'var(--font-space)',
            }}>
              Open Canvas →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmployeeCard({ e }: { e: any }) {
  return (
    <div className="setu-card-hover" style={{
      background: SURFACE,
      border: `1px solid ${BORDER}`,
      borderRadius: 22,
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: `${e.color}15`,
          border: `1.5px solid ${e.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, flexShrink: 0,
          boxShadow: `0 0 20px ${e.color}18`,
        }}>
          {e.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: e.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'var(--font-space)' }}>{e.dept}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', fontFamily: 'var(--font-space)' }}>{e.name}</div>
          <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{e.title} · {e.years} yrs</div>
        </div>
      </div>

      {/* Tagline */}
      <p style={{ fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.65, margin: 0, flexGrow: 1 }}>{e.tagline}</p>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {e.knows.slice(0, 3).map((k: string) => (
          <span key={k} style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 8,
            background: `${e.color}10`, border: `1px solid ${e.color}20`,
            color: e.color, fontWeight: 600,
          }}>{k}</span>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-space)' }}>{e.agentCount}</div>
            <div style={{ fontSize: 10, color: DIM, marginTop: 1 }}>agents</div>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-space)' }}>{e.capabilities.reduce((n: number, c: any) => n + c.scenarios.length, 0)}+</div>
            <div style={{ fontSize: 10, color: DIM, marginTop: 1 }}>scenarios</div>
          </div>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: e.color, fontFamily: 'var(--font-space)' }}>{e.pricing.label}</span>
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Link
          href={`/employees/${e.slug}/interview`}
          className="setu-interview-btn"
          style={{
            flex: 1, padding: '10px 0', borderRadius: 10,
            background: 'transparent',
            border: `1px solid ${e.color}35`,
            color: e.color, fontSize: 13, fontWeight: 600,
            textDecoration: 'none', textAlign: 'center',
            fontFamily: 'var(--font-space)', letterSpacing: '-0.01em',
          }}
        >
          Interview {e.name.split(' ')[0]}
        </Link>
        <Link
          href={`/employees/${e.slug}`}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
            color: '#fff', fontSize: 13, fontWeight: 700,
            textDecoration: 'none', textAlign: 'center',
            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
            fontFamily: 'var(--font-space)', letterSpacing: '-0.01em',
          }}
        >
          View Profile →
        </Link>
      </div>
    </div>
  )
}
