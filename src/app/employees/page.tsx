// @ts-nocheck
import type { Metadata } from 'next'
import EmployeesClient from './_client'

const BASE = 'https://setuagents.com'

export const metadata: Metadata = {
  title: 'Hire Your Stuntman — 100 Business Specialists | Setu',
  description: '100 Stuntmen & Stuntwomen ready to hire. Your CMO, CFO, COO — they do the work, you take the credit. Interview any of them free.',
  openGraph: {
    title: 'Browse 100 Stuntmen & Stuntwomen — Setu',
    description: 'Interview your Stuntman free. 100 roles, 31–312 agents each, starting at $199/mo.',
    url: `${BASE}/employees`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse 100 Business Stuntmen & Stuntwomen — Setu',
    description: '100 Stuntmen & Stuntwomen commanding 10,000+ agents. Interview free.',
  },
  alternates: { canonical: `${BASE}/employees` },
  keywords: ['stuntman', 'stuntwoman', 'AI CMO', 'AI CFO', 'AI agents', 'business automation', 'hire AI', 'Setu'],
}

export default function EmployeesPage() {
  return <EmployeesClient />
}
