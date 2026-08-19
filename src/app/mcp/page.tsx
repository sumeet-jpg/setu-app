// @ts-nocheck
import type { Metadata } from 'next'
import Link from 'next/link'
import { SetuLogo } from '@/components/SetuLogo'

export const metadata: Metadata = {
  title: 'MCP Server — Setu AI Employees',
  description: 'Connect Claude, GPT-4, and any AI assistant to Setu AI Employees. Browse 100 employees, search by capability, get pricing, and hire — all via MCP.',
  openGraph: {
    title: 'Setu MCP Server — AI Employees for Any AI Assistant',
    description: 'Connect your AI assistant to 100 Setu AI Employees. 5 tools: list, search, profile, capabilities, hiring info.',
  },
}

const BG = '#09090b'
const BORDER = 'rgba(255,255,255,0.08)'
const SURFACE = 'rgba(255,255,255,0.04)'
const MUTED = '#71717a'

const TOOLS = [
  { name: 'list_employees', desc: 'Browse all 100 AI Employees with roles, departments, agent counts, and pricing.', params: 'dept? (optional filter)' },
  { name: 'get_employee', desc: 'Full profile: capabilities, tools, how-it-works, pricing, and hire links.', params: 'slug (required)' },
  { name: 'search_employees', desc: 'Natural language search — "who handles email campaigns?" or "CFO-level finance".', params: 'query?, dept?, max_budget_monthly?' },
  { name: 'get_capabilities', desc: 'Detailed capability areas with specific use-case scenarios for any employee.', params: 'slug (required)' },
  { name: 'get_hiring_info', desc: 'Pricing, onboarding timeline, and direct links to interview or hire.', params: 'slug (required)' },
]

const CODE_EXAMPLES = [
  {
    label: 'Claude Code',
    lang: 'bash',
    code: 'claude mcp add setu-employees --transport http https://setuagents.com/api/mcp',
  },
  {
    label: 'List tools',
    lang: 'bash',
    code: `curl -X POST https://setuagents.com/api/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`,
  },
  {
    label: 'Search employees',
    lang: 'bash',
    code: `curl -X POST https://setuagents.com/api/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_employees","arguments":{"query":"email marketing automation"}}}'`,
  },
  {
    label: 'Get hiring info',
    lang: 'bash',
    code: `curl -X POST https://setuagents.com/api/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_hiring_info","arguments":{"slug":"marketing-manager"}}}'`,
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Setu AI Employees MCP Server',
  description: 'MCP server exposing 100 AI Employees for Claude, GPT-4, and any MCP-compatible AI assistant',
  url: 'https://setuagents.com/mcp',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  provider: { '@type': 'Organization', name: 'Setu', url: 'https://setuagents.com' },
}

export default function McpPage() {
  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fafafa', fontFamily: 'var(--font-inter)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(9,9,11,0.9)', backdropFilter: 'blur(16px)' }}>
        <SetuLogo size={28} color="#22c55e" wordColor="#fafafa" />
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/employees" style={{ fontSize: 13, color: MUTED, textDecoration: 'none', padding: '6px 12px' }}>AI Employees</Link>
          <a href="https://setuagents.com/api/mcp" target="_blank" rel="noopener" style={{ padding: '7px 16px', borderRadius: 8, background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Connect MCP →
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 24px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', marginBottom: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8' }}>Live · MCP 2024-11-05</span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 16px', color: '#fff' }}>
            Setu AI Employees<br />
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Model Context Protocol
            </span>
          </h1>
          <p style={{ fontSize: 16, color: MUTED, maxWidth: 540, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Connect Claude, GPT-4, or any MCP-compatible assistant to 100 Setu AI Employees. Let your AI recommend the right employee, show capabilities, and guide users through hiring.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            {['100 AI Employees', '5 tools', 'JSON-RPC 2.0', 'CORS enabled', 'No auth required'].map(badge => (
              <span key={badge} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: SURFACE, border: `1px solid ${BORDER}`, color: '#a1a1aa' }}>
                {badge}
              </span>
            ))}
          </div>

          {/* Endpoint display */}
          <div style={{ display: 'inline-block', padding: '12px 20px', borderRadius: 12, background: SURFACE, border: `1px solid ${BORDER}`, fontFamily: 'monospace', fontSize: 14, color: '#818cf8' }}>
            POST https://setuagents.com/api/mcp
          </div>
        </div>

        {/* Quick connect */}
        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: 24, marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Quick Connect — Claude Code</div>
          <div style={{ background: '#0a0a0a', borderRadius: 10, padding: '14px 18px', fontFamily: 'monospace', fontSize: 13, color: '#a1a1aa', overflowX: 'auto', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#71717a' }}>$ </span>claude mcp add setu-employees <span style={{ color: '#86efac' }}>--transport http</span> https://setuagents.com/api/mcp
          </div>
        </div>

        {/* Tools grid */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 20 }}>5 Available Tools</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {TOOLS.map(t => (
              <div key={t.name} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '18px 20px', display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: 16, alignItems: 'center' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#818cf8', fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.55 }}>{t.desc}</div>
                <div style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{t.params}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Code examples */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 20 }}>Usage Examples</h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {CODE_EXAMPLES.map(ex => (
              <div key={ex.label} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 600, color: '#a1a1aa' }}>{ex.label}</div>
                <pre style={{ margin: 0, padding: '16px', fontFamily: 'monospace', fontSize: 12, color: '#e4e4e7', overflowX: 'auto', lineHeight: 1.65, background: 'transparent' }}>
                  {ex.code}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* OpenAI Custom Action schema */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>OpenAI Custom Action (GPT Builder)</h2>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 20 }}>Import this schema in the GPT Builder's "Actions" tab to connect any GPT to Setu AI Employees.</p>
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa' }}>openapi.json</span>
              <a href="/api/mcp/openapi.json" target="_blank" rel="noopener" style={{ fontSize: 11, color: '#818cf8', textDecoration: 'none' }}>Download →</a>
            </div>
            <pre style={{ margin: 0, padding: '16px', fontFamily: 'monospace', fontSize: 11, color: '#a1a1aa', overflowX: 'auto', lineHeight: 1.65 }}>
{`{
  "openapi": "3.1.0",
  "info": {
    "title": "Setu AI Employees",
    "version": "1.0.0",
    "description": "Browse and hire AI Employees"
  },
  "servers": [{ "url": "https://setuagents.com" }],
  "paths": {
    "/api/mcp": {
      "post": {
        "operationId": "callMcpTool",
        "requestBody": {
          "content": { "application/json": { "schema": { "$ref": "#/components/schemas/JsonRpcRequest" } } }
        },
        "responses": { "200": { "description": "Tool result" } }
      }
    }
  }
}`}
            </pre>
          </div>
        </div>

        {/* Submission links */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32, marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>Submit to AI Directories</h2>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 20 }}>Use these details to submit Setu's MCP server to AI assistant directories.</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { label: 'MCP Endpoint', value: 'https://setuagents.com/api/mcp' },
              { label: 'Protocol Version', value: '2024-11-05' },
              { label: 'Transport', value: 'HTTP (Streamable)' },
              { label: 'Authentication', value: 'None required' },
              { label: 'CORS', value: 'Enabled (* origin)' },
              { label: 'Tools', value: 'list_employees, get_employee, search_employees, get_capabilities, get_hiring_info' },
              { label: 'Contact', value: 'sumeet@setuagents.com' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', gap: 16, fontSize: 13, padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ color: MUTED, minWidth: 160, flexShrink: 0 }}>{r.label}</span>
                <span style={{ color: '#fff', fontFamily: r.label === 'MCP Endpoint' ? 'monospace' : 'inherit' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 16 }}>Questions about the MCP integration? Reach out directly.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/employees" style={{ padding: '12px 24px', borderRadius: 12, background: '#6366f1', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Browse AI Employees →
            </Link>
            <a href="mailto:sumeet@setuagents.com" style={{ padding: '12px 24px', borderRadius: 12, background: SURFACE, border: `1px solid ${BORDER}`, color: '#a1a1aa', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Contact Sumeet
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
