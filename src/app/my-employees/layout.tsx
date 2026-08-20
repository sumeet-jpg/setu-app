import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My AI Employees | Setu',
  description: 'Manage all your hired AI Employees — trial status, billing, chat, and memory.',
  robots: 'noindex',
}

export default function MyEmployeesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
