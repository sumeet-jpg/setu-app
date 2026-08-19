// @ts-nocheck
import Link from 'next/link'
import type { Metadata } from 'next'
import { EMPLOYEES } from '@/lib/employees/profiles'
import { SetuLogo } from '@/components/SetuLogo'

const BASE = 'https://setuagents.com'

export const metadata: Metadata = {
  title: 'Setu — Hire Your Business Stuntman',
  description: 'The star gets the credit. Your Stuntman does the work. 100 Stuntmen & Stuntwomen — WhatsApp to CMO, CFO, COO. Interview free. Go live in days.',
  openGraph: {
    title: 'Hire Your Business Stuntman — Setu',
    description: '100 Stuntmen & Stuntwomen commanding 10,000+ agents. Interview any of them for free.',
    url: BASE,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hire Your Business Stuntman — Setu',
    description: '100 Stuntmen & Stuntwomen. WhatsApp to C-Suite. Interview free, hire in minutes.',
  },
  alternates: { canonical: BASE },
  keywords: ['AI employees', 'hire AI', 'AI marketing manager', 'AI CFO', 'AI agents', 'business automation', 'Setu', 'AI team', 'agent fleet'],
}

/* ─── Design tokens ─────────────────────────────────────────── */
const BG      = '#F6F5F1'
const WHITE   = '#FFFFFF'
const INK     = '#0D0C09'
const GREEN   = '#0E5C34'
const GREEN_L = '#EAF5EE'
const GREEN_M = '#1A9655'
const ORANGE  = '#E84A1A'
const GRAY    = '#E3E1DA'
const MUTED   = '#78746E'
const DIM     = '#9E9891'
const F       = 'var(--font-jakarta)'

const FEATURED_SLUGS = [
  'marketing-manager',
  'cfo-intelligence',
  'whatsapp-lead-qualifier',
  'cmo-intelligence',
  'hr-ops-manager',
  'coo-intelligence',
]

const HOW_STEPS = [
  { n: '01', title: 'Browse 100 roles', body: 'From a $199/mo WhatsApp Lead Qualifier to a $2,999/mo AI CMO — browse every function your business needs.' },
  { n: '02', title: 'Interview for free', body: 'Chat live with any employee. Ask real questions. See exactly how they think before you commit a rupee.' },
  { n: '03', title: 'Hire with one form', body: 'Fill out the hire form. We configure the employee, connect your tools, and have them working inside 48 hours.' },
  { n: '04', title: 'Or build your own', body: 'Use the Canvas to wire up a custom AI Employee for any unique workflow — no code, no engineers.' },
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
    },
    {
      '@type': 'ItemList',
      name: 'AI Employees',
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
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: F }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />

      <style>{`
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .emp-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .emp-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(14,92,52,0.12), 0 4px 12px rgba(0,0,0,0.06) !important; }
        .how-card { transition: background 0.15s ease, border-color 0.15s ease; }
        .how-card:hover { background: ${WHITE} !important; border-color: ${GREEN} !important; }
        .cta-btn { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .cta-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.25) !important; }
        .ghost-btn { transition: background 0.15s ease, color 0.15s ease; }
        .ghost-btn:hover { background: ${GREEN_L} !important; }
        .nav-link { transition: color 0.12s; }
        .nav-link:hover { color: ${GREEN} !important; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ background: WHITE, borderBottom: `1px solid ${GRAY}`, padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <SetuLogo size={30} color={GREEN} wordColor={INK} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[['All Employees', '/employees'], ['WhatsApp', '/whatsapp'], ['Enterprise', '/enterprise'], ['Compare', '/compare']].map(([label, href]) => (
            <Link key={href} href={href} className="nav-link" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '8px 13px', borderRadius: 8, fontWeight: 500 }}>{label}</Link>
          ))}
          <Link href="/quiz" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '8px 13px', borderRadius: 8, fontWeight: 500 }} className="nav-link">Which role?</Link>
          <Link href="/employees" className="cta-btn" style={{ fontSize: 13, fontWeight: 700, color: WHITE, textDecoration: 'none', padding: '9px 20px', borderRadius: 100, background: INK, marginLeft: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', letterSpacing: '-0.01em', display: 'inline-block' }}>
            Hire an Employee →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px 72px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.09em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 6, background: GREEN_L, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN_M, display: 'inline-block' }} />
            100 Stuntmen &amp; Stuntwomen · Hiring now
          </div>

          <h1 style={{ fontSize: 'clamp(44px,5vw,72px)', fontWeight: 800, letterSpacing: '-0.055em', margin: '0 0 24px', color: INK, lineHeight: 1.0, fontFamily: F }}>
            The star gets<br />the credit. Your<br /><span style={{ color: GREEN }}>Stuntman works.</span>
          </h1>

          <p style={{ fontSize: 18, color: MUTED, lineHeight: 1.72, maxWidth: 460, margin: '0 0 40px', fontWeight: 400 }}>
            100 Stuntmen &amp; Stuntwomen — CMO, CFO, COO and 97 more. They do the heavy work. You stay in control. Interview any of them free.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/employees" className="cta-btn" style={{ padding: '14px 32px', borderRadius: 100, background: INK, color: WHITE, fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', letterSpacing: '-0.02em', display: 'inline-block' }}>
              Browse the team →
            </Link>
            <Link href="/quiz" className="ghost-btn" style={{ padding: '14px 24px', borderRadius: 100, background: WHITE, border: `1.5px solid ${GRAY}`, color: INK, fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
              Which role do I need?
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 36, marginTop: 52, paddingTop: 36, borderTop: `1px solid ${GRAY}` }}>
            {[
              { value: '100', label: 'Stuntmen & Stuntwomen' },
              { value: '10,000+', label: 'Agents deployed' },
              { value: '$0', label: 'To interview' },
              { value: '48h', label: 'To go live' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 26, fontWeight: 800, color: GREEN, letterSpacing: '-0.05em', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero right: 2 employee cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {featured.slice(0, 2).map(e => (
            <HeroEmployeeCard key={e.slug} employee={e} />
          ))}
          <div style={{ background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 16, padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>+98 more employees across every function</span>
            <Link href="/employees" style={{ fontSize: 12, fontWeight: 700, color: GREEN, textDecoration: 'none' }}>View all →</Link>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ borderTop: `1px solid ${GRAY}`, borderBottom: `1px solid ${GRAY}`, padding: '12px 0', overflow: 'hidden', background: WHITE }}>
        <div style={{ display: 'flex', gap: 8, animation: 'marquee 40s linear infinite', width: 'max-content' }}>
          {[...EMPLOYEES, ...EMPLOYEES].map((e, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: MUTED, padding: '5px 14px', borderRadius: 6, border: `1px solid ${GRAY}`, whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 500 }}>
              <span style={{ fontSize: 13 }}>{e.emoji}</span>
              <span style={{ color: INK, fontWeight: 600 }}>{e.name}</span>
              <span style={{ color: GRAY }}>·</span>
              <span>{e.title}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 32px' }}>

        {/* ── HOW IT WORKS ── */}
        <section style={{ marginBottom: 104 }}>
          <div style={{ marginBottom: 40 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase' }}>How it works</span>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '10px 0 0', color: INK, lineHeight: 1.1 }}>
              From browser to hired in minutes
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
            {HOW_STEPS.map(s => (
              <div key={s.n} className="how-card" style={{ background: BG, border: `1.5px solid ${GRAY}`, borderRadius: 16, padding: '28px 24px' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: GREEN_L, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: GREEN }}>{s.n}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: INK, marginBottom: 10, letterSpacing: '-0.03em' }}>{s.title}</div>
                <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.7 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURED EMPLOYEES ── */}
        <section style={{ marginBottom: 104 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Meet the team</span>
              <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '10px 0 0', color: INK, lineHeight: 1.1 }}>
                Featured employees
              </h2>
            </div>
            <Link href="/employees" style={{ fontSize: 14, color: GREEN, textDecoration: 'none', fontWeight: 600, letterSpacing: '-0.01em', paddingBottom: 4, borderBottom: `1.5px solid ${GREEN}` }}>
              View all 100 →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {featured.map(e => (
              <EmployeeCard key={e.slug} employee={e} />
            ))}
          </div>
        </section>

        {/* ── CANVAS CTA ── */}
        <section style={{ marginBottom: 104, background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 24, padding: '52px 48px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Canvas Builder</span>
            <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '10px 0 14px', color: INK }}>
              Don't see the role you need?
            </h2>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, margin: 0, maxWidth: 440 }}>
              Use the visual canvas to wire up any AI Employee for any workflow. Connect triggers, AI agents, tools, and approval rules — no code required.
            </p>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <Link href="/flows" className="ghost-btn" style={{ display: 'inline-block', padding: '13px 30px', borderRadius: 11, background: GREEN_L, border: `1.5px solid ${GREEN}`, color: GREEN, fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Open Canvas →
            </Link>
            <p style={{ fontSize: 12, color: DIM, marginTop: 10, textAlign: 'center' }}>Free to build</p>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section style={{ marginBottom: 96 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pricing</span>
              <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '10px 0 0', color: INK }}>
                Pay per employee, not per seat
              </h2>
            </div>
            <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>Interview any employee free. Hire when ready.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {[
              { tier: 'Starter', price: '$199–999/mo', desc: 'WhatsApp bots, Executive Assistant, Support Manager, SDR Manager', accent: GREEN_M },
              { tier: 'Growth', price: '$999–1,999/mo', desc: 'Marketing Manager, RevOps Lead, Finance Controller, Customer Success', accent: '#1A5C8A' },
              { tier: 'Enterprise', price: '$2,499–2,999/mo', desc: 'CFO Intelligence, AI CMO, AI COO, CTO Intelligence, Chief of Staff', accent: '#8B5A1A' },
              { tier: 'Custom', price: 'Your workflow', desc: 'Build any role on our Canvas — no code, no engineers, any complexity', accent: MUTED },
            ].map(t => (
              <div key={t.tier} style={{ background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 16, padding: '26px 22px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: t.accent }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: t.accent, marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t.tier}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: INK, letterSpacing: '-0.04em', marginBottom: 10 }}>{t.price}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.65 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── BENTO FEATURES ── */}
      <section style={{ background: WHITE, borderTop: `1px solid ${GRAY}`, borderBottom: `1px solid ${GRAY}`, padding: 'clamp(56px,6vw,80px) 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Feature 1 */}
            <div style={{ background: BG, border: `1px solid ${GRAY}`, borderRadius: 20, padding: '32px', overflow: 'hidden', position: 'relative' }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED }}>Interview first</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '24px 0 20px' }}>
                {[
                  { q: 'Can you run a full email campaign for a product launch?', who: 'You' },
                  { q: 'Yes — targeting, copy, sequences, and A/B testing. Want me to start with the segment?', who: 'Priya' },
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: m.who !== 'You' ? 'row-reverse' : 'row' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: m.who === 'You' ? GRAY : GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: m.who === 'You' ? MUTED : WHITE }}>
                      {m.who === 'You' ? 'U' : 'P'}
                    </div>
                    <div style={{ background: WHITE, border: `1px solid ${GRAY}`, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: INK, lineHeight: 1.5, maxWidth: '80%' }}>{m.q}</div>
                  </div>
                ))}
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: INK, margin: '0 0 8px' }}>Talk to them before you hire</h3>
              <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.65 }}>Every employee is live-interviewable before you commit. Ask anything. See exactly how they think.</p>
            </div>

            {/* Feature 2 */}
            <div style={{ background: BG, border: `1px solid ${GRAY}`, borderRadius: 20, padding: '32px' }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED }}>Agent fleet</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '24px 0 20px' }}>
                {['📧 Email', '📊 Ads', '🔍 SEO', '📱 Social', '✍️ Copy', '📈 Reports', '🎨 Design', '💡 Strategy', '⚡ Automation'].map(a => (
                  <div key={a} style={{ background: WHITE, border: `1px solid ${GRAY}`, borderRadius: 9, padding: '8px 10px', fontSize: 11, color: INK, fontWeight: 500, textAlign: 'center' }}>{a}</div>
                ))}
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: INK, margin: '0 0 8px' }}>Each employee commands a team of agents</h3>
              <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.65 }}>One hire. A fleet of 30–300 specialist agents behind them, executing across every tool you use.</p>
            </div>

            {/* Feature 3 */}
            <div style={{ background: BG, border: `1px solid ${GRAY}`, borderRadius: 20, padding: '32px' }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED }}>WhatsApp native</span>
              <div style={{ background: '#075E54', borderRadius: 14, padding: '16px', margin: '24px 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { msg: 'Hi, interested in the course 🙏', left: true },
                  { msg: 'Hi Priya! Which city are you in? And are you looking at the weekend batch or weekday?', left: false },
                  { msg: 'Mumbai. Weekend works better.', left: true },
                  { msg: 'Great! I can share the seat availability + a short overview video. Want me to send it now?', left: false },
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.left ? 'flex-start' : 'flex-end' }}>
                    <div style={{ background: m.left ? 'rgba(255,255,255,0.1)' : '#25D366', borderRadius: 10, padding: '7px 11px', fontSize: 12, color: WHITE, maxWidth: '78%', lineHeight: 1.45 }}>{m.msg}</div>
                  </div>
                ))}
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: INK, margin: '0 0 8px' }}>Sells on WhatsApp while you sleep</h3>
              <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.65 }}>Replies in under 3 seconds. Qualifies leads, books appointments, and closes on your catalogue. Starts at $199/mo.</p>
            </div>

            {/* Feature 4 */}
            <div style={{ background: BG, border: `1px solid ${GRAY}`, borderRadius: 20, padding: '32px' }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED }}>Cost comparison</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '24px 0 20px' }}>
                {[
                  { role: 'Marketing Manager', human: '₹12L/yr', ai: '₹1.99L/mo all-in', savings: '83% less' },
                  { role: 'CFO', human: '₹40L/yr', ai: '₹1.99L/mo all-in', savings: '94% less' },
                  { role: 'WhatsApp Sales Rep', human: '₹4.8L/yr', ai: '₹16K/mo all-in', savings: '60% less' },
                ].map(r => (
                  <div key={r.role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: WHITE, border: `1px solid ${GRAY}`, borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: INK }}>{r.role}</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: MUTED, textDecoration: 'line-through' }}>{r.human}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>{r.ai}</span>
                    </div>
                  </div>
                ))}
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: INK, margin: '0 0 8px' }}>A fraction of the cost. Zero notice period.</h3>
              <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.65 }}>No PF, no recruitment fee, no training cost, no politics. Cancel anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── EDITORIAL QUOTE ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(72px,8vw,104px) 32px', textAlign: 'left' }}>
        <p style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.05em', color: INK, lineHeight: 1.2, margin: '0 0 24px' }}>
          "We needed a CMO-level thinker but could not justify ₹40L. Setu's AI CMO gave us exactly that — strategy, oversight, and board reporting — at a fraction of the cost."
        </p>
        <div style={{ fontSize: 14, color: MUTED }}>— Early customer · D2C fashion brand, Mumbai</div>
        <div style={{ marginTop: 40, paddingTop: 40, borderTop: `1px solid ${GRAY}`, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/enterprise" style={{ fontSize: 14, fontWeight: 700, color: GREEN, textDecoration: 'none', borderBottom: `1.5px solid ${GREEN}`, paddingBottom: 2 }}>Read about enterprise hires →</Link>
          <Link href="/compare" style={{ fontSize: 14, color: MUTED, textDecoration: 'none', paddingBottom: 2, borderBottom: `1.5px solid ${GRAY}` }}>See cost comparison</Link>
        </div>
      </section>

      {/* ── FULL-WIDTH BLACK CTA ── */}
      <section style={{ background: INK, padding: 'clamp(64px,8vw,104px) 32px', textAlign: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20, display: 'block' }}>Ready to hire?</span>
        <h2 style={{ fontSize: 'clamp(34px,5vw,64px)', fontWeight: 800, letterSpacing: '-0.055em', margin: '0 0 18px', color: WHITE, lineHeight: 1.02, fontFamily: F }}>
          Interview your first<br />AI Employee — free.
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', marginBottom: 40, lineHeight: 1.65 }}>No account needed. Hire only when you are impressed.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/employees" className="cta-btn" style={{ display: 'inline-block', padding: '16px 44px', borderRadius: 100, background: WHITE, color: INK, fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', letterSpacing: '-0.02em' }}>
            Browse the team →
          </Link>
          <Link href="/quiz" style={{ display: 'inline-block', padding: '16px 28px', borderRadius: 100, background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.18)', color: WHITE, fontSize: 16, fontWeight: 600, textDecoration: 'none', letterSpacing: '-0.01em' }}>
            Which role do I need?
          </Link>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 24 }}>$199/mo to start · 100 roles available · Cancel anytime</p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: WHITE, borderTop: `1px solid ${GRAY}`, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>S</span>
          </div>
          <span style={{ fontSize: 13, color: MUTED }}>Setu · SignalPulse Technologies LLC · Wyoming, USA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {[['sumeet@setuagents.com', 'mailto:sumeet@setuagents.com'], ['MCP', '/mcp'], ['Agencies', '/agencies'], ['Enterprise', '/enterprise']].map(([label, href]) => (
            <a key={href} href={href} style={{ fontSize: 13, color: DIM, textDecoration: 'none' }}>{label}</a>
          ))}
          <span style={{ fontSize: 13, color: DIM }}>© 2026</span>
        </div>
      </footer>
    </div>
  )
}

function HeroEmployeeCard({ employee: e }: { employee: any }) {
  return (
    <Link href={`/employees/${e.slug}`} className="emp-card" style={{ display: 'flex', alignItems: 'center', gap: 16, background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 16, padding: '20px 22px', textDecoration: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${e.color}14`, border: `1.5px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
        {e.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: INK, letterSpacing: '-0.03em' }}>{e.name}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: GREEN, flexShrink: 0 }}>{e.pricing.label}</div>
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{e.title}</div>
        <div style={{ fontSize: 11, color: DIM, marginTop: 5 }}>{e.agentCount} agents · {e.dept}</div>
      </div>
    </Link>
  )
}

function EmployeeCard({ employee: e }: { employee: any }) {
  return (
    <Link href={`/employees/${e.slug}`} className="emp-card" style={{ display: 'flex', flexDirection: 'column', background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 18, padding: '24px', textDecoration: 'none', gap: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: e.color, opacity: 0.7 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, background: `${e.color}12`, border: `1.5px solid ${e.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
          {e.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{e.dept}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: INK, letterSpacing: '-0.03em', lineHeight: 1.2 }}>{e.name}</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{e.title}</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.65, margin: 0, flexGrow: 1 }}>{e.tagline}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${GRAY}` }}>
        <div style={{ display: 'flex', gap: 18 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{e.years}yr</div>
            <div style={{ fontSize: 10, color: DIM }}>experience</div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{e.agentCount}</div>
            <div style={{ fontSize: 10, color: DIM }}>agents</div>
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>{e.pricing.label}</span>
      </div>
    </Link>
  )
}
