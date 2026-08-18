import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Agency & Reseller Program — Setu AI Employees',
  description: 'Resell AI Employees to your clients. 30% revenue share, white-label option, dedicated onboarding. Built for digital marketing agencies, consultants, and system integrators.',
  openGraph: {
    title: 'Resell AI Employees — Setu Agency Program',
    description: '30% revenue share. White-label available. Dedicated partner manager.',
    url: 'https://setuagents.com/agencies',
    siteName: 'Setu',
    type: 'website',
  },
}

const BENEFITS = [
  {
    icon: '💸',
    title: '30% revenue share',
    desc: 'Earn 30% of every subscription your client pays — for as long as they stay. No cap, no tiers, no friction. Just recurring income on top of your existing service fees.',
  },
  {
    icon: '🏷️',
    title: 'White-label option',
    desc: 'Launch under your own brand. Your domain, your logo, your pricing. Clients see your agency, not Setu. Fully supported at no extra cost.',
  },
  {
    icon: '🤝',
    title: 'Dedicated partner manager',
    desc: 'A real person — not a ticketing system. Your partner manager handles onboarding, escalations, and custom deals. We win when your clients win.',
  },
  {
    icon: '📋',
    title: 'Pre-built client decks',
    desc: 'Sales decks, ROI calculators, onboarding guides, and case studies — ready to drop your logo on. No reinventing the wheel for every prospect.',
  },
  {
    icon: '⚡',
    title: '48-hour activation',
    desc: 'Your client signs up. We configure and activate their AI Employee within 48 hours. You look like a hero. They get results fast.',
  },
  {
    icon: '📊',
    title: 'Agency dashboard',
    desc: 'One view across all client accounts. Track usage, renewals, and revenue. Spot upsell opportunities before clients ask. Stay in control.',
  },
]

const USE_CASES = [
  {
    type: 'Marketing Agency',
    headline: 'Sell AI CMOs to your clients',
    desc: 'Your retainer clients need marketing leadership they can\'t afford. You sell them Setu\'s AI CMO — they get strategy, reporting, and execution. You earn 30% recurring. Win-win-win.',
    employees: ['AI CMO — $2,999/mo', 'Marketing Manager — $1,999/mo', 'Demand Gen Manager — $999/mo'],
    color: '#6366F1',
  },
  {
    type: 'Business Consultant',
    headline: 'Bundle AI operations into your engagements',
    desc: 'When a client\'s ops are on fire, don\'t just recommend fixes — activate an AI COO or Operations Manager and make the fix immediate. Add a recurring revenue stream to every engagement.',
    employees: ['AI COO — $2,499/mo', 'Operations Manager — $999/mo', 'Finance Controller — $1,099/mo'],
    color: '#0EA5E9',
  },
  {
    type: 'WhatsApp / CRM Agency',
    headline: 'Add AI Employees to every WhatsApp setup',
    desc: 'You\'re already configuring WhatsApp Business for clients. Activating a Lead Qualifier or Commerce Agent on top is a 30-minute upsell that generates recurring income on every account.',
    employees: ['WhatsApp Lead Qualifier — $199/mo', 'WhatsApp Support Agent — $249/mo', 'WhatsApp Commerce — $299/mo'],
    color: '#25D366',
  },
]

const TIERS = [
  {
    name: 'Starter Partner',
    threshold: '1–5 clients',
    rev: '30%',
    perks: ['Sales decks + ROI calculator', 'Partner manager access', 'Standard onboarding SLA'],
    color: '#6366F1',
  },
  {
    name: 'Growth Partner',
    threshold: '6–20 clients',
    rev: '35%',
    perks: ['All Starter perks', 'White-label option', '24-hour activation SLA', 'Co-marketing opportunities'],
    color: '#8B5CF6',
  },
  {
    name: 'Strategic Partner',
    threshold: '20+ clients',
    rev: '40%',
    perks: ['All Growth perks', 'Custom enterprise pricing', 'Dedicated account team', 'Joint case studies + PR'],
    color: '#A855F7',
  },
]

const BG = '#07091C'
const SURFACE = '#0D1428'
const CARD = '#101A30'
const BORDER = 'rgba(148,163,184,0.08)'
const MUTED = '#94A3B8'
const DIM = '#475569'

export default function AgenciesPage() {
  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#F1F5F9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', lineHeight: 1.6 }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(7,9,28,0.94)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${BORDER}`, padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#F1F5F9' }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff' }}>S</div>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.04em' }}>Setu</span>
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/pricing" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '6px 12px' }}>Pricing</Link>
          <Link href="/employees" style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc', padding: '7px 16px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', textDecoration: 'none' }}>All employees →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: 'clamp(60px,9vw,110px) 24px clamp(48px,7vw,80px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 24, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 28 }}>
          Agency & Reseller Program
        </div>

        <h1 style={{ fontSize: 'clamp(34px,6vw,66px)', fontWeight: 900, letterSpacing: '-0.06em', color: '#fff', margin: '0 0 20px', lineHeight: 1.02 }}>
          Sell AI Employees.<br />
          <span style={{ color: '#818cf8' }}>Earn 30–40% forever.</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px,2vw,19px)', color: MUTED, maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.65 }}>
          Add AI Employees to your service offering. White-label under your brand. Earn 30% revenue share on every client subscription — recurring, not one-time. Join as a Setu Agency Partner.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="mailto:hello@setuagents.com?subject=Agency Partner Application" style={{ padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', letterSpacing: '-0.02em' }}>
            Apply to partner →
          </a>
          <Link href="/employees" style={{ padding: '14px 24px', borderRadius: 14, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            Browse AI Employees
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 48, justifyContent: 'center', flexWrap: 'wrap', marginTop: 56, paddingTop: 48, borderTop: `1px solid ${BORDER}` }}>
          {[
            { num: '30–40%', label: 'Revenue share' },
            { num: '100', label: 'AI Employees to sell' },
            { num: '48h', label: 'Client activation' },
            { num: '₀', label: 'Setup cost for partners' },
          ].map(s => (
            <div key={s.num} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, letterSpacing: '-0.06em', color: '#a5b4fc', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section style={{ maxWidth: 1060, margin: '0 auto', padding: '0 24px 72px' }}>
        <h2 style={{ fontSize: 'clamp(22px,3vw,34px)', fontWeight: 900, letterSpacing: '-0.05em', color: '#fff', margin: '0 0 32px', textAlign: 'center' }}>Built for your type of agency</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {USE_CASES.map(u => (
            <div key={u.type} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 22, padding: 32, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: u.color, marginBottom: 10 }}>{u.type}</div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>{u.headline}</div>
                <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.7 }}>{u.desc}</p>
              </div>
              <div style={{ flex: '0 1 220px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: DIM, marginBottom: 4 }}>Best employees to sell</div>
                {u.employees.map(e => (
                  <div key={e} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#CBD5E1', fontWeight: 600 }}>{e}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PARTNER BENEFITS */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: 'clamp(48px,6vw,80px) 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 900, letterSpacing: '-0.05em', color: '#fff', margin: '0 0 40px', textAlign: 'center' }}>What you get as a partner</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {BENEFITS.map(b => (
              <div key={b.title} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 26 }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{b.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: 8 }}>{b.title}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIERS */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(56px,7vw,88px) 24px' }}>
        <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 900, letterSpacing: '-0.05em', color: '#fff', margin: '0 0 10px', textAlign: 'center' }}>Partner tiers</h2>
        <p style={{ fontSize: 15, color: MUTED, textAlign: 'center', marginBottom: 40, lineHeight: 1.65 }}>Revenue share increases as your book grows. No applications for tier upgrades — it happens automatically.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {TIERS.map(t => (
            <div key={t.name} style={{ background: SURFACE, border: `1px solid ${t.color}20`, borderRadius: 22, padding: 28, boxShadow: `0 0 32px ${t.color}06` }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.color, marginBottom: 14 }}>{t.threshold}</div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', marginBottom: 6 }}>{t.name}</div>
              <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.06em', color: t.color, marginBottom: 20 }}>{t.rev}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {t.perks.map(p => (
                  <div key={p} style={{ fontSize: 13, color: MUTED, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: t.color, flexShrink: 0 }}>✓</span>{p}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: 'clamp(48px,6vw,80px) 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(26px,4vw,48px)', fontWeight: 900, letterSpacing: '-0.06em', color: '#fff', margin: '0 0 12px', lineHeight: 1.08 }}>
          Start earning 30%<br />
          <span style={{ color: '#818cf8' }}>on your first client today.</span>
        </h2>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.65 }}>
          Send an email to apply. We respond within 24 hours and can have you onboarded in under a week.
        </p>
        <a href="mailto:hello@setuagents.com?subject=Agency Partner Application" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', letterSpacing: '-0.02em' }}>
          Apply to partner — hello@setuagents.com →
        </a>
        <div style={{ marginTop: 14, fontSize: 12, color: DIM }}>No setup fees · 30% from day one · Cancel anytime</div>
      </section>

      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '20px 24px', textAlign: 'center', fontSize: 12, color: DIM }}>
        <Link href="/" style={{ color: DIM, textDecoration: 'none' }}>Setu</Link>
        {' · '}
        <Link href="/employees" style={{ color: DIM, textDecoration: 'none' }}>All 100 Employees</Link>
        {' · '}
        <Link href="/pricing" style={{ color: DIM, textDecoration: 'none' }}>Pricing</Link>
        {' · '}
        <Link href="/enterprise" style={{ color: DIM, textDecoration: 'none' }}>Enterprise</Link>
      </footer>
    </div>
  )
}
