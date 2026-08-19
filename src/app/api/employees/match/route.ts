// @ts-nocheck
// POST /api/employees/match — keyword-score the EMPLOYEES catalog against a free-text problem
// Returns top 5 matches with scores and reasons. No DB, no LLM — deterministic.

import { NextRequest, NextResponse } from 'next/server'
import { EMPLOYEES } from '@/lib/employees/profiles'

const DEPT_KEYWORDS: Record<string, string[]> = {
  'Marketing':          ['marketing', 'campaign', 'seo', 'email', 'ads', 'social', 'brand', 'content', 'influencer', 'growth', 'lead generation', 'demand gen', 'conversion', 'traffic'],
  'Sales':              ['sales', 'leads', 'pipeline', 'deals', 'crm', 'outbound', 'cold email', 'prospecting', 'quota', 'close', 'revenue', 'sdrs', 'follow up', 'follow-up'],
  'Finance':            ['finance', 'invoice', 'accounting', 'reconcili', 'cash flow', 'expenses', 'budget', 'payroll', 'tax', 'cfo', 'bookkeeping', 'payment', 'runway'],
  'Customer Success':   ['churn', 'retention', 'nps', 'onboarding', 'renewal', 'customer success', 'account management', 'upsell', 'satisfaction', 'support tickets'],
  'Customer Support':   ['support', 'tickets', 'helpdesk', 'refund', 'complaints', 'response time', 'customer service', 'queries', 'zendesk', 'freshdesk'],
  'HR':                 ['hiring', 'recruiting', 'hr', 'onboarding', 'employee', 'talent', 'culture', 'performance review', 'payroll', 'headcount', 'people ops'],
  'Operations':         ['operations', 'process', 'efficiency', 'workflow', 'supply chain', 'logistics', 'vendor', 'procurement', 'cost reduction', 'automation', 'ops'],
  'IT':                 ['it', 'tech', 'security', 'incident', 'saas', 'software', 'licens', 'infrastructure', 'devops', 'cloud', 'access'],
  'Executive':          ['strategy', 'board', 'investor', 'fundraising', 'coo', 'cmo', 'cfo', 'cto', 'chief', 'leadership', 'okr', 'kpi'],
  'Legal':              ['legal', 'compliance', 'contract', 'soc2', 'gdpr', 'audit', 'regulatory', 'risk'],
  'Data':               ['data', 'analytics', 'dashboard', 'report', 'metrics', 'kpi', 'sql', 'bi', 'insight', 'trend'],
  'Product':            ['product', 'roadmap', 'feature', 'sprint', 'backlog', 'pm', 'user research', 'priorit'],
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[\s,\.;!?\/\-_]+/).filter(w => w.length > 2)
}

function scoreEmployee(e: any, tokens: string[], rawProblem: string): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []
  const lc = rawProblem.toLowerCase()

  // 1. Department keyword match (up to 35pts)
  const deptKey = Object.keys(DEPT_KEYWORDS).find(d =>
    e.dept?.toLowerCase().includes(d.toLowerCase()) ||
    d.toLowerCase().includes(e.dept?.toLowerCase())
  )
  if (deptKey) {
    const hits = DEPT_KEYWORDS[deptKey].filter(kw => lc.includes(kw))
    if (hits.length > 0) {
      const pts = Math.min(35, hits.length * 8)
      score += pts
      reasons.push(`Matches your ${hits[0]} need`)
    }
  }

  // 2. Tool name overlap (up to 20pts)
  const toolNames: string[] = []
  for (const grp of (e.tools ?? [])) {
    for (const t of (grp.tools ?? [])) toolNames.push(t.toLowerCase())
  }
  const toolHits = tokens.filter(tok => toolNames.some(tn => tn.includes(tok) || tok.includes(tn.split(' ')[0])))
  if (toolHits.length > 0) {
    const pts = Math.min(20, toolHits.length * 7)
    score += pts
    reasons.push(`Uses ${toolHits[0]} natively`)
  }

  // 3. Knows / domain keywords (up to 20pts)
  const knows = (e.knows ?? []).map((k: string) => k.toLowerCase())
  const knowHits = tokens.filter(tok => knows.some(k => k.includes(tok) || tok.includes(k.split(' ')[0])))
  if (knowHits.length > 0) {
    const pts = Math.min(20, knowHits.length * 5)
    score += pts
    reasons.push(`Expert in ${(e.knows ?? [])[0] ?? 'this area'}`)
  }

  // 4. Tagline word hits (up to 15pts)
  const taglineWords = tokenize(e.tagline ?? '')
  const tagHits = tokens.filter(tok => taglineWords.includes(tok))
  if (tagHits.length > 0) {
    score += Math.min(15, tagHits.length * 4)
  }

  // 5. Capability area hits (up to 10pts)
  const capText = (e.capabilities ?? []).map((c: any) =>
    [c.area ?? '', ...(c.scenarios ?? [])].join(' ')
  ).join(' ').toLowerCase()
  const capHits = tokens.filter(tok => capText.includes(tok))
  if (capHits.length > 0) {
    score += Math.min(10, capHits.length * 2)
  }

  return { score, reasons }
}

export async function POST(req: NextRequest) {
  try {
    const { problem } = await req.json()
    if (!problem || typeof problem !== 'string' || problem.trim().length < 3) {
      return NextResponse.json({ error: 'problem is required' }, { status: 400 })
    }

    const tokens = tokenize(problem)
    const maxScore = 35 + 20 + 20 + 15 + 10

    const scored = EMPLOYEES
      .map(e => {
        const { score, reasons } = scoreEmployee(e, tokens, problem)
        return { e, score, reasons }
      })
      .filter(r => r.score >= 10)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    if (scored.length === 0) {
      return NextResponse.json({ matches: [], problem })
    }

    const topScore = scored[0].score
    const matches = scored.map(({ e, score, reasons }) => ({
      slug: e.slug,
      name: e.name,
      title: e.title,
      dept: e.dept,
      emoji: e.emoji,
      color: e.color,
      tagline: e.tagline,
      pricing: e.pricing,
      agentCount: e.agentCount,
      years: e.years,
      confidence: Math.min(95, Math.round((score / maxScore) * 100)),
      reasons: reasons.slice(0, 2),
    }))

    return NextResponse.json({ matches, problem })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
