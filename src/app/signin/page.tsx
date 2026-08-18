// @ts-nocheck
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const BG = '#0A0F1E'
const SURFACE = '#111827'
const BORDER = 'rgba(255,255,255,0.08)'
const TEXT = '#F9FAFB'
const MUTED = '#9CA3AF'
const ACCENT = '#6366F1'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogleSignIn() {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (authError) {
      setError('Sign in failed. Please try again.')
      setLoading(false)
    }
    // On success, browser redirects — no need to setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'var(--font-inter)',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)',
      }} />

      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', marginBottom: 48, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(99,102,241,0.4), 0 0 0 1px rgba(99,102,241,0.3)',
        }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-space)' }}>S</span>
        </div>
        <span style={{ fontSize: 22, fontWeight: 800, color: TEXT, letterSpacing: '-0.04em', fontFamily: 'var(--font-space)' }}>Setu</span>
      </Link>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 24,
        padding: '40px 32px',
        position: 'relative',
      }}>
        {/* Top glow line */}
        <div style={{
          position: 'absolute', top: 0, left: 32, right: 32, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)',
          borderRadius: 2,
        }} />

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: TEXT, letterSpacing: '-0.04em', margin: '0 0 8px', fontFamily: 'var(--font-space)' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.6 }}>
            Sign in to your Setu dashboard to manage your AI Employees.
          </p>
        </div>

        {error && (
          <div style={{
            marginBottom: 20, padding: '12px 16px', borderRadius: 10,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#FCA5A5', fontSize: 13, textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '14px 20px',
            borderRadius: 12,
            background: loading ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${loading ? BORDER : 'rgba(255,255,255,0.15)'}`,
            color: loading ? MUTED : TEXT,
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-space)',
            letterSpacing: '-0.01em',
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: 18, height: 18, border: `2px solid rgba(255,255,255,0.2)`,
                borderTopColor: ACCENT, borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              Connecting…
            </>
          ) : (
            <>
              {/* Google G logo inline SVG */}
              <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
          <span style={{ fontSize: 12, color: MUTED }}>or</span>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
        </div>

        {/* Browse without signing in */}
        <Link
          href="/employees"
          style={{
            display: 'block',
            width: '100%',
            padding: '13px 20px',
            borderRadius: 12,
            background: 'transparent',
            border: `1px solid ${BORDER}`,
            color: MUTED,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-space)',
            boxSizing: 'border-box',
          }}
        >
          Browse employees without signing in
        </Link>

        <p style={{ marginTop: 24, fontSize: 12, color: MUTED, textAlign: 'center', lineHeight: 1.7 }}>
          By signing in, you agree to our{' '}
          <Link href="/terms" style={{ color: '#818cf8', textDecoration: 'none' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" style={{ color: '#818cf8', textDecoration: 'none' }}>Privacy Policy</Link>.
        </p>
      </div>

      {/* Social proof */}
      <div style={{ marginTop: 40, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { value: '100', label: 'AI Employees' },
          { value: '$199', label: 'Starting from' },
          { value: 'Free', label: 'to interview' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: 'var(--font-space)', letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
