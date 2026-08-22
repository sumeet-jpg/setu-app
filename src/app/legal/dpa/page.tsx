import type { Metadata } from 'next'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'

const BASE = 'https://setuagents.com'

export const metadata: Metadata = {
  title: 'Data Processing Agreement — Setu',
  description: 'Setu\'s standard Data Processing Agreement — how customer data is processed, who the subprocessors are, and what security measures apply.',
  alternates: { canonical: `${BASE}/legal/dpa` },
}

const BG = '#F6F5F1', WHITE = '#FFFFFF', INK = '#0D0C09', GREEN = '#0E5C34'
const GRAY = '#E3E1DA', MUTED = '#78746E', DIM = '#9E9891', F = 'var(--font-jakarta)'

const SECTIONS: [string, string][] = [
  ['1. Parties and scope', 'This Data Processing Agreement ("DPA") forms part of the agreement between SignalPulse Technologies LLC ("Setu", "Processor") and the customer using Setu\'s services ("Customer", "Controller"). It applies whenever Setu processes personal data on Customer\'s behalf — the name, email, and company details Customer\'s own contacts or team members provide through a hired AI Employee, and any personal data contained in documents Customer uploads to an employee\'s Vault.'],
  ['2. Roles', 'Customer acts as the data controller for personal data it submits to or collects through Setu. Setu acts as the data processor, processing that data only to provide the service and only on Customer\'s documented instructions (configuring and operating the AI Employees Customer hires).'],
  ['3. Subject matter and duration', 'Processing covers the categories of data described in Setu\'s Privacy Policy — account/contact details, subscription records, uploaded context documents, and conversation-derived beliefs. Processing continues for the duration of Customer\'s subscription and for the data-retention period described in Section 8 after termination.'],
  ['4. Subprocessors', 'Setu uses the following subprocessors, each bound by their own data processing terms: Supabase (database hosting, USA) for all application data; Dodo Payments for billing (Setu does not receive or store full card numbers); Resend for transactional email delivery; Anthropic and OpenAI as the AI model providers that power AI Employee conversations. Setu will give reasonable notice before adding or replacing a subprocessor that would materially change how Customer\'s data is handled.'],
  ['5. Security measures', 'Data is encrypted in transit (TLS) and at rest. Access to production data is restricted to what Setu\'s own systems need to operate — row-level security policies scope every table to service-role access only, meaning even Setu\'s public API keys cannot read customer data directly. Sensitive credentials Customer connects (third-party API keys) are encrypted before storage.'],
  ['6. Sub-processing and international transfers', 'Subprocessors listed in Section 4 may process data outside Customer\'s home jurisdiction (Supabase and Resend infrastructure is US-based). Setu relies on each subprocessor\'s own compliance mechanisms for cross-border transfer and will provide further detail on request.'],
  ['7. Data subject rights', 'Setu will assist Customer in responding to data subject requests (access, correction, deletion) concerning personal data Setu processes on Customer\'s behalf, to the extent Setu is able to do so. Customer can independently delete uploaded documents at any time from the employee\'s Memory page; full account/data deletion requests can be sent to sumeet@setuagents.com.'],
  ['8. Data retention and deletion', 'Upon termination of a subscription, Setu retains subscription and lead records for legitimate business purposes (accounting, fraud prevention) as described in the Privacy Policy, and will delete or anonymize personal data upon a reasonable written request, except where retention is required by law.'],
  ['9. Breach notification', 'Setu will notify Customer without undue delay after becoming aware of a personal data breach affecting Customer\'s data, providing the information reasonably available at the time and reasonable cooperation with Customer\'s own notification obligations.'],
  ['10. Audit rights', 'On reasonable written request, Setu will provide information reasonably necessary to demonstrate compliance with this DPA. Setu is a small, founder-run team without third-party compliance certification (e.g. SOC 2) at this time — see Section 11.'],
  ['11. Current compliance posture', 'Setu does not currently hold SOC 2, ISO 27001, or equivalent third-party certification. A completed security questionnaire is available on request for prospective customers who need one as part of their own vendor-review process — email sumeet@setuagents.com.'],
  ['12. Contact', 'Questions about this DPA: sumeet@setuagents.com · SignalPulse Technologies LLC, Wyoming, USA.'],
]

export default function DpaPage() {
  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: F, lineHeight: 1.6 }}>
      <Nav theme="light" />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(48px,8vw,80px) clamp(16px,4vw,40px)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 8px' }}>Data Processing Agreement</h1>
        <p style={{ fontSize: 14, color: DIM, marginBottom: 40 }}>Last updated: August 2026 · Setu · setuagents.com</p>
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, marginBottom: 56, maxWidth: 600 }}>
          This is Setu's standard DPA, referencing the structure used by Stripe, Linear, and similar SaaS providers. If your
          organization needs a countersigned copy or has specific terms to add, email <a href="mailto:sumeet@setuagents.com" style={{ color: GREEN }}>sumeet@setuagents.com</a>.
        </p>
        {SECTIONS.map(([title, body]) => (
          <div key={title} style={{ marginBottom: 32, paddingBottom: 32, borderBottom: `1px solid ${GRAY}` }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px' }}>{title}</h2>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, margin: 0 }}>{body}</p>
          </div>
        ))}
      </div>
      <Footer theme="light" />
    </div>
  )
}
