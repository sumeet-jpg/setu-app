import Link from 'next/link'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'

const GREEN = '#0E5C34'
const INK = '#0D0C09'
const MUTED = '#78746E'
const BG = '#FFFFFF'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: BG }}>
      <Nav />
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '80px 24px', fontFamily: 'var(--font-jakarta)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>404</div>
        <h1 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 800, letterSpacing: '-0.05em', color: INK, margin: '0 0 12px' }}>
          This page doesn&apos;t exist
        </h1>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 440, margin: '0 0 32px', lineHeight: 1.6 }}>
          The page you&apos;re looking for was moved, renamed, or never existed. Try browsing the AI employees instead.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/" style={{ padding: '12px 24px', borderRadius: 10, background: '#F5F3EE', border: '1.5px solid #E3E1DA', color: INK, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Go home
          </Link>
          <Link href="/employees" style={{ padding: '12px 24px', borderRadius: 10, background: GREEN, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Browse employees →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
