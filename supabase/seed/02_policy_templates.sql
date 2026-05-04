-- =============================================================
-- SETU Seed 02: Policy Templates
-- =============================================================

INSERT INTO policy_templates (policy_key, name, description, is_blocking, escalation_required, applies_to_modes) VALUES
  (
    'sandbox_required_before_production',
    'Sandbox Required Before Production',
    'Every agent must complete sandbox validation before moving to production. No direct production deployment.',
    true, false,
    ARRAY['draft_only', 'approval_required', 'guarded_autonomy']::agent_mode[]
  ),
  (
    'log_every_action',
    'Log Every Action',
    'Every agent action, decision, and output must be written to the audit log before and after execution.',
    true, false,
    ARRAY['observe_only', 'draft_only', 'approval_required', 'guarded_autonomy', 'admin_only']::agent_mode[]
  ),
  (
    'no_external_send_without_approval',
    'No External Send Without Approval',
    'Agents may not send any external communication (email, SMS, message) without prior admin approval.',
    true, true,
    ARRAY['draft_only', 'approval_required', 'guarded_autonomy']::agent_mode[]
  ),
  (
    'no_file_deletion_without_admin_approval',
    'No File Deletion Without Admin Approval',
    'File deletion (single or bulk) is blocked by default. Requires explicit admin approval and audit log entry.',
    true, true,
    ARRAY['observe_only', 'draft_only', 'approval_required', 'guarded_autonomy', 'admin_only']::agent_mode[]
  ),
  (
    'no_external_file_sharing_without_admin_approval',
    'No External File Sharing Without Admin Approval',
    'Files may not be shared externally or with unrecognized parties without admin approval.',
    true, true,
    ARRAY['observe_only', 'draft_only', 'approval_required', 'guarded_autonomy', 'admin_only']::agent_mode[]
  ),
  (
    'no_financial_posting_without_approval',
    'No Financial Posting Without Approval',
    'No financial transactions, payments, refunds, or accounting entries may be posted without human approval.',
    true, true,
    ARRAY['draft_only', 'approval_required', 'guarded_autonomy']::agent_mode[]
  ),
  (
    'no_legal_or_medical_advice',
    'No Legal or Medical Advice',
    'Agents may not provide legal, medical, compliance, or regulated professional advice. Always escalate to qualified professionals.',
    true, true,
    ARRAY['observe_only', 'draft_only', 'approval_required', 'guarded_autonomy', 'admin_only']::agent_mode[]
  ),
  (
    'escalate_low_confidence',
    'Escalate on Low Confidence',
    'When agent confidence score falls below threshold, draft output for human review rather than proceeding autonomously.',
    false, true,
    ARRAY['draft_only', 'approval_required', 'guarded_autonomy']::agent_mode[]
  ),
  (
    'escalate_angry_customer',
    'Escalate Angry or Distressed Customer',
    'Detect negative sentiment signals and escalate to a human agent immediately. Do not attempt autonomous resolution.',
    true, true,
    ARRAY['draft_only', 'approval_required', 'guarded_autonomy']::agent_mode[]
  ),
  (
    'escalate_legal_or_compliance_sensitive',
    'Escalate Legal or Compliance-Sensitive Content',
    'Any interaction involving legal, regulatory, compliance, healthcare, or HR-sensitive topics must be escalated to a human.',
    true, true,
    ARRAY['observe_only', 'draft_only', 'approval_required', 'guarded_autonomy', 'admin_only']::agent_mode[]
  ),
  (
    'pause_on_cost_threshold',
    'Pause on Cost Threshold',
    'Agent execution pauses and requires admin review when estimated or actual cost exceeds the configured threshold.',
    true, false,
    ARRAY['draft_only', 'approval_required', 'guarded_autonomy']::agent_mode[]
  ),
  (
    'pause_on_repeated_critical_errors',
    'Pause on Repeated Critical Errors',
    'If an agent encounters 3 or more critical errors in a run, execution pauses and an admin alert is triggered.',
    true, true,
    ARRAY['draft_only', 'approval_required', 'guarded_autonomy']::agent_mode[]
  )
ON CONFLICT (policy_key) DO NOTHING;
