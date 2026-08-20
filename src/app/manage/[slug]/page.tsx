import { getEmployee } from '@/lib/employees/profiles'
import ManageClient from './_client'

export default function ManagePage({ params }: { params: { slug: string } }) {
  const employee = getEmployee(params.slug)
  if (!employee) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0D14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤔</div>
          <p style={{ color: '#64748b' }}>Employee not found</p>
        </div>
      </div>
    )
  }
  return (
    <ManageClient
      slug={employee.slug}
      employeeName={employee.name}
      employeeEmoji={employee.emoji}
      employeeTitle={employee.title}
      employeeColor={employee.color}
      agentCount={employee.agentCount}
    />
  )
}
