import { Metadata } from 'next'
import { getEmployee } from '@/lib/employees/profiles'
import MemoryClient from './_client'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const e = getEmployee(slug)
  return { title: e ? `${e.name} · Memory` : 'Memory' }
}

export default async function MemoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = getEmployee(slug)
  if (!e) return <div style={{ padding: 40, color: '#fff' }}>Employee not found.</div>
  return <MemoryClient slug={slug} employeeName={e.name} employeeEmoji={e.emoji} />
}
