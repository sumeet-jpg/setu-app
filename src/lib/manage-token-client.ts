'use client'
// Browser-side counterpart to src/lib/manage-token.ts.
// Stores the signed manage-session token and attaches it to gated requests.

const STORAGE_KEY = 'setu_manage_token'

export function getManageToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

export function setManageToken(token: string | null | undefined): void {
  if (typeof window === 'undefined' || !token) return
  localStorage.setItem(STORAGE_KEY, token)
}

// fetch() wrapper for routes gated by withManageAuth(): attaches the stored
// token as a header, and if the response carries a refreshed token (every
// gated route returns one on success), persists it — a sliding session that
// stays alive under normal use and expires if the token is ever unused.
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getManageToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('x-manage-token', token)
  const res = await fetch(input, { ...init, headers })
  const fresh = res.headers.get('x-manage-token')
  if (fresh) setManageToken(fresh)
  return res
}
