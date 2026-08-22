import { NextRequest } from 'next/server'

// Vercel's native Cron Jobs (see vercel.json `crons`) authenticate every
// triggered request with `Authorization: Bearer ${CRON_SECRET}` — not a
// custom header. Both cron routes here were checking a home-grown
// `x-cron-secret` header instead, which Vercel never sends, so every
// scheduled run 401'd and did nothing (trials never auto-expired, decay
// never ran) with no visible symptom short of checking Vercel's cron logs.
// Also accepts the old x-cron-secret for a manual/external trigger.
export function verifyCronSecret(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  const bearer = req.headers.get('authorization')
  const legacy = req.headers.get('x-cron-secret')
  return bearer === `Bearer ${cronSecret}` || legacy === cronSecret
}
