import type { Metadata } from 'next'
import Link from 'next/link'
import { SetuLogo } from '@/components/SetuLogo'

const BASE = 'https://setuagents.com'

export const metadata: Metadata = {
  title: 'Terms of Service — Setu',
  description: 'The terms for interviewing, hiring, and subscribing to a Setu AI Employee.',
  alternates: { canonical: `${BASE}/terms` },
}

const BG = '#F6F5F1', WHITE = '#FFFFFF', INK = '#0D0C09', GREEN = '#0E5C34'
const GRAY = '#E3E1DA', MUTED = '#78746E', DIM = '#9E9891', F = 'var(--font-jakarta)'

const SECTIONS: [string, string][] = [
  ['Acceptance', 'By interviewing, hiring, or subscribing to a Setu AI Employee, you agree to these terms. If you don\'t agree, don\'t use the service.'],
  ['Free interviews', 'You can interview any AI Employee for free, with no account and no payment method — that\'s the whole point. Nothing is charged, and no subscription is created, until you complete the hire form.'],
  ['Trial & pricing', 'Hiring starts a 14-day free trial at the rate shown at the time you hire — that rate is locked to your subscription for as long as you stay subscribed, even as the listed rate for new signups rises over time. Activating before your trial ends requires a valid payment method via Dodo Payments. If you don\'t activate, your trial simply expires — you\'re never auto-charged.'],
  ['Cancel & pause', 'You can cancel or pause your subscription yourself at any time from the manage page — no email required, no retention call. Pausing preserves your locked rate; cancelling loses it, though reactivating within 30 days restores your original rate.'],
  ['Your data & documents', 'Anything you upload to an employee\'s Vault, or that comes up in conversation, is used only to make that employee useful to you — never sold, and never used to train models for other customers. See the Privacy Policy for details.'],
  ['AI-generated output', 'Setu AI Employees produce drafts, analysis, and proposed actions using AI models — review anything consequential before acting on it. Setu is not liable for decisions made solely on an employee\'s output without your own review.'],
  ['Acceptable use', 'Don\'t use Setu to generate spam, illegal content, or anything that violates others\' rights. We may suspend accounts that abuse the service or attempt to access another customer\'s data.'],
  ['Availability', 'We aim for high uptime but don\'t guarantee it, and we\'re not liable for losses caused by downtime.'],
  ['Changes', 'We may update these terms; we\'ll flag material changes by email. Continued use after a change means acceptance.'],
  ['Contact', 'Questions? sumeet@setuagents.com · SignalPulse Technologies LLC, Wyoming, USA · © 2026'],
]

export default function TermsPage() {
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
        <h1 style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 8px' }}>Terms of Service</h1>
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
