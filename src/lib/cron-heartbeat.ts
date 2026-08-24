// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/server'

export async function recordCronRun(jobName: string, status: 'success' | 'failed', detail?: string): Promise<void> {
  try {
    const db = createAdminClient()
    await db.from('cron_runs').insert({ job_name: jobName, status, detail: detail ?? null })
  } catch (err) {
    // Never let heartbeat logging itself break the actual cron job
    console.error('[cron-heartbeat] failed to record run', err)
  }
}
