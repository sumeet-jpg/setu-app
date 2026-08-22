'use client'
import { useEffect } from 'react'
import { initPostHog } from '@/lib/posthog/client'

// Tiny client component, mounted once in the root layout, whose only job is
// to initialize PostHog on first paint. Kept separate from client.ts so the
// SDK only loads in the browser, never during server rendering.
export default function PostHogInit() {
  useEffect(() => { initPostHog() }, [])
  return null
}
