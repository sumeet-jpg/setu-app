// @ts-nocheck
import Link from 'next/link'
import type { Metadata } from 'next'
import { EMPLOYEES } from '@/lib/employees/profiles'

const BASE = 'https://setuagents.com'

export const metadata: Metadata = {
  title: 'Setu — Hire AI Employees for Your Business',
  description: 'Hire AI Employees that plan, execute, and report like real department heads. 20 roles — Marketing Manager to CFO Intelligence. Interview free. Go live in days.',
  openGraph: {
    title: 'Hire AI Employees — Setu',
    description: 'From Marketing Manager to CFO: 20 AI Employees commanding 2,400+ agents. Interview any of them for free.',
    url: BASE,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hire AI Employees — Setu',
    description: 'From Marketing Manager to CFO: 20 AI Employees. Interview free, hire in minutes.',
  },
  alternates: { canonical: BASE },
  keywords: ['AI employees', 'hire AI', 'AI marketing manager', 'AI CFO', 'AI agents', 'business automation', 'Setu', 'AI team', 'agent fleet'],
}

/* ─── Design tokens (nextlevelbuilder-inspired) ─── */
const BG      = '#0F172A'
const SURFACE = '#1E293B'
const BORDER  = 'rgba(148,163,184,0.1)'
const TEXT    = '#F1F5F9'
const MUTED   = '#94A3B8'
const DIM     = '#475569'

const FEATURED_SLUGS = [
  'marketing-manager',
  'cfo-intelligence',
  'revenue-ops-lead',
  'compliance-officer',
  'executive-intelligence',
  'finance-controller',
]

const HOW_STEPS = [
  { n: '01', title: 'Browse the team', body: 'Explore 20 AI Employees across every business function. Interview any of them for free.' },
  { n: '02', title: 'Interview first', body: 'Chat live with the employee. Ask anything. See how they think and work before you hire.' },
  { n: '03', title: 'Hire with one form', body: 'Fill out the hire form. We set up the employee, connect your tools, and get them working.' },
  { n: '04', title: 'Or build your own', body: 'Use our canvas to wire up a custom AI Employee for any workflow unique to your business.' },
]

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${BASE}/#org`,
      name: 'Setu',
      legalName: 'SignalPulse Technologies LLC',
      url: BASE,
      description: 'AI Employees marketplace — hire AI department heads that command fleets of specialized agents',
      foundingDate: '2026',
      address: { '@type': 'PostalAddress', addressRegion: 'WY', addressCountry: 'US' },
      contactPoint: { '@type': 'ContactPoint', email: 'sumeet@setuagents.com', contactType: 'sales' },
    },
    {
      '@type': 'WebSite',
      '@id': `${BASE}/#website`,
      url: BASE,
      name: 'Setu AI Employees',
      publisher: { '@id': `${BASE}/#org` },
      potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${BASE}/employees?q={search_term_string}` }, 'query-input': 'required name=search_term_string' },
    },
    {
      '@type': 'ItemList',
      name: 'AI Employees',
      description: '20 AI Employees available to hire, each commanding a fleet of specialized agents',
      url: `${BASE}/employees`,
      numberOfItems: EMPLOYEES.length,
      itemListElement: EMPLOYEES.map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${e.name} — ${e.title}`,
        url: `${BASE}/employees/${e.slug}`,
        description: e.tagline,
      })),
    },
  ],
}

export default function HomePage() {
  const featured = FEATURED_SLUGS.map(s => EMPLOYEES.find(e => e.slug === s)).filter(Boolean)

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'var(--font-inter)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />

      {/* ── Glassmorphic Nav ── */}
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
        background: 'rgba(15,23,42,0.8)',
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
          <NavLink href="/employees">All Employees</NavLink>
          <NavLink href="/flows">Canvas</NavLink>
          <NavLink href="/mcp">MCP</NavLink>
          <Link href="/employees" style={{
            fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none',
            padding: '8px 18px', borderRadius: 9,
            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
            boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            marginLeft: 8,
            fontFamily: 'var(--font-space)',
          }}>
            Hire an Employee →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Aurora blobs */}
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '600px', background: 'radial-gradient(ellipse at center top, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.12) 40%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '10%', left: '-10%', width: '500px', height: '400px', background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '20%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(ellipse, rgba(192,132,252,0.08) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '112px 32px 80px', textAlign: 'center', position: 'relative', zIndex: 1 }}>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12,
            fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 24, padding: '6px 16px', borderRadius: 24,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
            fontFamily: 'var(--font-space)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.8)', display: 'inline-block' }} />
            20 AI Employees · Available to hire today
          </div>

          <h1 style={{
            fontSize: 'clamp(44px,6.5vw,78px)',
            fontWeight: 800,
            letterSpacing: '-0.05em',
            margin: '0 0 24px',
            lineHeight: 1.02,
            color: '#fff',
            fontFamily: 'var(--font-space)',
          }}>
            Your business, run by
            <br />
            <span style={{
              background: 'linear-gradient(90deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>AI Employees</span>
          </h1>

          <p style={{ fontSize: 18, color: MUTED, lineHeight: 1.7, maxWidth: 580, margin: '0 auto 40px', letterSpacing: '-0.01em' }}>
            20 AI Employees that work like real department heads — Marketing Manager, CFO, Compliance Officer, and 17 more. Interview any of them free. Hire when you're ready.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/employees" style={{
              padding: '15px 36px', borderRadius: 14,
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 8px 40px rgba(99,102,241,0.45), 0 2px 8px rgba(0,0,0,0.3)',
              letterSpacing: '-0.01em', fontFamily: 'var(--font-space)',
            }}>
              Browse the team →
            </Link>
            <Link href="/flows" style={{
              padding: '15px 28px', borderRadius: 14,
              background: 'rgba(30,41,59,0.8)',
              color: TEXT, fontSize: 15, fontWeight: 600, textDecoration: 'none',
              border: `1px solid ${BORDER}`,
              backdropFilter: 'blur(8px)',
              letterSpacing: '-0.01em',
            }}>
              Build your own employee
            </Link>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 0, justifyContent: 'center', marginTop: 64, flexWrap: 'wrap', borderRadius: 18, border: `1px solid ${BORDER}`, background: 'rgba(30,41,59,0.5)', backdropFilter: 'blur(12px)', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto', overflow: 'hidden' }}>
            {[
              { value: '20', label: 'AI Employees' },
              { value: '2,400+', label: 'Agents deployed' },
              { value: '$0', label: 'To interview' },
              { value: '1 day', label: 'To go live' },
            ].map((stat, i) => (
              <div key={stat.label} style={{ flex: 1, minWidth: 120, padding: '20px 16px', textAlign: 'center', borderLeft: i > 0 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', fontFamily: 'var(--font-space)' }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 4, letterSpacing: '0.02em' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Employee marquee ── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: '14px 0', overflow: 'hidden', background: 'rgba(30,41,59,0.3)' }}>
        <div style={{ display: 'flex', gap: 8, animation: 'marquee 35s linear infinite', width: 'max-content' }}>
          {[...EMPLOYEES, ...EMPLOYEES].map((e, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12,
              color: MUTED, padding: '5px 15px', borderRadius: 24,
              border: `1px solid ${BORDER}`, background: 'rgba(30,41,59,0.6)',
              whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: '-0.01em',
            }}>
              <span style={{ fontSize: 14 }}>{e.emoji}</span>
              <span style={{ color: TEXT, fontWeight: 600, fontFamily: 'var(--font-space)' }}>{e.name}</span>
              <span style={{ color: DIM }}>·</span>
              <span>{e.title}</span>
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .setu-card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .setu-card-hover:hover { transform: translateY(-3px); box-shadow: 0 0 40px rgba(99,102,241,0.15), 0 20px 40px rgba(0,0,0,0.3); border-color: rgba(99,102,241,0.3) !important; }
        .setu-how-hover { transition: all 0.25s ease; }
        .setu-how-hover:hover { border-color: rgba(99,102,241,0.4) !important; background: rgba(30,41,59,0.9) !important; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 32px' }}>

        {/* ── How it works ── */}
        <div style={{ marginBottom: 112 }}>
          <EyebrowLabel>How it works</EyebrowLabel>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '12px 0 48px', color: '#fff', fontFamily: 'var(--font-space)' }}>
            From browser to hired in minutes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {HOW_STEPS.map(s => (
              <div key={s.n} className="setu-how-hover" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '28px 24px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-space)' }}>{s.n}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10, fontFamily: 'var(--font-space)', letterSpacing: '-0.02em' }}>{s.title}</div>
                <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.65 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Featured employees – bento layout ── */}
        <div style={{ marginBottom: 112 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <div>
              <EyebrowLabel>Meet the team</EyebrowLabel>
              <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '12px 0 0', color: '#fff', fontFamily: 'var(--font-space)' }}>
                Featured employees
              </h2>
            </div>
            <Link href="/employees" style={{ fontSize: 14, color: '#818cf8', textDecoration: 'none', fontWeight: 600, fontFamily: 'var(--font-space)', letterSpacing: '-0.01em', paddingBottom: 4 }}>
              View all 20 →
            </Link>
          </div>

          {/* Bento: big card on left, 2 stacked on right, then 3 across */}
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {featured.slice(0, 2).map(e => (
                <EmployeeCard key={e.slug} employee={e} />
              ))}
              <EmployeeCard key={featured[2]?.slug} employee={featured[2]} tall />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {featured.slice(3).map(e => (
                <EmployeeCard key={e.slug} employee={e} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Canvas CTA ── */}
        <div style={{
          marginBottom: 112,
          borderRadius: 28,
          border: '1px solid rgba(99,102,241,0.25)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.04) 100%)',
          padding: '56px 48px',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 40,
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-40%', right: '10%', width: '400px', height: '300px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <EyebrowLabel>Canvas Builder</EyebrowLabel>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '12px 0 16px', color: '#fff', fontFamily: 'var(--font-space)' }}>
              Don't see the role you need?
            </h2>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, margin: 0, maxWidth: 480 }}>
              Use our visual canvas to wire up any AI Employee for any workflow. Connect triggers, AI agents, tools, and approval rules — no code required.
            </p>
          </div>
          <div style={{ flexShrink: 0, position: 'relative' }}>
            <Link href="/flows" style={{
              display: 'block', padding: '14px 32px', borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
              whiteSpace: 'nowrap', textAlign: 'center',
              boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
              fontFamily: 'var(--font-space)',
            }}>
              Open Canvas →
            </Link>
            <p style={{ fontSize: 12, color: DIM, marginTop: 10, textAlign: 'center' }}>Free to build</p>
          </div>
        </div>

        {/* ── Pricing ── */}
        <div style={{ marginBottom: 96 }}>
          <EyebrowLabel>Pricing</EyebrowLabel>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '12px 0 0', color: '#fff', fontFamily: 'var(--font-space)' }}>
              Pay per employee, not per seat
            </h2>
            <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>Interview any employee free. Hire when you're ready.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { tier: 'Starter', price: '$999/mo', examples: 'Executive Assistant, Support Manager, SDR Manager', color: '#34d399', glow: 'rgba(52,211,153,0.15)' },
              { tier: 'Growth', price: '$1,499–1,999/mo', examples: 'Marketing Manager, RevOps Lead, Data Analyst, Customer Success', color: '#818cf8', glow: 'rgba(129,140,248,0.15)' },
              { tier: 'Enterprise', price: '$2,499–2,999/mo', examples: 'CFO Intelligence, Compliance Officer, Executive Intelligence', color: '#fbbf24', glow: 'rgba(251,191,36,0.15)' },
              { tier: 'Custom', price: 'Build your own', examples: 'Any workflow, any role, any complexity', color: '#c084fc', glow: 'rgba(192,132,252,0.15)' },
            ].map(t => (
              <div key={t.tier} className="setu-how-hover" style={{
                background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '28px 24px',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${t.color}, transparent)`, opacity: 0.6 }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: t.color, marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-space)' }}>{t.tier}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: 12, fontFamily: 'var(--font-space)' }}>{t.price}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{t.examples}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Final CTA ── */}
        <div style={{ textAlign: 'center', padding: '80px 0 16px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <EyebrowLabel>Ready to hire?</EyebrowLabel>
            <h2 style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '16px 0 18px', color: '#fff', lineHeight: 1.06, fontFamily: 'var(--font-space)' }}>
              Interview your first<br />AI Employee
            </h2>
            <p style={{ fontSize: 16, color: MUTED, marginBottom: 36, lineHeight: 1.6 }}>Free. No account required. Hire only when you're impressed.</p>
            <Link href="/employees" style={{
              display: 'inline-block', padding: '17px 44px', borderRadius: 16,
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 8px 48px rgba(99,102,241,0.5), 0 2px 12px rgba(0,0,0,0.4)',
              fontFamily: 'var(--font-space)',
              letterSpacing: '-0.01em',
            }}>
              Browse the team →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-space)' }}>S</span>
          </div>
          <span style={{ fontSize: 13, color: DIM }}>Setu · SignalPulse Technologies LLC · Wyoming, USA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a href="mailto:sumeet@setuagents.com" style={{ fontSize: 13, color: DIM, textDecoration: 'none' }}>sumeet@setuagents.com</a>
          <Link href="/mcp" style={{ fontSize: 13, color: DIM, textDecoration: 'none' }}>MCP Integration</Link>
          <span style={{ fontSize: 13, color: DIM }}>© 2026</span>
        </div>
      </div>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '8px 14px', borderRadius: 8, letterSpacing: '-0.01em', transition: 'color 0.15s' }}>
      {children}
    </Link>
  )
}

function EyebrowLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-space)' }}>{children}</div>
  )
}

function EmployeeCard({ employee: e, tall }: { employee: any; tall?: boolean }) {
  return (
    <Link href={`/employees/${e.slug}`} className="setu-card-hover" style={{
      display: 'flex', flexDirection: 'column',
      background: SURFACE,
      border: `1px solid ${BORDER}`,
      borderRadius: 22,
      padding: tall ? '32px 28px' : '24px',
      textDecoration: 'none',
      gap: 16,
      gridRow: tall ? 'span 1' : undefined,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{
          width: tall ? 64 : 52, height: tall ? 64 : 52,
          borderRadius: tall ? 18 : 14,
          background: `${e.color}18`,
          border: `1.5px solid ${e.color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: tall ? 30 : 24, flexShrink: 0,
          boxShadow: `0 0 20px ${e.color}20`,
        }}>
          {e.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: e.color, marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-space)' }}>{e.dept}</div>
          <div style={{ fontSize: tall ? 19 : 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', fontFamily: 'var(--font-space)' }}>{e.name}</div>
          <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{e.title}</div>
        </div>
      </div>
      <p style={{ fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.65, margin: 0, flexGrow: 1 }}>{e.tagline}</p>
      {tall && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {e.knows.slice(0, 3).map((k: string) => (
            <span key={k} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: `${e.color}12`, border: `1px solid ${e.color}25`, color: e.color, fontWeight: 600 }}>{k}</span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-space)' }}>{e.years}yr</div>
            <div style={{ fontSize: 10, color: DIM, marginTop: 1 }}>experience</div>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-space)' }}>{e.agentCount}</div>
            <div style={{ fontSize: 10, color: DIM, marginTop: 1 }}>agents</div>
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: e.color, fontFamily: 'var(--font-space)' }}>{e.pricing.label}</span>
      </div>
    </Link>
  )
}
