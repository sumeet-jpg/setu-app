-- =============================================================
-- SETU — Migration 021: increment_pattern_fire_count RPC
--
-- Context: both src/app/api/employees/pin/route.ts's checkPatterns() (now
-- src/lib/employees/proactive.ts) and the new watch-pattern monitor
-- (src/lib/employees/monitor.ts) call
-- supabase.rpc('increment_pattern_fire_count', { pattern_id }) whenever a
-- watch pattern fires — but this function never existed in any migration.
-- The original code also assigned the rpc() call's PostgrestFilterBuilder
-- object directly as the `fire_count` field value inside the SAME .update()
-- payload rather than awaiting it as a separate statement, which wouldn't
-- have worked correctly even if the function had existed. Net effect:
-- fire_count has never actually incremented for any watch pattern, ever.
-- Fixed the call sites to await this properly and separately from the
-- last_fired_at/last_checked_at update.
-- =============================================================

CREATE OR REPLACE FUNCTION increment_pattern_fire_count(pattern_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE employee_watch_patterns
  SET fire_count = fire_count + 1
  WHERE id = pattern_id;
END;
$$ LANGUAGE plpgsql;
