'use client'
import posthog from 'posthog-js'

let initialized = false

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return // analytics is optional — never break the app if unset
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    // Error Tracking rides on the same SDK init — no separate setup needed.
  })
  initialized = true
}

// The exact funnel from SETU_MASTER_PLAN.md item #20, plus whatever else is
// worth knowing. Never throws — a tracking failure must never break the
// actual feature it's instrumenting.
//
// userId is Setu's own anonymous localStorage identity (setu_user_id) — not
// optional. Without it, PostHog falls back to its own auto-generated device
// ID, which won't match the distinct_id server-side events use (webhook
// activation, cron checks), breaking the funnel across the exact steps this
// is meant to connect (interview → hire → activate).
let lastIdentified: string | null = null

export function track(event: string, userId: string, properties?: Record<string, unknown>) {
  try {
    if (!initialized || !userId) return
    if (lastIdentified !== userId) {
      posthog.identify(userId)
      lastIdentified = userId
    }
    posthog.capture(event, properties)
  } catch {
    // analytics failures are always non-fatal
  }
}
