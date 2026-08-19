// @ts-nocheck
import type { Metadata } from 'next'
import EmployeesClient from './_client'

const BASE = 'https://setuagents.com'

export const metadata: Metadata = {
  title: 'Hire Your AI Employee — Business Specialists | Setu',
  description: 'AI Employees ready to hire. Your CMO, CFO, COO — they do the work, you take the credit. Interview any of them free.',
  openGraph: {
    title: 'Browse AI Employees — Setu',
    description: 'Interview your AI Employee free. Multiple roles, 31–312 agents each, starting from BYOK.',
    url: `${BASE}/employees`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse AI Employees — Setu',
    description: 'AI Employees commanding 10,000+ agents. Interview free.',
  },
  alternates: { canonical: `${BASE}/employees` },
  keywords: ['AI employee', 'AI CMO', 'AI CFO', 'AI agents', 'business automation', 'hire AI', 'Setu'],
}

export default function EmployeesPage() {
  return <EmployeesClient />
}
