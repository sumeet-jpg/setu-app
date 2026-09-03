-- =============================================================
-- SETU — Migration 022: mark_cortex_consumed RPC
--
-- Context: src/app/api/employees/cortex/route.ts's PATCH handler calls
-- supabase.rpc('mark_cortex_consumed', {...}) to append a slug to
-- org_cortex_entries.consumed_by, but this function never existed in any
-- migration. Not a live bug, though — the route already anticipated this
-- ("Fallback: fetch + update if RPC doesn't exist yet") and correctly
-- falls back to a manual fetch+update with dedup on every call. This just
-- makes the primary path real: one round-trip instead of two, and no more
-- "function mark_cortex_consumed does not exist" noise in Postgres logs
-- every time an employee's shared-intelligence entry gets consumed.
--
-- p_user_id is uuid, not text: org_cortex_entries.user_id was created as
-- `uuid not null` in migration 006 and, unlike tool_connections/
-- employee_tasks (fixed in migration 011), was never migrated to the
-- anonymous-friendly `text` pattern most other tables use. Anonymous
-- customer IDs are still genuine UUID-formatted strings
-- (localStorage('setu_user_id')), so this works, but a text param here
-- would raise "operator does not exist: uuid = text" at the WHERE clause.
-- =============================================================

CREATE OR REPLACE FUNCTION mark_cortex_consumed(
  p_entry_id uuid,
  p_user_id  uuid,
  p_slug     text
) RETURNS void AS $$
BEGIN
  UPDATE org_cortex_entries
  SET
    consumed_by = (
      SELECT ARRAY(SELECT DISTINCT unnest(consumed_by || ARRAY[p_slug]))
    ),
    updated_at = now()
  WHERE id = p_entry_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
