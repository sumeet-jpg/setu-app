'use client'

import { useEffect } from 'react'
import Link from 'next/link'

const GREEN = '#0E5C34'
const INK = '#0D0C09'
const MUTED = '#78746E'

// Root error boundary. Next.js requires this to be a Client Component and
// renders it in place of any page/layout below it that throws — without
// this file, an unhandled render error shows Next's raw unstyled crash
// screen (or a blank white page in production) instead of a recoverable UI.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Setu] unhandled error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '80px 24px', fontFamily: 'system-ui, sans-serif', background: '#FFFFFF',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GREEN, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            Something went wrong
          </div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, letterSpacing: '-0.03em', color: INK, margin: '0 0 12px' }}>
            This page hit an unexpected error
          </h1>
          <p style={{ fontSize: 15, color: MUTED, maxWidth: 440, margin: '0 0 32px', lineHeight: 1.6 }}>
            It&apos;s been logged. Try again, or head back home — your data is safe.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/" style={{ padding: '12px 24px', borderRadius: 10, background: '#F5F3EE', border: '1.5px solid #E3E1DA', color: INK, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Go home
            </Link>
            <button
              onClick={() => reset()}
              style={{ padding: '12px 24px', borderRadius: 10, background: GREEN, color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
