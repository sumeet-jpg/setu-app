import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EMPLOYEE_BY_SLUG } from '@/lib/employees/profiles'
import { SetuLogo } from '@/components/SetuLogo'

// Maps pSEO role slugs → employee profile slugs + copy overrides
const ROLE_MAP: Record<string, {
  employeeSlug: string
  h1: string
  description: string
  keyword: string
  useCases: string[]
}> = {
  'ai-marketing-manager': {
    employeeSlug: 'marketing-manager',
    h1: 'Hire an AI Marketing Manager',
    description: 'An AI Marketing Manager that plans campaigns, manages budgets, and delivers weekly reports — starting at $1,999/mo. Interview free before you hire.',
    keyword: 'AI Marketing Manager',
    useCases: ['Campaign planning and execution', 'Ad budget management', 'Content calendar ownership', 'Weekly marketing reports', 'Agency brief writing'],
  },
  'whatsapp-sales-bot': {
    employeeSlug: 'whatsapp-lead-qualifier',
    h1: 'Hire a WhatsApp Sales Bot',
    description: 'An AI WhatsApp Sales Agent that qualifies leads, answers product questions, and books appointments 24/7 — starting at $199/mo. Interview free.',
    keyword: 'WhatsApp Sales Bot',
    useCases: ['Lead qualification on WhatsApp', 'Product and pricing inquiries', 'Appointment booking', 'Follow-up sequences', '24/7 customer replies'],
  },
  'ai-cfo': {
    employeeSlug: 'cfo-intelligence',
    h1: 'Hire an AI CFO',
    description: 'An AI CFO that manages cash flow, board-level reporting, and financial strategy — without the ₹25L salary. Starting at $1,999/mo.',
    keyword: 'AI CFO',
    useCases: ['Cash flow forecasting', 'Board and investor reporting', 'Financial modeling', 'Budget planning and tracking', 'Cost reduction analysis'],
  },
  'ai-customer-support': {
    employeeSlug: 'whatsapp-support-agent',
    h1: 'Hire an AI Customer Support Agent',
    description: 'An AI Customer Support Agent that resolves 80% of tickets automatically on WhatsApp — without a support team. Starting at $249/mo.',
    keyword: 'AI Customer Support Agent',
    useCases: ['Instant ticket resolution', 'Order and delivery queries', 'Return and refund handling', 'FAQ deflection', 'Smart human escalation'],
  },
  'ai-cmo': {
    employeeSlug: 'cmo-intelligence',
    h1: 'Hire an AI CMO',
    description: 'An AI Chief Marketing Officer that sets strategy, manages your brand, and runs specialist agents — at a fraction of a CMO salary. From $2,999/mo.',
    keyword: 'AI CMO',
    useCases: ['Marketing strategy and roadmap', 'Brand positioning and messaging', 'Campaign oversight', 'Agency and vendor management', 'Board-level marketing reports'],
  },
  'ai-coo': {
    employeeSlug: 'coo-intelligence',
    h1: 'Hire an AI COO',
    description: 'An AI Chief Operating Officer that manages operations, vendor relations, and execution cadence — commanding a full agent fleet. From $2,499/mo.',
    keyword: 'AI COO',
    useCases: ['Operations oversight and planning', 'Vendor and partner management', 'OKR tracking and reporting', 'Cross-team coordination', 'Process documentation'],
  },
  'ai-sales-manager': {
    employeeSlug: 'account-manager',
    h1: 'Hire an AI Sales Manager',
    description: 'An AI Sales Manager that runs your pipeline, manages accounts, and drives revenue — without the commission overhead. Starting at $1,099/mo.',
    keyword: 'AI Sales Manager',
    useCases: ['Pipeline management', 'Account relationship management', 'Sales playbook execution', 'Forecast and reporting', 'Proposal and demo generation'],
  },
  'ai-hr-manager': {
    employeeSlug: 'hr-ops-manager',
    h1: 'Hire an AI HR Manager',
    description: 'An AI HR Manager that handles onboarding, compliance, payroll coordination, and employee queries — starting at $999/mo.',
    keyword: 'AI HR Manager',
    useCases: ['Employee onboarding flows', 'Payroll and compliance tracking', 'Leave management', 'HR policy Q&A', 'Performance review coordination'],
  },
  'whatsapp-ecommerce-bot': {
    employeeSlug: 'whatsapp-commerce-agent',
    h1: 'Hire a WhatsApp E-commerce Bot',
    description: 'An AI WhatsApp Commerce Agent that runs your product catalogue, order confirmations, and cart recovery on WhatsApp — starting at $299/mo.',
    keyword: 'WhatsApp Ecommerce Bot',
    useCases: ['Product catalogue sends', 'Order confirmation flows', 'Cart abandonment recovery', 'Payment link automation', 'Post-purchase follow-up'],
  },
  'ai-financial-analyst': {
    employeeSlug: 'financial-planning',
    h1: 'Hire an AI Financial Analyst',
    description: 'An AI Financial Analyst that builds board-ready models, cash flow forecasts, and scenario analyses — on demand. Starting at $1,499/mo.',
    keyword: 'AI Financial Analyst',
    useCases: ['Financial model building', 'Cash flow forecasting', 'Budget variance analysis', 'Investor deck financials', 'Scenario planning'],
  },
}

export async function generateStaticParams() {
  return Object.keys(ROLE_MAP).map(role => ({ role }))
}

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const { role } = await params
  const data = ROLE_MAP[role]
  if (!data) return {}
  return {
    title: `${data.h1} — Setu AI Employees`,
    description: data.description,
    openGraph: {
      title: `${data.h1} — Setu AI Employees`,
      description: data.description,
      url: `https://setuagents.com/hire/${role}`,
      siteName: 'Setu',
      type: 'website',
    },
  }
}

export default async function HireRolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params
  const data = ROLE_MAP[role]
  if (!data) notFound()

  const employee = EMPLOYEE_BY_SLUG[data.employeeSlug]

  const BG = '#0A0F1E'
  const SURFACE = '#111E35'
  const CARD = '#0D1828'
  const BORDER = 'rgba(148,163,184,0.08)'
  const MUTED = '#94A3B8'
  const DIM = '#475569'

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#F1F5F9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', lineHeight: 1.6 }}>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${BORDER}`, padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SetuLogo size={28} color="#22c55e" wordColor="#F1F5F9" />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/employees" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '6px 12px' }}>All 100 employees</Link>
          {employee && (
            <Link href={`/employees/${employee.slug}/interview`} style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc', padding: '7px 16px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', textDecoration: 'none' }}>
              Interview free →
            </Link>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: 'clamp(60px,8vw,100px) 24px clamp(40px,6vw,72px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '70vw', height: '50vw', maxWidth: 700, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 24, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 24 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.8)', display: 'inline-block' }} />
          Available to hire today
        </div>

        <h1 style={{ fontSize: 'clamp(32px,5.5vw,60px)', fontWeight: 900, letterSpacing: '-0.06em', color: '#fff', margin: '0 0 18px', lineHeight: 1.04 }}>
          {data.h1}
        </h1>
        <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: MUTED, maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.65 }}>
          {data.description}
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {employee ? (
            <>
              <Link href={`/employees/${employee.slug}/interview`} style={{ padding: '13px 28px', borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', letterSpacing: '-0.02em' }}>
                Interview {employee.name} free →
              </Link>
              <Link href={`/employees/${employee.slug}/hire`} style={{ padding: '13px 28px', borderRadius: 14, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 15, fontWeight: 700, textDecoration: 'none', letterSpacing: '-0.02em' }}>
                Hire {employee.name}
              </Link>
            </>
          ) : (
            <Link href="/employees" style={{ padding: '13px 28px', borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.4)', letterSpacing: '-0.02em' }}>
              Browse all employees →
            </Link>
          )}
        </div>
      </section>

      {/* EMPLOYEE CARD */}
      {employee && (
        <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 64px' }}>
          <div style={{ background: SURFACE, border: `1px solid ${employee.color}20`, borderRadius: 24, padding: 32, display: 'flex', gap: 28, flexWrap: 'wrap', boxShadow: `0 0 40px ${employee.color}0A` }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minWidth: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: `${employee.color}18`, border: `2px solid ${employee.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: `0 0 32px ${employee.color}18` }}>{employee.emoji}</div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>{employee.name}</div>
                  <div style={{ fontSize: 13, color: MUTED }}>{employee.title}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, margin: 0 }}>{employee.intro}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 180 }}>
              {[
                { label: 'Monthly price', value: employee.pricing.label },
                { label: 'Agents included', value: `${employee.agentCount} agents` },
                { label: 'Department', value: employee.dept },
                { label: 'Experience', value: `${employee.years} years` },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ color: MUTED }}>{r.label}</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{r.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Link href={`/employees/${employee.slug}/interview`} style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 10, background: `${employee.color}15`, border: `1px solid ${employee.color}30`, color: employee.color, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  Interview free
                </Link>
                <Link href={`/employees/${employee.slug}/hire`} style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  Hire now
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* USE CASES */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: 'clamp(48px,6vw,80px) 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, letterSpacing: '-0.05em', color: '#fff', margin: '0 0 32px' }}>
            What your {data.keyword} handles
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {data.useCases.map(uc => (
              <div key={uc} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: '#22c55e', fontSize: 12, marginTop: 2, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.55 }}>{uc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(48px,6vw,80px) 24px' }}>
        <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, letterSpacing: '-0.05em', color: '#fff', margin: '0 0 32px' }}>
          How hiring works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {[
            { step: '01', title: 'Interview free', desc: 'Chat with the employee. Ask real questions about your business.' },
            { step: '02', title: 'Submit hire request', desc: 'Fill a 5-min brief. No technical setup required.' },
            { step: '03', title: 'We configure', desc: 'Agents are trained on your brand, products, and workflows in 2–3 days.' },
            { step: '04', title: 'Go live', desc: 'Onboarding call, first tasks completed. Results visible within week 1.' },
          ].map(s => (
            <div key={s.step} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', letterSpacing: '0.06em', marginBottom: 10 }}>{s.step}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.65 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: 'clamp(48px,6vw,80px) 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, letterSpacing: '-0.06em', color: '#fff', margin: '0 0 12px', lineHeight: 1.1 }}>
          {data.h1} — free interview first.
        </h2>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 420, margin: '0 auto 32px', lineHeight: 1.65 }}>No credit card. No commitment. Talk to the employee, see how they think, then decide.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {employee && (
            <Link href={`/employees/${employee.slug}/interview`} style={{ padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
              Start free interview →
            </Link>
          )}
          <Link href="/employees" style={{ padding: '14px 24px', borderRadius: 14, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
            Browse all 100 employees
          </Link>
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: DIM }}>
          Free to interview · Monthly billing · Cancel anytime
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '20px 24px', textAlign: 'center', fontSize: 12, color: DIM }}>
        <Link href="/" style={{ color: DIM, textDecoration: 'none' }}>Setu</Link>
        {' · '}
        <Link href="/employees" style={{ color: DIM, textDecoration: 'none' }}>All 100 Employees</Link>
        {' · '}
        <Link href="/pricing" style={{ color: DIM, textDecoration: 'none' }}>Pricing</Link>
        {' · '}
        <Link href="/whatsapp" style={{ color: DIM, textDecoration: 'none' }}>WhatsApp Employees</Link>
      </footer>
    </div>
  )
}
