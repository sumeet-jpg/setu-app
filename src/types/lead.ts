/**
 * SETU — Lead and Support Type Definitions
 */

export type LeadStatus =
  | "new"
  | "reviewed"
  | "qualified"
  | "unqualified"
  | "pilot_scheduled"
  | "converted"
  | "lost";

export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "escalated"
  | "resolved"
  | "closed";

export type SupportCategory =
  | "blueprint_question"
  | "workflow_audit_request"
  | "sandbox_request"
  | "pricing_question"
  | "integration_question"
  | "security_compliance_question"
  | "pilot_request"
  | "bug_reporting_issue"
  | "account_billing"
  | "other";

export interface Lead {
  id: string;
  email: string;
  name?: string;
  company?: string;
  role?: string;
  conversation_id?: string;
  blueprint_id?: string;
  status: LeadStatus;
  source: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadIntelligence {
  id: string;
  lead_id: string;
  company_summary?: string;
  icp_fit_score?: number;
  recommended_agents: string[];
  talking_points: string[];
  risk_flags: string[];
  generated_by: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  lead_id?: string;
  conversation_id?: string;
  category: SupportCategory;
  subject: string;
  status: SupportTicketStatus;
  priority: "low" | "medium" | "high" | "critical";
  escalation_required: boolean;
  escalation_reason?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}
