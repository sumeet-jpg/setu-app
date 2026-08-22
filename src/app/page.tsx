// @ts-nocheck
import Link from 'next/link'
import type { Metadata } from 'next'
import { EMPLOYEES, EMPLOYEE_COUNT, DEPT_ORDER } from '@/lib/employees/profiles'
import EmployeeMatchBox from '@/components/EmployeeMatchBox'
import VideoHero from '@/components/VideoHero'
import DeptPicker from '@/components/DeptPicker'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'

const BASE = 'https://setuagents.com'

export const metadata: Metadata = {
  title: 'Setu — Hire Your Business Stuntman',
  description: 'The star gets the credit. Your Stuntman does the work. 100 Stuntmen & Stuntwomen — CMO, CFO, COO and 97 more. Interview free. Go live in days.',
  openGraph: {
    title: 'Hire Your Business Stuntman — Setu',
    description: '100 Stuntmen & Stuntwomen commanding 10,000+ agents. Interview any of them for free.',
    url: BASE,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hire Your Business Stuntman — Setu',
    description: '100 Stuntmen & Stuntwomen. CMO to CFO to COO. Interview free, hire in minutes.',
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

const HOW_STEPS = [
  { n: '01', title: 'Browse 100 roles', body: 'From a RevOps Lead to an AI CMO — browse every function your business needs. Each employee is deeply specialized.' },
  { n: '02', title: 'Interview for free', body: 'Chat live with any employee. Ask real questions. See exactly how they think before you commit a rupee.' },
  { n: '03', title: 'Hire with one form', body: 'Fill out the hire form. We configure the employee, connect your tools, and have them working inside 48 hours.' },
  { n: '04', title: 'Or build your own', body: 'Describe any unique workflow in the Blueprint Builder and Setu scopes a custom AI Employee for it — no code, no engineers.' },
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
  const departments = DEPT_ORDER
    .filter(d => EMPLOYEES.some(e => e.dept === d))
    .map(d => ({
      name: d,
      employees: EMPLOYEES
        .filter(e => e.dept === d)
        .map(e => ({ slug: e.slug, name: e.name, title: e.title, emoji: e.emoji, color: e.color, dept: e.dept, pricing: e.pricing })),
    }))

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
        @media (max-width: 768px) {
          .setu-hp-hero { grid-template-columns: 1fr !important; gap: 32px !important; padding: 48px 20px 40px !important; }
          .setu-hp-hero-video { display: none; }
          .setu-hp-stats { flex-wrap: wrap !important; gap: 20px !important; }
          .setu-hp-pad { padding-left: 20px !important; padding-right: 20px !important; }
          .setu-hp-section-pad { padding: 60px 20px !important; }
        }
      `}</style>

      <Nav theme="light" />

      {/* ── HERO ── */}
      <section className="setu-hp-hero" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px 72px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.09em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 6, background: GREEN_L, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN_M, display: 'inline-block' }} />
            100 AI Employees · Interview free
          </div>

          <h1 style={{ fontSize: 'clamp(44px,5vw,72px)', fontWeight: 800, letterSpacing: '-0.055em', margin: '0 0 24px', color: INK, lineHeight: 1.0, fontFamily: F }}>
            The star gets<br />the credit. Your<br /><span style={{ color: GREEN }}>Stuntman works.</span>
          </h1>

          <p style={{ fontSize: 18, color: MUTED, lineHeight: 1.72, maxWidth: 460, margin: '0 0 40px', fontWeight: 400 }}>
            100 AI Employees — CMO, CFO, COO and 97 more. They do the heavy work. You stay in control. Interview any of them free.
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
          <div className="setu-hp-stats" style={{ display: 'flex', gap: 36, marginTop: 52, paddingTop: 36, borderTop: `1px solid ${GRAY}` }}>
            {[
              { value: '100', label: 'AI Employees' },
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

        {/* Hero right: video */}
        <div className="setu-hp-hero-video">
          <VideoHero />
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: MUTED }}>30-second overview · unmute for narration</span>
            <Link href="/employees" style={{ fontSize: 12, fontWeight: 700, color: GREEN, textDecoration: 'none', marginLeft: 'auto' }}>Browse the team →</Link>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ borderTop: `1px solid ${GRAY}`, borderBottom: `1px solid ${GRAY}`, padding: '12px 0', overflow: 'hidden', background: WHITE }}>
        <div style={{ display: 'flex', gap: 8, animation: 'marquee 60s linear infinite', width: 'max-content' }}>
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

      {/* ── PROBLEM MATCHER ── */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 32px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Find your match</span>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '10px 0 8px', color: INK, lineHeight: 1.1 }}>
            Describe your problem — we'll match the right AI Employee
          </h2>
          <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>Type in plain English. No forms, no dropdowns.</p>
        </div>
        <EmployeeMatchBox count={EMPLOYEE_COUNT} />
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

        {/* ── DEPT PICKER ── */}
        <section style={{ marginBottom: 104 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Browse by Department</span>
              <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '10px 0 0', color: INK, lineHeight: 1.1 }}>
                Pick a department, meet the team
              </h2>
            </div>
            <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>Interview any of them free — no account needed.</p>
          </div>
          <DeptPicker departments={departments} />
        </section>

        {/* ── BLUEPRINT BUILDER CTA ── */}
        <section style={{ marginBottom: 104, background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 24, padding: '52px 48px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Blueprint Builder</span>
            <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '10px 0 14px', color: INK }}>
              Don't see the role you need?
            </h2>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, margin: 0, maxWidth: 440 }}>
              Describe the workflow in plain English and Setu scopes a custom AI Employee for it — the agents, the tools it needs, the guardrails — no code required.
            </p>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <Link href="/blueprints/new" className="ghost-btn" style={{ display: 'inline-block', padding: '13px 30px', borderRadius: 11, background: GREEN_L, border: `1.5px solid ${GREEN}`, color: GREEN, fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Build a blueprint →
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
                One price. $49/month. Lock it in now.
              </h2>
            </div>
            <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>Price rises $10 every month we ship. Early signups keep their rate forever.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {[
              { tier: '14-day trial', price: 'Free', desc: 'Start immediately. No credit card. Interview first, hire when ready — all employees included.', accent: GREEN_M },
              { tier: 'Today', price: '$49/month', desc: 'Sign up now and this is your rate forever — any employee, all memory systems, full calibration.', accent: '#1A5C8A' },
              { tier: 'October onward', price: '$59/month', desc: 'New signups from October pay $10 more. Sign up before then and your rate is locked forever.', accent: '#8B5A1A' },
              { tier: 'Multiple employees', price: 'Per employee', desc: 'Each employee is a separate subscription. Each locks in the rate at their individual trial start.', accent: MUTED },
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
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED }}>Approval gates</span>
              <div style={{ background: WHITE, border: `1px solid ${GRAY}`, borderRadius: 14, padding: '18px', margin: '24px 0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Marcus wants to act</div>
                <div style={{ background: BG, border: `1px solid ${GRAY}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 4 }}>Send campaign to 8,400 contacts</div>
                  <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.6 }}>Subject: "Your Q4 pricing window closes Friday"<br />Segment: Enterprise trials · not converted · last active &lt;30d</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, background: GREEN, borderRadius: 8, padding: '9px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: WHITE }}>Approve</div>
                  <div style={{ flex: 1, background: BG, border: `1px solid ${GRAY}`, borderRadius: 8, padding: '9px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: MUTED }}>Reject</div>
                </div>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: INK, margin: '0 0 8px' }}>Nothing runs without your sign-off</h3>
              <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.65 }}>Every consequential action pauses for your approval. See the plan, review the details, then approve or redirect.</p>
            </div>

            {/* Feature 4 */}
            <div style={{ background: BG, border: `1px solid ${GRAY}`, borderRadius: 20, padding: '32px' }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED }}>Cost comparison</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '24px 0 20px' }}>
                {[
                  { role: 'Marketing Manager', human: '₹15L/yr', ai: '₹20.7K/mo', savings: '83% less' },
                  { role: 'CFO', human: '₹40L/yr', ai: '₹29K/mo', savings: '91% less' },
                  { role: 'SDR Manager', human: '₹10L/yr', ai: '₹16.5K/mo', savings: '80% less' },
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
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 24 }}>100 roles available · BYOK — use your own API keys · Cancel anytime</p>
      </section>

      <Footer theme="light" />
    </div>
  )
}


