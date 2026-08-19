// @ts-nocheck
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { EMPLOYEES } from '@/lib/employees/profiles'
import { SetuLogo } from '@/components/SetuLogo'

/* ─── Design tokens ─── */
const BG = '#F6F5F1'
const WHITE = '#FFFFFF'
const INK = '#0D0C09'
const GREEN = '#0E5C34'
const GREEN_L = '#EAF5EE'
const GRAY = '#E3E1DA'
const MUTED = '#78746E'
const DIM = '#9E9891'

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
}> = [
  {
    id: 'consumer',
    label: 'Starter',
    emoji: '💬',
    tagline: 'WhatsApp automation & simple bots',
    range: '$29 – $89 /mo',
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
  },
  {
    id: 'business',
    label: 'Business',
    emoji: '🚀',
    tagline: 'Core business functions covered',
    range: '$79 – $149 /mo',
    color: '#1A5C8A',
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
    range: '$159 – $249 /mo',
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
    range: '$299 – $349 /mo',
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

  const allPrices = EMPLOYEES.map(e => e.pricing.monthly).sort((a, b) => a - b)
  const minPrice = allPrices[0]

  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: 'var(--font-jakarta)' }}>
      <style>{`
        .pricing-card { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .pricing-card:hover { transform: translateY(-4px); box-shadow: 0 8px 40px rgba(14,92,52,0.10), 0 2px 8px rgba(0,0,0,0.04); border-color: rgba(14,92,52,0.30) !important; }
        .pricing-cta { transition: all 0.2s ease; }
        .pricing-cta:hover { opacity: 0.85; }
        .faq-item { transition: background 0.15s ease; }
        .faq-item:hover { background: rgba(14,92,52,0.03) !important; }
      `}</style>

      {/* Nav */}
      <nav style={{
        borderBottom: `1px solid ${GRAY}`,
        padding: '0 24px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        background: WHITE,
      }}>
        <SetuLogo size={30} color={GREEN} wordColor={INK} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link href="/employees" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '8px 14px', borderRadius: 8 }}>Employees</Link>
          <Link href="/quiz" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '8px 14px', borderRadius: 8 }}>Which role?</Link>
          <Link href="/signin" style={{ fontSize: 13, color: WHITE, textDecoration: 'none', padding: '8px 18px', borderRadius: 8, background: INK, fontWeight: 700 }}>Sign in</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20, padding: '5px 14px', borderRadius: 24, background: GREEN_L, border: `1px solid rgba(14,92,52,0.25)` }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: '0 0 8px rgba(14,92,52,0.55)', display: 'inline-block' }} />
          Transparent Pricing
        </div>
        <h1 style={{ fontSize: 'clamp(36px,6vw,60px)', fontWeight: 900, letterSpacing: '-0.06em', margin: '0 0 20px', color: INK, lineHeight: 1.0 }}>
          From WhatsApp bot<br />to Chief of Staff
        </h1>
        <p style={{ fontSize: 17, color: MUTED, margin: '0 0 16px', lineHeight: 1.7, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
          100 AI Employees. Starting at ${minPrice}/mo. Every employee is free to interview before you hire.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          {['No setup fee', 'Monthly billing', 'Cancel anytime', 'Free interview'].map(b => (
            <span key={b} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: WHITE, border: `1px solid ${GRAY}`, color: MUTED }}>{b}</span>
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
                background: WHITE,
                border: `1.5px solid ${tier.highlight ? GREEN : GRAY}`,
                borderRadius: 24,
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: tier.highlight ? '0 4px 24px rgba(14,92,52,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              {tier.highlight && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: 800, color: '#fff', background: GREEN, padding: '4px 14px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(14,92,52,0.35)' }}>
                  Most Popular
                </div>
              )}

              <div style={{ fontSize: 32, marginBottom: 12 }}>{tier.emoji}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: tier.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{tier.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: INK, letterSpacing: '-0.04em', marginBottom: 4 }}>{tier.range}</div>
              <div style={{ fontSize: 13, color: MUTED, marginBottom: 28, lineHeight: 1.5 }}>{tier.tagline}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, marginBottom: 28 }}>
                {tier.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: tier.highlight ? GREEN : MUTED, fontSize: 13, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>

              <Link
                href={tier.ctaHref}
                className="pricing-cta"
                style={{
                  display: 'block', padding: '13px 0',
                  borderRadius: 12, textAlign: 'center',
                  background: tier.highlight ? GREEN : BG,
                  border: tier.highlight ? 'none' : `1.5px solid ${GRAY}`,
                  color: tier.highlight ? '#fff' : INK,
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  letterSpacing: '-0.01em',
                  boxShadow: tier.highlight ? '0 6px 20px rgba(14,92,52,0.28)' : 'none',
                }}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Interview CTA */}
        <div style={{ marginTop: 60, textAlign: 'center', padding: '48px 24px', borderRadius: 24, border: `1.5px solid ${GRAY}`, background: WHITE }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🎙️</div>
          <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 10px', color: INK }}>
            Interview before you hire
          </h2>
          <p style={{ fontSize: 14, color: MUTED, margin: '0 auto 28px', lineHeight: 1.7, maxWidth: 480 }}>
            Every one of our 100 AI Employees has a live interview you can do for free. Chat with them, ask about your specific situation, see how they think. No commitment.
          </p>
          <Link href="/employees" style={{
            padding: '13px 32px', borderRadius: 12,
            background: INK,
            color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}>
            Browse all 100 employees →
          </Link>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 80, maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '0 0 40px', color: INK, textAlign: 'center' }}>
            Frequently asked
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="faq-item"
                style={{ borderRadius: 14, border: `1px solid ${openFaq === i ? 'rgba(14,92,52,0.3)' : GRAY}`, overflow: 'hidden', background: openFaq === i ? GREEN_L : 'transparent' }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '18px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: INK, fontSize: 14, fontWeight: 600, textAlign: 'left',
                    fontFamily: 'inherit',
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
            <Link href="/employees" style={{ padding: '12px 24px', borderRadius: 10, background: INK, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Browse employees →
            </Link>
            <a href="mailto:hello@setuagents.com" style={{ padding: '12px 24px', borderRadius: 10, background: WHITE, border: `1.5px solid ${GRAY}`, color: MUTED, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Email us
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
