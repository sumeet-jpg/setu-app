// ─────────────────────────────────────────────────────────────────────────
// Signed manage-session tokens.
//
// Setu's customer identity is an anonymous localStorage UUID (no login) —
// that's a deliberate product decision (zero-friction interview-before-you-pay),
// not something this file changes. What it fixes: routes that touch private
// data (subscription mutations, memory/beliefs, calibration, vault documents,
// cross-employee cortex) used to trust a bare `userId` passed by the client,
// so anyone who obtained another user's UUID (browser history, a pasted
// support-chat screenshot, a shared `?uid=` recovery link) had permanent,
// unrevocable access to that person's private data.
//
// A manage-token is an HMAC-signed, expiring credential for exactly that
// userId. It's issued only through two legitimate channels — the hire
// confirmation response, and a recovery email sent to the address on file —
// never minted from a bare userId on request. Gated routes require it and
// derive the authoritative userId from the token, never from client input.
// ─────────────────────────────────────────────────────────────────────────
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const SESSION_TTL_MS  = 90 * 24 * 60 * 60 * 1000 // hire-issued session, refreshed on use
const RECOVERY_TTL_MS = 48 * 60 * 60 * 1000       // recovery-email link

function secret(): string {
  const s = process.env.MANAGE_TOKEN_SECRET
  if (!s) throw new Error('MANAGE_TOKEN_SECRET is not set')
  return s
}

function hmac(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function signManageToken(userId: string, ttlMs: number = SESSION_TTL_MS): string {
  const expiresAt = Date.now() + ttlMs
  const payload = `${userId}.${expiresAt}`
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url')
  return `${payloadB64}.${hmac(payload)}`
}

export function signRecoveryToken(userId: string): string {
  return signManageToken(userId, RECOVERY_TTL_MS)
}

export function verifyManageToken(token: string | null | undefined): string | null {
  if (!token) return null
  try {
    const [payloadB64, sig] = token.split('.')
    if (!payloadB64 || !sig) return null
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8')
    const expected = hmac(payload)
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
    const dot = payload.lastIndexOf('.')
    if (dot < 0) return null
    const userId = payload.slice(0, dot)
    const expiresAt = Number(payload.slice(dot + 1))
    if (!userId || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return null
    return userId
  } catch {
    return null
  }
}

function tokenFromRequest(req: NextRequest): string | null {
  return req.headers.get('x-manage-token') ?? new URL(req.url).searchParams.get('mt')
}

// Wrap a route handler so it only runs with a verified, non-expired token,
// and every successful response carries a freshly-extended token (sliding
// session — an actively-used session never expires; an unused/leaked one does).
export function withManageAuth(
  req: NextRequest,
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const userId = verifyManageToken(tokenFromRequest(req))
  if (!userId) {
    return Promise.resolve(
      NextResponse.json({ error: 'Unauthorized — missing or expired session token' }, { status: 401 })
    )
  }
  return handler(userId).then(res => {
    res.headers.set('x-manage-token', signManageToken(userId))
    return res
  })
}
