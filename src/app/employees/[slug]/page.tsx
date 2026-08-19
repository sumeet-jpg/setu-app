// @ts-nocheck
import { notFound } from 'next/navigation'
import { getEmployee, EMPLOYEES, getStuntTitle } from '@/lib/employees/profiles'
import EmployeeWorkspace from './_workspace'

export async function generateStaticParams() {
  return EMPLOYEES.map(e => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = getEmployee(slug)
  if (!e) return {}
  const BASE = 'https://setuagents.com'
  const stunt = getStuntTitle(e.name)
  return {
    title: `${e.name} — ${e.title} ${stunt} | Setu`,
    description: `${e.tagline} Commands ${e.agentCount} specialized AI agents. Starting at ${e.pricing.label}.`,
    openGraph: {
      title: `${e.name} — Your ${e.title} ${stunt} | Setu`,
      description: e.tagline,
      url: `${BASE}/employees/${e.slug}`,
      siteName: 'Setu AI Employees',
      type: 'profile',
    },
    twitter: { card: 'summary_large_image', title: `${e.name} — AI ${e.title}`, description: e.tagline },
    alternates: { canonical: `${BASE}/employees/${e.slug}` },
    keywords: [e.name, e.title, e.dept, 'AI employee', 'hire AI', 'Setu', ...e.knows],
  }
}

export default async function EmployeeProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = getEmployee(slug)
  if (!e) notFound()

  const BASE = 'https://setuagents.com'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${e.name} — AI ${e.title}`,
    description: e.tagline,
    provider: { '@type': 'Organization', name: 'Setu', url: BASE },
    offers: {
      '@type': 'Offer',
      ...(typeof e.pricing.monthly === 'number' ? { price: e.pricing.monthly, priceCurrency: 'USD' } : {}),
    },
    serviceType: 'AI Employee',
    category: e.dept,
  }

  const employeeData = {
    slug: e.slug,
    name: e.name,
    title: e.title,
    dept: e.dept,
    emoji: e.emoji,
    color: e.color,
    years: e.years,
    tagline: e.tagline,
    intro: e.intro,
    agentCount: e.agentCount,
    pricing: e.pricing,
    knows: e.knows,
    capabilities: e.capabilities,
    tools: e.tools,
    howItWorks: e.howItWorks,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <EmployeeWorkspace employee={employeeData} />
    </>
  )
}
