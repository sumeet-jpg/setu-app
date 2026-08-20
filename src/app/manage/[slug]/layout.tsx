import type { Metadata } from 'next'
import { getEmployee } from '@/lib/employees/profiles'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const e = getEmployee(slug)
  if (!e) return { title: 'Manage Employee | Setu' }
  return {
    title: `Manage ${e.name} — ${e.title} | Setu`,
    description: `Your ${e.name} management hub. Chat, review memory, calibrate trust, and manage your subscription.`,
    robots: 'noindex',
  }
}

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
