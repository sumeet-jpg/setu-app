// @ts-nocheck
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { EMPLOYEES } from '@/lib/employees/profiles'
import { SetuLogo } from '@/components/SetuLogo'

/* ─── Design tokens ─── */
const BG    = '#F6F5F1'
const WHITE = '#FFFFFF'
const INK   = '#0D0C09'
const GREEN = '#0E5C34'
const GREEN_L = '#EAF5EE'
const GRAY  = '#E3E1DA'
const MUTED = '#78746E'
const DIM   = '#9E9891'

// Pricing escalation: $49 base, +$10/month from launch (2026-09-01)
const LAUNCH_DATE = new Date('2026-09-01')
const BASE_PRICE  = 49
const STEP        = 10

function currentPrice(): number {
  const now = new Date()
  const months = Math.max(0,
    (now.getFullYear() - LAUNCH_DATE.getFullYear()) * 12
    + (now.getMonth() - LAUNCH_DATE.getMonth())
  )
  return BASE_PRICE + months * STEP
}

function nextMonthPrice(): number { return currentPrice() + STEP }

// Days until 1st of next month (when price increases)
function daysUntilIncrease(): number {
  const now   = new Date()
  const next  = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return Math.ceil((next.getTime() - now.getTime()) / 86400000)
}

const WHAT_YOU_GET = [
  { icon: '🤖', title: 'Your AI Employee', body: 'One dedicated employee from our roster of 100 — any function, any department.' },
  { icon: '🧠', title: 'Memory that compounds', body: 'Every session is distilled into structured beliefs. By session 10, the difference is night and day.' },
  { icon: '📄', title: 'Company Intelligence Vault', body: 'Upload your SOPs, playbooks, and docs. Your employee references them — never guesses.' },
  { icon: '🔔', title: 'Proactive alerts', body: 'Your employee flags patterns, conflicts, and opportunities between sessions — not just during them.' },
  { icon: '⚙', title: 'Calibrated autonomy', body: 'Trust score adapts to your approval patterns. The more you trust, the less overhead over time.' },
  { icon: '🌐', title: 'Team intelligence', body: "One employee's insights propagate to all your others automatically through the org cortex." },
]

const FAQS = [
  {
    q: 'What happens after my 14-day trial?',
    a: `You're billed $${currentPrice()}/month — the price that's locked in at the time you sign up. That rate is yours forever as long as you stay subscribed, even as the published price increases.`,
  },
  {
    q: 'Why does the price increase every month?',
    a: "We ship meaningful new systems every month — memory architecture, action layers, trust calibration. The price reflects the value added. Signing up now locks in the lowest rate this platform will ever be.",
  },
  {
    q: 'Can I hire multiple AI Employees?',
    a: "Yes. Each employee is billed separately. You lock in the price for each at the time of their trial start, so adding employees later means they're at a higher rate.",
  },
  {
    q: 'Do I need technical setup?',
    a: 'Minimal. Most employees need access to 1–3 tools you already use. We handle the configuration during onboarding.',
  },
  {
    q: 'Can I interview an employee before committing?',
    a: 'Yes — every employee has a free live chat where you can ask anything. No account required, no commitment.',
  },
  {
    q: 'What if I cancel?',
    a: 'Monthly billing, no long-term contracts. Cancel before your next billing date and you owe nothing further. Your price lock ends on cancellation.',
  },
]

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const price = currentPrice()
  const nextPrice = nextMonthPrice()
  const days = daysUntilIncrease()

  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: 'var(--font-jakarta)' }}>
      <style>{`
        .feature-card { transition: transform 0.2s, box-shadow 0.2s; }
        .feature-card:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(14,92,52,0.08); }
        .faq-item { transition: background 0.15s; }
        .faq-item:hover { background: rgba(14,92,52,0.03) !important; }
        .cta-btn { transition: opacity 0.15s, transform 0.15s; }
        .cta-btn:hover { opacity: 0.88; transform: translateY(-1px); }
      `}</style>

      {/* Nav */}
      <nav style={{
        borderBottom: `1px solid ${GRAY}`, padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50, background: WHITE,
      }}>
        <SetuLogo size={30} color={GREEN} wordColor={INK} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link href="/employees" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '8px 14px', borderRadius: 8 }}>Employees</Link>
          <Link href="/quiz" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '8px 14px', borderRadius: 8 }}>Which role?</Link>
          <Link href="/signin" style={{ fontSize: 13, color: WHITE, textDecoration: 'none', padding: '8px 18px', borderRadius: 8, background: INK, fontWeight: 700 }}>Sign in</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px 0', textAlign: 'center' }}>
        {/* Urgency chip */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700,
          color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a',
          padding: '6px 16px', borderRadius: 24, marginBottom: 28, letterSpacing: '0.02em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', boxShadow: '0 0 6px rgba(245,158,11,0.6)' }} />
          Price rises to ${nextPrice}/mo in {days} day{days !== 1 ? 's' : ''}
        </div>

        <h1 style={{ fontSize: 'clamp(42px,7vw,72px)', fontWeight: 900, letterSpacing: '-0.07em', margin: '0 0 24px', color: INK, lineHeight: 0.95 }}>
          One price.<br />
          <span style={{ color: GREEN }}>${price}/month.</span>
        </h1>

        <p style={{ fontSize: 18, color: MUTED, margin: '0 0 12px', lineHeight: 1.7, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
          Any AI Employee. 14 days free. Your price is locked when you sign up — the published rate rises $10 every month we ship.
        </p>

        <div style={{ fontSize: 13, color: DIM, marginBottom: 40 }}>
          Today: ${price}/mo → Next month: ${nextPrice}/mo → Month after: ${nextPrice + STEP}/mo…
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          <Link href="/employees" className="cta-btn" style={{
            padding: '14px 32px', borderRadius: 13, background: GREEN,
            color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none',
            boxShadow: '0 6px 24px rgba(14,92,52,0.30)', letterSpacing: '-0.02em',
          }}>
            Start free trial — ${price}/mo after →
          </Link>
          <Link href="/employees" style={{
            padding: '14px 24px', borderRadius: 13, background: WHITE,
            border: `1.5px solid ${GRAY}`, color: MUTED, fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}>
            Interview free first
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['14 days free', 'No credit card', 'Price locked at signup', 'Cancel anytime'].map(b => (
            <span key={b} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: WHITE, border: `1px solid ${GRAY}`, color: MUTED }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Price lock visual */}
      <div style={{ maxWidth: 640, margin: '64px auto 0', padding: '0 24px' }}>
        <div style={{ background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 24, padding: '32px 36px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Price escalation schedule</div>
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, position: 'relative' }}>
            {[
              { label: 'Today', price: price, current: true },
              { label: 'Next month', price: nextPrice, current: false },
              { label: `+2 months`, price: nextPrice + STEP, current: false },
              { label: `+3 months`, price: nextPrice + STEP * 2, current: false },
            ].map((item, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%', margin: '0 auto 8px',
                  background: item.current ? GREEN : GRAY,
                  border: item.current ? `3px solid ${GREEN_L}` : 'none',
                  position: 'relative', zIndex: 1,
                }} />
                {i < 3 && (
                  <div style={{ position: 'absolute', top: 5, left: '50%', width: '100%', height: 2, background: GRAY, zIndex: 0 }} />
                )}
                <div style={{ fontSize: item.current ? 20 : 15, fontWeight: item.current ? 900 : 600, color: item.current ? INK : MUTED, letterSpacing: '-0.04em' }}>
                  ${item.price}
                </div>
                <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{item.label}</div>
                {item.current && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: GREEN, background: GREEN_L, padding: '2px 8px', borderRadius: 10, display: 'inline-block', marginTop: 4 }}>your rate</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.7, borderTop: `1px solid ${GRAY}`, paddingTop: 16 }}>
            Sign up today and pay ${price}/month permanently — regardless of where the published price goes. The price lock ends only if you cancel.
          </div>
        </div>
      </div>

      {/* What you get */}
      <div style={{ maxWidth: 1100, margin: '80px auto 0', padding: '0 24px' }}>
        <h2 style={{ fontSize: 'clamp(22px,3.5vw,34px)', fontWeight: 800, letterSpacing: '-0.05em', textAlign: 'center', margin: '0 0 48px', color: INK }}>
          Everything included in ${ price}/month
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {WHAT_YOU_GET.map(item => (
            <div key={item.title} className="feature-card" style={{
              background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 18, padding: '24px 22px',
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: INK, marginBottom: 8, letterSpacing: '-0.02em' }}>{item.title}</div>
              <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.65 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 100 employees preview */}
      <div style={{ maxWidth: 1100, margin: '80px auto 0', padding: '0 24px' }}>
        <div style={{ background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 24, padding: '40px 36px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 10px', color: INK }}>
                100 AI Employees. One price.
              </h2>
              <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.7 }}>
                From WhatsApp support bot to Chief of Staff — any employee, same subscription.
              </p>
            </div>
            <Link href="/employees" className="cta-btn" style={{
              padding: '11px 22px', borderRadius: 11, background: INK,
              color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              Browse all 100 →
            </Link>
          </div>
          {/* Sample employees */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {EMPLOYEES.slice(0, 12).map(e => (
              <Link key={e.slug} href={`/employees/${e.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, border: `1px solid ${GRAY}`, background: BG, cursor: 'pointer', transition: 'border-color 0.2s' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${e.color}15`, border: `1.5px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{e.emoji}</div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{e.title}</div>
                  </div>
                </div>
              </Link>
            ))}
            <Link href="/employees" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 12px', borderRadius: 11, border: `1.5px dashed ${GRAY}`, background: 'transparent', cursor: 'pointer', height: '100%', minHeight: 52 }}>
                <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>+{EMPLOYEES.length - 12} more →</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Interview CTA */}
      <div style={{ maxWidth: 700, margin: '64px auto 0', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ padding: '48px 32px', borderRadius: 24, border: `1.5px solid ${GRAY}`, background: WHITE }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🎙️</div>
          <h2 style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 10px', color: INK }}>
            Interview before you commit
          </h2>
          <p style={{ fontSize: 14, color: MUTED, margin: '0 auto 28px', lineHeight: 1.7, maxWidth: 440 }}>
            Every employee has a free live chat. Ask about your specific use case, see how they think. No account, no card.
          </p>
          <Link href="/employees" className="cta-btn" style={{
            padding: '13px 32px', borderRadius: 12, background: INK,
            color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
          }}>
            Interview any employee free →
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 700, margin: '80px auto 0', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '0 0 40px', color: INK, textAlign: 'center' }}>
          Frequently asked
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {FAQS.map((faq, i) => (
            <div key={i} className="faq-item" style={{ borderRadius: 14, border: `1px solid ${openFaq === i ? 'rgba(14,92,52,0.3)' : GRAY}`, overflow: 'hidden', background: openFaq === i ? GREEN_L : 'transparent' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'transparent', border: 'none', cursor: 'pointer', color: INK, fontSize: 14, fontWeight: 600, textAlign: 'left', fontFamily: 'inherit' }}
              >
                <span>{faq.q}</span>
                <span style={{ color: MUTED, fontSize: 18, flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 20px 18px', fontSize: 14, color: MUTED, lineHeight: 1.7 }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 56, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: DIM, marginBottom: 20 }}>Still have questions?</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/employees" className="cta-btn" style={{ padding: '12px 24px', borderRadius: 10, background: INK, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
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
