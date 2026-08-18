// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getEmployee } from '@/lib/employees/profiles'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = getEmployee(slug)

  if (!e) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  return NextResponse.json(
    {
      slug: e.slug,
      name: e.name,
      title: e.title,
      dept: e.dept,
      emoji: e.emoji,
      color: e.color,
      years: e.years,
      tagline: e.tagline,
      intro: e.intro,
      agentCount: e.agentCount,
      pricing: e.pricing,
      knows: e.knows,
      capabilities: e.capabilities,
      tools: e.tools,
      howItWorks: e.howItWorks,
      profile_url: `https://setuagents.com/employees/${e.slug}`,
      interview_url: `https://setuagents.com/employees/${e.slug}/interview`,
      hire_url: `https://setuagents.com/employees/${e.slug}/hire`,
    },
    { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } }
  )
}
