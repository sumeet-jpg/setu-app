-- =============================================================
-- SETU — Migration 015: Lock down conversation/blueprint RLS
-- Context: migration 002 created policies on conversations,
-- conversation_messages, conversation_state, and generated_blueprints
-- shaped `USING (true)` / `WITH CHECK (true)` with no `TO service_role`
-- restriction, with comments saying "scoped by session_id in app layer"
-- — but RLS itself does not enforce that scoping, and the Supabase
-- anon key is public (shipped to the browser bundle). Anyone with that
-- key can read every prospect's full interview transcript directly via
-- the Supabase REST API, or insert/delete rows in conversation_state,
-- completely bypassing the app.
--
-- Migration 012 already fixed this exact bug shape for hired_subscriptions,
-- employee_actions, employee_action_log, employee_calibration, and
-- action_outcomes. These four tables were missed in that pass.
--
-- Confirmed safe: every read/write to these four tables goes through
-- src/lib/services/conversation.service.ts, which uses createAdminClient()
-- (service role) exclusively. No client-side code queries them with the
-- anon key — the browser only ever calls the Next.js API routes. Scoping
-- these policies to service_role changes no application behavior.
-- =============================================================

DROP POLICY IF EXISTS "Anyone can start a conversation" ON conversations;
DROP POLICY IF EXISTS "Conversation owner can read their conversation" ON conversations;
CREATE POLICY "service_role_full_access" ON conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can add messages to conversations" ON conversation_messages;
DROP POLICY IF EXISTS "Anyone can read conversation messages" ON conversation_messages;
CREATE POLICY "service_role_full_access" ON conversation_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create or update conversation state" ON conversation_state;
CREATE POLICY "service_role_full_access" ON conversation_state
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create a blueprint" ON generated_blueprints;
DROP POLICY IF EXISTS "Anyone can read their blueprint by session" ON generated_blueprints;
CREATE POLICY "service_role_full_access" ON generated_blueprints
  FOR ALL TO service_role USING (true) WITH CHECK (true);
