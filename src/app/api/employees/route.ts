// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { EMPLOYEES, getEmployee } from '@/lib/employees/profiles'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dept = searchParams.get('dept')
  const q = searchParams.get('q')?.toLowerCase()

  let employees = EMPLOYEES

  if (dept) {
    employees = employees.filter(e => e.dept.toLowerCase() === dept.toLowerCase())
  }

  if (q) {
    employees = employees.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.dept.toLowerCase().includes(q) ||
      e.tagline.toLowerCase().includes(q) ||
      e.knows.some(k => k.toLowerCase().includes(q))
    )
  }

  return NextResponse.json(
    employees.map(e => ({
      slug: e.slug,
      name: e.name,
      title: e.title,
      dept: e.dept,
      emoji: e.emoji,
      color: e.color,
      years: e.years,
      tagline: e.tagline,
      agentCount: e.agentCount,
      pricing: e.pricing,
      knows: e.knows,
      profile_url: `https://setuagents.com/employees/${e.slug}`,
      interview_url: `https://setuagents.com/employees/${e.slug}/interview`,
      hire_url: `https://setuagents.com/employees/${e.slug}/hire`,
    })),
    { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } }
  )
}
