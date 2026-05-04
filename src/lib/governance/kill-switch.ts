// @ts-nocheck
/**
 * SETU — Kill Switch Enforcer
 *
 * Checks Supabase kill_switches table before any execution.
 * Levels: global > tenant > agent > runtime_instance > tool_connector > action_type
 */

import { createAdminClient } from "@/lib/supabase/server";
import { writeAuditLog } from "./audit-logger";

export interface KillSwitchCheckResult {
  blocked: boolean;
  switch_id?: string;
  reason?: string;
  level?: string;
}

/**
 * Check if any active kill switch blocks this execution.
 * Checks global first, then tenant, then agent-specific.
 */
export async function checkKillSwitches(opts: {
  tenant_id?: string;
  agent_id?: string;
  action_type?: string;
  session_id?: string;
}): Promise<KillSwitchCheckResult> {
  try {
    const db = createAdminClient();

    // Build OR conditions for all applicable levels
    const conditions = ["level.eq.global"];
    if (opts.tenant_id) conditions.push(`and(level.eq.tenant,target_id.eq.${opts.tenant_id})`);
    if (opts.agent_id) conditions.push(`and(level.eq.agent,target_id.eq.${opts.agent_id})`);
    if (opts.action_type) conditions.push(`and(level.eq.action_type,target_id.eq.${opts.action_type})`);

    const { data: switches } = await db
      .from("kill_switches")
      .select("id, level, target_label, reason, is_active")
      .eq("is_active", true)
      .or(conditions.join(","));

    if (switches && switches.length > 0) {
      const sw = switches[0];
      await writeAuditLog({
        event_type: "runtime_action_blocked",
        severity: "warning",
        session_id: opts.session_id,
        description: `Kill switch active: ${sw.target_label}`,
        metadata: {
          kill_switch_id: sw.id,
          level: sw.level,
          reason: sw.reason,
        },
      });

      return {
        blocked: true,
        switch_id: sw.id,
        reason: sw.reason,
        level: sw.level,
      };
    }

    return { blocked: false };
  } catch (error) {
    // If kill switch check fails, block by default (fail-safe)
    console.error("[Setu] Kill switch check failed — blocking by default:", error instanceof Error ? error.message : "unknown");
    return {
      blocked: true,
      reason: "Kill switch check failed — blocking execution as precaution",
      level: "system",
    };
  }
}
