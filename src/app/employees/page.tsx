// @ts-nocheck
import type { Metadata } from 'next'
import EmployeesClient from './_client'

const BASE = 'https://setuagents.com'

export const metadata: Metadata = {
  title: 'Hire AI Employees — Browse 100 Roles | Setu',
  description: '100 AI Employees ready to hire. WhatsApp bots to CMO, CFO, COO. Every business function covered. Interview any of them free.',
  openGraph: {
    title: 'Browse 100 AI Employees — Setu',
    description: 'Interview any AI Employee free. 100 roles, 31–312 agents each, starting at $199/mo.',
    url: `${BASE}/employees`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse 100 AI Employees — Setu',
    description: '100 AI Employees commanding 10,000+ agents. Interview free.',
  },
  alternates: { canonical: `${BASE}/employees` },
  keywords: ['AI employees', 'hire AI', 'AI marketing manager', 'AI CFO', 'AI agents', 'business automation', 'AI team for hire', 'Setu'],
}

export default function EmployeesPage() {
  return <EmployeesClient />
}
