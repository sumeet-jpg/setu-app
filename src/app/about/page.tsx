import type { Metadata } from 'next'
import Link from 'next/link'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'

const BASE = 'https://setuagents.com'

export const metadata: Metadata = {
  title: 'About Setu — Why We Built AI Employees',
  description: 'Setu is built by SignalPulse Technologies, a Wyoming company. Here\'s why AI Employees exist, who\'s behind them, and what "interview before you hire" actually means.',
  openGraph: {
    title: 'About Setu',
    description: 'Why AI Employees exist, and who builds them.',
    url: `${BASE}/about`,
    siteName: 'Setu',
    type: 'website',
  },
  alternates: { canonical: `${BASE}/about` },
}

const BG    = '#F6F5F1'
const WHITE = '#FFFFFF'
const INK   = '#0D0C09'
const GREEN = '#0E5C34'
const GREEN_L = '#EAF5EE'
const GRAY  = '#E3E1DA'
const MUTED = '#78746E'
const DIM   = '#9E9891'
const F = 'var(--font-jakarta)'

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: F, lineHeight: 1.6 }}>

      <Nav theme="light" />

      <section style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(56px,8vw,96px) 24px clamp(40px,6vw,64px)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase' }}>About</span>
        <h1 style={{ fontSize: 'clamp(30px,5vw,52px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '12px 0 24px', lineHeight: 1.08 }}>
          Hire the stuntman,<br />not the star.
        </h1>
        <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.75, margin: '0 0 20px' }}>
          Most software sells you a tool and leaves the work to you. Setu sells you the work itself — an AI Employee that
          does the job of a CMO, a COO, a Finance Controller, or any of 100 specialized roles, for a fraction of what a
          human hire costs.
        </p>
        <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.75, margin: '0 0 20px' }}>
          I built Setu because every small business I'd worked with — in marketing, in security, in ops — had the same
          problem: they needed department-head-level thinking long before they could afford a department head. Generic
          AI chatbots don't fix that; they answer questions. An AI Employee has a job title, a specific mandate, and
          gets better at your business the longer it works for you.
        </p>
        <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.75, margin: '0 0 20px' }}>
          The one rule I built the product around: you interview before you hire. No sales call, no demo video —
          you talk to the actual employee, ask it real questions about your actual business, and decide for yourself
          if it's good enough. If it isn't, you've lost nothing.
        </p>

        <div style={{ background: WHITE, border: `1px solid ${GRAY}`, borderRadius: 18, padding: '28px 30px', margin: '40px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>The company</div>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, margin: 0 }}>
            Setu is built and operated by <strong style={{ color: INK }}>SignalPulse Technologies LLC</strong>, a
            Wyoming, USA company. It's a small, founder-run team — when you email or WhatsApp us, you're reaching the
            person actually building the product, not a support queue.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/employees" style={{ padding: '13px 28px', borderRadius: 12, background: INK, color: WHITE, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Meet the 100 employees →
          </Link>
          <Link href="/contact" style={{ padding: '13px 28px', borderRadius: 12, background: GREEN_L, border: `1.5px solid ${GREEN}`, color: GREEN, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Get in touch
          </Link>
        </div>
      </section>

      <Footer theme="light" />
    </div>
  )
}
