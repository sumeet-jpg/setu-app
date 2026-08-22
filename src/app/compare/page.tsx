import type { Metadata } from 'next'
import Link from 'next/link'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'AI Employees vs Human Hires — Real Cost Comparison',
  description: 'Compare the real cost of AI Employees vs human hires. Salary, PF, recruitment, downtime — the numbers tell the whole story. Every Setu AI Employee is $49/mo, locked at signup.',
  openGraph: {
    title: 'AI Employees vs Human Hires — Setu',
    description: 'The real math on AI Employees vs human hires. Spoiler: it\'s not close.',
    url: 'https://setuagents.com/compare',
    siteName: 'Setu',
    type: 'website',
  },
}

// Every AI Employee is the same flat rate — $49/mo (~₹4,100/mo), locked at
// signup — see src/lib/employees/profiles.ts `pricing` field and the live
// checkout flow. The "verdict" multipliers below are computed from that real
// number against the human cost shown, not invented.
const COMPARISONS = [
  {
    role: 'Marketing Manager',
    human: { cost: '₹10,00,000', breakdown: ['₹8L base salary', '₹96k PF (12%)', '₹1L+ recruitment', '90 day notice period', 'Leaves after 18 months avg'], risk: 'Quits → 6 months of lost momentum' },
    ai: { cost: '~₹4,100/mo', breakdown: ['No PF or benefits', 'No recruitment cost', 'Starts in 48 hours', 'Never quits', '208 agents across all channels'] },
    slug: 'marketing-manager',
    verdict: '~20× cheaper per year. Infinitely more capacity.'
  },
  {
    role: 'WhatsApp Sales Rep',
    human: { cost: '₹3,00,000+', breakdown: ['₹2.4L base salary', '₹29k PF', 'Works 9am–6pm only', 'Misses leads after hours', 'Covers 1 channel only'], risk: 'Every unanswered lead = lost revenue' },
    ai: { cost: '~₹4,100/mo', breakdown: ['24/7 — never sleeps', 'Replies in < 3 seconds', 'Handles 100s of chats simultaneously', 'Hindi, Tamil, Marathi + 9 languages', 'Reports daily'] },
    slug: 'whatsapp-lead-qualifier',
    verdict: '~6× cheaper per year. Works while you sleep.'
  },
  {
    role: 'CFO / Finance Head',
    human: { cost: '₹30,00,000+', breakdown: ['₹25L+ base salary', '₹3L PF', 'ESOPs expected', '120-day notice period', 'Manages limited scope'], risk: 'Hiring takes 6 months. Replacement takes another 6.' },
    ai: { cost: '~₹4,100/mo', breakdown: ['Board-ready reporting on demand', 'Cash flow, forecasting, scenario models', 'No equity dilution', 'No notice period', 'Available 24/7 for investor queries'] },
    slug: 'cfo-intelligence',
    verdict: '~60× cheaper per year. No equity dilution.'
  },
  {
    role: 'CMO',
    human: { cost: '₹40,00,000+', breakdown: ['₹35L+ base salary', 'ESOP/equity stake', 'Team budget needed on top', '6-month search + notice', 'Risk: wrong hire = wrong brand'], risk: 'Bad CMO = 18 months of damage + expensive exit' },
    ai: { cost: '~₹4,100/mo', breakdown: ['Full marketing strategy on day 1', 'No equity given up', 'Commands 234 specialist agents', 'Interview free before committing', 'Weekly board-ready reports'] },
    slug: 'cmo-intelligence',
    verdict: '~80× cheaper per year. No ESOP. Interview first.'
  },
]

const HIDDEN_COSTS = [
  { label: 'Recruitment & interviews', human: '₹50k–₹2L per hire', ai: '₹0' },
  { label: 'Training & onboarding', human: '3–6 months', ai: '48 hours' },
  { label: 'Benefits & PF', human: '+12–20% of salary', ai: '₹0' },
  { label: 'Downtime (sick, leave, etc.)', human: '15–30 days/year', ai: '0 days' },
  { label: 'Notice period (before they start)', human: '30–90 days', ai: '0 days' },
  { label: 'Knowledge loss on exit', human: 'Severe — costs months', ai: 'None — never quits' },
  { label: 'Performance management', human: 'Ongoing — your time', ai: 'Automated — weekly reports' },
  { label: 'Night / weekend coverage', human: 'Overtime or extra hire', ai: 'Included — 24/7' },
]

const BG = '#080C1C'
const SURFACE = '#0E1828'
const CARD = '#111E35'
const BORDER = 'rgba(148,163,184,0.08)'
const MUTED = '#94A3B8'
const DIM = '#475569'
const RED = '#EF4444'
const GREEN = '#22C55E'

export default function ComparePage() {
  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#F1F5F9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', lineHeight: 1.6 }}>

      {/* NAV */}
      <Nav theme="dark" />

      {/* HERO */}
      <section style={{ padding: 'clamp(56px,8vw,96px) 24px clamp(40px,6vw,64px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '700px', height: '400px', background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 24, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 24 }}>
          Real numbers · No spin
        </div>
        <h1 style={{ fontSize: 'clamp(32px,5.5vw,60px)', fontWeight: 900, letterSpacing: '-0.06em', color: '#fff', margin: '0 0 16px', lineHeight: 1.04 }}>
          AI Employees vs<br />Human Hires
        </h1>
        <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: MUTED, maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.65 }}>
          The full cost of hiring, including everything your spreadsheet usually misses. The comparison is stark.
        </p>
        <Link href="/employees" style={{ display: 'inline-block', padding: '13px 28px', borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.35)', letterSpacing: '-0.02em' }}>
          Browse AI Employees →
        </Link>
      </section>

      {/* COMPARISON CARDS */}
      <section style={{ maxWidth: 1060, margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {COMPARISONS.map(c => (
            <div key={c.role} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 22, overflow: 'hidden' }}>
              <div style={{ padding: '20px 28px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>{c.role}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', padding: '5px 14px', borderRadius: 20, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>{c.verdict}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                {/* Human */}
                <div style={{ padding: '24px 28px', borderRight: `1px solid ${BORDER}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: RED }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#ef4444', textTransform: 'uppercase' }}>Human hire</span>
                  </div>
                  <div style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, letterSpacing: '-0.06em', color: '#ef4444', marginBottom: 16 }}>{c.human.cost}<span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>/year</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {c.human.breakdown.map(b => (
                      <div key={b} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#CBD5E1' }}>
                        <span style={{ color: '#ef4444', fontSize: 12, marginTop: 2 }}>✕</span> {b}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 12, color: '#fca5a5', lineHeight: 1.6 }}>
                    ⚠ {c.human.risk}
                  </div>
                </div>
                {/* AI */}
                <div style={{ padding: '24px 28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#22c55e', textTransform: 'uppercase' }}>Setu AI Employee</span>
                  </div>
                  <div style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, letterSpacing: '-0.06em', color: '#22c55e', marginBottom: 16 }}>{c.ai.cost}<span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}></span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {c.ai.breakdown.map(b => (
                      <div key={b} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#CBD5E1' }}>
                        <span style={{ color: '#22c55e', fontSize: 12, marginTop: 2 }}>✓</span> {b}
                      </div>
                    ))}
                  </div>
                  <Link href={`/employees/${c.slug}/interview`} style={{ display: 'block', padding: '10px 18px', borderRadius: 10, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 12, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
                    Interview free before you decide →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HIDDEN COSTS TABLE */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: 'clamp(48px,6vw,80px) 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 900, letterSpacing: '-0.05em', color: '#fff', margin: '0 0 12px' }}>The costs your spreadsheet misses</h2>
            <p style={{ fontSize: 14, color: MUTED, maxWidth: 480, margin: '0 auto' }}>Every hidden cost of a human hire — versus an AI Employee.</p>
          </div>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr 1fr', padding: '14px 24px', background: 'rgba(99,102,241,0.06)', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cost factor</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Human hire</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Setu AI</span>
            </div>
            {HIDDEN_COSTS.map((row, i) => (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr 1fr', padding: '16px 24px', borderBottom: i < HIDDEN_COSTS.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <span style={{ fontSize: 13, color: '#CBD5E1' }}>{row.label}</span>
                <span style={{ fontSize: 13, color: '#fca5a5', fontWeight: 600 }}>{row.human}</span>
                <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 700 }}>{row.ai}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: 'clamp(56px,8vw,96px) 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px,4.5vw,50px)', fontWeight: 900, letterSpacing: '-0.06em', color: '#fff', margin: '0 0 14px', lineHeight: 1.07 }}>
          The math is in.<br />Try the interview first.
        </h2>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.65 }}>
          Interview any AI Employee free — no credit card, no commitment. Talk to them the same way you would a human candidate. Then decide.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/employees" style={{ padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', letterSpacing: '-0.02em' }}>
            Browse all 100 employees →
          </Link>
          <Link href="/pricing" style={{ padding: '14px 24px', borderRadius: 14, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 15, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.02em' }}>
            See pricing
          </Link>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: DIM }}>Every employee, $49/mo, locked at signup · No commitment · Cancel anytime</div>
      </section>

      <Footer theme="dark" />
    </div>
  )
}
