'use client'
import Link from 'next/link'

const LIGHT = { bg: '#FFFFFF', border: '#E3E1DA', green: '#0E5C34', muted: '#78746E', dim: '#9E9891' }
const DARK  = { bg: 'transparent', border: 'rgba(148,163,184,0.08)', green: '#22c55e', muted: '#94A3B8', dim: '#475569' }

const LINKS: [string, string][] = [
  ['About', '/about'],
  ['Contact', '/contact'],
  ['Changelog', '/changelog'],
  ['Agencies', '/agencies'],
  ['MCP', '/mcp'],
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
]

export function Footer({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const C = theme === 'dark' ? DARK : LIGHT
  return (
    <footer style={{
      background: C.bg, borderTop: `1px solid ${C.border}`, padding: '24px 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>S</span>
        </div>
        <span style={{ fontSize: 13, color: C.muted }}>Setu · SignalPulse Technologies LLC · Wyoming, USA</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        {LINKS.map(([label, href]) => (
          <Link key={href} href={href} style={{ fontSize: 13, color: C.dim, textDecoration: 'none' }}>{label}</Link>
        ))}
        <span style={{ fontSize: 13, color: C.dim }}>© 2026</span>
      </div>
    </footer>
  )
}
