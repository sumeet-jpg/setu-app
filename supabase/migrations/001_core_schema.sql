-- =============================================================
-- SETU — Migration 001: Core Schema
-- Run: supabase db push  OR  paste into Supabase SQL Editor
-- =============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE agent_mode AS ENUM (
  'observe_only', 'draft_only', 'approval_required',
  'guarded_autonomy', 'admin_only', 'disabled'
);

CREATE TYPE agent_status AS ENUM (
  'active', 'sandbox', 'pilot', 'production', 'deprecated', 'disabled'
);

CREATE TYPE agent_complexity AS ENUM ('starter', 'growth', 'enterprise');

CREATE TYPE agent_readiness_tier AS ENUM (
  'tier_1_pilot_ready', 'tier_2_packaged_offer',
  'tier_3_catalog_offer', 'internal_only', 'experimental'
);

CREATE TYPE approval_status AS ENUM (
  'pending', 'approved', 'rejected', 'expired', 'cancelled'
);

CREATE TYPE audit_severity AS ENUM ('info', 'warning', 'critical');

CREATE TYPE kill_switch_level AS ENUM (
  'global', 'tenant', 'agent', 'runtime_instance',
  'runtime_deployment', 'tool_connector', 'action_type'
);

CREATE TYPE blueprint_status AS ENUM (
  'draft', 'pending_review', 'reviewed', 'approved', 'rejected', 'archived'
);

CREATE TYPE conversation_stage AS ENUM (
  'problem_discovery', 'system_mapping', 'risk_mapping',
  'agent_recommendation', 'blueprint_generation',
  'blueprint_refinement', 'sandbox_planning', 'conversion'
);

CREATE TYPE lead_status AS ENUM (
  'new', 'reviewed', 'qualified', 'unqualified',
  'pilot_scheduled', 'converted', 'lost'
);

CREATE TYPE support_ticket_status AS ENUM (
  'open', 'in_progress', 'escalated', 'resolved', 'closed'
);

CREATE TYPE runtime_activation_status AS ENUM (
  'pending_upgrade', 'awaiting_configuration', 'active', 'suspended', 'decommissioned'
);

CREATE TYPE runtime_deployment_status AS ENUM (
  'blueprint_ready', 'sandbox_scheduled', 'sandbox_active',
  'pilot_scheduled', 'pilot_active', 'production_scheduled',
  'production_active', 'paused', 'terminated'
);

CREATE TYPE runtime_run_status AS ENUM (
  'queued', 'running', 'completed', 'failed',
  'blocked_by_policy', 'blocked_by_kill_switch',
  'blocked_no_runtime', 'pending_approval'
);

-- =============================================================
-- TENANTS
-- =============================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);

-- =============================================================
-- PROFILES (extends Supabase auth.users)
-- =============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  full_name TEXT,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- =============================================================
-- AGENT CATALOG
-- =============================================================

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT UNIQUE NOT NULL,               -- e.g. SETU-001
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  vertical TEXT,
  sub_vertical TEXT,
  primary_buyer TEXT,
  best_icp TEXT,
  pain_problem TEXT NOT NULL,
  business_outcome TEXT NOT NULL,
  core_capabilities TEXT[] NOT NULL DEFAULT '{}',
  required_tools TEXT[] NOT NULL DEFAULT '{}',
  optional_tools TEXT[] NOT NULL DEFAULT '{}',
  complexity agent_complexity NOT NULL DEFAULT 'growth',
  default_mode agent_mode NOT NULL DEFAULT 'draft_only',
  status agent_status NOT NULL DEFAULT 'sandbox',
  readiness_tier agent_readiness_tier NOT NULL DEFAULT 'tier_3_catalog_offer',
  launch_tier TEXT,
  pricing_band TEXT,
  sales_confidence TEXT,
  commercial_priority TEXT,
  best_demo TEXT,
  sales_motion TEXT,
  why_sell_first TEXT,
  is_flagship BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  demo_script TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_agent_id ON agents(agent_id);
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_agents_is_flagship ON agents(is_flagship);
CREATE INDEX idx_agents_is_public ON agents(is_public);
CREATE INDEX idx_agents_readiness_tier ON agents(readiness_tier);
CREATE INDEX idx_agents_status ON agents(status);

-- Internal n8n workflow reference candidates (not public)
CREATE TABLE agent_candidate_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rank INTEGER NOT NULL,
  workflow_id TEXT NOT NULL,
  title TEXT NOT NULL,
  candidate_type TEXT,
  business_function TEXT,
  complexity TEXT,
  score INTEGER,
  node_count INTEGER,
  systems TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_candidates_rank ON agent_candidate_references(rank);
CREATE INDEX idx_agent_candidates_business_function ON agent_candidate_references(business_function);

-- =============================================================
-- TOOL REGISTRY
-- =============================================================

CREATE TABLE tool_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  integration_complexity TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tool_registry_category ON tool_registry(category);
CREATE INDEX idx_tool_registry_slug ON tool_registry(slug);

-- =============================================================
-- POLICY TEMPLATES
-- =============================================================

CREATE TABLE policy_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_blocking BOOLEAN NOT NULL DEFAULT true,
  escalation_required BOOLEAN NOT NULL DEFAULT false,
  applies_to_modes agent_mode[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policy_templates_key ON policy_templates(policy_key);

-- =============================================================
-- CONVERSATIONS
-- =============================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT,
  lead_id UUID,                                -- set after lead capture
  blueprint_id UUID,                           -- set after blueprint generated
  stage conversation_stage NOT NULL DEFAULT 'problem_discovery',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX idx_conversations_blueprint_id ON conversations(blueprint_id);

CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  structured_response JSONB,                   -- assistant response JSON
  intent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conv_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_conv_messages_created_at ON conversation_messages(created_at);

CREATE TABLE conversation_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID UNIQUE NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  stage conversation_stage NOT NULL DEFAULT 'problem_discovery',
  requirements JSONB NOT NULL DEFAULT '{}',
  blueprint_id UUID,
  lead_captured BOOLEAN NOT NULL DEFAULT false,
  last_intent TEXT,
  turn_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conv_state_conversation_id ON conversation_state(conversation_id);

-- =============================================================
-- BLUEPRINTS
-- =============================================================

CREATE TABLE generated_blueprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  lead_id UUID,
  version INTEGER NOT NULL DEFAULT 1,
  status blueprint_status NOT NULL DEFAULT 'draft',
  input_summary TEXT NOT NULL DEFAULT '',
  detected_workflow TEXT,
  recommendation JSONB,
  requirements JSONB NOT NULL DEFAULT '{}',
  tool_requirements JSONB NOT NULL DEFAULT '[]',
  policy_guardrails JSONB NOT NULL DEFAULT '[]',
  risk_assessment JSONB,
  passport JSONB,
  cost_estimate JSONB,
  sandbox_plan JSONB,
  rollout_plan JSONB,
  success_metrics TEXT[] NOT NULL DEFAULT '{}',
  next_cta TEXT,
  admin_notes TEXT,
  admin_reviewed_at TIMESTAMPTZ,
  admin_reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blueprints_status ON generated_blueprints(status);
CREATE INDEX idx_blueprints_session_id ON generated_blueprints(session_id);
CREATE INDEX idx_blueprints_conversation_id ON generated_blueprints(conversation_id);
CREATE INDEX idx_blueprints_created_at ON generated_blueprints(created_at DESC);

CREATE TABLE blueprint_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID NOT NULL REFERENCES generated_blueprints(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blueprint_id, version)
);

CREATE INDEX idx_blueprint_versions_blueprint_id ON blueprint_versions(blueprint_id);

-- =============================================================
-- AGENT PASSPORTS
-- =============================================================

CREATE TABLE agent_passports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID REFERENCES generated_blueprints(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  default_mode agent_mode NOT NULL DEFAULT 'draft_only',
  permitted_actions TEXT[] NOT NULL DEFAULT '{}',
  restricted_actions TEXT[] NOT NULL DEFAULT '{}',
  approval_required_actions TEXT[] NOT NULL DEFAULT '{}',
  tool_permissions JSONB NOT NULL DEFAULT '{}',
  data_access_scope TEXT[] NOT NULL DEFAULT '{}',
  audit_level TEXT NOT NULL DEFAULT 'standard',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_passports_blueprint_id ON agent_passports(blueprint_id);
CREATE INDEX idx_passports_agent_id ON agent_passports(agent_id);

-- =============================================================
-- APPROVAL REQUESTS
-- =============================================================

CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  blueprint_id UUID REFERENCES generated_blueprints(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  requested_by TEXT,
  requested_by_email TEXT,
  status approval_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approvals_status ON approval_requests(status);
CREATE INDEX idx_approvals_tenant_id ON approval_requests(tenant_id);
CREATE INDEX idx_approvals_created_at ON approval_requests(created_at DESC);

-- =============================================================
-- AUDIT LOGS (append-only — no UPDATE or DELETE policies)
-- =============================================================

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,                          -- prefixed ID: aud_timestamp_random
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  severity audit_severity NOT NULL DEFAULT 'info',
  entity_type TEXT,
  entity_id TEXT,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',         -- NEVER contains secrets
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- =============================================================
-- POLICY DECISIONS
-- =============================================================

CREATE TABLE policy_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  blueprint_id UUID REFERENCES generated_blueprints(id) ON DELETE SET NULL,
  policy_key TEXT NOT NULL,
  policy_name TEXT NOT NULL,
  action_attempted TEXT NOT NULL,
  result TEXT NOT NULL,
  reason TEXT NOT NULL,
  escalation_required BOOLEAN NOT NULL DEFAULT false,
  audit_log_id TEXT REFERENCES audit_logs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policy_decisions_policy_key ON policy_decisions(policy_key);
CREATE INDEX idx_policy_decisions_result ON policy_decisions(result);
CREATE INDEX idx_policy_decisions_created_at ON policy_decisions(created_at DESC);

-- =============================================================
-- FILE ACTION REQUESTS
-- =============================================================

CREATE TABLE file_action_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('delete', 'bulk_delete', 'external_share', 'permission_change')),
  file_path TEXT,
  file_count INTEGER,
  requested_by TEXT,
  justification TEXT,
  approval_request_id UUID REFERENCES approval_requests(id) ON DELETE SET NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_file_actions_status ON file_action_requests(status);
CREATE INDEX idx_file_actions_tenant_id ON file_action_requests(tenant_id);

-- =============================================================
-- CREDENTIAL REFERENCES (no raw secrets stored)
-- =============================================================

CREATE TABLE credential_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  provider TEXT NOT NULL,
  secret_ref TEXT NOT NULL,                     -- pointer to secret store ONLY
  -- Raw credentials are NEVER stored in this table
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credential_refs_tenant_id ON credential_references(tenant_id);
CREATE INDEX idx_credential_refs_provider ON credential_references(provider);

-- =============================================================
-- COST EVENTS
-- =============================================================

CREATE TABLE cost_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  blueprint_id UUID REFERENCES generated_blueprints(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  tokens_used INTEGER,
  estimated_cost_usd NUMERIC(10, 6),
  threshold_reached BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cost_events_tenant_id ON cost_events(tenant_id);
CREATE INDEX idx_cost_events_created_at ON cost_events(created_at DESC);

-- =============================================================
-- KILL SWITCHES
-- =============================================================

CREATE TABLE kill_switches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level kill_switch_level NOT NULL,
  target_id TEXT,                               -- tenant_id, agent_id, etc. NULL = global
  target_label TEXT NOT NULL,
  reason TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  activated_by TEXT NOT NULL,
  activated_at TIMESTAMPTZ,
  deactivated_by TEXT,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kill_switches_level ON kill_switches(level);
CREATE INDEX idx_kill_switches_is_active ON kill_switches(is_active);
CREATE INDEX idx_kill_switches_target_id ON kill_switches(target_id);

-- Insert global runtime kill switch (active until enterprise runtime activated)
INSERT INTO kill_switches (level, target_label, reason, is_active, activated_by, activated_at)
VALUES (
  'global',
  'All runtime execution',
  'Runtime provider not yet activated. Pending enterprise plan upgrade.',
  true,
  'system_init',
  NOW()
);

-- =============================================================
-- LEADS
-- =============================================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  role TEXT,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  blueprint_id UUID REFERENCES generated_blueprints(id) ON DELETE SET NULL,
  status lead_status NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'blueprint_builder',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

CREATE TABLE lead_intelligence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  company_summary TEXT,
  icp_fit_score INTEGER CHECK (icp_fit_score BETWEEN 0 AND 100),
  recommended_agents TEXT[] NOT NULL DEFAULT '{}',
  talking_points TEXT[] NOT NULL DEFAULT '{}',
  risk_flags TEXT[] NOT NULL DEFAULT '{}',
  generated_by TEXT NOT NULL DEFAULT 'lead_intelligence_agent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_intelligence_lead_id ON lead_intelligence(lead_id);

-- =============================================================
-- SUPPORT
-- =============================================================

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  status support_ticket_status NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  escalation_required BOOLEAN NOT NULL DEFAULT false,
  escalation_reason TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- =============================================================
-- INTERNAL AGENTS
-- =============================================================

CREATE TABLE internal_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT 'admin',
  mode agent_mode NOT NULL DEFAULT 'admin_only',
  input_schema JSONB NOT NULL DEFAULT '{}',
  output_schema JSONB NOT NULL DEFAULT '{}',
  allowed_actions TEXT[] NOT NULL DEFAULT '{}',
  approval_required_actions TEXT[] NOT NULL DEFAULT '{}',
  restricted_actions TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_internal_agents_key ON internal_agents(agent_key);

CREATE TABLE internal_agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES internal_agents(id) ON DELETE CASCADE,
  triggered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_internal_agent_runs_agent_id ON internal_agent_runs(agent_id);
CREATE INDEX idx_internal_agent_runs_status ON internal_agent_runs(status);
CREATE INDEX idx_internal_agent_runs_created_at ON internal_agent_runs(created_at DESC);

-- =============================================================
-- RUNTIME TABLES
-- =============================================================

CREATE TABLE runtime_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'n8n',
  instance_url TEXT,
  activation_status runtime_activation_status NOT NULL DEFAULT 'pending_upgrade',
  plan_tier TEXT,
  credential_ref_id UUID REFERENCES credential_references(id) ON DELETE SET NULL,
  is_customer_owned BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_runtime_instances_tenant_id ON runtime_instances(tenant_id);
CREATE INDEX idx_runtime_instances_activation_status ON runtime_instances(activation_status);

CREATE TABLE runtime_deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  blueprint_id UUID REFERENCES generated_blueprints(id) ON DELETE SET NULL,
  runtime_instance_id UUID REFERENCES runtime_instances(id) ON DELETE SET NULL,
  status runtime_deployment_status NOT NULL DEFAULT 'blueprint_ready',
  execution_disabled_reason TEXT DEFAULT 'Runtime provider not yet activated',
  approval_request_id UUID REFERENCES approval_requests(id) ON DELETE SET NULL,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_runtime_deployments_tenant_id ON runtime_deployments(tenant_id);
CREATE INDEX idx_runtime_deployments_agent_id ON runtime_deployments(agent_id);
CREATE INDEX idx_runtime_deployments_status ON runtime_deployments(status);

CREATE TABLE runtime_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deployment_id UUID REFERENCES runtime_deployments(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  status runtime_run_status NOT NULL DEFAULT 'queued',
  triggered_by TEXT,
  input_summary TEXT,
  output_summary TEXT,
  blocked_reason TEXT,
  policy_decision_id UUID REFERENCES policy_decisions(id) ON DELETE SET NULL,
  kill_switch_id UUID REFERENCES kill_switches(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_runtime_runs_deployment_id ON runtime_runs(deployment_id);
CREATE INDEX idx_runtime_runs_status ON runtime_runs(status);
CREATE INDEX idx_runtime_runs_created_at ON runtime_runs(created_at DESC);

-- =============================================================
-- KNOWLEDGE ARTICLES
-- =============================================================

CREATE TABLE knowledge_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,     -- internal by default
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_articles_slug ON knowledge_articles(slug);
CREATE INDEX idx_knowledge_articles_category ON knowledge_articles(category);

-- =============================================================
-- COMPLIANCE EVIDENCE
-- =============================================================

CREATE TABLE compliance_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  framework TEXT NOT NULL,                      -- 'soc2', 'iso27001', 'nist_ai_rmf', etc.
  control_id TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  evidence_description TEXT NOT NULL,
  audit_log_id TEXT REFERENCES audit_logs(id) ON DELETE SET NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_evidence_tenant_id ON compliance_evidence(tenant_id);
CREATE INDEX idx_compliance_evidence_framework ON compliance_evidence(framework);

-- =============================================================
-- SECURITY EVENTS
-- =============================================================

CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity audit_severity NOT NULL DEFAULT 'warning',
  description TEXT NOT NULL,
  source_ip TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_resolved ON security_events(resolved);
CREATE INDEX idx_security_events_created_at ON security_events(created_at DESC);

-- =============================================================
-- UPDATED_AT trigger function (reuse across tables)
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tenants', 'profiles', 'agents', 'tool_registry', 'policy_templates',
    'conversations', 'generated_blueprints', 'agent_passports',
    'approval_requests', 'file_action_requests', 'credential_references',
    'kill_switches', 'leads', 'support_tickets', 'internal_agents',
    'runtime_instances', 'runtime_deployments', 'knowledge_articles'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;
