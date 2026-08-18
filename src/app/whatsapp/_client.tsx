// @ts-nocheck
'use client'
import Link from 'next/link'
import { useState } from 'react'

const WA_EMPLOYEES = [
  {
    slug: 'whatsapp-lead-qualifier',
    name: 'Nisha',
    title: 'WhatsApp Lead Qualifier',
    emoji: '🎯',
    color: '#075E54',
    agents: 31,
    price: '$199/mo',
    tagline: 'Qualifies every inbound WhatsApp lead so your sales team only talks to buyers',
    handles: ['Lead qualification', 'BANT scoring', 'Appointment booking', 'Follow-up sequences', 'CRM integration'],
  },
  {
    slug: 'whatsapp-support-agent',
    name: 'Aarav',
    title: 'WhatsApp Support Manager',
    emoji: '🤝',
    color: '#128C7E',
    agents: 63,
    price: '$249/mo',
    tagline: 'Resolves 80% of support tickets inside WhatsApp — before a human sees them',
    handles: ['Instant query resolution', 'Order and delivery queries', 'Return and refund handling', 'Smart escalation', 'CSAT measurement'],
  },
  {
    slug: 'whatsapp-commerce-agent',
    name: 'Zara',
    title: 'WhatsApp Commerce Agent',
    emoji: '💬',
    color: '#25D366',
    agents: 44,
    price: '$299/mo',
    tagline: 'Turns WhatsApp into a full sales channel — catalogue, orders, follow-ups',
    handles: ['Product catalogue sends', 'Order confirmation flows', 'Cart abandonment recovery', 'Payment link automation', 'Broadcast campaigns'],
  },
]

const LOGOS = ['Swiggy', 'Meesho', 'Razorpay', 'Zepto', 'Cars24', 'Urban Company']

const FAQS = [
  {
    q: 'Do I need WhatsApp Business API for this?',
    a: 'Yes — Setu connects to your WhatsApp Business API account. We help you set it up during onboarding. The process takes about 30 minutes.',
  },
  {
    q: 'Will it sound like a robot?',
    a: 'No. Each Setu employee has a full personality, your brand voice, and responds the way a trained human sales rep would. Customers rarely know it\'s AI.',
  },
  {
    q: 'What happens when it can\'t answer something?',
    a: 'The employee automatically escalates to you or a team member on WhatsApp with full context — so you can step in and take over seamlessly.',
  },
  {
    q: 'Can it handle Hindi, Tamil, or regional languages?',
    a: 'Yes — Setu WhatsApp employees are multilingual. They respond in the customer\'s language automatically.',
  },
  {
    q: 'How long does setup take?',
    a: 'Most customers are live within 5 business days. Includes WhatsApp Business API setup, brand voice training, and workflow configuration.',
  },
  {
    q: 'Is there a contract?',
    a: 'No. Monthly billing, cancel anytime. Most customers stay because results show up in the first week.',
  },
]

export default function WhatsAppClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const C = {
    bg: '#060A18',
    surface: '#0D1428',
    card: '#0F1B30',
    border: 'rgba(37,211,102,0.1)',
    borderMid: 'rgba(148,163,184,0.08)',
    text: '#F1F5F9',
    muted: '#94A3B8',
    dim: '#475569',
    green: '#25D366',
    greenLight: '#4ade80',
    greenDim: 'rgba(37,211,102,0.1)',
    greenBorder: 'rgba(37,211,102,0.2)',
  }

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', lineHeight: 1.6 }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(6,10,24,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.borderMid}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: C.text }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff' }}>S</div>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.04em' }}>Setu</span>
        </Link>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/employees" style={{ fontSize: 13, color: C.muted, textDecoration: 'none', padding: '6px 12px' }}>All employees</Link>
          <Link href="/employees/whatsapp-lead-qualifier/interview" style={{ fontSize: 13, fontWeight: 700, color: C.green, padding: '7px 16px', borderRadius: 20, background: C.greenDim, border: `1px solid ${C.greenBorder}`, textDecoration: 'none' }}>
            Interview free →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: 'clamp(64px,10vw,120px) 24px clamp(48px,7vw,80px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Green radial glow */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '60vw', maxWidth: 800, background: 'radial-gradient(ellipse at 50% 0%, rgba(37,211,102,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: C.greenLight, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 24, background: C.greenDim, border: `1px solid ${C.greenBorder}`, marginBottom: 28 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
          WhatsApp AI Employees — starts at $199/mo
        </div>

        <h1 style={{ fontSize: 'clamp(36px,7vw,72px)', fontWeight: 900, letterSpacing: '-0.06em', color: '#fff', margin: '0 0 20px', lineHeight: 1.02 }}>
          Your WhatsApp inbox,<br />
          <span style={{ color: C.green }}>handled by AI.</span>
        </h1>

        <p style={{ fontSize: 'clamp(16px,2.5vw,20px)', color: C.muted, maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.65 }}>
          Reply to every lead instantly. Book appointments. Handle orders.
          Follow up automatically. 24/7 — even when you&apos;re asleep.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/employees/whatsapp-lead-qualifier/interview" style={{ padding: '14px 28px', borderRadius: 14, background: C.green, color: '#000', fontSize: 15, fontWeight: 800, textDecoration: 'none', letterSpacing: '-0.02em', boxShadow: `0 8px 32px rgba(37,211,102,0.35)` }}>
            Interview free — no credit card
          </Link>
          <Link href="#employees" style={{ padding: '14px 28px', borderRadius: 14, background: C.greenDim, border: `1px solid ${C.greenBorder}`, color: C.green, fontSize: 15, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.02em' }}>
            See all WhatsApp employees ↓
          </Link>
        </div>

        {/* Fake WhatsApp message preview */}
        <div style={{ maxWidth: 360, margin: '56px auto 0', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 16, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.borderMid}` }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.greenDim, border: `1.5px solid ${C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💬</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Zara</div>
              <div style={{ fontSize: 10, color: C.greenLight }}>● Online</div>
            </div>
          </div>
          {[
            { from: 'customer', msg: 'Hi, how much does the black kurta cost?' },
            { from: 'zara', msg: 'Hi! The black kurta is ₹1,299. We have sizes S–XXL in stock. Would you like me to send photos? 😊' },
            { from: 'customer', msg: 'Yes! Also can you deliver by tomorrow?' },
            { from: 'zara', msg: "Sending photos now! We do express delivery — same-city orders placed before 2pm arrive next day. Shall I place the order for you?" },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.from === 'customer' ? 'flex-start' : 'flex-end', marginBottom: 8 }}>
              <div style={{ maxWidth: '80%', padding: '8px 12px', borderRadius: m.from === 'customer' ? '14px 14px 14px 4px' : '14px 14px 4px 14px', background: m.from === 'customer' ? C.card : 'rgba(37,211,102,0.12)', border: m.from === 'customer' ? `1px solid ${C.borderMid}` : `1px solid ${C.greenBorder}`, fontSize: 12, color: m.from === 'customer' ? C.muted : '#dcfce7', lineHeight: 1.5 }}>
                {m.msg}
              </div>
            </div>
          ))}
          <div style={{ textAlign: 'right', fontSize: 10, color: C.dim, marginTop: 4 }}>3:47 AM · All 47 messages handled ✓✓</div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.borderMid}`, borderBottom: `1px solid ${C.borderMid}`, padding: '32px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 24, textAlign: 'center' }}>
          {[
            { stat: '< 3s', label: 'Average reply time' },
            { stat: '24/7', label: 'Always on — no sick days' },
            { stat: '12+', label: 'Languages supported' },
            { stat: '$199', label: 'Starting monthly price' },
          ].map(s => (
            <div key={s.stat}>
              <div style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, letterSpacing: '-0.06em', color: C.green, lineHeight: 1 }}>{s.stat}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(56px,7vw,96px) 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.greenLight, marginBottom: 10 }}>How it works</div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-0.05em', color: '#fff', margin: 0, lineHeight: 1.1 }}>Live in 5 days.</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
          {[
            { num: '01', title: 'Interview free', desc: 'Chat with your future AI employee. See how they think, how they handle tough questions. No commitment.' },
            { num: '02', title: 'Tell us your setup', desc: 'Fill a 5-min brief — your products, prices, tone of voice, FAQs. Sumeet reviews it personally.' },
            { num: '03', title: 'We connect WhatsApp', desc: 'We set up your WhatsApp Business API and connect your AI employee. Typically 2–3 business days.' },
            { num: '04', title: 'Go live', desc: 'Onboarding call. First messages handled. You watch your AI employee work — and tweak if needed.' },
          ].map(s => (
            <div key={s.num} style={{ background: C.card, border: `1px solid ${C.borderMid}`, borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.greenLight, letterSpacing: '0.06em', marginBottom: 12 }}>{s.num}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WA EMPLOYEES */}
      <section id="employees" style={{ background: C.surface, borderTop: `1px solid ${C.borderMid}`, padding: 'clamp(56px,7vw,96px) 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.greenLight, marginBottom: 10 }}>Meet the team</div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-0.05em', color: '#fff', margin: 0 }}>WhatsApp AI Employees</h2>
            <p style={{ fontSize: 15, color: C.muted, marginTop: 10, maxWidth: 480, margin: '10px auto 0' }}>Each has a full personality, your brand voice, and a fleet of specialist agents behind them.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
            {WA_EMPLOYEES.map(e => (
              <div key={e.slug} style={{ background: C.bg, border: `1px solid rgba(37,211,102,0.12)`, borderRadius: 22, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: `${e.color}18`, border: `1.5px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: `0 0 24px ${e.color}15` }}>{e.emoji}</div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{e.title}</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6 }}>{e.tagline}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {e.handles.map(h => (
                    <div key={h} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#CBD5E1', alignItems: 'center' }}>
                      <span style={{ color: C.green, fontSize: 10 }}>✓</span> {h}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 4, paddingTop: 16, borderTop: `1px solid ${C.borderMid}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: C.green, letterSpacing: '-0.04em' }}>{e.price}</div>
                    <div style={{ fontSize: 10, color: C.dim }}>{e.agents} agents included</div>
                  </div>
                  <Link href={`/employees/${e.slug}/interview`} style={{ padding: '9px 18px', borderRadius: 10, background: C.greenDim, border: `1px solid ${C.greenBorder}`, color: C.greenLight, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    Interview free →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link href="/employees" style={{ fontSize: 13, color: C.muted, textDecoration: 'none', padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.borderMid}`, display: 'inline-block' }}>
              Browse all 100 AI Employees →
            </Link>
          </div>
        </div>
      </section>

      {/* WHAT IT HANDLES */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(56px,7vw,96px) 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-0.05em', color: '#fff', margin: 0 }}>What your AI employee handles</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {[
            { icon: '💬', label: 'Incoming lead qualification', desc: 'Asks the right questions, scores intent, routes hot leads to you.' },
            { icon: '📋', label: 'Price & product inquiries', desc: 'Answers FAQs instantly, 24/7. No human needed.' },
            { icon: '📅', label: 'Appointment booking', desc: 'Syncs with your calendar, books slots, sends reminders.' },
            { icon: '📦', label: 'Order status & tracking', desc: 'Pulls real-time status from your OMS and replies instantly.' },
            { icon: '🔄', label: 'Return & refund handling', desc: 'Follows your policy, initiates returns, keeps customers calm.' },
            { icon: '📢', label: 'Broadcast campaigns', desc: 'Sends promotions, reactivates cold leads, drives repeat orders.' },
            { icon: '🌐', label: '12+ languages', desc: 'Responds in the customer\'s language. Hindi, Tamil, Marathi + more.' },
            { icon: '🤝', label: 'Human handoff', desc: 'Knows when to escalate. Passes full context to your team.' },
          ].map(f => (
            <div key={f.label} style={{ background: C.card, border: `1px solid ${C.borderMid}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>{f.label}</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.borderMid}`, padding: 'clamp(56px,7vw,96px) 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 900, letterSpacing: '-0.05em', color: '#fff', margin: '0 0 36px', textAlign: 'center' }}>Common questions</h2>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${C.borderMid}` }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '20px 0', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>{faq.q}</span>
                <span style={{ color: C.green, fontSize: 18, fontWeight: 300, flexShrink: 0 }}>{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <div style={{ paddingBottom: 20, fontSize: 14, color: C.muted, lineHeight: 1.75 }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: 'clamp(64px,8vw,100px) 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '70vw', height: '70vw', maxWidth: 600, background: 'radial-gradient(ellipse, rgba(37,211,102,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <h2 style={{ fontSize: 'clamp(30px,5vw,54px)', fontWeight: 900, letterSpacing: '-0.06em', color: '#fff', margin: '0 0 14px', lineHeight: 1.05 }}>
          Stop losing leads<br />at 3am.
        </h2>
        <p style={{ fontSize: 16, color: C.muted, maxWidth: 440, margin: '0 auto 36px', lineHeight: 1.65 }}>
          Interview your AI WhatsApp employee free. No credit card. See how they'd handle your real customers before you commit.
        </p>
        <Link href="/employees/whatsapp-lead-qualifier/interview" style={{ display: 'inline-block', padding: '16px 36px', borderRadius: 16, background: C.green, color: '#000', fontSize: 16, fontWeight: 900, textDecoration: 'none', letterSpacing: '-0.03em', boxShadow: `0 12px 40px rgba(37,211,102,0.4)` }}>
          Start free interview →
        </Link>
        <div style={{ marginTop: 14, fontSize: 12, color: C.dim }}>Free to interview · $199/mo to hire · Cancel anytime</div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.borderMid}`, padding: '24px', textAlign: 'center', fontSize: 12, color: C.dim }}>
        <Link href="/" style={{ color: C.dim, textDecoration: 'none' }}>Setu</Link>
        {' · '}
        <Link href="/employees" style={{ color: C.dim, textDecoration: 'none' }}>100 AI Employees</Link>
        {' · '}
        <Link href="/pricing" style={{ color: C.dim, textDecoration: 'none' }}>Pricing</Link>
        {' · '}
        <span>SignalPulse Technologies LLC · Wyoming, USA</span>
      </footer>
    </div>
  )
}
