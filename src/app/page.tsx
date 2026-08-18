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

const BG = '#09090b'
const SURFACE = 'rgba(255,255,255,0.04)'
const BORDER = 'rgba(255,255,255,0.08)'
const TEXT = '#fafafa'
const MUTED = '#71717a'
const DIM = '#3f3f46'

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

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>S</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: TEXT, letterSpacing: '-0.02em' }}>Setu</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/employees" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '6px 12px' }}>All Employees</Link>
          <Link href="/flows" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '6px 12px' }}>Canvas</Link>
          <Link href="/agents" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '6px 12px' }}>Catalog</Link>
          <Link href="/employees" style={{ fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none', padding: '7px 16px', borderRadius: 8, background: '#6366f1' }}>
            Hire an Employee →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.15), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '96px 24px 72px', textAlign: 'center', position: 'relative' }}>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#818cf8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20, padding: '5px 14px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            20 AI Employees · Available to hire today
          </div>

          <h1 style={{ fontSize: 'clamp(40px,6vw,72px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 20px', lineHeight: 1.05, color: '#fff' }}>
            Your business, run by<br />
            <span style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Employees</span>
          </h1>

          <p style={{ fontSize: 18, color: '#a1a1aa', lineHeight: 1.65, maxWidth: 600, margin: '0 auto 36px' }}>
            20 AI Employees that work like real department heads — Marketing Manager, CFO, Compliance Officer, and 17 more. Interview any of them free. Hire when you're ready.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/employees" style={{ padding: '14px 32px', borderRadius: 12, background: '#6366f1', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 30px rgba(99,102,241,0.35)' }}>
              Browse the team →
            </Link>
            <Link href="/flows" style={{ padding: '14px 24px', borderRadius: 12, background: SURFACE, color: TEXT, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: `1px solid ${BORDER}` }}>
              Build your own employee
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 48, justifyContent: 'center', marginTop: 56, flexWrap: 'wrap' }}>
            {[
              { value: '20', label: 'AI Employees ready to hire' },
              { value: '2,400+', label: 'Specialist agents deployed' },
              { value: '$0', label: 'To interview any employee' },
              { value: '1 day', label: 'Average time to go live' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employee marquee */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: '16px 0', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', gap: 8, animation: 'marquee 30s linear infinite', width: 'max-content' }}>
          {[...EMPLOYEES, ...EMPLOYEES].map((e, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUTED, padding: '4px 14px', borderRadius: 20, border: `1px solid ${BORDER}`, background: SURFACE, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <span>{e.emoji}</span>
              <span style={{ color: '#a1a1aa', fontWeight: 500 }}>{e.name}</span>
              <span>·</span>
              <span>{e.title}</span>
            </span>
          ))}
        </div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>

        {/* How it works */}
        <div style={{ marginBottom: 96 }}>
          <SectionLabel>How it works</SectionLabel>
          <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '12px 0 48px', color: '#fff' }}>
            From browser to hired in minutes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {HOW_STEPS.map(s => (
              <div key={s.n} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', marginBottom: 12, letterSpacing: '0.04em' }}>{s.n}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured employees */}
        <div style={{ marginBottom: 96 }}>
          <SectionLabel>Meet the team</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '12px 0 36px', flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: '#fff' }}>
              Featured employees
            </h2>
            <Link href="/employees" style={{ fontSize: 14, color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>
              View all 20 →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {featured.map(e => (
              <EmployeeCard key={e.slug} employee={e} />
            ))}
          </div>
        </div>

        {/* Build your own */}
        <div style={{ marginBottom: 96, borderRadius: 24, border: `1px solid rgba(99,102,241,0.3)`, background: 'rgba(99,102,241,0.06)', padding: '48px 40px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Canvas</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px', color: '#fff' }}>
              Don't see the role you need?
            </h2>
            <p style={{ fontSize: 15, color: '#a1a1aa', lineHeight: 1.65, margin: 0, maxWidth: 480 }}>
              Use our visual canvas to wire up any AI Employee for any workflow. Connect triggers, AI agents, tools, and approval rules — no code required.
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <Link href="/flows" style={{ display: 'block', padding: '14px 28px', borderRadius: 12, background: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', textAlign: 'center' }}>
              Open Canvas →
            </Link>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 8, textAlign: 'center' }}>Free to build</p>
          </div>
        </div>

        {/* Pricing overview */}
        <div style={{ marginBottom: 80 }}>
          <SectionLabel>Pricing</SectionLabel>
          <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '12px 0 16px', color: '#fff' }}>
            Pay per employee, not per seat
          </h2>
          <p style={{ fontSize: 15, color: MUTED, marginBottom: 40 }}>Interview any employee free. Hire when you're ready.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { tier: 'Starter', price: '$999/mo', examples: 'Executive Assistant, Support Manager, SDR Manager', color: '#22c55e' },
              { tier: 'Growth', price: '$1,499–1,999/mo', examples: 'Marketing Manager, RevOps Lead, Data Analyst, Customer Success', color: '#6366f1' },
              { tier: 'Enterprise', price: '$2,499–2,999/mo', examples: 'CFO Intelligence, Compliance Officer, Executive Intelligence', color: '#f59e0b' },
              { tier: 'Custom', price: 'Build your own', examples: 'Any workflow, any role, any complexity', color: '#c084fc' },
            ].map(t => (
              <div key={t.tier} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: t.color, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t.tier}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>{t.price}</div>
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{t.examples}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 16px', color: '#fff' }}>
            Interview your first AI Employee
          </h2>
          <p style={{ fontSize: 16, color: MUTED, marginBottom: 32 }}>Free. No account required. Hire only when you're impressed.</p>
          <Link href="/employees" style={{ display: 'inline-block', padding: '16px 40px', borderRadius: 14, background: '#6366f1', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 30px rgba(99,102,241,0.4)' }}>
            Browse the team →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: DIM, margin: 0 }}>
          © 2026 Setu · SignalPulse Technologies LLC · Wyoming, USA · <a href="mailto:sumeet@setuagents.com" style={{ color: MUTED, textDecoration: 'none' }}>sumeet@setuagents.com</a>
        </p>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{children}</div>
  )
}

function EmployeeCard({ employee: e }: { employee: any }) {
  return (
    <Link href={`/employees/${e.slug}`} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, textDecoration: 'none', transition: 'border-color 0.2s', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: `${e.color}18`, border: `1px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
          {e.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: e.color, marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{e.dept}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{e.name}</div>
          <div style={{ fontSize: 13, color: '#71717a' }}>{e.title}</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>{e.tagline}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{e.years}yr</div>
            <div style={{ fontSize: 10, color: '#52525b' }}>experience</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{e.agentCount}</div>
            <div style={{ fontSize: 10, color: '#52525b' }}>agents</div>
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: e.color }}>{e.pricing.label}</span>
      </div>
    </Link>
  )
}
