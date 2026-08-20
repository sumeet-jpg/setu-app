import { Metadata } from 'next'
import { getEmployee } from '@/lib/employees/profiles'
import MemoryClient from './_client'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const e = getEmployee(params.slug)
  return { title: e ? `${e.name} · Memory` : 'Memory' }
}

export default function MemoryPage({ params }: { params: { slug: string } }) {
  const e = getEmployee(params.slug)
  if (!e) return <div style={{ padding: 40, color: '#fff' }}>Employee not found.</div>
  return <MemoryClient slug={params.slug} employeeName={e.name} employeeEmoji={e.emoji} />
}
