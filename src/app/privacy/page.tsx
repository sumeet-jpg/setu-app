import type { Metadata } from 'next'
import Link from 'next/link'
import { SetuLogo } from '@/components/SetuLogo'

const BASE = 'https://setuagents.com'

export const metadata: Metadata = {
  title: 'Privacy Policy — Setu',
  description: 'What Setu collects, how it\'s stored, and your rights over it.',
  alternates: { canonical: `${BASE}/privacy` },
}

const BG = '#F6F5F1', WHITE = '#FFFFFF', INK = '#0D0C09', GREEN = '#0E5C34'
const GRAY = '#E3E1DA', MUTED = '#78746E', DIM = '#9E9891', F = 'var(--font-jakarta)'

const SECTIONS: [string, string][] = [
  ['What we collect', 'When you interview an AI Employee, no personal data is required — you\'re identified only by a random, anonymous ID stored in your browser. When you hire an employee (the trial signup form), we collect your name, email, company, role, team size, and use case. If you upload documents to an employee\'s Vault (SOPs, playbooks, product docs), that content is stored to give the employee context — see "Vault documents" below for how it\'s used.'],
  ['How we use it', 'Your contact details are used to run the trial (confirmation, reminders, activation) and to reach you about your subscription. Conversations with an AI Employee are distilled into structured "beliefs" — your preferences, decisions, and business context — that make the employee more useful over time. We do not sell your data, and we don\'t use your business content to train models for other customers.'],
  ['Data storage', 'Your data is stored in Supabase (PostgreSQL, hosted in the US) and protected by row-level security. Subscription and billing records are readable only by our servers, not by the public Supabase key your browser uses. Anonymous identity means we can\'t always verify who\'s asking, so we scope what any request can see or change to exactly what\'s needed.'],
  ['Vault documents', 'Documents you upload for an employee are always treated as untrusted reference material — the employee cites them but never asserts their contents as verified fact, and they\'re never promoted into the employee\'s learned beliefs about you. You can remove any document at any time from the Memory page.'],
  ['Billing', 'Subscriptions are processed by Dodo Payments. We store your monthly rate and subscription status, not your card details — Dodo handles payment collection and never shares full card numbers with us.'],
  ['Email', 'Trial and account emails (confirmations, reminders, activation, cancellation) are sent via Resend. You can unsubscribe from non-essential emails; transactional emails about your own subscription will still be sent.'],
  ['Your rights', 'You can cancel or pause a subscription yourself from the manage page at any time — no email required. To request a full data export or deletion, email sumeet@setuagents.com; we\'ll confirm and act within a few business days.'],
  ['Third-party services', 'We use Supabase (database), Dodo Payments (billing), Resend (email), and Anthropic/OpenAI (the AI models employees run on). Each has its own privacy policy governing how they process data on our behalf.'],
  ['Contact', 'For privacy questions: sumeet@setuagents.com · setuagents.com · SignalPulse Technologies LLC, Wyoming, USA'],
]

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: F, lineHeight: 1.6 }}>
      <nav style={{ background: WHITE, borderBottom: `1px solid ${GRAY}`, padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: 'none' }}><SetuLogo size={30} color={GREEN} wordColor={INK} /></Link>
        <Link href="/employees" style={{ fontSize: 13, fontWeight: 700, color: WHITE, textDecoration: 'none', padding: '9px 20px', borderRadius: 100, background: INK }}>
          Hire an Employee →
        </Link>
      </nav>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(48px,8vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 8px' }}>Privacy Policy</h1>
        <p style={{ fontSize: 14, color: DIM, marginBottom: 56 }}>Last updated: August 2026 · Setu · setuagents.com</p>
        {SECTIONS.map(([title, body]) => (
          <div key={title} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: `1px solid ${GRAY}` }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 10px' }}>{title}</h2>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, margin: 0 }}>{body}</p>
          </div>
        ))}
      </div>
      <footer style={{ background: WHITE, borderTop: `1px solid ${GRAY}`, padding: '24px 32px', textAlign: 'center' }}>
        <span style={{ fontSize: 13, color: MUTED }}>Setu · SignalPulse Technologies LLC · Wyoming, USA</span>
      </footer>
    </div>
  )
}
