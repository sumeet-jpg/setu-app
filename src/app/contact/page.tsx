import type { Metadata } from 'next'
import Link from 'next/link'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'

const BASE = 'https://setuagents.com'

export const metadata: Metadata = {
  title: 'Contact Setu',
  description: 'Reach the team behind Setu — email or WhatsApp, real replies within a few hours, not a support queue.',
  openGraph: {
    title: 'Contact Setu',
    description: 'Email or WhatsApp — real replies within a few hours.',
    url: `${BASE}/contact`,
    siteName: 'Setu',
    type: 'website',
  },
  alternates: { canonical: `${BASE}/contact` },
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

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '918951066630'

const CHANNELS = [
  {
    icon: '✉️',
    title: 'Email',
    detail: 'sumeet@setuagents.com',
    desc: 'For anything — a question before you hire, a billing issue, a partnership idea. Real replies within a few hours during IST business hours.',
    href: 'mailto:sumeet@setuagents.com',
    cta: 'Send an email →',
  },
  {
    icon: '💬',
    title: 'WhatsApp',
    detail: 'Fastest for anything time-sensitive',
    desc: 'Trial ending, activation help, or you just want a quick answer — WhatsApp is checked more often than email.',
    href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi, I have a question about Setu.')}`,
    cta: 'Message on WhatsApp →',
  },
]

export default function ContactPage() {
  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: F, lineHeight: 1.6 }}>

      <Nav theme="light" />

      <section style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(56px,8vw,96px) 24px clamp(48px,7vw,72px)', textAlign: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Contact</span>
        <h1 style={{ fontSize: 'clamp(30px,5vw,48px)', fontWeight: 800, letterSpacing: '-0.05em', margin: '12px 0 16px', lineHeight: 1.1 }}>
          You'll reach a real person.
        </h1>
        <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
          Setu is a small, founder-run team. There's no ticketing system between you and an answer — email or
          WhatsApp go straight to the person building the product.
        </p>
      </section>

      <section style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px clamp(64px,8vw,96px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {CHANNELS.map(c => (
            <a key={c.title} href={c.href} target={c.title === 'WhatsApp' ? '_blank' : undefined} rel={c.title === 'WhatsApp' ? 'noopener noreferrer' : undefined}
              style={{ display: 'flex', gap: 20, alignItems: 'flex-start', background: WHITE, border: `1.5px solid ${GRAY}`, borderRadius: 18, padding: '26px 28px', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontSize: 30, flexShrink: 0 }}>{c.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: INK, letterSpacing: '-0.03em', marginBottom: 3 }}>{c.title}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: GREEN, marginBottom: 8 }}>{c.detail}</div>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65, margin: '0 0 12px' }}>{c.desc}</p>
                <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{c.cta}</span>
              </div>
            </a>
          ))}
        </div>

        <div style={{ marginTop: 32, padding: '20px 24px', background: GREEN_L, border: `1px solid ${GREEN}`, borderRadius: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: GREEN, fontWeight: 600, lineHeight: 1.6 }}>
            Looking to hire an AI Employee? You don't need to contact us first —
            {' '}<Link href="/employees" style={{ color: GREEN, fontWeight: 800, textDecoration: 'underline' }}>interview one directly</Link>, free, no account needed.
          </div>
        </div>
      </section>

      <Footer theme="light" />
    </div>
  )
}
