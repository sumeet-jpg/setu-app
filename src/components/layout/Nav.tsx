'use client'
import Link from 'next/link'
import { SetuLogo } from '@/components/SetuLogo'

// Canonical site nav — replaces ~9 pages that each hand-rolled their own
// link set (some had "Sign in", some didn't; some had "My Team", some
// didn't; enterprise/agencies/mcp weren't linked from most pages at all).
// Two themes because the site itself has two real visual registers (the
// light homepage/pricing/legal pages vs. the dark enterprise/agencies/
// whatsapp pages) — that split is intentional, the *links* weren't.

const LINKS: [string, string][] = [
  ['All Employees', '/employees'],
  ['Enterprise', '/enterprise'],
  ['Compare', '/compare'],
  ['Pricing', '/pricing'],
  ['My Team', '/my-employees'],
]

const LIGHT = {
  bg: '#FFFFFF', border: '#E3E1DA', ink: '#0D0C09', muted: '#78746E',
}
const DARK = {
  bg: 'rgba(7,9,26,0.94)', border: 'rgba(148,163,184,0.08)', ink: '#F1F5F9', muted: '#94A3B8',
}

export function Nav({ theme = 'light', ctaLabel = 'Hire an Employee', ctaHref = '/employees' }: { theme?: 'light' | 'dark'; ctaLabel?: string; ctaHref?: string }) {
  const C = theme === 'dark' ? DARK : LIGHT
  const isDark = theme === 'dark'

  return (
    <nav style={{
      background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 20px', height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 50,
      backdropFilter: isDark ? 'blur(20px)' : undefined,
    }}>
      <style>{`
        .setu-nav-link { transition: color 0.12s; }
        .setu-nav-link:hover { color: ${isDark ? '#a5b4fc' : '#0E5C34'} !important; }
        .setu-nav-cta { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .setu-nav-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
        @media (max-width: 760px) {
          .setu-nav-links { display: none !important; }
        }
      `}</style>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <SetuLogo size={28} color={isDark ? '#22c55e' : '#0E5C34'} wordColor={C.ink} />
      </Link>
      <div className="setu-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {LINKS.map(([label, href]) => (
          <Link key={href} href={href} className="setu-nav-link" style={{ fontSize: 13, color: C.muted, textDecoration: 'none', padding: '8px 13px', borderRadius: 8, fontWeight: 500 }}>
            {label}
          </Link>
        ))}
      </div>
      <Link href={ctaHref} className="setu-nav-cta" style={{
        fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none',
        padding: '9px 20px', borderRadius: 100, background: isDark ? 'linear-gradient(135deg,#6366f1,#7c3aed)' : C.ink,
        letterSpacing: '-0.01em', whiteSpace: 'nowrap', display: 'inline-block',
      }}>
        {ctaLabel} →
      </Link>
    </nav>
  )
}
