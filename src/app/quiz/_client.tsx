'use client'
import { useState } from 'react'
import Link from 'next/link'
import { SetuLogo } from '@/components/SetuLogo'

const BG = '#F6F5F1'
const WHITE = '#FFFFFF'
const INK = '#0D0C09'
const GREEN = '#0E5C34'
const GRAY = '#E3E1DA'
const MUTED = '#78746E'
const DIM = '#9E9891'

const Qs = [
  {
    q: "What's your biggest bottleneck right now?",
    sub: "The thing eating the most time or costing you the most leads.",
    opts: [
      { icon: '💬', text: 'Missing leads on WhatsApp', sub: 'Messages pile up, people buy elsewhere', tag: 'whatsapp' },
      { icon: '📊', text: 'Marketing is unfocused', sub: 'Spending on ads with unclear ROI', tag: 'marketing' },
      { icon: '💼', text: 'Finance feels out of control', sub: 'Cash flow surprises, unclear runway', tag: 'finance' },
      { icon: '🏢', text: 'Operations are chaos', sub: 'Too many fires, nothing systematic', tag: 'ops' },
    ]
  },
  {
    q: "How many people are on your team?",
    sub: "Helps us understand your scale.",
    opts: [
      { icon: '🧑', text: 'Just me', sub: 'Sole founder or solo operator', tag: 'solo' },
      { icon: '👥', text: '2–10 people', sub: 'Small team, wearing many hats', tag: 'small' },
      { icon: '🏢', text: '11–50 people', sub: 'Growing team, some structure', tag: 'mid' },
      { icon: '🏛️', text: '50+ people', sub: 'Established org, scaling fast', tag: 'large' },
    ]
  },
  {
    q: "What's your primary sales channel?",
    sub: "Where do most of your customers come from?",
    opts: [
      { icon: '📱', text: 'WhatsApp / direct messages', sub: 'Customers message you first', tag: 'direct' },
      { icon: '🌐', text: 'Website / digital ads', sub: 'Inbound from search or social', tag: 'digital' },
      { icon: '🤝', text: 'Referrals and word of mouth', sub: 'Existing customers bring new ones', tag: 'referral' },
      { icon: '🏪', text: 'Physical presence / field sales', sub: 'In-person or rep-led sales', tag: 'field' },
    ]
  },
  {
    q: "What's your monthly budget for AI Employees?",
    sub: "No wrong answer — just helps us match the right fit.",
    opts: [
      { icon: '💰', text: 'Under $500/mo', sub: 'Starting small, proving the model', tag: 'budget' },
      { icon: '💳', text: '$500–$2,000/mo', sub: 'Investing in one key function', tag: 'mid-budget' },
      { icon: '🏦', text: '$2,000–$5,000/mo', sub: 'Building out a capability', tag: 'high-budget' },
      { icon: '🔑', text: 'C-Suite level / no ceiling', sub: 'Need the best, full team', tag: 'enterprise' },
    ]
  },
]

type Rec = { slug: string; name: string; title: string; emoji: string; color: string; price: string; match: string[] }
const RECS: Record<string, Rec> = {
  whatsapp_budget: { slug: 'whatsapp-lead-qualifier', name: 'Nisha', title: 'WhatsApp Lead Qualifier', emoji: '🎯', color: '#075E54', price: '$49/mo', match: ['Qualifies every WhatsApp lead automatically', 'Replies in < 3 seconds, 24/7', 'Appointment booking built in', '14-day free trial — no card needed'] },
  whatsapp_mid: { slug: 'whatsapp-commerce-agent', name: 'Zara', title: 'WhatsApp Commerce Agent', emoji: '💬', color: '#25D366', price: '$49/mo', match: ['Full sales channel on WhatsApp', 'Product catalogue, orders, cart recovery', 'Payment link automation', 'Runs 44 commerce agents'] },
  marketing_budget: { slug: 'demand-gen-manager', name: 'Your Demand Gen Manager', title: 'Demand Gen Manager', emoji: '🚀', color: '#8B5CF6', price: '$49/mo', match: ['Full-funnel demand generation', 'Ad copy, landing pages, A/B tests', 'Lead scoring and attribution', 'Weekly pipeline reports'] },
  marketing_high: { slug: 'marketing-manager', name: 'Your Marketing Manager', title: 'Marketing Manager', emoji: '📊', color: '#6366F1', price: '$49/mo', match: ['Plans and executes full strategy', 'Manages 208 specialist agents', 'Covers every channel simultaneously', 'Weekly board-ready reports'] },
  finance_budget: { slug: 'finance-controller', name: 'Your Finance Controller', title: 'Finance Controller', emoji: '💰', color: '#F59E0B', price: '$49/mo', match: ['Month-close in 2 days not 2 weeks', 'Cash flow visibility always-on', 'AP/AR automation', 'Board reporting on demand'] },
  finance_high: { slug: 'cfo-intelligence', name: 'Your AI CFO', title: 'CFO-level Intelligence', emoji: '🏦', color: '#D97706', price: '$49/mo', match: ['Board and investor reporting', 'Cash flow and runway forecasting', 'Financial strategy and modeling', 'Fundraising intelligence'] },
  ops_budget: { slug: 'operations-manager', name: 'Your Operations Manager', title: 'Operations Manager', emoji: '⚙️', color: '#0369A1', price: '$49/mo', match: ['Systematizes chaotic operations', 'Vendor and supply chain management', 'Process documentation', 'OKR tracking'] },
  ops_high: { slug: 'coo-intelligence', name: 'Your AI COO', title: 'COO-level Intelligence', emoji: '🏢', color: '#0284C7', price: '$49/mo', match: ['End-to-end operations oversight', '300+ agents across all functions', 'Cross-team coordination', 'Board-level operational reporting'] },
  enterprise: { slug: 'cmo-intelligence', name: 'Your AI CMO', title: 'CMO-level Intelligence', emoji: '🎯', color: '#EC4899', price: '$49/mo', match: ['Full marketing org in AI form', 'Strategy, brand, campaigns, analytics', 'Board-level reporting', 'Commands 234 specialist agents'] },
}

const ALSO: Record<string, { slug: string; emoji: string; name: string; price: string; sub: string }[]> = {
  whatsapp: [
    { slug: 'whatsapp-support-agent', emoji: '🤝', name: 'Aarav', price: '$49/mo', sub: 'WhatsApp Support' },
    { slug: 'whatsapp-commerce-agent', emoji: '💬', name: 'Zara', price: '$49/mo', sub: 'WhatsApp Commerce' },
    { slug: 'demand-gen-manager', emoji: '🚀', name: 'Growth Manager', price: '$49/mo', sub: 'Lead gen' },
  ],
  marketing: [
    { slug: 'demand-gen-manager', emoji: '🚀', name: 'Demand Gen', price: '$49/mo', sub: 'Top of funnel' },
    { slug: 'plg-growth-agent', emoji: '🌱', name: 'PLG Agent', price: '$49/mo', sub: 'Product-led growth' },
    { slug: 'cmo-intelligence', emoji: '🎯', name: 'AI CMO', price: '$49/mo', sub: 'C-Suite marketing' },
  ],
  finance: [
    { slug: 'accounts-payable', emoji: '📤', name: 'AP Manager', price: '$49/mo', sub: 'Accounts payable' },
    { slug: 'financial-planning', emoji: '📈', name: 'FP&A', price: '$49/mo', sub: 'Financial planning' },
    { slug: 'cfo-intelligence', emoji: '🏦', name: 'AI CFO', price: '$49/mo', sub: 'CFO intelligence' },
  ],
  ops: [
    { slug: 'project-manager-agent', emoji: '📋', name: 'Project Manager', price: '$49/mo', sub: 'Project ops' },
    { slug: 'vendor-manager', emoji: '🤝', name: 'Vendor Manager', price: '$49/mo', sub: 'Vendor coordination' },
    { slug: 'coo-intelligence', emoji: '🏢', name: 'AI COO', price: '$49/mo', sub: 'C-Suite ops' },
  ],
}

function getRec(answers: string[]): Rec {
  const primary = answers[0] || 'whatsapp'
  const budget = answers[3] || 'budget'
  const isHigh = budget === 'high-budget' || budget === 'enterprise'
  if (budget === 'enterprise') return RECS['enterprise']
  if (primary === 'whatsapp') return isHigh ? RECS['whatsapp_mid'] : RECS['whatsapp_budget']
  if (primary === 'marketing') return isHigh ? RECS['marketing_high'] : RECS['marketing_budget']
  if (primary === 'finance') return isHigh ? RECS['finance_high'] : RECS['finance_budget']
  if (primary === 'ops') return isHigh ? RECS['ops_high'] : RECS['ops_budget']
  return RECS['whatsapp_budget']
}

export default function QuizClient() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [picked, setPicked] = useState<number | null>(null)
  const done = step >= Qs.length

  function choose(tag: string, idx: number) {
    setPicked(idx)
    setTimeout(() => {
      const next = [...answers, tag]
      setAnswers(next)
      setPicked(null)
      setStep(s => s + 1)
    }, 320)
  }

  function restart() {
    setAnswers([])
    setStep(0)
    setPicked(null)
  }

  const pct = Math.round(((step + 1) / (Qs.length + 1)) * 100)
  const rec = done ? getRec(answers) : null
  const also = done ? (ALSO[answers[0]] || ALSO['whatsapp']) : []

  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: 'var(--font-jakarta)', lineHeight: 1.6 }}>
      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: WHITE, borderBottom: `1px solid ${GRAY}`, padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SetuLogo size={28} color={GREEN} wordColor={INK} />
        <Link href="/employees" style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>Browse all 100 employees →</Link>
      </nav>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px 64px' }}>
        {/* Progress */}
        <div style={{ height: 3, background: 'rgba(14,92,52,0.10)', borderRadius: 3, marginBottom: 40, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#0E5C34,#1A9655)', borderRadius: 3, transition: 'width 0.4s ease' }} />
        </div>

        {!done && (() => {
          const q = Qs[step]
          return (
            <div key={step} style={{ background: WHITE, border: `1px solid ${GRAY}`, borderRadius: 22, padding: 32 }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: MUTED, marginBottom: 12 }}>Question {step + 1} of {Qs.length}</div>
              <div style={{ fontSize: 'clamp(20px,4vw,26px)', fontWeight: 800, letterSpacing: '-0.04em', color: INK, marginBottom: 8, lineHeight: 1.2 }}>{q.q}</div>
              <div style={{ fontSize: 14, color: MUTED, marginBottom: 28, lineHeight: 1.6 }}>{q.sub}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.opts.map((o, idx) => (
                  <button
                    key={idx}
                    onClick={() => choose(o.tag, idx)}
                    style={{
                      background: picked === idx ? 'rgba(14,92,52,0.08)' : WHITE,
                      border: `1.5px solid ${picked === idx ? GREEN : GRAY}`,
                      borderRadius: 14,
                      padding: '16px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{o.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, color: INK, fontWeight: 600, lineHeight: 1.4 }}>{o.text}</div>
                      <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{o.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })()}

        {done && rec && (
          <div style={{ background: WHITE, border: `1px solid ${GRAY}`, borderRadius: 22, padding: 36, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: MUTED, marginBottom: 20 }}>Your match</div>
            <div style={{ width: 80, height: 80, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 20px', background: `${rec.color}18`, border: `2px solid ${rec.color}30`, boxShadow: `0 0 40px ${rec.color}18` }}>{rec.emoji}</div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.05em', color: INK, marginBottom: 4 }}>{rec.name}</div>
            <div style={{ fontSize: 14, color: MUTED, marginBottom: 6 }}>{rec.title}</div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.06em', color: rec.color, marginBottom: 24 }}>{rec.price}</div>

            <div style={{ background: 'rgba(14,92,52,0.05)', border: '1px solid rgba(14,92,52,0.12)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: MUTED, marginBottom: 10 }}>Why this match</div>
              {rec.match.map((m, i) => (
                <div key={i} style={{ fontSize: 13, color: INK, marginBottom: 6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: rec.color, marginTop: 2, flexShrink: 0 }}>✓</span>{m}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
              <Link href={`/employees/${rec.slug}/interview`} style={{ padding: '13px 28px', borderRadius: 13, background: GREEN, color: '#fff', fontSize: 14, fontWeight: 800, textDecoration: 'none', boxShadow: '0 6px 24px rgba(14,92,52,0.28)' }}>
                Interview {rec.name} free →
              </Link>
              <Link href={`/employees/${rec.slug}/hire`} style={{ padding: '13px 22px', borderRadius: 13, background: 'rgba(14,92,52,0.06)', border: '1px solid rgba(14,92,52,0.2)', color: GREEN, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                Hire now
              </Link>
            </div>
            <div style={{ fontSize: 12, color: DIM }}>Free to interview · No credit card · Starts in 48 hours</div>

            {also.length > 0 && (
              <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${GRAY}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: MUTED, marginBottom: 14 }}>You might also need</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
                  {also.map(a => (
                    <Link key={a.slug} href={`/employees/${a.slug}/interview`} style={{ background: BG, border: `1px solid ${GRAY}`, borderRadius: 14, padding: 14, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{a.emoji}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: INK }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: MUTED }}>{a.sub} · {a.price}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <button onClick={restart} style={{ fontSize: 12, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: '4px 10px' }}>
                Start over ↩
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
