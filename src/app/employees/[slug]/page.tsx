// @ts-nocheck
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEmployee, EMPLOYEES } from '@/lib/employees/profiles'

export async function generateStaticParams() {
  return EMPLOYEES.map(e => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const e = getEmployee(params.slug)
  if (!e) return {}
  const BASE = 'https://setuagents.com'
  return {
    title: `Hire ${e.name} — AI ${e.title} | Setu`,
    description: `${e.tagline} Commands ${e.agentCount} specialized AI agents. Starting at ${e.pricing.label}/mo. Interview free, hire when ready.`,
    openGraph: {
      title: `${e.name} — AI ${e.title} | Setu`,
      description: e.tagline,
      url: `${BASE}/employees/${e.slug}`,
      siteName: 'Setu AI Employees',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${e.name} — AI ${e.title}`,
      description: e.tagline,
    },
    alternates: { canonical: `${BASE}/employees/${e.slug}` },
    keywords: [e.name, e.title, e.dept, 'AI employee', 'hire AI', 'AI agent', 'business automation', 'Setu', ...e.knows],
  }
}

export default function EmployeeProfilePage({ params }: { params: { slug: string } }) {
  const e = getEmployee(params.slug)
  if (!e) notFound()

  const BG = '#09090b'
  const SURFACE = 'rgba(255,255,255,0.04)'
  const BORDER = 'rgba(255,255,255,0.08)'
  const MUTED = '#71717a'

  // JSON-LD structured data for AEO / AI search engines
  const BASE = 'https://setuagents.com'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${BASE}/employees/${e.slug}`,
        name: `${e.name} — AI ${e.title}`,
        description: e.tagline,
        provider: {
          '@type': 'Organization',
          name: 'Setu',
          url: BASE,
          legalName: 'SignalPulse Technologies LLC',
        },
        offers: {
          '@type': 'Offer',
          price: e.pricing.monthly,
          priceCurrency: 'USD',
          priceSpecification: { '@type': 'UnitPriceSpecification', billingIncrement: 1, unitCode: 'MON' },
        },
        serviceType: 'AI Employee',
        category: e.dept,
        audience: { '@type': 'BusinessAudience', audienceType: 'B2B' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `What does ${e.name} do as an AI ${e.title}?`,
            acceptedAnswer: { '@type': 'Answer', text: e.intro },
          },
          {
            '@type': 'Question',
            name: `How many AI agents does ${e.name} command?`,
            acceptedAnswer: { '@type': 'Answer', text: `${e.name} commands a fleet of ${e.agentCount} specialized AI agents across ${e.capabilities.length} capability areas including ${e.capabilities.slice(0, 3).map(c => c.area).join(', ')}.` },
          },
          {
            '@type': 'Question',
            name: `How much does it cost to hire ${e.name}?`,
            acceptedAnswer: { '@type': 'Answer', text: `Hiring ${e.name} starts at ${e.pricing.label} per month. You can interview ${e.name} for free before committing.` },
          },
          {
            '@type': 'Question',
            name: `What tools does ${e.name} integrate with?`,
            acceptedAnswer: { '@type': 'Answer', text: `${e.name} integrates with ${e.tools.flatMap(t => t.tools).slice(0, 8).join(', ')}, and more through the Setu agent network.` },
          },
        ],
      },
    ],
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fafafa', fontFamily: 'var(--font-inter)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <Link href="/employees" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>S</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em' }}>Setu</span>
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/employees/${e.slug}/interview`} style={{ padding: '8px 16px', borderRadius: 9, background: SURFACE, border: `1px solid ${e.color}40`, color: e.color, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Interview {e.name}
          </Link>
          <Link href={`/employees/${e.slug}/hire`} style={{ padding: '8px 16px', borderRadius: 9, background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Hire Now →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: `linear-gradient(180deg, ${e.color}12 0%, transparent 60%)`, borderBottom: `1px solid ${BORDER}`, padding: '48px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }}>
          <div>
            <Link href="/employees" style={{ fontSize: 12, color: MUTED, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
              ← All Employees
            </Link>
            <div style={{ fontSize: 10, fontWeight: 700, color: e.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{e.dept}</div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 8px', color: '#fff' }}>
              {e.name}
            </h1>
            <div style={{ fontSize: 18, color: '#a1a1aa', marginBottom: 16 }}>{e.title} · {e.years} years experience</div>
            <p style={{ fontSize: 16, color: '#71717a', lineHeight: 1.7, maxWidth: 560, margin: '0 0 28px' }}>{e.intro}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {e.knows.map(k => (
                <span key={k} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, background: `${e.color}10`, border: `1px solid ${e.color}25`, color: e.color, fontWeight: 500 }}>{k}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 140, height: 140, borderRadius: 32, background: `${e.color}20`, border: `3px solid ${e.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, margin: '0 auto 16px' }}>
              {e.emoji}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{e.agentCount}</div>
            <div style={{ fontSize: 12, color: MUTED }}>AI Agents under command</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 48 }}>
          {[
            { label: 'Price', value: e.pricing.label },
            { label: 'Agents', value: `${e.agentCount}+` },
            { label: 'Scenarios', value: `${e.capabilities.reduce((n: number, c: any) => n + c.scenarios.length, 0)}+` },
            { label: 'Tool Groups', value: `${e.tools.length}` },
          ].map(s => (
            <div key={s.label} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>

          {/* Main content */}
          <div>

            {/* Capabilities */}
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 20 }}>What {e.name} can do</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {e.capabilities.map(cap => (
                  <div key={cap.area} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 20 }}>{cap.icon}</span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{cap.area}</div>
                        <div style={{ fontSize: 12, color: MUTED }}>{cap.blurb}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {cap.scenarios.map(s => (
                        <span key={s} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: `${e.color}08`, border: `1px solid ${e.color}15`, color: '#a1a1aa' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 20 }}>How it works</h2>
              <div style={{ display: 'grid', gap: 1 }}>
                {e.howItWorks.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: '20px', background: SURFACE, borderRadius: i === 0 ? '16px 16px 0 0' : i === e.howItWorks.length - 1 ? '0 0 16px 16px' : 0, border: `1px solid ${BORDER}`, borderTop: i > 0 ? 'none' : `1px solid ${BORDER}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${e.color}20`, border: `1px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: e.color }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{step.step}</div>
                      <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{step.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 20 }}>Integrated Tools</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {e.tools.map(tg => (
                  <div key={tg.category} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 16 }}>{tg.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{tg.category}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {tg.tools.map(t => (
                        <span key={t} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: MUTED }}>{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sticky sidebar */}
          <div style={{ position: 'sticky', top: 72 }}>
            <div style={{ background: SURFACE, border: `1px solid ${e.color}25`, borderRadius: 20, padding: 24 }}>
              <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>Starting at</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{e.pricing.label}</div>
                <div style={{ fontSize: 11, color: MUTED }}>per month</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {[
                  `${e.agentCount} specialized AI agents`,
                  'Real-time execution & monitoring',
                  'Email + Slack notifications',
                  'Weekly performance reports',
                  'Dedicated Setu support',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#a1a1aa' }}>
                    <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
              </div>

              <Link href={`/employees/${e.slug}/hire`} style={{ display: 'block', width: '100%', padding: '12px', borderRadius: 12, background: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', marginBottom: 10 }}>
                Hire {e.name} →
              </Link>
              <Link href={`/employees/${e.slug}/interview`} style={{ display: 'block', width: '100%', padding: '12px', borderRadius: 12, background: 'transparent', border: `1px solid ${e.color}40`, color: e.color, fontSize: 13, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
                Interview first (free)
              </Link>

              <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 11, color: MUTED, textAlign: 'center', lineHeight: 1.6 }}>
                  Free 30-min onboarding call · No long-term commitment · Cancel anytime
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Need something custom?</div>
              <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, marginBottom: 12 }}>Build your own AI Employee with our visual canvas and deploy it under your brand.</div>
              <Link href="/flows" style={{ display: 'block', padding: '9px', borderRadius: 10, background: 'transparent', border: `1px solid ${BORDER}`, color: '#818cf8', fontSize: 12, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
                Open Canvas →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: 64, borderRadius: 20, background: `linear-gradient(135deg, ${e.color}10, rgba(99,102,241,0.08))`, border: `1px solid ${e.color}20`, padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 8 }}>
            Ready to hire {e.name}?
          </div>
          <p style={{ fontSize: 15, color: MUTED, maxWidth: 480, margin: '0 auto 24px' }}>
            Start with a free interview to see exactly how {e.name} would handle your workflow, then hire when you're convinced.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/employees/${e.slug}/interview`} style={{ padding: '12px 24px', borderRadius: 12, background: SURFACE, border: `1px solid ${e.color}40`, color: e.color, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Interview {e.name} free
            </Link>
            <Link href={`/employees/${e.slug}/hire`} style={{ padding: '12px 24px', borderRadius: 12, background: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Hire Now →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
