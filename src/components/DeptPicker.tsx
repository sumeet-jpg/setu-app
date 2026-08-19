'use client'
// @ts-nocheck
import { useState } from 'react'
import Link from 'next/link'

const GREEN   = '#0E5C34'
const GREEN_L = '#EAF5EE'
const INK     = '#0D0C09'
const GRAY    = '#E3E1DA'
const MUTED   = '#78746E'
const WHITE   = '#FFFFFF'
const BG      = '#F6F5F1'

const DEPT_ICONS: Record<string, string> = {
  'Executive':        '👔',
  'Marketing':        '📣',
  'Sales':            '🎯',
  'Revenue Ops':      '📈',
  'Finance':          '💰',
  'Operations':       '⚙️',
  'Customer Success': '🤝',
  'Customer Support': '🎧',
  'HR':               '👥',
  'IT':               '💻',
  'Legal':            '⚖️',
  'Data':             '📊',
  'Product':          '🗺️',
}

interface Employee {
  slug: string
  name: string
  title: string
  emoji: string
  color: string
  dept: string
  pricing: { label: string }
}

interface Dept {
  name: string
  employees: Employee[]
}

export default function DeptPicker({ departments }: { departments: Dept[] }) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div>
      {/* Dept grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        {departments.map(({ name, employees }) => {
          const isOpen = open === name
          return (
            <button
              key={name}
              onClick={() => setOpen(isOpen ? null : name)}
              style={{
                background: isOpen ? GREEN : WHITE,
                border: `1.5px solid ${isOpen ? GREEN : GRAY}`,
                borderRadius: 14,
                padding: '20px 18px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isOpen ? '0 4px 16px rgba(14,92,52,0.18)' : '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 10 }}>
                {DEPT_ICONS[name] || '🏢'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isOpen ? WHITE : INK, lineHeight: 1.2 }}>
                {name}
              </div>
              <div style={{ fontSize: 11, color: isOpen ? 'rgba(255,255,255,0.65)' : MUTED, marginTop: 5 }}>
                {employees.length} employee{employees.length !== 1 ? 's' : ''}
              </div>
              <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: isOpen ? 'rgba(255,255,255,0.8)' : GREEN }}>
                {isOpen ? 'Close ↑' : 'View →'}
              </div>
            </button>
          )
        })}
      </div>

      {/* Expanded employees */}
      {open && (() => {
        const dept = departments.find(d => d.name === open)
        if (!dept) return null
        return (
          <div style={{ marginTop: 20, background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 18, padding: '28px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{DEPT_ICONS[open] || '🏢'}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: INK, letterSpacing: '-0.03em' }}>{open}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>{dept.employees.length} AI Employees · Interview any free</div>
                </div>
              </div>
              <Link href="/employees" style={{ fontSize: 12, fontWeight: 700, color: GREEN, textDecoration: 'none' }}>
                View all departments →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
              {dept.employees.map(e => (
                <Link key={e.slug} href={`/employees/${e.slug}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, background: BG, border: `1.5px solid ${GRAY}`, borderRadius: 12, padding: '14px 16px', textDecoration: 'none', transition: 'box-shadow 0.15s' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${e.color}14`, border: `1.5px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {e.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: INK, letterSpacing: '-0.02em' }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, flexShrink: 0 }}>{e.pricing.label}</div>
                </Link>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
