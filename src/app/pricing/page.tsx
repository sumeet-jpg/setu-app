// @ts-nocheck
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { EMPLOYEES } from '@/lib/employees/profiles'

/* ─── Design tokens ─── */
const BG = '#070B18'
const SURFACE = '#0D1526'
const CARD = '#111E35'
const BORDER = 'rgba(148,163,184,0.1)'
const GLOW_BORDER = 'rgba(99,102,241,0.35)'
const TEXT = '#F1F5F9'
const MUTED = '#94A3B8'
const DIM = '#475569'
const ACCENT = '#6366F1'

type Tier = 'consumer' | 'business' | 'growth' | 'enterprise'

const TIERS: Array<{
  id: Tier
  label: string
  emoji: string
  tagline: string
  range: string
  color: string
  highlight?: boolean
  features: string[]
  cta: string
  ctaHref: string
  deptFilter?: string
}> = [
  {
    id: 'consumer',
    label: 'Starter',
    emoji: '💬',
    tagline: 'WhatsApp automation & simple bots',
    range: '$199 – $399 /mo',
    color: '#25D366',
    features: [
      'WhatsApp customer support bot',
      'Lead qualification agent',
      'Order tracking & status bot',
      'Appointment booking assistant',
      'Product catalog chatbot',
      'Interview free before hiring',
      'Setup in under 48 hours',
      'Monthly billing, cancel anytime',
    ],
    cta: 'Browse Starter Employees',
    ctaHref: '/employees',
    deptFilter: 'WhatsApp & Messaging',
  },
  {
    id: 'business',
    label: 'Business',
    emoji: '🚀',
    tagline: 'Core business functions covered',
    range: '$499 – $999 /mo',
    color: ACCENT,
    highlight: true,
    features: [
      'Marketing, Sales & RevOps employees',
      'Customer Support & Success agents',
      'HR, Operations & Finance roles',
      'E-commerce & Creator Economy',
      'India-specific compliance & payroll',
      'Real Estate & Healthcare agents',
      'Full onboarding & tool setup',
      'Priority support channel',
    ],
    cta: 'Browse Business Employees',
    ctaHref: '/employees',
  },
  {
    id: 'growth',
    label: 'Growth',
    emoji: '📈',
    tagline: 'Specialist & technical functions',
    range: '$1,099 – $1,999 /mo',
    color: '#EC4899',
    features: [
      'Technical employees (DevOps, QA, Cloud)',
      'Sales Enablement & Account Managers',
      'Growth, PLG & Community managers',
      'Fundraising Intelligence Agent',
      'Financial Planning & Analysis',
      'Talent Acquisition & L&D',
      'Contract & Proposal management',
      'Dedicated account manager',
    ],
    cta: 'Browse Growth Employees',
    ctaHref: '/employees',
  },
  {
    id: 'enterprise',
    label: 'C-Suite',
    emoji: '👔',
    tagline: 'Executive AI employees for scale',
    range: '$2,499 – $2,999 /mo',
    color: '#F59E0B',
    features: [
      'Chief of Staff (241 agents)',
      'Chief Marketing Officer (287 agents)',
      'Chief Technology Officer (312 agents)',
      'Chief Operating Officer (263 agents)',
      'Strategic planning & OKR management',
      'Board-ready reporting & dashboards',
      'Cross-function coordination',
      'White-glove onboarding & custom setup',
    ],
    cta: 'Meet the C-Suite',
    ctaHref: '/employees',
  },
]

const FAQS = [
  {
    q: 'What exactly happens when I hire an AI Employee?',
    a: "You fill out a short hire form telling us your use case. We review it, contact you within 24–48 hours, and begin onboarding. Most employees are operational within 3–5 business days.",
  },
  {
    q: 'Do I need any technical setup on my end?',
    a: "Minimal. Most employees need access to 1–3 tools you already use (Google Workspace, HubSpot, WhatsApp Business API, etc.). We guide you through the connection process.",
  },
  {
    q: 'Can I interview an employee before hiring?',
    a: "Yes — every employee has a free live interview where you can ask anything. See how they think, what tools they need, and how they'd approach your specific situation. No commitment required.",
  },
  {
    q: 'What is the difference between a Starter and C-Suite employee?',
    a: "Agent count and autonomy. A Starter WhatsApp bot manages 31–50 agents handling a specific workflow. A C-Suite COO commands 263 agents across your entire operations function. Scope, complexity, and integration depth scale accordingly.",
  },
  {
    q: 'Can I hire multiple AI Employees?',
    a: "Yes. Many companies start with one employee and add more as they see results. Pricing is per employee per month. We offer consolidated billing and a shared onboarding plan for multi-employee hires.",
  },
  {
    q: 'What happens if I want to cancel?',
    a: "Monthly billing, no long-term contracts. Cancel anytime before your next billing date. Your data and integrations are fully reversible.",
  },
]

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Quick price check: min and max across all 100 employees
  const allPrices = EMPLOYEES.map(e => e.pricing.monthly).sort((a, b) => a - b)
  const minPrice = allPrices[0]
  const maxPrice = allPrices[allPrices.length - 1]

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'var(--font-inter)' }}>
      <style>{`
        .pricing-card { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .pricing-card:hover { transform: translateY(-4px); }
        .pricing-cta { transition: all 0.2s ease; }
        .pricing-cta:hover { opacity: 0.85; }
        .faq-item { transition: background 0.15s ease; }
        .faq-item:hover { background: rgba(99,102,241,0.04) !important; }
        .check-icon::before { content: '✓'; font-weight: 800; }
      `}</style>

      {/* Nav */}
      <nav style={{
        borderBottom: `1px solid ${BORDER}`,
        padding: '0 24px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,11,24,0.9)',
        backdropFilter: 'blur(20px)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-space)' }}>S</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT, letterSpacing: '-0.03em', fontFamily: 'var(--font-space)' }}>Setu</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link href="/employees" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '8px 14px', borderRadius: 8 }}>Employees</Link>
          <Link href="/mcp" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '8px 14px', borderRadius: 8 }}>MCP</Link>
          <Link href="/signin" style={{ fontSize: 13, color: '#c7d2fe', textDecoration: 'none', padding: '8px 16px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', fontFamily: 'var(--font-space)', fontWeight: 600 }}>Sign in</Link>
        </div>
      </nav>

      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '800px', height: '500px', background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 60%)', pointerEvents: 'none' }} />

      {/* Hero */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center', position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20, padding: '5px 14px', borderRadius: 24, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', fontFamily: 'var(--font-space)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.8)', display: 'inline-block' }} />
          Transparent Pricing
        </div>
        <h1 style={{ fontSize: 'clamp(36px,6vw,64px)', fontWeight: 900, letterSpacing: '-0.06em', margin: '0 0 20px', color: '#fff', fontFamily: 'var(--font-space)', lineHeight: 1.0 }}>
          From WhatsApp bot<br />to Chief of Staff
        </h1>
        <p style={{ fontSize: 17, color: MUTED, margin: '0 0 16px', lineHeight: 1.7, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
          100 AI Employees. Starting at ${minPrice}/mo. Every employee is free to interview before you hire.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          {['No setup fee', 'Monthly billing', 'Cancel anytime', 'Free interview'].map(b => (
            <span key={b} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: MUTED }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Pricing tiers */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, alignItems: 'stretch' }}>
          {TIERS.map(tier => (
            <div
              key={tier.id}
              className="pricing-card"
              style={{
                background: tier.highlight ? `linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.05) 100%)` : CARD,
                border: `1px solid ${tier.highlight ? GLOW_BORDER : BORDER}`,
                borderRadius: 24,
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                position: 'relative',
                boxShadow: tier.highlight ? '0 0 40px rgba(99,102,241,0.12), inset 0 1px 0 rgba(99,102,241,0.2)' : 'none',
              }}
            >
              {tier.highlight && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', padding: '4px 14px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: 'var(--font-space)', boxShadow: '0 4px 16px rgba(99,102,241,0.5)' }}>
                  Most Popular
                </div>
              )}

              <div style={{ fontSize: 32, marginBottom: 12 }}>{tier.emoji}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: tier.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--font-space)' }}>{tier.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: 4, fontFamily: 'var(--font-space)' }}>{tier.range}</div>
              <div style={{ fontSize: 13, color: MUTED, marginBottom: 28, lineHeight: 1.5 }}>{tier.tagline}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, marginBottom: 28 }}>
                {tier.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: tier.color, fontSize: 13, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>

              <Link
                href={tier.ctaHref + (tier.id === 'consumer' ? '' : '')}
                className="pricing-cta"
                style={{
                  display: 'block', padding: '13px 0',
                  borderRadius: 12, textAlign: 'center',
                  background: tier.highlight
                    ? 'linear-gradient(135deg, #6366f1, #7c3aed)'
                    : 'rgba(255,255,255,0.05)',
                  border: tier.highlight ? 'none' : `1px solid ${BORDER}`,
                  color: '#fff',
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  fontFamily: 'var(--font-space)', letterSpacing: '-0.01em',
                  boxShadow: tier.highlight ? '0 8px 24px rgba(99,102,241,0.35)' : 'none',
                }}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Interview CTA */}
        <div style={{ marginTop: 60, textAlign: 'center', padding: '48px 24px', borderRadius: 24, border: '1px solid rgba(99,102,241,0.15)', background: 'rgba(99,102,241,0.04)' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🎙️</div>
          <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 10px', color: '#fff', fontFamily: 'var(--font-space)' }}>
            Interview before you hire
          </h2>
          <p style={{ fontSize: 14, color: MUTED, margin: '0 auto 28px', lineHeight: 1.7, maxWidth: 480 }}>
            Every one of our 100 AI Employees has a live interview you can do for free. Chat with them, ask about your specific situation, see how they think. No commitment.
          </p>
          <Link href="/employees" style={{
            padding: '13px 32px', borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
            color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
            fontFamily: 'var(--font-space)', boxShadow: '0 8px 28px rgba(99,102,241,0.35)',
          }}>
            Browse all 100 employees →
          </Link>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 80, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '0 0 40px', color: '#fff', fontFamily: 'var(--font-space)', textAlign: 'center' }}>
            Frequently asked
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="faq-item"
                style={{ borderRadius: 14, border: `1px solid ${openFaq === i ? 'rgba(99,102,241,0.25)' : BORDER}`, overflow: 'hidden', background: openFaq === i ? 'rgba(99,102,241,0.05)' : 'transparent' }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '18px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: TEXT, fontSize: 14, fontWeight: 600, textAlign: 'left',
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ color: MUTED, fontSize: 18, flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 18px', fontSize: 14, color: MUTED, lineHeight: 1.7 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: 80, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: DIM, marginBottom: 20 }}>Still have questions?</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/employees" style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-space)' }}>
              Browse employees →
            </Link>
            <a href="mailto:hello@setuagents.com" style={{ padding: '12px 24px', borderRadius: 10, background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-space)' }}>
              Email us
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
