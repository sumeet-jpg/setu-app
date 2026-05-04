-- =============================================================
-- SETU Seed 04: Internal Admin Agents
-- These are admin-triggered backend actions only.
-- =============================================================

INSERT INTO internal_agents
  (agent_key, name, purpose, owner, mode,
   input_schema, output_schema,
   allowed_actions, approval_required_actions, restricted_actions)
VALUES
  (
    'lead_intelligence',
    'Lead Intelligence Agent',
    'Research a lead company and generate ICP fit score, talking points, and risk flags for sales preparation.',
    'admin',
    'admin_only',
    '{"lead_id": "uuid", "company_name": "string", "email": "string"}'::JSONB,
    '{"company_summary": "string", "icp_fit_score": "integer 0-100", "recommended_agents": "array", "talking_points": "array", "risk_flags": "array"}'::JSONB,
    ARRAY['web_search', 'llm_reasoning', 'read_crm', 'write_lead_intelligence'],
    ARRAY[]::TEXT[],
    ARRAY['send_email', 'write_crm', 'access_financials', 'external_api_post']
  ),
  (
    'workflow_audit_prep',
    'Workflow Audit Prep Agent',
    'Review a blueprint conversation and prepare a structured workflow audit document with gaps, risks, and recommendations.',
    'admin',
    'admin_only',
    '{"blueprint_id": "uuid", "conversation_id": "uuid"}'::JSONB,
    '{"audit_summary": "string", "gaps": "array", "risks": "array", "recommendations": "array", "readiness_score": "integer 0-100"}'::JSONB,
    ARRAY['read_blueprint', 'read_conversation', 'llm_reasoning', 'write_audit_report'],
    ARRAY[]::TEXT[],
    ARRAY['send_email', 'modify_blueprint', 'external_api_post']
  ),
  (
    'sales_call_summary',
    'Sales Call Summary Agent',
    'Summarize a sales call transcript into structured next actions, objections, and CRM-ready notes.',
    'admin',
    'admin_only',
    '{"transcript_text": "string", "lead_id": "uuid", "call_date": "string"}'::JSONB,
    '{"summary": "string", "objections": "array", "next_actions": "array", "crm_note": "string", "follow_up_draft": "string"}'::JSONB,
    ARRAY['llm_reasoning', 'read_lead', 'write_internal_note'],
    ARRAY['write_crm'],
    ARRAY['send_email', 'external_api_post', 'access_financials']
  ),
  (
    'proposal_draft',
    'Proposal Draft Agent',
    'Generate a tailored Setu proposal outline for a specific lead based on their blueprint and company context.',
    'admin',
    'admin_only',
    '{"lead_id": "uuid", "blueprint_id": "uuid", "pricing_tier": "string"}'::JSONB,
    '{"proposal_sections": "array", "recommended_agents": "array", "pricing_summary": "string", "timeline": "string", "risks": "array"}'::JSONB,
    ARRAY['read_lead', 'read_blueprint', 'read_agents', 'llm_reasoning', 'write_proposal_draft'],
    ARRAY['send_email'],
    ARRAY['commit_pricing', 'legal_commitment', 'access_financials']
  ),
  (
    'support_triage',
    'Support Triage Agent',
    'Classify an incoming support conversation, recommend a response category, and flag escalation needs.',
    'admin',
    'admin_only',
    '{"conversation_id": "uuid", "message_content": "string", "lead_email": "string"}'::JSONB,
    '{"category": "string", "priority": "string", "escalation_required": "boolean", "escalation_reason": "string", "draft_response": "string", "knowledge_articles": "array"}'::JSONB,
    ARRAY['read_conversation', 'read_knowledge_articles', 'llm_reasoning', 'write_ticket'],
    ARRAY['send_email'],
    ARRAY['external_api_post', 'access_financials', 'legal_commitment']
  ),
  (
    'founder_brief',
    'Founder Brief Agent',
    'Generate a daily operational brief for the Setu founder: pipeline, support, runtime, and priority actions.',
    'admin',
    'admin_only',
    '{"date": "string", "include_sections": "array"}'::JSONB,
    '{"pipeline_summary": "string", "support_summary": "string", "blueprint_queue": "string", "priority_actions": "array", "risk_flags": "array"}'::JSONB,
    ARRAY['read_leads', 'read_blueprints', 'read_support_tickets', 'read_audit_logs', 'llm_reasoning'],
    ARRAY[]::TEXT[],
    ARRAY['send_email', 'external_api_post', 'modify_data']
  )
ON CONFLICT (agent_key) DO NOTHING;
