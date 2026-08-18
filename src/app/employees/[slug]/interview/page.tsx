// @ts-nocheck
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEmployee, EMPLOYEES } from '@/lib/employees/profiles'
import InterviewClient from './_client'

export async function generateStaticParams() {
  return EMPLOYEES.map(e => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const e = getEmployee(slug)
  if (!e) return {}
  const BASE = 'https://setuagents.com'
  return {
    title: `Interview ${e.name} — AI ${e.title} | Setu`,
    description: `Chat live with ${e.name}, your AI ${e.title} commanding ${e.agentCount} specialist agents. Free interview — no credit card required.`,
    openGraph: {
      title: `Interview ${e.name} free — ${e.title}`,
      description: `See exactly how ${e.name} would handle your ${e.dept.toLowerCase()} before you hire.`,
      url: `${BASE}/employees/${e.slug}/interview`,
    },
    twitter: {
      card: 'summary',
      title: `Interview ${e.name} — AI ${e.title}`,
      description: `Free live chat with ${e.name}. ${e.agentCount} agents, ${e.pricing.label}.`,
    },
    alternates: { canonical: `${BASE}/employees/${e.slug}/interview` },
    robots: { index: true, follow: true },
  }
}

export default async function InterviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = getEmployee(slug)
  if (!e) notFound()
  return <InterviewClient slug={slug} />
}
