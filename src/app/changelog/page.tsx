import type { Metadata } from 'next'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'

const BASE = 'https://setuagents.com'

export const metadata: Metadata = {
  title: 'Changelog — Setu',
  description: 'What shipped, when. A real log of Setu product updates.',
  alternates: { canonical: `${BASE}/changelog` },
}

const BG = '#F6F5F1', WHITE = '#FFFFFF', INK = '#0D0C09', GREEN = '#0E5C34'
const GRAY = '#E3E1DA', MUTED = '#78746E', DIM = '#9E9891', F = 'var(--font-jakarta)'

const ENTRIES: { date: string; items: string[] }[] = [
  {
    date: 'August 21, 2026',
    items: [
      'Security hardening pass: closed session-token gaps on subscription, memory, and vault data; locked down database access on five tables that were readable with just the public API key.',
      'Self-serve trial resume now requires a real payment — a cancelled or expired trial can no longer be reactivated for free.',
      'Recovery links now expire after 48 hours instead of never.',
      'Added Privacy Policy, Terms of Service, About, and Contact pages.',
      'Every AI Employee is now clearly priced at $49/month everywhere on the site — cleaned up old inconsistent pricing on the comparison, enterprise, and WhatsApp pages.',
    ],
  },
  {
    date: 'August 20, 2026',
    items: [
      'Self-service management hub: activate, pause, resume, or cancel your subscription without emailing anyone.',
      'Trial lifecycle emails — check-in on day 3, a reminder before your rate locks in, and a re-engagement email if your trial lapses.',
      'Email recovery — lost your management link? Get it re-sent to your inbox.',
      'WhatsApp activation as a self-serve alternative to card payment.',
      'Admin dashboard shows trial count, active subscriptions, and MRR at a glance.',
    ],
  },
  {
    date: 'August 19, 2026',
    items: [
      'Expanded from 20 to all 100 AI Employees across every business function — Marketing, Finance, Ops, Sales, HR, and the C-Suite.',
      'Real agentic execution engine — employees can now propose and (with your approval) execute actions, not just talk.',
      'Deep, role-specific system prompts for every employee — real frameworks, tool fluency, and domain boundaries so an employee stays in their lane.',
      'Problem-to-employee matcher — describe what you need in plain English, get matched to the right specialist.',
      'Employee prospectus pages — full capability breakdown before you commit to an interview.',
    ],
  },
  {
    date: 'August 18, 2026',
    items: [
      'Setu launches: 20 AI Employees, live free interviews before you hire, and an MCP server for programmatic access.',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: F, lineHeight: 1.6 }}>
      <Nav theme="light" />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(48px,8vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Changelog</div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 12px' }}>What shipped, when</h1>
        <p style={{ fontSize: 15, color: MUTED, marginBottom: 56, maxWidth: 480 }}>
          A real log, not a highlight reel — pulled straight from what actually went out.
        </p>

        {ENTRIES.map((entry, i) => (
          <div key={entry.date} style={{ display: 'flex', gap: 28, marginBottom: i === ENTRIES.length - 1 ? 0 : 40 }}>
            <div style={{ flexShrink: 0, width: 130, paddingTop: 2 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: DIM, fontFamily: 'monospace' }}>{entry.date}</div>
            </div>
            <div style={{ flex: 1, borderLeft: `2px solid ${GRAY}`, paddingLeft: 24 }}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {entry.items.map(item => (
                  <li key={item} style={{ fontSize: 14, color: '#3f3d38', lineHeight: 1.7, position: 'relative', paddingLeft: 18 }}>
                    <span style={{ position: 'absolute', left: 0, color: GREEN }}>—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      <Footer theme="light" />
    </div>
  )
}
