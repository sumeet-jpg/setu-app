import { NextResponse } from "next/server";
import { clientEnv } from "@/lib/env";
import { isRuntimeExecutionEnabled } from "@/lib/env";

/**
 * GET /api/health
 *
 * Returns system status. Used by Vercel health checks and monitoring.
 * Does NOT expose secrets or internal configuration.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "setu-app",
    env: clientEnv.NEXT_PUBLIC_APP_ENV,
    timestamp: new Date().toISOString(),
    runtime_execution_enabled: isRuntimeExecutionEnabled(),
    version: "0.1.0",
  });
}
