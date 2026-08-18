// @ts-nocheck
/**
 * Setu AI Employees — MCP Server (Streamable HTTP)
 *
 * Protocol: MCP (Model Context Protocol) over HTTP
 * Spec: https://modelcontextprotocol.io/specification
 *
 * Tools exposed:
 *   list_employees        — browse all 100 AI employees
 *   get_employee          — full profile for one employee
 *   search_employees      — filter by dept, keyword, or budget
 *   get_capabilities      — what a specific employee can do
 *   get_hiring_info       — pricing and next steps to hire
 *
 * Usage:
 *   Claude Code: claude mcp add --transport http https://setuagents.com/api/mcp
 *   OpenAI: use as a custom action endpoint
 *   Direct: POST https://setuagents.com/api/mcp
 */

import { NextRequest, NextResponse } from 'next/server'
import { EMPLOYEES, getEmployee, groupByDept, DEPT_ORDER } from '@/lib/employees/profiles'

export const runtime = 'nodejs'

// ── JSON-RPC helpers ──────────────────────────────────────────────────────────

function rpcOk(id: string | number | null, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result })
}

function rpcError(id: string | number | null, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } })
}

// ── Server metadata ───────────────────────────────────────────────────────────

const SERVER_INFO = {
  name: 'setu-ai-employees',
  version: '1.0.0',
  protocolVersion: '2024-11-05',
}

const SERVER_CAPABILITIES = {
  tools: {},
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'list_employees',
    description: 'List all 100 available AI Employees from Setu. Each employee commands a fleet of specialized agents and covers a specific business function. Use this to browse what\'s available before recommending one to a user.',
    inputSchema: {
      type: 'object',
      properties: {
        dept: {
          type: 'string',
          description: 'Optional: filter by department. One of: Executive, Revenue Operations, Sales, Marketing, Finance, Customer Success, Customer Support, Operations, Product, Compliance & Legal, Legal Operations, People Operations, IT Operations, Analytics, Security',
        },
      },
    },
  },
  {
    name: 'get_employee',
    description: 'Get the full profile of a specific AI Employee including their capabilities, tools they integrate with, how they work, and pricing. Use this when a user wants details about a specific employee before hiring.',
    inputSchema: {
      type: 'object',
      required: ['slug'],
      properties: {
        slug: {
          type: 'string',
          description: 'The employee slug, e.g. "marketing-manager", "cfo-intelligence", "revenue-ops-lead". Get slugs from list_employees.',
        },
      },
    },
  },
  {
    name: 'search_employees',
    description: 'Search for AI Employees that match a specific need. Use this when a user describes what they want help with (e.g. "I need help with email campaigns" or "who handles financial reporting?"). Returns the best-matching employees.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'What the user needs help with — natural language is fine',
        },
        max_budget_monthly: {
          type: 'number',
          description: 'Optional: maximum monthly budget in USD (e.g. 1999)',
        },
        dept: {
          type: 'string',
          description: 'Optional: filter by department',
        },
      },
    },
  },
  {
    name: 'get_capabilities',
    description: 'Get the detailed capability areas and specific scenarios an AI Employee handles. Use this to give a user concrete examples of what an employee would do for them day-to-day.',
    inputSchema: {
      type: 'object',
      required: ['slug'],
      properties: {
        slug: {
          type: 'string',
          description: 'Employee slug (e.g. "marketing-manager")',
        },
      },
    },
  },
  {
    name: 'get_hiring_info',
    description: 'Get pricing, onboarding timeline, and direct links to hire or interview a specific AI Employee. Use this when a user is ready to take action and hire.',
    inputSchema: {
      type: 'object',
      required: ['slug'],
      properties: {
        slug: {
          type: 'string',
          description: 'Employee slug (e.g. "marketing-manager")',
        },
      },
    },
  },
]

// ── Tool implementations ──────────────────────────────────────────────────────

function callListEmployees(args: { dept?: string }) {
  let employees = EMPLOYEES
  if (args.dept) {
    employees = employees.filter(e => e.dept.toLowerCase() === args.dept!.toLowerCase())
  }

  const list = employees.map(e => ({
    slug: e.slug,
    name: e.name,
    title: e.title,
    dept: e.dept,
    emoji: e.emoji,
    tagline: e.tagline,
    agent_count: e.agentCount,
    price: e.pricing.label,
    top_skills: e.knows.slice(0, 4),
  }))

  const departments = [...new Set(employees.map(e => e.dept))]

  return {
    total: list.length,
    departments,
    employees: list,
    _note: 'To get full profile + capabilities for an employee, call get_employee with their slug',
  }
}

function callGetEmployee(args: { slug: string }) {
  const e = getEmployee(args.slug)
  if (!e) {
    return { error: `No employee found with slug "${args.slug}". Call list_employees to see valid slugs.` }
  }

  return {
    slug: e.slug,
    name: e.name,
    title: e.title,
    dept: e.dept,
    emoji: e.emoji,
    years_experience: e.years,
    tagline: e.tagline,
    intro: e.intro,
    agent_count: e.agentCount,
    pricing: e.pricing,
    expertise: e.knows,
    capability_areas: e.capabilities.map(c => ({
      area: c.area,
      blurb: c.blurb,
      scenario_count: c.scenarios.length,
    })),
    tool_categories: e.tools.map(t => ({ category: t.category, tools: t.tools })),
    how_it_works: e.howItWorks,
    interview_url: `https://setuagents.com/employees/${e.slug}/interview`,
    hire_url: `https://setuagents.com/employees/${e.slug}/hire`,
    profile_url: `https://setuagents.com/employees/${e.slug}`,
  }
}

function callSearchEmployees(args: { query?: string; max_budget_monthly?: number; dept?: string }) {
  let employees = EMPLOYEES

  if (args.dept) {
    employees = employees.filter(e => e.dept.toLowerCase().includes(args.dept!.toLowerCase()))
  }

  if (typeof args.max_budget_monthly === 'number') {
    employees = employees.filter(e =>
      typeof e.pricing.monthly === 'number' && e.pricing.monthly <= args.max_budget_monthly!
    )
  }

  if (args.query) {
    const q = args.query.toLowerCase()
    const scored = employees.map(e => {
      let score = 0
      if (e.title.toLowerCase().includes(q)) score += 10
      if (e.dept.toLowerCase().includes(q)) score += 8
      if (e.tagline.toLowerCase().includes(q)) score += 5
      if (e.intro.toLowerCase().includes(q)) score += 4
      if (e.knows.some(k => k.toLowerCase().includes(q))) score += 6
      if (e.capabilities.some(c => c.area.toLowerCase().includes(q) || c.blurb.toLowerCase().includes(q))) score += 5
      if (e.capabilities.some(c => c.scenarios.some(s => s.toLowerCase().includes(q)))) score += 3
      return { e, score }
    })
    employees = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.e)
  }

  return {
    query: args.query,
    filters: { dept: args.dept, max_budget: args.max_budget_monthly },
    matches: employees.slice(0, 5).map(e => ({
      slug: e.slug,
      name: e.name,
      title: e.title,
      dept: e.dept,
      tagline: e.tagline,
      price: e.pricing.label,
      agent_count: e.agentCount,
      profile_url: `https://setuagents.com/employees/${e.slug}`,
      interview_url: `https://setuagents.com/employees/${e.slug}/interview`,
    })),
    _suggestion: employees.length > 0 ? `Call get_employee("${employees[0].slug}") to see full capabilities of the top match` : 'No matches found — try a broader search term',
  }
}

function callGetCapabilities(args: { slug: string }) {
  const e = getEmployee(args.slug)
  if (!e) {
    return { error: `No employee found with slug "${args.slug}"` }
  }

  return {
    employee: e.name,
    title: e.title,
    agent_count: e.agentCount,
    capabilities: e.capabilities.map(c => ({
      area: c.area,
      description: c.blurb,
      specific_scenarios: c.scenarios,
    })),
    integrated_tools: e.tools.flatMap(t => t.tools),
    interview_free: true,
    interview_url: `https://setuagents.com/employees/${e.slug}/interview`,
    hire_url: `https://setuagents.com/employees/${e.slug}/hire`,
  }
}

function callGetHiringInfo(args: { slug: string }) {
  const e = getEmployee(args.slug)
  if (!e) {
    return { error: `No employee found with slug "${args.slug}"` }
  }

  return {
    employee: e.name,
    title: e.title,
    pricing: {
      monthly: e.pricing.monthly,
      label: e.pricing.label,
      billing: 'monthly subscription, cancel anytime',
    },
    what_is_included: [
      `${e.agentCount} pre-trained specialist AI agents`,
      'Free onboarding call with Setu team',
      'Custom workflow configuration for your stack',
      'Email + Slack integration',
      'Weekly performance reports',
      '30-day satisfaction guarantee',
    ],
    onboarding_timeline: [
      'Day 1: Sumeet reaches out within 24h of hire request',
      `Day 2-3: ${e.name}'s agent fleet configured for your specific tech stack`,
      'Day 4-5: Onboarding call — first agents go live',
    ],
    next_steps: {
      interview_free: `https://setuagents.com/employees/${e.slug}/interview`,
      hire_now: `https://setuagents.com/employees/${e.slug}/hire`,
      view_full_profile: `https://setuagents.com/employees/${e.slug}`,
    },
    contact: 'sumeet@setuagents.com',
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      { headers: corsHeaders }
    )
  }

  const { id, method, params } = body

  let response: NextResponse

  if (method === 'initialize') {
    response = rpcOk(id, {
      protocolVersion: SERVER_INFO.protocolVersion,
      serverInfo: SERVER_INFO,
      capabilities: SERVER_CAPABILITIES,
    })
  } else if (method === 'tools/list') {
    response = rpcOk(id, { tools: TOOLS })
  } else if (method === 'tools/call') {
    const { name, arguments: args = {} } = params ?? {}

    let result: unknown
    try {
      switch (name) {
        case 'list_employees':
          result = callListEmployees(args)
          break
        case 'get_employee':
          result = callGetEmployee(args)
          break
        case 'search_employees':
          result = callSearchEmployees(args)
          break
        case 'get_capabilities':
          result = callGetCapabilities(args)
          break
        case 'get_hiring_info':
          result = callGetHiringInfo(args)
          break
        default: {
          const errResp = rpcError(id, -32601, `Unknown tool: ${name}`)
          const errHeaders = new Headers(errResp.headers)
          Object.entries(corsHeaders).forEach(([k, v]) => errHeaders.set(k, v))
          return new NextResponse(errResp.body, { status: errResp.status, headers: errHeaders })
        }
      }
    } catch (err: any) {
      const errResp = rpcError(id, -32000, err.message ?? 'Tool execution failed')
      const errHeaders = new Headers(errResp.headers)
      Object.entries(corsHeaders).forEach(([k, v]) => errHeaders.set(k, v))
      return new NextResponse(errResp.body, { status: errResp.status, headers: errHeaders })
    }

    response = rpcOk(id, {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    })
  } else if (method === 'notifications/initialized') {
    // Client notification, no response needed
    return new NextResponse(null, { status: 204, headers: corsHeaders })
  } else {
    response = rpcError(id, -32601, `Method not found: ${method}`)
  }

  // Add CORS headers
  const headers = new Headers(response.headers)
  Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v))

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  })
}

export async function GET(req: NextRequest) {
  // MCP discovery endpoint — returns server info for clients
  return NextResponse.json({
    name: SERVER_INFO.name,
    version: SERVER_INFO.version,
    description: 'Setu AI Employees — Browse and hire AI Employees that command fleets of specialized agents',
    protocol: 'mcp',
    protocol_version: SERVER_INFO.protocolVersion,
    endpoint: 'https://setuagents.com/api/mcp',
    tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
    usage: {
      claude_code: 'claude mcp add setu-employees --transport http https://setuagents.com/api/mcp',
      curl: 'curl -X POST https://setuagents.com/api/mcp -H "Content-Type: application/json" -d \'{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\'',
    },
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
