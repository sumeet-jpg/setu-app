// @ts-nocheck
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEmployee, EMPLOYEES } from '@/lib/employees/profiles'
import { SetuLogo } from '@/components/SetuLogo'

export async function generateStaticParams() {
  return EMPLOYEES.map(e => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = getEmployee(slug)
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

export default async function EmployeeProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = getEmployee(slug)
  if (!e) notFound()

  const BG = '#0F172A'
  const SURFACE = '#1E293B'
  const BORDER = 'rgba(148,163,184,0.1)'
  const MUTED = '#94A3B8'
  const DIM = '#475569'

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
          ...(typeof e.pricing.monthly === 'number' ? { price: e.pricing.monthly, priceCurrency: 'USD' } : {}),
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
    <div style={{ minHeight: '100vh', background: BG, color: '#F1F5F9', fontFamily: 'var(--font-inter)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        .setu-card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .setu-card-hover:hover { transform: translateY(-2px); box-shadow: 0 0 30px rgba(99,102,241,0.12), 0 12px 30px rgba(0,0,0,0.25); }
      `}</style>

      {/* Glassmorphic Nav */}
      <nav style={{
        borderBottom: `1px solid ${BORDER}`, padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <SetuLogo href="/" size={30} color="#22c55e" wordColor="#F1F5F9" />
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href={`/employees/${e.slug}/interview`} style={{ padding: '8px 18px', borderRadius: 10, background: 'transparent', border: `1px solid ${e.color}45`, color: e.color, fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-space)', letterSpacing: '-0.01em' }}>
            Interview {e.name}
          </Link>
          <Link href={`/employees/${e.slug}/hire`} style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.35)', fontFamily: 'var(--font-space)', letterSpacing: '-0.01em' }}>
            Hire Now →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${BORDER}`, padding: '56px 32px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(ellipse 80% 60% at 60% 0%, ${e.color}18 0%, transparent 60%)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'center', position: 'relative' }}>
          <div>
            <Link href="/employees" style={{ fontSize: 12, color: MUTED, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 24, letterSpacing: '-0.01em' }}>
              ← All Employees
            </Link>
            <div style={{ fontSize: 10, fontWeight: 700, color: e.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'var(--font-space)' }}>{e.dept}</div>
            <h1 style={{ fontSize: 'clamp(36px, 5.5vw, 60px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '0 0 10px', color: '#fff', fontFamily: 'var(--font-space)', lineHeight: 1.03 }}>
              {e.name}
            </h1>
            <div style={{ fontSize: 17, color: MUTED, marginBottom: 20, letterSpacing: '-0.01em' }}>{e.title} · {e.years} years experience</div>
            <p style={{ fontSize: 15.5, color: '#CBD5E1', lineHeight: 1.75, maxWidth: 560, margin: '0 0 28px' }}>{e.intro}</p>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {e.knows.map(k => (
                <span key={k} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 9, background: `${e.color}12`, border: `1px solid ${e.color}28`, color: e.color, fontWeight: 600 }}>{k}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ width: 148, height: 148, borderRadius: 36, background: `${e.color}18`, border: `2px solid ${e.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 68, margin: '0 auto 20px', boxShadow: `0 0 60px ${e.color}25` }}>
              {e.emoji}
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', fontFamily: 'var(--font-space)' }}>{e.agentCount}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>AI Agents under command</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginBottom: 48, borderRadius: 18, border: `1px solid ${BORDER}`, overflow: 'hidden', background: SURFACE }}>
          {[
            { label: 'Starting price', value: e.pricing.label },
            { label: 'AI Agents', value: `${e.agentCount}+` },
            { label: 'Scenarios', value: `${e.capabilities.reduce((n: number, c: any) => n + c.scenarios.length, 0)}+` },
            { label: 'Tool groups', value: `${e.tools.length}` },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: '24px', textAlign: 'center', borderLeft: i > 0 ? `1px solid ${BORDER}` : 'none' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', fontFamily: 'var(--font-space)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 4, letterSpacing: '0.02em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>

          {/* Main content */}
          <div>

            {/* Capabilities */}
            <div style={{ marginBottom: 52 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: 20, fontFamily: 'var(--font-space)' }}>What {e.name} can do</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                {e.capabilities.map(cap => (
                  <div key={cap.area} className="setu-card-hover" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 11, background: `${e.color}15`, border: `1px solid ${e.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cap.icon}</div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-space)', letterSpacing: '-0.02em' }}>{cap.area}</div>
                        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{cap.blurb}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {cap.scenarios.map(s => (
                        <span key={s} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: `${e.color}08`, border: `1px solid ${e.color}18`, color: '#94A3B8' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div style={{ marginBottom: 52 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: 20, fontFamily: 'var(--font-space)' }}>How it works</h2>
              <div style={{ display: 'grid', gap: 1 }}>
                {e.howItWorks.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: '22px', background: SURFACE, borderRadius: i === 0 ? '16px 16px 0 0' : i === e.howItWorks.length - 1 ? '0 0 16px 16px' : 0, border: `1px solid ${BORDER}`, borderTop: i > 0 ? 'none' : `1px solid ${BORDER}` }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${e.color}18`, border: `1px solid ${e.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: e.color, fontFamily: 'var(--font-space)' }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', marginBottom: 4, fontFamily: 'var(--font-space)', letterSpacing: '-0.02em' }}>{step.step}</div>
                      <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.65 }}>{step.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div style={{ marginBottom: 52 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: 20, fontFamily: 'var(--font-space)' }}>Integrated Tools</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {e.tools.map(tg => (
                  <div key={tg.category} className="setu-card-hover" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 17 }}>{tg.icon}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-space)' }}>{tg.category}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {tg.tools.map(t => (
                        <span key={t} style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 7, background: 'rgba(148,163,184,0.06)', color: MUTED, border: `1px solid ${BORDER}` }}>{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sticky sidebar */}
          <div style={{ position: 'sticky', top: 76 }}>
            <div style={{ background: SURFACE, border: `1px solid ${e.color}30`, borderRadius: 22, padding: 26, boxShadow: `0 0 40px ${e.color}10` }}>
              <div style={{ textAlign: 'center', marginBottom: 22, paddingBottom: 22, borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 11, color: MUTED, marginBottom: 6, letterSpacing: '0.04em' }}>Starting at</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-0.05em', fontFamily: 'var(--font-space)' }}>{e.pricing.label}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>per month</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
                {[
                  `${e.agentCount} specialized AI agents`,
                  'Real-time execution & monitoring',
                  'Email + Slack notifications',
                  'Weekly performance reports',
                  'Dedicated Setu support',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#CBD5E1' }}>
                    <span style={{ color: '#22c55e', flexShrink: 0, fontSize: 12 }}>✓</span> {f}
                  </div>
                ))}
              </div>

              <Link href={`/employees/${e.slug}/hire`} style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', marginBottom: 10, boxShadow: '0 6px 24px rgba(99,102,241,0.4)', fontFamily: 'var(--font-space)', letterSpacing: '-0.01em', boxSizing: 'border-box' }}>
                Hire {e.name} →
              </Link>
              <Link href={`/employees/${e.slug}/interview`} style={{ display: 'block', width: '100%', padding: '12px', borderRadius: 12, background: 'transparent', border: `1px solid ${e.color}40`, color: e.color, fontSize: 13, fontWeight: 600, textDecoration: 'none', textAlign: 'center', fontFamily: 'var(--font-space)', boxSizing: 'border-box' }}>
                Interview first (free)
              </Link>

              <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 11, color: DIM, textAlign: 'center', lineHeight: 1.7 }}>
                  Free 30-min onboarding call · No long-term commitment · Cancel anytime
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 8, fontFamily: 'var(--font-space)', letterSpacing: '-0.02em' }}>Need something custom?</div>
              <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.65, marginBottom: 14 }}>Build your own AI Employee with our visual canvas and deploy it under your brand.</div>
              <Link href="/flows" style={{ display: 'block', padding: '10px', borderRadius: 10, background: 'transparent', border: `1px solid ${BORDER}`, color: '#818cf8', fontSize: 12, fontWeight: 600, textDecoration: 'none', textAlign: 'center', fontFamily: 'var(--font-space)' }}>
                Open Canvas →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: 72, borderRadius: 24, background: `linear-gradient(135deg, ${e.color}10, rgba(99,102,241,0.08))`, border: `1px solid ${e.color}22`, padding: '52px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '300px', background: `radial-gradient(ellipse, ${e.color}15 0%, transparent 60%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', marginBottom: 12, fontFamily: 'var(--font-space)' }}>
              Ready to hire {e.name}?
            </div>
            <p style={{ fontSize: 15, color: MUTED, maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.65 }}>
              Start with a free interview to see exactly how {e.name} would handle your workflow, then hire when you're convinced.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href={`/employees/${e.slug}/interview`} style={{ padding: '13px 28px', borderRadius: 12, background: SURFACE, border: `1px solid ${e.color}40`, color: e.color, fontSize: 14, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-space)' }}>
                Interview {e.name} free
              </Link>
              <Link href={`/employees/${e.slug}/hire`} style={{ padding: '13px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 6px 24px rgba(99,102,241,0.4)', fontFamily: 'var(--font-space)' }}>
                Hire Now →
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
