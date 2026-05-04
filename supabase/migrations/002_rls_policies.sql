-- =============================================================
-- SETU — Migration 002: Row Level Security Policies
-- Run after 001_core_schema.sql
-- =============================================================

-- =============================================================
-- Enable RLS on all tables
-- =============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_candidate_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_action_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE kill_switches ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- PUBLIC READ — Agent catalog (public agents only, via anon key)
-- =============================================================

CREATE POLICY "Public agents are readable by anyone"
  ON agents FOR SELECT
  USING (is_public = true AND status != 'disabled');

-- Tool registry is public read
CREATE POLICY "Tool registry is public read"
  ON tool_registry FOR SELECT
  USING (is_available = true);

-- =============================================================
-- PUBLIC WRITE — Prospect flow (anon users can create conversations/blueprints/leads)
-- =============================================================

CREATE POLICY "Anyone can start a conversation"
  ON conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Conversation owner can read their conversation"
  ON conversations FOR SELECT
  USING (true); -- scoped by session_id in app layer

CREATE POLICY "Anyone can add messages to conversations"
  ON conversation_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read conversation messages"
  ON conversation_messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create or update conversation state"
  ON conversation_state FOR ALL
  USING (true);

CREATE POLICY "Anyone can create a blueprint"
  ON generated_blueprints FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read their blueprint by session"
  ON generated_blueprints FOR SELECT
  USING (true); -- app layer filters by session_id

CREATE POLICY "Anyone can create a lead"
  ON leads FOR INSERT
  WITH CHECK (true);

-- =============================================================
-- ADMIN ONLY — Service role bypasses all RLS
-- All admin operations use createAdminClient() (service role)
-- The policies below cover authenticated admin users via anon key
-- =============================================================

CREATE POLICY "Authenticated users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin tables — readable only by authenticated users (service role bypasses anyway)
CREATE POLICY "Authenticated users can read approval requests"
  ON approval_requests FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read kill switches"
  ON kill_switches FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read leads"
  ON leads FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read support tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read internal agents"
  ON internal_agents FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read internal agent runs"
  ON internal_agent_runs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read runtime instances"
  ON runtime_instances FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read runtime deployments"
  ON runtime_deployments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =============================================================
-- BLOCKED — Sensitive tables require service role only
-- Anon and authenticated users cannot read these directly
-- =============================================================

CREATE POLICY "Credential references: service role only"
  ON credential_references FOR ALL
  USING (false); -- Only service role (admin client) can access

CREATE POLICY "Agent candidates: service role only"
  ON agent_candidate_references FOR ALL
  USING (false); -- Internal reference only

-- =============================================================
-- AUDIT LOGS — append-only (no update/delete for any user)
-- =============================================================

CREATE POLICY "Audit logs: no update allowed"
  ON audit_logs FOR UPDATE
  USING (false);

CREATE POLICY "Audit logs: no delete allowed"
  ON audit_logs FOR DELETE
  USING (false);

CREATE POLICY "Audit logs: service role can insert"
  ON audit_logs FOR INSERT
  WITH CHECK (true); -- service role handles inserts; anon blocked by column constraints
