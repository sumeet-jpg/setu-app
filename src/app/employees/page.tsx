// @ts-nocheck
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { EMPLOYEES, DEPT_ORDER } from '@/lib/employees/profiles'

const BG = '#09090b'
const SURFACE = 'rgba(255,255,255,0.04)'
const BORDER = 'rgba(255,255,255,0.08)'
const TEXT = '#fafafa'
const MUTED = '#71717a'

export default function EmployeesPage() {
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

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>S</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: TEXT, letterSpacing: '-0.02em' }}>Setu</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/flows" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '6px 12px' }}>Build your own</Link>
          <Link href="/agents" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '6px 12px' }}>Agent Catalog</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>AI Employees</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 8px', color: '#fff' }}>
                20 AI Employees, ready to hire
              </h1>
              <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>Interview any employee free. Hire when you're ready. Or build your own with the canvas.</p>
            </div>
            <Link href="/flows" style={{ flexShrink: 0, padding: '10px 20px', borderRadius: 10, background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              + Build your own employee
            </Link>
          </div>
        </div>

        {/* Search + filter */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, role, or department..."
            style={{ flex: '1 1 280px', minWidth: 0, padding: '10px 16px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {depts.slice(0, 8).map(d => (
              <button key={d} onClick={() => setDept(d)} style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', fontFamily: 'inherit', background: dept === d ? '#6366f1' : 'transparent', borderColor: dept === d ? '#6366f1' : 'rgba(255,255,255,0.1)', color: dept === d ? '#fff' : MUTED }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(e => (
            <EmployeeCard key={e.slug} e={e} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: MUTED }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 15 }}>No employees found. <button onClick={() => { setDept('All'); setSearch('') }} style={{ color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15 }}>Clear filters</button></p>
          </div>
        )}

        {/* Build your own CTA */}
        <div style={{ marginTop: 80, borderRadius: 20, border: `1px solid rgba(99,102,241,0.25)`, background: 'rgba(99,102,241,0.06)', padding: '40px 32px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Canvas Builder</div>
            <h3 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px', color: '#fff' }}>Don't see the right employee?</h3>
            <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.6 }}>Use our visual canvas to wire up any AI Employee for any workflow unique to your business. Connect triggers, AI agents, tools, and approval rules in minutes.</p>
          </div>
          <Link href="/flows" style={{ flexShrink: 0, padding: '12px 24px', borderRadius: 10, background: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', textAlign: 'center', display: 'block' }}>
            Open Canvas →
          </Link>
        </div>
      </div>
    </div>
  )
}

function EmployeeCard({ e }: { e: any }) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: `${e.color}15`, border: `2px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
          {e.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: e.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>{e.dept}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{e.name}</div>
          <div style={{ fontSize: 12.5, color: MUTED }}>{e.title} · {e.years} yrs exp</div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.65, margin: 0, flexGrow: 1 }}>{e.tagline}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {e.knows.slice(0, 3).map((k: string) => (
          <span key={k} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: `${e.color}10`, border: `1px solid ${e.color}20`, color: e.color, fontWeight: 500 }}>{k}</span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{e.agentCount}</div>
            <div style={{ fontSize: 10, color: '#52525b' }}>agents</div>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{e.capabilities.reduce((n: number, c: any) => n + c.scenarios.length, 0)}+</div>
            <div style={{ fontSize: 10, color: '#52525b' }}>scenarios</div>
          </div>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: e.color }}>{e.pricing.label}</span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Link href={`/employees/${e.slug}/interview`} style={{ flex: 1, padding: '9px 0', borderRadius: 9, background: 'transparent', border: `1px solid ${e.color}40`, color: e.color, fontSize: 13, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
          Interview {e.name}
        </Link>
        <Link href={`/employees/${e.slug}`} style={{ flex: 1, padding: '9px 0', borderRadius: 9, background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
          View Profile →
        </Link>
      </div>
    </div>
  )
}
