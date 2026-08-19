// @ts-nocheck
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { EMPLOYEES, DEPT_ORDER, getStuntTitle } from '@/lib/employees/profiles'
import { SetuLogo } from '@/components/SetuLogo'

/* ─── Design tokens ─── */
const GREEN  = '#0E5C34'
const INK    = '#0D0C09'
const BG     = '#F6F5F1'
const WHITE  = '#FFFFFF'
const GRAY   = '#E3E1DA'
const MUTED  = '#78746E'
const DIM    = '#9E9891'

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
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: 'var(--font-jakarta)' }}>
      <style>{`
        .setu-card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .setu-card-hover:hover { transform: translateY(-3px); box-shadow: 0 8px 40px rgba(14,92,52,0.10), 0 2px 8px rgba(0,0,0,0.04); border-color: rgba(14,92,52,0.30) !important; }
        .setu-dept-btn { transition: all 0.15s ease; }
        .setu-dept-btn:hover { border-color: ${GREEN} !important; color: ${GREEN} !important; }
        .setu-input:focus { border-color: rgba(14,92,52,0.45) !important; box-shadow: 0 0 0 3px rgba(14,92,52,0.08) !important; outline: none; }
        .setu-interview-btn:hover { background: rgba(14,92,52,0.06) !important; }
      `}</style>

      {/* Nav */}
      <nav style={{
        borderBottom: `1px solid ${GRAY}`,
        padding: '0 32px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: WHITE,
      }}>
        <SetuLogo size={30} color={GREEN} wordColor={INK} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link href="/pricing" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '8px 14px', borderRadius: 8, letterSpacing: '-0.01em' }}>Pricing</Link>
          <Link href="/pricing" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '8px 14px', borderRadius: 8, letterSpacing: '-0.01em' }}>Pricing</Link>
          <Link href="/signin" style={{ fontSize: 13, color: WHITE, textDecoration: 'none', padding: '8px 18px', borderRadius: 8, letterSpacing: '-0.01em', background: INK, fontWeight: 700 }}>Sign in</Link>
        </div>
      </nav>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${GRAY}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, padding: '5px 14px', borderRadius: 24, background: 'rgba(14,92,52,0.07)', border: '1px solid rgba(14,92,52,0.18)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: '0 0 8px rgba(14,92,52,0.55)', display: 'inline-block' }} />
            AI Employees
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h1 style={{ fontSize: 'clamp(32px,4.5vw,54px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '0 0 12px', color: INK, lineHeight: 1.04 }}>
                {EMPLOYEES.length} AI Employees,<br />ready to hire
              </h1>
              <p style={{ fontSize: 15, color: MUTED, margin: 0, lineHeight: 1.65 }}>The star gets the credit. Your AI Employee does the work. Interview free, hire when ready.</p>
            </div>
            <Link href="/quiz" style={{
              flexShrink: 0,
              padding: '12px 24px', borderRadius: 12,
              background: WHITE, border: `1.5px solid ${GRAY}`,
              color: INK, fontSize: 13, fontWeight: 600, textDecoration: 'none',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              Which role do I need? →
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
                background: WHITE,
                border: `1.5px solid ${GRAY}`,
                borderRadius: 12,
                color: INK,
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
                  cursor: 'pointer', border: '1.5px solid',
                  background: dept === d ? GREEN : WHITE,
                  borderColor: dept === d ? GREEN : GRAY,
                  color: dept === d ? WHITE : MUTED,
                  letterSpacing: '-0.01em',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Quiz promo */}
        <div style={{ marginBottom: 20, padding: '11px 18px', borderRadius: 12, background: 'rgba(14,92,52,0.06)', border: '1px solid rgba(14,92,52,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 13, color: INK, fontWeight: 500 }}>Not sure which role fits your business?</span>
          <Link href="/quiz" style={{ fontSize: 12, fontWeight: 700, color: GREEN, textDecoration: 'none', padding: '6px 14px', borderRadius: 8, background: WHITE, border: `1px solid rgba(14,92,52,0.22)`, whiteSpace: 'nowrap' }}>Take the 4-question quiz →</Link>
        </div>

        {/* Results count */}
        <div style={{ marginBottom: 20, fontSize: 12, color: DIM, letterSpacing: '0.02em' }}>
          {filtered.length} stunt{filtered.length !== 1 ? 'men & stuntwomen' : 'man/stuntwoman'} {dept !== 'All' ? `in ${dept}` : 'across all departments'}
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
            <p style={{ fontSize: 16, margin: '0 0 16px', fontWeight: 600, color: INK }}>No employees found</p>
            <p style={{ fontSize: 14, color: MUTED, margin: '0 0 24px' }}>Try a different search term or department</p>
            <button
              onClick={() => { setDept('All'); setSearch('') }}
              style={{
                color: GREEN, background: 'rgba(14,92,52,0.06)', border: '1.5px solid rgba(14,92,52,0.22)',
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
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
          border: `1.5px solid ${GRAY}`,
          background: WHITE,
          padding: '44px 40px',
          display: 'grid', gridTemplateColumns: '1fr auto',
          gap: 32, alignItems: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Not sure which role?</div>
            <h3 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 10px', color: INK }}>Find your perfect AI Employee match</h3>
            <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.65, maxWidth: 460 }}>Take our 4-question quiz and we'll match you to the right AI Employee for your budget and bottleneck.</p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <Link href="/quiz" style={{
              padding: '13px 28px', borderRadius: 12,
              background: GREEN,
              color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
              whiteSpace: 'nowrap', textAlign: 'center', display: 'block',
              boxShadow: '0 8px 28px rgba(14,92,52,0.22)',
            }}>
              Take the Quiz →
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
      background: WHITE,
      border: `1.5px solid ${GRAY}`,
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
        }}>
          {e.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: e.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{e.dept}</div>
            <div style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: BG, color: MUTED, letterSpacing: '0.04em', textTransform: 'uppercase', border: `1px solid ${GRAY}` }}>{getStuntTitle(e.name)}</div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: INK, letterSpacing: '-0.02em' }}>{e.name}</div>
          <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{e.title} · {e.years} yrs</div>
        </div>
      </div>

      {/* Tagline */}
      <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.65, margin: 0, flexGrow: 1 }}>{e.tagline}</p>

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1.5px solid ${GRAY}` }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>{e.agentCount}</div>
            <div style={{ fontSize: 10, color: DIM, marginTop: 1 }}>agents</div>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>{e.capabilities.reduce((n: number, c: any) => n + c.scenarios.length, 0)}+</div>
            <div style={{ fontSize: 10, color: DIM, marginTop: 1 }}>scenarios</div>
          </div>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: e.color }}>{e.pricing.label}</span>
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Link
          href={`/employees/${e.slug}/interview`}
          className="setu-interview-btn"
          style={{
            flex: 1, padding: '10px 0', borderRadius: 10,
            background: 'transparent',
            border: `1.5px solid ${e.color}35`,
            color: e.color, fontSize: 13, fontWeight: 600,
            textDecoration: 'none', textAlign: 'center',
            letterSpacing: '-0.01em',
            transition: 'all 0.15s ease',
          }}
        >
          Interview {e.name.split(' ')[0]}
        </Link>
        <Link
          href={`/employees/${e.slug}`}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 10,
            background: GREEN,
            color: '#fff', fontSize: 13, fontWeight: 700,
            textDecoration: 'none', textAlign: 'center',
            boxShadow: '0 4px 14px rgba(14,92,52,0.20)',
            letterSpacing: '-0.01em',
          }}
        >
          View Profile →
        </Link>
      </div>
    </div>
  )
}
