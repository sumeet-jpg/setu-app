// @ts-nocheck
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEmployee, EMPLOYEES } from '@/lib/employees/profiles'
import HireClient from './_client'

export async function generateStaticParams() {
  return EMPLOYEES.map(e => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const e = getEmployee(slug)
  if (!e) return {}
  const BASE = 'https://setuagents.com'
  return {
    title: `Hire ${e.name} — AI ${e.title} | Setu`,
    description: `Hire ${e.name} as your AI ${e.title}. Commands ${e.agentCount} specialist agents. Starting at ${e.pricing.label}. Onboarding in 5 days. No credit card required to start.`,
    openGraph: {
      title: `Hire ${e.name} — AI ${e.title}`,
      description: `${e.agentCount} agents. ${e.pricing.label}. Interview free, hire when ready.`,
      url: `${BASE}/employees/${e.slug}/hire`,
    },
    twitter: {
      card: 'summary',
      title: `Hire ${e.name} — AI ${e.title}`,
      description: `${e.agentCount} agents. ${e.pricing.label}. Go live in 5 days.`,
    },
    alternates: { canonical: `${BASE}/employees/${e.slug}/hire` },
  }
}

export default async function HirePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = getEmployee(slug)
  if (!e) notFound()
  return <HireClient slug={slug} />
}
