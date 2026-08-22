import type { Metadata } from 'next'
import Link from 'next/link'
import { EMPLOYEE_BY_SLUG } from '@/lib/employees/profiles'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Enterprise AI Employees — C-Suite AI for Growing Businesses',
  description: 'AI CMO, COO, CTO, and Chief of Staff — each commanding 240+ specialist agents. Enterprise-grade intelligence at a fraction of the exec hiring cost. Interview free.',
  openGraph: {
    title: 'Enterprise AI Employees — Setu',
    description: 'Your C-Suite, powered by AI. CMO, COO, CTO, Chief of Staff. $49/mo, locked at signup.',
    url: 'https://setuagents.com/enterprise',
    siteName: 'Setu',
    type: 'website',
  },
}

const CSUITE_SLUGS = ['cmo-intelligence', 'coo-intelligence', 'cto-intelligence', 'chief-of-staff']

const ENTERPRISE_BENEFITS = [
  { icon: '🔒', title: 'Enterprise security', desc: 'Your data stays yours. No training on your business data. Security questionnaire available on request.' },
  { icon: '🔗', title: 'Deep integrations', desc: 'Slack, Notion, Salesforce, HubSpot, Jira, Google Workspace — connects to your existing stack.' },
  { icon: '📊', title: 'Board-level reporting', desc: 'Weekly and monthly reports in the format your board expects. Investor-ready by default.' },
  { icon: '⚡', title: '240+ agents each', desc: 'Each C-Suite employee commands a fleet of specialist agents — no task too complex.' },
  { icon: '🎯', title: 'Custom playbooks', desc: 'Trained on your strategy, brand, values, and workflows. Acts like an insider, not a generalist.' },
  { icon: '🤝', title: 'White-glove onboarding', desc: 'Dedicated onboarding with Sumeet. Live in under 7 days. Ongoing support included.' },
]

export default function EnterprisePage() {
  const csuite = CSUITE_SLUGS.map(s => EMPLOYEE_BY_SLUG[s]).filter(Boolean)

  const BG = '#06091A'
  const SURFACE = '#0C1426'
  const CARD = '#0F1A2E'
  const BORDER = 'rgba(148,163,184,0.08)'
  const MUTED = '#94A3B8'
  const DIM = '#475569'

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#F1F5F9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', lineHeight: 1.6 }}>

      <Nav theme="dark" ctaLabel="Meet the C-Suite" />

      {/* HERO */}
      <section style={{ padding: 'clamp(60px,9vw,110px) 24px clamp(48px,7vw,80px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.13) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 24, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 28 }}>
          C-Suite AI · $49/mo
        </div>

        <h1 style={{ fontSize: 'clamp(34px,6vw,66px)', fontWeight: 900, letterSpacing: '-0.06em', color: '#fff', margin: '0 0 20px', lineHeight: 1.02 }}>
          Your entire C-Suite.<br />
          <span style={{ color: '#818cf8' }}>Without the salaries.</span>
        </h1>

        <p style={{ fontSize: 'clamp(15px,2vw,19px)', color: MUTED, maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.65 }}>
          AI CMO, COO, CTO, and Chief of Staff — each commanding 240+ specialist agents. Board-ready reporting, strategic execution, and deep integration with your stack. Interview any of them free before committing.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/employees?dept=C-Suite" style={{ padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', letterSpacing: '-0.02em' }}>
            Meet the C-Suite →
          </Link>
          <Link href="/compare" style={{ padding: '14px 24px', borderRadius: 14, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 15, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.02em' }}>
            See cost comparison
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 48, justifyContent: 'center', flexWrap: 'wrap', marginTop: 56, paddingTop: 48, borderTop: `1px solid ${BORDER}` }}>
          {[
            { num: '4', label: 'C-Suite AI Employees' },
            { num: '240+', label: 'Agents each' },
            { num: '~70×', label: 'Cheaper than human exec' },
            { num: '7 days', label: 'To go live' },
          ].map(s => (
            <div key={s.num} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, letterSpacing: '-0.06em', color: '#a5b4fc', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CSUITE CARDS */}
      {csuite.length > 0 && (
        <section style={{ maxWidth: 1060, margin: '0 auto', padding: '0 24px 64px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {csuite.map(e => (
              <div key={e.slug} style={{ background: SURFACE, border: `1px solid ${e.color}20`, borderRadius: 22, padding: 28, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: `0 0 32px ${e.color}08` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: `${e.color}15`, border: `1.5px solid ${e.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: `0 0 24px ${e.color}12` }}>{e.emoji}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>{e.title}</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.65, flex: 1 }}>{e.tagline}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '14px 0', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
                  {[
                    { label: 'Price', value: e.pricing.label },
                    { label: 'Agents', value: `${e.agentCount} agents` },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: MUTED }}>{r.label}</span>
                      <span style={{ color: '#fff', fontWeight: 700 }}>{r.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href={`/employees/${e.slug}/interview`} style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 10, background: `${e.color}12`, border: `1px solid ${e.color}28`, color: e.color, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                    Interview free
                  </Link>
                  <Link href={`/employees/${e.slug}/hire`} style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                    Hire
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ENTERPRISE BENEFITS */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: 'clamp(48px,6vw,80px) 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900, letterSpacing: '-0.05em', color: '#fff', margin: '0 0 40px', textAlign: 'center' }}>Enterprise-grade, startup price</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {ENTERPRISE_BENEFITS.map(b => (
              <div key={b.title} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{b.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: 8 }}>{b.title}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.65 }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY TRUST THIS WITHOUT A CASE STUDY YET */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: 'clamp(56px,7vw,88px) 24px', textAlign: 'center' }}>
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 22, padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🎙️</div>
          <p style={{ fontSize: 16, color: '#CBD5E1', lineHeight: 1.75, margin: '0 0 8px', fontWeight: 700 }}>
            Judge it yourself, not from a quote.
          </p>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, margin: 0, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            We're early — we'd rather you interview the actual AI CMO or COO for 10 minutes and see the depth yourself
            than take a stranger's word for it. If it's not good enough for a board-level decision, you'll know
            immediately, and it costs you nothing to find out.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: 'clamp(48px,6vw,80px) 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(26px,4vw,48px)', fontWeight: 900, letterSpacing: '-0.06em', color: '#fff', margin: '0 0 12px', lineHeight: 1.08 }}>
          Interview your AI C-Suite.<br />Free. Today.
        </h2>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.65 }}>
          No credit card. No commitment. Talk to the executive candidate and see if they have the depth you need.
        </p>
        <Link href="/employees" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', letterSpacing: '-0.02em' }}>
          Meet the C-Suite →
        </Link>
        <div style={{ marginTop: 14, fontSize: 12, color: DIM }}>$49/mo, locked at signup · 7-day live guarantee · Cancel anytime</div>
        <div style={{ marginTop: 20, fontSize: 12, color: DIM }}>
          Procurement need a DPA? <Link href="/legal/dpa" style={{ color: '#a5b4fc', textDecoration: 'underline' }}>Read Setu's standard Data Processing Agreement →</Link>
        </div>
      </section>

      <Footer theme="dark" />
    </div>
  )
}
