-- =============================================================
-- SETU Seed 05: Knowledge Articles (internal)
-- =============================================================

INSERT INTO knowledge_articles (slug, title, content, category, is_public) VALUES
  ('what-is-setu', 'What is Setu?',
   'Setu is an AI Operations Control Plane for governed business process agents. Setu helps enterprises identify, blueprint, sandbox, and deploy AI operators across revenue, support, finance, operations, compliance, IT, HR, marketing, and customer success — with human approvals, audit logs, cost controls, and rollback built in from day one.',
   'product', false),

  ('what-is-ai-operations-control-plane', 'What is an AI Operations Control Plane?',
   'An AI Operations Control Plane is the governance layer that sits between your business workflows and AI execution. Instead of letting AI agents run freely, the control plane ensures every agent action passes permission checks, policy checks, risk scoring, approval gates, cost controls, and kill switches before execution — and logs everything after.',
   'product', false),

  ('what-is-agent-blueprint', 'What is an Agent Blueprint?',
   'An Agent Blueprint is the structured plan for deploying a managed AI operator. It includes: the recommended agent from the Setu catalog, required and optional tool integrations, policy guardrails, risk assessment, cost estimate, sandbox plan, rollout plan, and success metrics. Blueprints are generated conversationally and reviewed before any deployment.',
   'product', false),

  ('what-is-agent-passport', 'What is an Agent Passport?',
   'An Agent Passport is the permission document for a deployed agent. It specifies exactly what the agent is allowed to do (permitted actions), what requires human approval (approval-required actions), and what is permanently blocked (restricted actions). Every agent starts in draft_only mode and earns autonomy over time.',
   'product', false),

  ('what-is-sandbox', 'What is a Sandbox?',
   'A Sandbox is a controlled, isolated environment where an agent runs against test data before touching production systems. Every Setu agent must complete sandbox validation before moving to a pilot. The sandbox documents what the agent does, what it blocks, and what it escalates.',
   'product', false),

  ('what-is-approval-based-pilot', 'What is an Approval-Based Pilot?',
   'An Approval-Based Pilot is the first live deployment of a Setu agent in a production environment. Every significant action requires human review and approval during the pilot phase. The pilot typically runs for 4–8 weeks with weekly review sessions before the agent earns managed production status.',
   'product', false),

  ('what-is-managed-production', 'What is Managed Production?',
   'Managed Production is the final deployment stage where an agent operates with configured autonomy, ongoing monitoring, cost controls, kill switches, and Setu support. Even in production, high-risk actions (financial, legal, file deletion, external sharing) remain approval-gated by default.',
   'product', false),

  ('how-pricing-works', 'How Setu Pricing Works',
   'Setu uses a four-tier pricing model: (1) Instant Agent Blueprint — free, generated in the conversation; (2) Workflow Blueprint package — $1.5k–$10k, full blueprint with tool mapping and risk assessment; (3) Approval-Based Pilot — $10k–$50k depending on agent complexity; (4) Managed Production — custom enterprise pricing. Contact Setu for a proposal.',
   'pricing', false),

  ('how-approvals-work', 'How Setu Handles Approvals',
   'By default, all Setu agents start in draft_only mode — they prepare outputs for human review but do not execute actions autonomously. Actions involving external communication, financial transactions, file operations, or sensitive decisions always require explicit admin approval regardless of agent mode. Approval requests are tracked, logged, and auditable.',
   'governance', false),

  ('how-risky-actions-work', 'How Setu Handles Risky Actions',
   'Setu permanently blocks the following actions without admin approval: file deletion, bulk file deletion, external file sharing, file permission changes, external email/SMS sending, financial postings, refunds, legal or medical advice, access provisioning, access deprovisioning, contract commitments, and pricing discount promises. These restrictions cannot be overridden by the agent itself.',
   'governance', false),

  ('what-tools-setu-connects', 'What Tools Can Setu Connect To?',
   'Setu connects to common enterprise tools including CRMs (Salesforce, HubSpot), email (Gmail, Outlook), calendars, Slack and Teams, support desks (Zendesk, Intercom, Freshdesk), finance/ERP (QuickBooks, Xero, NetSuite, Stripe), document storage (Google Drive, SharePoint), HR systems (BambooHR, Workday), identity (Okta, Auth0), contract tools (DocuSign, PandaDoc), and custom APIs. Tool availability depends on agent and integration complexity.',
   'integrations', false)

ON CONFLICT (slug) DO NOTHING;
