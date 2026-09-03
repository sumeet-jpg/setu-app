// @ts-nocheck
// ── Setu Tool Registry ───────────────────────────────────────────────────────
// Every tool a customer can connect. Logo comes from Clearbit via domain.
// authType drives the connect modal copy and how keys are sent in requests.

export type AuthType = 'api_key' | 'bearer' | 'basic' | 'oauth' | 'account_sid'

export type ToolCategory =
  | 'CRM'
  | 'Email Marketing'
  | 'Paid Ads'
  | 'Analytics'
  | 'SEO'
  | 'Social Media'
  | 'Communication'
  | 'Project Management'
  | 'Sales Outreach'
  | 'Customer Support'
  | 'Finance & Payments'
  | 'Accounting'
  | 'HR & People'
  | 'Engineering'
  | 'Data & BI'
  | 'E-commerce'
  | 'Messaging'
  | 'Design'
  | 'Content & Docs'
  | 'Marketing Automation'
  // Scheduling and E-signature didn't exist as categories at all — every
  // other category ships 3-4 vendors so whichever tool a customer already
  // uses is covered (CRM: HubSpot/Salesforce/Pipedrive/Zoho; Email:
  // Mailchimp/Klaviyo/Customer.io/SendGrid). These two had ZERO vendors,
  // meaning no employee could ever actually book a real meeting or get a
  // document really signed — only draft one and stop. Not every company
  // uses Cal.com, so this follows the same multi-vendor pattern rather
  // than picking a single winner.
  | 'Scheduling'
  | 'E-signature'
  // Whole categories of real work an employee could plausibly claim,
  // with zero vendor coverage at all: nobody could join/create a video
  // call, no recruiter employee could touch an actual ATS, no
  // compliance employee could touch Vanta/Drata despite that being
  // exactly what its watchPatterns describe (control evidence gaps,
  // access reviews), no finance employee could process payroll or
  // expenses, no local-business employee could manage reviews, no
  // analyst employee could query an actual warehouse.
  | 'Video & Meetings'
  | 'Recruiting & ATS'
  | 'Payroll & Expenses'
  | 'Reviews & Reputation'
  | 'Compliance & GRC'
  | 'Data Warehouse'

export interface ToolDef {
  slug: string
  name: string
  domain: string            // Clearbit logo domain
  category: ToolCategory
  description: string       // What this tool does — injected into Claude's context
  authType: AuthType
  authLabel: string         // Label shown in connect modal
  authPlaceholder: string   // Placeholder for the key input
  authHint: string          // How to get the key (short)
  baseUrl: string           // API base URL (may contain {placeholder})
  docsUrl: string
}

export const TOOL_REGISTRY: ToolDef[] = [
  // ── CRM ──────────────────────────────────────────────────────────────────
  {
    slug: 'hubspot',
    name: 'HubSpot',
    domain: 'hubspot.com',
    category: 'CRM',
    description: 'CRM, marketing automation, sales sequences, and customer service hub. API base: https://api.hubapi.com. Key endpoints: /crm/v3/objects/contacts, /crm/v3/objects/deals, /marketing/v3/emails, /automation/v4/flows.',
    authType: 'bearer',
    authLabel: 'Private App Token',
    authPlaceholder: 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    authHint: 'HubSpot → Settings → Integrations → Private Apps → Create app → copy token',
    baseUrl: 'https://api.hubapi.com',
    docsUrl: 'https://developers.hubspot.com/docs/api/overview',
  },
  {
    slug: 'salesforce',
    name: 'Salesforce',
    domain: 'salesforce.com',
    category: 'CRM',
    description: 'Enterprise CRM. Accounts, contacts, opportunities, leads, campaigns. API base: https://{instance}.salesforce.com/services/data/v59.0. Use Connected App OAuth or session token.',
    authType: 'bearer',
    authLabel: 'Session Token or Connected App Token',
    authPlaceholder: '00Dxx0000000xxx!AQEAxxxxxxxxxxxxxx',
    authHint: 'Salesforce → Setup → Connected Apps → OAuth → get access_token via Postman or CLI',
    baseUrl: 'https://login.salesforce.com',
    docsUrl: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest',
  },
  {
    slug: 'pipedrive',
    name: 'Pipedrive',
    domain: 'pipedrive.com',
    category: 'CRM',
    description: 'Sales-focused CRM. Deals, persons, organizations, activities, pipelines. API base: https://api.pipedrive.com/v1. Append ?api_token=KEY to every request.',
    authType: 'api_key',
    authLabel: 'API Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Pipedrive → Profile → Personal Preferences → API → copy token',
    baseUrl: 'https://api.pipedrive.com/v1',
    docsUrl: 'https://developers.pipedrive.com/docs/api/v1',
  },
  {
    slug: 'zoho-crm',
    name: 'Zoho CRM',
    domain: 'zoho.com',
    category: 'CRM',
    description: 'CRM with leads, contacts, accounts, deals, and workflows. API base: https://www.zohoapis.com/crm/v6. Uses OAuth access token in Authorization: Zoho-oauthtoken header.',
    authType: 'bearer',
    authLabel: 'OAuth Access Token',
    authPlaceholder: '1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Zoho API Console → Self Client → generate access token with ZohoCRM.modules.ALL scope',
    baseUrl: 'https://www.zohoapis.com/crm/v6',
    docsUrl: 'https://www.zoho.com/crm/developer/docs/api/v6/',
  },
  // ── Sales Outreach ────────────────────────────────────────────────────────
  {
    slug: 'outreach',
    name: 'Outreach',
    domain: 'outreach.io',
    category: 'Sales Outreach',
    description: 'Sales engagement platform. Sequences, tasks, emails, calls, prospects. API base: https://api.outreach.io/api/v2. Bearer token auth.',
    authType: 'bearer',
    authLabel: 'API Token',
    authPlaceholder: 'eyJhbGciOiJSUzI1NiJ9...',
    authHint: 'Outreach → Settings → Apps & Integrations → API → create token',
    baseUrl: 'https://api.outreach.io/api/v2',
    docsUrl: 'https://developer.outreach.io/api/reference',
  },
  {
    slug: 'salesloft',
    name: 'Salesloft',
    domain: 'salesloft.com',
    category: 'Sales Outreach',
    description: 'Sales engagement with cadences, emails, calls, analytics. API base: https://api.salesloft.com/v2. Bearer token in Authorization header.',
    authType: 'bearer',
    authLabel: 'API Key',
    authPlaceholder: 'slapi_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Salesloft → Settings → API Keys → Create API Key',
    baseUrl: 'https://api.salesloft.com/v2',
    docsUrl: 'https://developers.salesloft.com/api.html',
  },
  {
    slug: 'apollo',
    name: 'Apollo.io',
    domain: 'apollo.io',
    category: 'Sales Outreach',
    description: 'B2B prospecting, contact data, email sequences. API base: https://api.apollo.io/v1. API key in X-Api-Key header or request body.',
    authType: 'api_key',
    authLabel: 'API Key',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Apollo → Settings → Integrations → API → copy key',
    baseUrl: 'https://api.apollo.io/v1',
    docsUrl: 'https://apolloio.github.io/apollo-api-docs/',
  },
  // ── Email Marketing ───────────────────────────────────────────────────────
  {
    slug: 'mailchimp',
    name: 'Mailchimp',
    domain: 'mailchimp.com',
    category: 'Email Marketing',
    description: 'Email campaigns, automations, audiences, and analytics. API base: https://{dc}.api.mailchimp.com/3.0 where dc is the last part of your API key (e.g., us21). Auth: Basic with username "apikey" and password = your API key.',
    authType: 'basic',
    authLabel: 'API Key',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us21',
    authHint: 'Mailchimp → Account → Extras → API keys → Create A Key',
    baseUrl: 'https://{dc}.api.mailchimp.com/3.0',
    docsUrl: 'https://mailchimp.com/developer/marketing/api/',
  },
  {
    slug: 'klaviyo',
    name: 'Klaviyo',
    domain: 'klaviyo.com',
    category: 'Email Marketing',
    description: 'Email and SMS marketing for e-commerce. Campaigns, flows, lists, segments, profiles. API base: https://a.klaviyo.com/api. Bearer token: "Klaviyo-API-Key your-key".',
    authType: 'bearer',
    authLabel: 'Private API Key',
    authPlaceholder: 'pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Klaviyo → Account → Settings → API Keys → Create Private API Key',
    baseUrl: 'https://a.klaviyo.com/api',
    docsUrl: 'https://developers.klaviyo.com/en/reference/api-overview',
  },
  {
    slug: 'customer-io',
    name: 'Customer.io',
    domain: 'customer.io',
    category: 'Email Marketing',
    description: 'Behavioral email and messaging platform. Campaigns, broadcasts, segments, people. App API base: https://api.customer.io/v1. Track API: https://track.customer.io/api/v1. Bearer auth with App API Key.',
    authType: 'bearer',
    authLabel: 'App API Key',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Customer.io → Settings → API Credentials → App API Keys → Create Key',
    baseUrl: 'https://api.customer.io/v1',
    docsUrl: 'https://customer.io/docs/api/',
  },
  {
    slug: 'sendgrid',
    name: 'SendGrid',
    domain: 'sendgrid.com',
    category: 'Email Marketing',
    description: 'Transactional and marketing email. Campaigns, contacts, templates, suppressions. API base: https://api.sendgrid.com/v3. Bearer token auth.',
    authType: 'bearer',
    authLabel: 'API Key',
    authPlaceholder: 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'SendGrid → Settings → API Keys → Create API Key → Full Access',
    baseUrl: 'https://api.sendgrid.com/v3',
    docsUrl: 'https://www.twilio.com/docs/sendgrid/api-reference',
  },
  {
    slug: 'activecampaign',
    name: 'ActiveCampaign',
    domain: 'activecampaign.com',
    category: 'Marketing Automation',
    description: 'CRM + email automation. Contacts, lists, automations, campaigns, deals. API base: https://{account}.api-us1.com/api/3. Header: Api-Token: your-key.',
    authType: 'api_key',
    authLabel: 'API Key',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'ActiveCampaign → Settings → Developer → API Key (also note your Account URL)',
    baseUrl: 'https://{account}.api-us1.com/api/3',
    docsUrl: 'https://developers.activecampaign.com/reference/overview',
  },
  {
    slug: 'marketo',
    name: 'Marketo',
    domain: 'marketo.com',
    category: 'Marketing Automation',
    description: 'Enterprise marketing automation. Leads, programs, smart lists, emails, campaigns. REST API base: https://{munchkin}.mktorest.com/rest/v1. OAuth client credentials.',
    authType: 'oauth',
    authLabel: 'Client ID + Client Secret',
    authPlaceholder: 'clientId:clientSecret',
    authHint: 'Marketo → Admin → LaunchPoint → Create New Service → REST API → get Client ID and Secret',
    baseUrl: 'https://{munchkin}.mktorest.com/rest/v1',
    docsUrl: 'https://developers.marketo.com/rest-api/',
  },
  // ── Paid Ads ──────────────────────────────────────────────────────────────
  {
    slug: 'google-ads',
    name: 'Google Ads',
    domain: 'google.com',
    category: 'Paid Ads',
    description: 'Search, display, shopping, and video advertising. Campaigns, ad groups, keywords, ads, extensions. Use Google Ads API with developer token + OAuth. REST base: https://googleads.googleapis.com/v17.',
    authType: 'oauth',
    authLabel: 'Developer Token + OAuth Refresh Token',
    authPlaceholder: 'developer_token:refresh_token:client_id:client_secret',
    authHint: 'Google Ads API Center → apply for developer token → OAuth2 → refresh token',
    baseUrl: 'https://googleads.googleapis.com/v17',
    docsUrl: 'https://developers.google.com/google-ads/api/docs/start',
  },
  {
    slug: 'meta-ads',
    name: 'Meta Ads',
    domain: 'meta.com',
    category: 'Paid Ads',
    description: 'Facebook and Instagram advertising. Campaigns, ad sets, ads, audiences, insights. API base: https://graph.facebook.com/v20.0. Bearer access token.',
    authType: 'bearer',
    authLabel: 'Access Token',
    authPlaceholder: 'your_meta_access_token_here',
    authHint: 'Meta Business Suite → Settings → Business Settings → System Users → generate token with ads_management permission',
    baseUrl: 'https://graph.facebook.com/v20.0',
    docsUrl: 'https://developers.facebook.com/docs/marketing-api/overview',
  },
  {
    slug: 'linkedin-ads',
    name: 'LinkedIn Ads',
    domain: 'linkedin.com',
    category: 'Paid Ads',
    description: 'B2B advertising on LinkedIn. Sponsored content, InMail, text ads. Campaign Manager API base: https://api.linkedin.com/rest. OAuth2 bearer token.',
    authType: 'bearer',
    authLabel: 'OAuth Access Token',
    authPlaceholder: 'AQXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'LinkedIn Developer Portal → create app → OAuth 2.0 → generate token with r_ads,rw_ads,r_ads_reporting permissions',
    baseUrl: 'https://api.linkedin.com/rest',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/',
  },
  {
    slug: 'tiktok-ads',
    name: 'TikTok Ads',
    domain: 'tiktok.com',
    category: 'Paid Ads',
    description: 'TikTok for Business advertising. Campaigns, ad groups, creatives, audiences. API base: https://business-api.tiktok.com/open_api/v1.3. Access token in header.',
    authType: 'bearer',
    authLabel: 'Access Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'TikTok for Business → Assets → Business Center → Apps → create app → generate access token',
    baseUrl: 'https://business-api.tiktok.com/open_api/v1.3',
    docsUrl: 'https://business-api.tiktok.com/portal/docs',
  },
  // ── Analytics ─────────────────────────────────────────────────────────────
  {
    slug: 'ga4',
    name: 'Google Analytics 4',
    domain: 'google.com',
    category: 'Analytics',
    description: 'Web and app analytics. Sessions, users, events, conversions, funnels. Data API base: https://analyticsdata.googleapis.com/v1beta. OAuth service account or bearer token.',
    authType: 'bearer',
    authLabel: 'Service Account JSON or OAuth Token',
    authPlaceholder: 'ya29.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Google Cloud Console → service account → grant Analytics Viewer role → generate key or use OAuth',
    baseUrl: 'https://analyticsdata.googleapis.com/v1beta',
    docsUrl: 'https://developers.google.com/analytics/devguides/reporting/data/v1',
  },
  {
    slug: 'mixpanel',
    name: 'Mixpanel',
    domain: 'mixpanel.com',
    category: 'Analytics',
    description: 'Product analytics. Events, funnels, retention, cohorts, user profiles. Export API: https://data.mixpanel.com/api/2.0. Query API: https://mixpanel.com/api/2.0. Basic auth: username=service_account, password=secret.',
    authType: 'basic',
    authLabel: 'Service Account + Secret',
    authPlaceholder: 'service_account_user:service_account_secret',
    authHint: 'Mixpanel → Settings → Organization → Service Accounts → create account and secret',
    baseUrl: 'https://mixpanel.com/api/2.0',
    docsUrl: 'https://developer.mixpanel.com/reference/overview',
  },
  {
    slug: 'amplitude',
    name: 'Amplitude',
    domain: 'amplitude.com',
    category: 'Analytics',
    description: 'Product analytics. Charts, funnels, retention, cohorts, user behavior. Dashboard REST API base: https://amplitude.com/api/2. Header: Authorization: Basic base64(api_key:secret).',
    authType: 'basic',
    authLabel: 'API Key + Secret Key',
    authPlaceholder: 'api_key:secret_key',
    authHint: 'Amplitude → Settings → Projects → your project → API Key and Secret Key',
    baseUrl: 'https://amplitude.com/api/2',
    docsUrl: 'https://www.docs.developers.amplitude.com/analytics/apis/',
  },
  {
    slug: 'posthog',
    name: 'PostHog',
    domain: 'posthog.com',
    category: 'Analytics',
    description: 'Open-source product analytics. Events, feature flags, session recordings, funnels. API base: https://app.posthog.com/api. Personal API key as Authorization: Bearer.',
    authType: 'bearer',
    authLabel: 'Personal API Key',
    authPlaceholder: 'phx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'PostHog → Settings → Personal API Keys → Create personal API key',
    baseUrl: 'https://app.posthog.com/api',
    docsUrl: 'https://posthog.com/docs/api',
  },
  {
    slug: 'hotjar',
    name: 'Hotjar',
    domain: 'hotjar.com',
    category: 'Analytics',
    description: 'Heatmaps, session recordings, feedback surveys, funnels. API v3 base: https://api.hotjar.com/v3. Bearer token from client credentials flow.',
    authType: 'bearer',
    authLabel: 'API Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Hotjar → Settings → Sites & Organizations → API → create token',
    baseUrl: 'https://api.hotjar.com/v3',
    docsUrl: 'https://apidocs.hotjar.com/',
  },
  // ── SEO ───────────────────────────────────────────────────────────────────
  {
    slug: 'semrush',
    name: 'Semrush',
    domain: 'semrush.com',
    category: 'SEO',
    description: 'SEO, keyword research, competitor analysis, backlinks. API base: https://api.semrush.com. Pass key as ?key= query param. Reports: domain_organic, phrase_all, backlinks.',
    authType: 'api_key',
    authLabel: 'API Key',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Semrush → Profile → Subscription Info → API Units → copy key',
    baseUrl: 'https://api.semrush.com',
    docsUrl: 'https://developer.semrush.com/api/',
  },
  {
    slug: 'ahrefs',
    name: 'Ahrefs',
    domain: 'ahrefs.com',
    category: 'SEO',
    description: 'Backlink analysis, keyword research, site audit, rank tracking. API v3 base: https://api.ahrefs.com/v3. Bearer token in Authorization header.',
    authType: 'bearer',
    authLabel: 'API Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Ahrefs → Account Settings → API Key → generate token',
    baseUrl: 'https://api.ahrefs.com/v3',
    docsUrl: 'https://ahrefs.com/api',
  },
  {
    slug: 'search-console',
    name: 'Google Search Console',
    domain: 'google.com',
    category: 'SEO',
    description: 'Organic search performance. Queries, pages, impressions, clicks, CTR, position. API base: https://searchconsole.googleapis.com/webmasters/v3. OAuth or service account.',
    authType: 'bearer',
    authLabel: 'OAuth Token',
    authPlaceholder: 'ya29.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Google Cloud Console → service account → Search Console → grant permission → generate OAuth token',
    baseUrl: 'https://searchconsole.googleapis.com/webmasters/v3',
    docsUrl: 'https://developers.google.com/webmaster-tools/v1/api_reference_index',
  },
  // ── Social Media ──────────────────────────────────────────────────────────
  {
    slug: 'buffer',
    name: 'Buffer',
    domain: 'buffer.com',
    category: 'Social Media',
    description: 'Social media scheduling across Twitter, LinkedIn, Facebook, Instagram. API base: https://api.bufferapp.com/1. Bearer access token.',
    authType: 'bearer',
    authLabel: 'Access Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Buffer → Developer Hub → create app → OAuth2 → copy access_token',
    baseUrl: 'https://api.bufferapp.com/1',
    docsUrl: 'https://buffer.com/developers/api',
  },
  {
    slug: 'hootsuite',
    name: 'Hootsuite',
    domain: 'hootsuite.com',
    category: 'Social Media',
    description: 'Social media management, scheduling, monitoring, analytics. API base: https://platform.hootsuite.com/v1. OAuth2 bearer token.',
    authType: 'bearer',
    authLabel: 'Access Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Hootsuite → My Profile → Developer → create app → OAuth2 → access token',
    baseUrl: 'https://platform.hootsuite.com/v1',
    docsUrl: 'https://developer.hootsuite.com/',
  },
  // ── Communication ─────────────────────────────────────────────────────────
  {
    slug: 'slack',
    name: 'Slack',
    domain: 'slack.com',
    category: 'Communication',
    description: 'Team messaging. Post messages, create channels, manage users, search messages. API base: https://slack.com/api. Bearer bot token in Authorization header.',
    authType: 'bearer',
    authLabel: 'Bot Token',
    authPlaceholder: 'xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Slack API → create app → OAuth & Permissions → add scopes → Install to workspace → copy Bot User OAuth Token',
    baseUrl: 'https://slack.com/api',
    docsUrl: 'https://api.slack.com/methods',
  },
  {
    slug: 'intercom',
    name: 'Intercom',
    domain: 'intercom.com',
    category: 'Customer Support',
    description: 'Customer messaging, support, and CRM. Conversations, contacts, companies, tickets. API base: https://api.intercom.io. Bearer token auth.',
    authType: 'bearer',
    authLabel: 'Access Token',
    authPlaceholder: 'dG9rOjxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Intercom → Settings → Developers → Your apps → create app → Access Token',
    baseUrl: 'https://api.intercom.io',
    docsUrl: 'https://developers.intercom.com/docs/build-an-integration/learn-more/rest-apis/',
  },
  {
    slug: 'zendesk',
    name: 'Zendesk',
    domain: 'zendesk.com',
    category: 'Customer Support',
    description: 'Help desk and ticketing. Tickets, users, organizations, macros, reports. API base: https://{subdomain}.zendesk.com/api/v2. Basic auth with email:token.',
    authType: 'basic',
    authLabel: 'Email/token (email:api_token)',
    authPlaceholder: 'you@company.com/token:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Zendesk → Admin → Apps and integrations → APIs → Zendesk API → Enable → Add API Token',
    baseUrl: 'https://{subdomain}.zendesk.com/api/v2',
    docsUrl: 'https://developer.zendesk.com/api-reference/',
  },
  {
    slug: 'freshdesk',
    name: 'Freshdesk',
    domain: 'freshdesk.com',
    category: 'Customer Support',
    description: 'Help desk. Tickets, contacts, agents, groups, canned responses. API base: https://{domain}.freshdesk.com/api/v2. Basic auth with API key as username and X as password.',
    authType: 'basic',
    authLabel: 'API Key',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Freshdesk → Profile Settings → API Key → View API Key',
    baseUrl: 'https://{domain}.freshdesk.com/api/v2',
    docsUrl: 'https://developers.freshdesk.com/api/',
  },
  {
    slug: 'twilio',
    name: 'Twilio',
    domain: 'twilio.com',
    category: 'Messaging',
    description: 'SMS, voice, WhatsApp, and email via API. Messages, calls, phone numbers. API base: https://api.twilio.com/2010-04-01. Basic auth with Account SID as username and Auth Token as password.',
    authType: 'account_sid',
    authLabel: 'Account SID + Auth Token',
    authPlaceholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Twilio Console → Account Info → copy Account SID and Auth Token (format: SID:token)',
    baseUrl: 'https://api.twilio.com/2010-04-01',
    docsUrl: 'https://www.twilio.com/docs/usage/api',
  },
  // ── Project Management ────────────────────────────────────────────────────
  {
    slug: 'asana',
    name: 'Asana',
    domain: 'asana.com',
    category: 'Project Management',
    description: 'Task and project management. Projects, tasks, sections, teams, users, portfolios. API base: https://app.asana.com/api/1.0. Bearer personal access token.',
    authType: 'bearer',
    authLabel: 'Personal Access Token',
    authPlaceholder: '1/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Asana → My Settings → Apps → Manage Developer Apps → Personal Access Tokens → New token',
    baseUrl: 'https://app.asana.com/api/1.0',
    docsUrl: 'https://developers.asana.com/docs',
  },
  {
    slug: 'jira',
    name: 'Jira',
    domain: 'atlassian.com',
    category: 'Project Management',
    description: 'Issue and project tracking. Issues, sprints, boards, epics, projects. API base: https://{domain}.atlassian.net/rest/api/3. Basic auth with email:api_token.',
    authType: 'basic',
    authLabel: 'Email + API Token',
    authPlaceholder: 'email@company.com:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Atlassian → id.atlassian.com → Security → Create and manage API tokens',
    baseUrl: 'https://{domain}.atlassian.net/rest/api/3',
    docsUrl: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/',
  },
  {
    slug: 'notion',
    name: 'Notion',
    domain: 'notion.so',
    category: 'Content & Docs',
    description: 'Docs, databases, wikis, tasks. Pages, databases, blocks, comments. API base: https://api.notion.com/v1. Bearer integration token.',
    authType: 'bearer',
    authLabel: 'Integration Token',
    authPlaceholder: 'secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Notion → Settings → Connections → Develop or manage integrations → New integration → copy Internal Integration Secret',
    baseUrl: 'https://api.notion.com/v1',
    docsUrl: 'https://developers.notion.com/reference/intro',
  },
  {
    slug: 'linear',
    name: 'Linear',
    domain: 'linear.app',
    category: 'Project Management',
    description: 'Engineering issue tracker. Issues, projects, cycles, teams, workflows. GraphQL API: https://api.linear.app/graphql. Bearer API key.',
    authType: 'bearer',
    authLabel: 'API Key',
    authPlaceholder: 'lin_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Linear → Settings → API → Personal API Keys → Create key',
    baseUrl: 'https://api.linear.app/graphql',
    docsUrl: 'https://developers.linear.app/docs',
  },
  {
    slug: 'monday',
    name: 'Monday.com',
    domain: 'monday.com',
    category: 'Project Management',
    description: 'Work OS for projects, tasks, and workflows. Boards, items, columns, groups. GraphQL API: https://api.monday.com/v2. Bearer token.',
    authType: 'bearer',
    authLabel: 'API Token',
    authPlaceholder: 'eyJhbGciOiJIUzI1NiJ9...',
    authHint: 'Monday.com → Profile → Developers → My Access Tokens → copy token',
    baseUrl: 'https://api.monday.com/v2',
    docsUrl: 'https://developer.monday.com/api-reference/docs',
  },
  {
    slug: 'clickup',
    name: 'ClickUp',
    domain: 'clickup.com',
    category: 'Project Management',
    description: 'All-in-one project management. Tasks, lists, spaces, docs, goals. API base: https://api.clickup.com/api/v2. Bearer personal token.',
    authType: 'bearer',
    authLabel: 'Personal Token',
    authPlaceholder: 'pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'ClickUp → Settings → Apps → API → Generate token',
    baseUrl: 'https://api.clickup.com/api/v2',
    docsUrl: 'https://clickup.com/api',
  },
  {
    slug: 'airtable',
    name: 'Airtable',
    domain: 'airtable.com',
    category: 'Content & Docs',
    description: 'Flexible database + spreadsheet. Records, fields, tables, views, automations. API base: https://api.airtable.com/v0. Bearer personal access token.',
    authType: 'bearer',
    authLabel: 'Personal Access Token',
    authPlaceholder: 'patxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Airtable → Account → Developer hub → Personal access tokens → Create token',
    baseUrl: 'https://api.airtable.com/v0',
    docsUrl: 'https://airtable.com/developers/web/api/introduction',
  },
  // ── Finance & Payments ────────────────────────────────────────────────────
  {
    slug: 'stripe',
    name: 'Stripe',
    domain: 'stripe.com',
    category: 'Finance & Payments',
    description: 'Payments, subscriptions, invoices, customers, payouts. API base: https://api.stripe.com/v1. Bearer secret key.',
    authType: 'bearer',
    authLabel: 'Secret Key',
    authPlaceholder: 'your_stripe_secret_key_here',
    authHint: 'Stripe Dashboard → Developers → API keys → Secret key (use restricted key for safety)',
    baseUrl: 'https://api.stripe.com/v1',
    docsUrl: 'https://stripe.com/docs/api',
  },
  {
    slug: 'razorpay',
    name: 'Razorpay',
    domain: 'razorpay.com',
    category: 'Finance & Payments',
    description: 'Indian payments gateway. Orders, payments, refunds, payouts, subscriptions. API base: https://api.razorpay.com/v1. Basic auth with Key ID and Key Secret.',
    authType: 'basic',
    authLabel: 'Key ID + Key Secret',
    authPlaceholder: 'rzp_live_xxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Razorpay Dashboard → Settings → API Keys → Generate Key',
    baseUrl: 'https://api.razorpay.com/v1',
    docsUrl: 'https://razorpay.com/docs/api/',
  },
  {
    slug: 'chargebee',
    name: 'Chargebee',
    domain: 'chargebee.com',
    category: 'Finance & Payments',
    description: 'Subscription billing and revenue management. Subscriptions, customers, invoices, plans, coupons. API base: https://{site}.chargebee.com/api/v2. Basic auth with API key as username.',
    authType: 'basic',
    authLabel: 'API Key',
    authPlaceholder: 'test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Chargebee → Settings → Configure Chargebee → API Keys → create Full-Access key',
    baseUrl: 'https://{site}.chargebee.com/api/v2',
    docsUrl: 'https://apidocs.chargebee.com/docs/api',
  },
  // ── Accounting ────────────────────────────────────────────────────────────
  {
    slug: 'quickbooks',
    name: 'QuickBooks',
    domain: 'quickbooks.com',
    category: 'Accounting',
    description: 'Accounting software. Invoices, expenses, P&L, balance sheet, reports. API base: https://quickbooks.api.intuit.com/v3. OAuth2 bearer token.',
    authType: 'oauth',
    authLabel: 'OAuth Access Token + Realm ID',
    authPlaceholder: 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0:realmId',
    authHint: 'Intuit Developer → create app → OAuth 2.0 → Sandbox or Production credentials',
    baseUrl: 'https://quickbooks.api.intuit.com/v3',
    docsUrl: 'https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account',
  },
  {
    slug: 'xero',
    name: 'Xero',
    domain: 'xero.com',
    category: 'Accounting',
    description: 'Cloud accounting. Invoices, bills, bank reconciliation, payroll, reporting. API base: https://api.xero.com/api.xro/2.0. OAuth2 bearer token.',
    authType: 'oauth',
    authLabel: 'OAuth2 Access Token',
    authPlaceholder: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    authHint: 'Xero Developer → My Apps → add app → OAuth 2.0 credentials → authorize',
    baseUrl: 'https://api.xero.com/api.xro/2.0',
    docsUrl: 'https://developer.xero.com/documentation/api/api-overview',
  },
  // ── HR & People ───────────────────────────────────────────────────────────
  {
    slug: 'bamboohr',
    name: 'BambooHR',
    domain: 'bamboohr.com',
    category: 'HR & People',
    description: 'HR information system. Employees, time-off, onboarding, performance, org chart. API base: https://api.bamboohr.com/api/gateway.php/{company}/v1. Basic auth with API key as username.',
    authType: 'basic',
    authLabel: 'API Key',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'BambooHR → Account → API Keys → Add New Key',
    baseUrl: 'https://api.bamboohr.com/api/gateway.php/{company}/v1',
    docsUrl: 'https://documentation.bamboohr.com/reference/getting-started',
  },
  {
    slug: 'rippling',
    name: 'Rippling',
    domain: 'rippling.com',
    category: 'HR & People',
    description: 'All-in-one HR, payroll, IT, and benefits. Employees, payroll, apps, devices. API base: https://api.rippling.com/platform/api. Bearer token.',
    authType: 'bearer',
    authLabel: 'API Key',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Rippling → Settings → Developers → API → Create API key',
    baseUrl: 'https://api.rippling.com/platform/api',
    docsUrl: 'https://developer.rippling.com/',
  },
  {
    slug: 'darwinbox',
    name: 'Darwinbox',
    domain: 'darwinbox.com',
    category: 'HR & People',
    description: 'HRMS for Indian and Southeast Asian enterprises. Employee lifecycle, payroll, attendance, performance. API base: https://api.darwinbox.io. Bearer token.',
    authType: 'bearer',
    authLabel: 'API Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Darwinbox → Developer Settings → API Access → generate token',
    baseUrl: 'https://api.darwinbox.io',
    docsUrl: 'https://darwinbox.com/developer',
  },
  // ── Engineering ───────────────────────────────────────────────────────────
  {
    slug: 'github',
    name: 'GitHub',
    domain: 'github.com',
    category: 'Engineering',
    description: 'Source control, issues, PRs, actions, releases, projects. API base: https://api.github.com. Bearer personal access token (classic or fine-grained).',
    authType: 'bearer',
    authLabel: 'Personal Access Token',
    authPlaceholder: 'your_github_personal_access_token',
    authHint: 'GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token',
    baseUrl: 'https://api.github.com',
    docsUrl: 'https://docs.github.com/en/rest',
  },
  {
    slug: 'sentry',
    name: 'Sentry',
    domain: 'sentry.io',
    category: 'Engineering',
    description: 'Error tracking and performance monitoring. Issues, events, releases, projects. API base: https://sentry.io/api/0. Bearer auth token.',
    authType: 'bearer',
    authLabel: 'Auth Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Sentry → User Settings → Auth Tokens → Create New Token',
    baseUrl: 'https://sentry.io/api/0',
    docsUrl: 'https://docs.sentry.io/api/',
  },
  {
    slug: 'datadog',
    name: 'Datadog',
    domain: 'datadoghq.com',
    category: 'Engineering',
    description: 'Infrastructure monitoring, APM, logs, dashboards. API base: https://api.datadoghq.com/api/v2. DD-API-KEY and DD-APPLICATION-KEY headers.',
    authType: 'api_key',
    authLabel: 'API Key + Application Key',
    authPlaceholder: 'api_key:app_key',
    authHint: 'Datadog → Organization Settings → API Keys + Application Keys → create both',
    baseUrl: 'https://api.datadoghq.com/api/v2',
    docsUrl: 'https://docs.datadoghq.com/api/latest/',
  },
  // ── Data & BI ─────────────────────────────────────────────────────────────
  {
    slug: 'tableau',
    name: 'Tableau',
    domain: 'tableau.com',
    category: 'Data & BI',
    description: 'Business intelligence and data visualization. Workbooks, views, datasources, users, sites. REST API base: https://{server}/api/3.21. Bearer token from sign-in.',
    authType: 'bearer',
    authLabel: 'Personal Access Token',
    authPlaceholder: 'name:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Tableau → My Account Settings → Personal Access Tokens → Create new token',
    baseUrl: 'https://{server}/api/3.21',
    docsUrl: 'https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref.htm',
  },
  {
    slug: 'looker',
    name: 'Looker',
    domain: 'looker.com',
    category: 'Data & BI',
    description: 'BI and data platform. Looks, dashboards, explores, models, schedules. API base: https://{host}:19999/api/4.0. OAuth2 client credentials.',
    authType: 'oauth',
    authLabel: 'Client ID + Client Secret',
    authPlaceholder: 'client_id:client_secret',
    authHint: 'Looker → Admin → Users → API Keys → Edit your user → New API3 Key',
    baseUrl: 'https://{host}:19999/api/4.0',
    docsUrl: 'https://developers.looker.com/api/explorer/4.0/methods',
  },
  // ── E-commerce ────────────────────────────────────────────────────────────
  {
    slug: 'shopify',
    name: 'Shopify',
    domain: 'shopify.com',
    category: 'E-commerce',
    description: 'E-commerce platform. Products, orders, customers, inventory, discounts, analytics. Admin API base: https://{store}.myshopify.com/admin/api/2024-10. Bearer access token.',
    authType: 'bearer',
    authLabel: 'Admin API Access Token',
    authPlaceholder: 'shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Shopify Admin → Settings → Apps → Develop apps → create app → API credentials → Admin API access token',
    baseUrl: 'https://{store}.myshopify.com/admin/api/2024-10',
    docsUrl: 'https://shopify.dev/docs/api/admin-rest',
  },
  {
    slug: 'woocommerce',
    name: 'WooCommerce',
    domain: 'woocommerce.com',
    category: 'E-commerce',
    description: 'WordPress e-commerce plugin. Products, orders, customers, coupons, reports. REST API base: https://{store}/wp-json/wc/v3. Basic auth with Consumer Key and Secret.',
    authType: 'basic',
    authLabel: 'Consumer Key + Consumer Secret',
    authPlaceholder: 'ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'WooCommerce → Settings → Advanced → REST API → Add key → Read/Write permissions',
    baseUrl: 'https://{store}/wp-json/wc/v3',
    docsUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
  },
  // ── Messaging ─────────────────────────────────────────────────────────────
  {
    slug: 'whatsapp-api',
    name: 'WhatsApp Business API',
    domain: 'whatsapp.com',
    category: 'Messaging',
    description: 'Programmatic WhatsApp messaging. Send templates, interactive messages, handle webhooks. Cloud API base: https://graph.facebook.com/v20.0. Bearer token with phone number ID.',
    authType: 'bearer',
    authLabel: 'Access Token',
    authPlaceholder: 'your_meta_whatsapp_access_token',
    authHint: 'Meta for Developers → WhatsApp → Getting Started → Temporary access token or System User token',
    baseUrl: 'https://graph.facebook.com/v20.0',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
  },
  {
    slug: 'moengage',
    name: 'MoEngage',
    domain: 'moengage.com',
    category: 'Marketing Automation',
    description: 'Customer engagement platform. Campaigns, push, email, SMS, in-app, analytics. API base: https://api-01.moengage.com/v1. Basic auth with App ID and Secret Key.',
    authType: 'basic',
    authLabel: 'App ID + Secret Key',
    authPlaceholder: 'APP_ID:SECRET_KEY',
    authHint: 'MoEngage → Settings → APIs → DATA API Settings → App ID and Secret Key',
    baseUrl: 'https://api-01.moengage.com/v1',
    docsUrl: 'https://developers.moengage.com/',
  },
  {
    slug: 'clevertap',
    name: 'CleverTap',
    domain: 'clevertap.com',
    category: 'Marketing Automation',
    description: 'Mobile and web engagement. Campaigns, segments, funnels, A/B testing, push notifications. API base: https://api.clevertap.com/1. X-CleverTap-Account-Id and X-CleverTap-Passcode headers.',
    authType: 'api_key',
    authLabel: 'Account ID + Passcode',
    authPlaceholder: 'ACCOUNT_ID:PASSCODE',
    authHint: 'CleverTap → Settings → CleverTap Account → Account ID and Passcode',
    baseUrl: 'https://api.clevertap.com/1',
    docsUrl: 'https://developer.clevertap.com/docs/',
  },
  // ── Design ────────────────────────────────────────────────────────────────
  {
    slug: 'canva',
    name: 'Canva',
    domain: 'canva.com',
    category: 'Design',
    description: 'Design platform. Create designs, export assets, manage brand kits, use templates. Connect API base: https://api.canva.com/rest/v1. OAuth2 bearer token.',
    authType: 'oauth',
    authLabel: 'OAuth Access Token',
    authPlaceholder: 'eyJhbGciOiJSUzI1NiJ9...',
    authHint: 'Canva Developers → create integration → OAuth2 → authorize with design:content:read write scopes',
    baseUrl: 'https://api.canva.com/rest/v1',
    docsUrl: 'https://www.canva.dev/docs/connect/',
  },
  {
    slug: 'figma',
    name: 'Figma',
    domain: 'figma.com',
    category: 'Design',
    description: 'Collaborative design tool. Files, components, frames, comments, teams. API base: https://api.figma.com/v1. Bearer personal access token.',
    authType: 'bearer',
    authLabel: 'Personal Access Token',
    authPlaceholder: 'figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Figma → Account Settings → Personal access tokens → Generate new token',
    baseUrl: 'https://api.figma.com/v1',
    docsUrl: 'https://www.figma.com/developers/api',
  },
  // ── Google Workspace ──────────────────────────────────────────────────────
  {
    slug: 'google-workspace',
    name: 'Google Workspace',
    domain: 'google.com',
    category: 'Content & Docs',
    description: 'Gmail, Google Docs, Sheets, Calendar, Drive. Various APIs under googleapis.com. Service account or OAuth2. Sheets API: https://sheets.googleapis.com/v4. Drive: https://www.googleapis.com/drive/v3.',
    authType: 'bearer',
    authLabel: 'OAuth2 Access Token or Service Account JSON',
    authPlaceholder: 'ya29.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Google Cloud Console → Service Accounts → create → grant domain-wide delegation → generate key',
    baseUrl: 'https://www.googleapis.com',
    docsUrl: 'https://developers.google.com/workspace',
  },
  {
    slug: 'microsoft-365',
    name: 'Microsoft 365',
    domain: 'microsoft.com',
    category: 'Content & Docs',
    description: 'Outlook Mail, Outlook Calendar, OneDrive, Teams — via Microsoft Graph. API base: https://graph.microsoft.com/v1.0. Key endpoints: /me/messages, /me/events, /me/drive, /teams. OAuth2 (app registration in Azure AD/Entra ID).',
    authType: 'bearer',
    authLabel: 'OAuth2 Access Token',
    authPlaceholder: 'eyJ0eXAiOiJKV1QiLCJhbGc...',
    authHint: 'Azure Portal → App registrations → New registration → API permissions (Mail.Send, Calendars.ReadWrite) → Certificates & secrets → generate token',
    baseUrl: 'https://graph.microsoft.com/v1.0',
    docsUrl: 'https://learn.microsoft.com/en-us/graph/overview',
  },
  // ── Scheduling ─────────────────────────────────────────────────────────────
  // A customer's own Google/Microsoft Calendar (above) can hold an event, but
  // that isn't what makes booking feel human: a real availability-aware
  // booking link, buffer rules, timezone handling, and reschedule/cancel
  // flows a prospect can self-serve. Four vendors so whichever one a sales,
  // CS, or recruiting team already has is covered.
  {
    slug: 'calendly',
    name: 'Calendly',
    domain: 'calendly.com',
    category: 'Scheduling',
    description: 'Booking links, real availability, event types, invitee management. API base: https://api.calendly.com. Key endpoints: /scheduled_events, /event_types, /users/me, /scheduling_links (single-use links you can hand a prospect directly).',
    authType: 'bearer',
    authLabel: 'Personal Access Token',
    authPlaceholder: 'eyJraWQiOiIxY2UxZTEzNjE3ZG...',
    authHint: 'Calendly → Integrations → API & Webhooks → Generate New Token',
    baseUrl: 'https://api.calendly.com',
    docsUrl: 'https://developer.calendly.com/api-docs',
  },
  {
    slug: 'cal-com',
    name: 'Cal.com',
    domain: 'cal.com',
    category: 'Scheduling',
    description: 'Open-source scheduling — self-hosted or cloud. Bookings, event types, availability, slots. API base: https://api.cal.com/v2. Key endpoints: /bookings, /event-types, /slots/available.',
    authType: 'bearer',
    authLabel: 'API Key',
    authPlaceholder: 'cal_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Cal.com → Settings → Developer → API Keys → Add',
    baseUrl: 'https://api.cal.com/v2',
    docsUrl: 'https://cal.com/docs/api-reference/v2/introduction',
  },
  {
    slug: 'acuity-scheduling',
    name: 'Acuity Scheduling',
    domain: 'acuityscheduling.com',
    category: 'Scheduling',
    description: 'Appointment scheduling common with service businesses (consultants, coaches, clinics). Appointments, availability, appointment types, clients. API base: https://acuityscheduling.com/api/v1.',
    authType: 'basic',
    authLabel: 'User ID + API Key',
    authPlaceholder: 'USER_ID:API_KEY',
    authHint: 'Acuity → Business Settings → Integrations → API → copy User ID and API Key',
    baseUrl: 'https://acuityscheduling.com/api/v1',
    docsUrl: 'https://developers.acuityscheduling.com/reference',
  },
  {
    slug: 'microsoft-bookings',
    name: 'Microsoft Bookings',
    domain: 'microsoft.com',
    category: 'Scheduling',
    description: 'Booking pages and staff calendars for Microsoft-shop customers. Via Microsoft Graph. API base: https://graph.microsoft.com/v1.0/solutions/bookingBusinesses. Key endpoints: /appointments, /staffMembers, /services. OAuth2.',
    authType: 'bearer',
    authLabel: 'OAuth2 Access Token',
    authPlaceholder: 'eyJ0eXAiOiJKV1QiLCJhbGc...',
    authHint: 'Same Azure app registration as Microsoft 365 above, with Bookings.Read.All / Bookings.ReadWrite.All permissions granted',
    baseUrl: 'https://graph.microsoft.com/v1.0/solutions/bookingBusinesses',
    docsUrl: 'https://learn.microsoft.com/en-us/graph/api/resources/bookingbusiness',
  },
  // ── E-signature ────────────────────────────────────────────────────────────
  // Closes the gap between "drafted a contract" and "got it executed" — the
  // sales, HR onboarding, and legal/ops employees all claim to close deals
  // and process paperwork, and none of that was real without this.
  {
    slug: 'docusign',
    name: 'DocuSign',
    domain: 'docusign.com',
    category: 'E-signature',
    description: 'The enterprise e-signature standard. Envelopes, templates, recipient status, signing URLs. API base: https://{server}.docusign.net/restapi/v2.1/accounts/{accountId} — server and accountId come from the OAuth userinfo response, set them as config when connecting.',
    authType: 'oauth',
    authLabel: 'OAuth2 Access Token',
    authPlaceholder: 'eyJ0eXAiOiJNVCIsImFsZ...',
    authHint: 'DocuSign Admin → Apps and Keys → Add App/Integration Key → JWT Grant or Authorization Code flow',
    baseUrl: 'https://{server}.docusign.net/restapi/v2.1/accounts/{accountId}',
    docsUrl: 'https://developers.docusign.com/docs/esign-rest-api/',
  },
  {
    slug: 'dropbox-sign',
    name: 'Dropbox Sign',
    domain: 'sign.dropbox.com',
    category: 'E-signature',
    description: 'Simpler, SMB-friendly e-signature (formerly HelloSign). Signature requests, templates, status. API base: https://api.hellosign.com/v3. Auth: HTTP Basic with the API key as username and a blank password.',
    authType: 'basic',
    authLabel: 'API Key',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Dropbox Sign → Settings → API → Generate API Key',
    baseUrl: 'https://api.hellosign.com/v3',
    docsUrl: 'https://developers.hellosign.com/docs/api/reference/',
  },
  {
    slug: 'pandadoc',
    name: 'PandaDoc',
    domain: 'pandadoc.com',
    category: 'E-signature',
    description: 'Sales-doc-native e-signature — quotes, proposals, and contracts in one flow, common with SMB sales teams. Documents, templates, recipients. API base: https://api.pandadoc.com/public/v1. Auth header: "Authorization: API-Key {key}" (not Bearer).',
    authType: 'api_key',
    authLabel: 'API Key',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'PandaDoc → Settings → Integrations → API → Generate API Key',
    baseUrl: 'https://api.pandadoc.com/public/v1',
    docsUrl: 'https://developers.pandadoc.com/reference/about',
  },
  {
    slug: 'adobe-sign',
    name: 'Adobe Acrobat Sign',
    domain: 'adobe.com',
    category: 'E-signature',
    description: 'Enterprise e-signature, natural fit for Adobe-shop customers. Agreements, transient documents, templates. API base: https://api.{shard}.echosign.com/api/rest/v6 — shard (e.g. na1, eu1) comes from your account, set it as config when connecting.',
    authType: 'oauth',
    authLabel: 'OAuth2 Access Token',
    authPlaceholder: '3AAABLblqZhC2...',
    authHint: 'Adobe Developer Console → Create Project → Add API → Acrobat Sign API → OAuth Server-to-Server credential',
    baseUrl: 'https://api.{shard}.echosign.com/api/rest/v6',
    docsUrl: 'https://opensource.adobe.com/acrobat-sign/developer_guide/',
  },
  // ── Payments India ────────────────────────────────────────────────────────
  {
    slug: 'payu',
    name: 'PayU',
    domain: 'payu.in',
    category: 'Finance & Payments',
    description: 'Indian payments processing. Transactions, refunds, settlements, subscriptions. API base: https://info.payu.in. Merchant Key and Salt for HMAC auth.',
    authType: 'api_key',
    authLabel: 'Merchant Key + Salt',
    authPlaceholder: 'MERCHANT_KEY:MERCHANT_SALT',
    authHint: 'PayU Dashboard → My Account → Profile → Merchant Key and Salt',
    baseUrl: 'https://info.payu.in',
    docsUrl: 'https://devguide.payu.in/',
  },
  // ── Video & Meetings ───────────────────────────────────────────────────────
  {
    slug: 'zoom',
    name: 'Zoom',
    domain: 'zoom.us',
    category: 'Video & Meetings',
    description: 'Create/list/update meetings, pull recordings and cloud transcripts. API base: https://api.zoom.us/v2. Key endpoints: /users/me/meetings, /meetings/{meetingId}, /meetings/{meetingId}/recordings. Server-to-Server OAuth.',
    authType: 'oauth',
    authLabel: 'Server-to-Server OAuth Token',
    authPlaceholder: 'eyJ0eXAiOiJKV1QiLCJhbGc...',
    authHint: 'Zoom App Marketplace → Develop → Build App → Server-to-Server OAuth → generate token',
    baseUrl: 'https://api.zoom.us/v2',
    docsUrl: 'https://developers.zoom.us/docs/api/',
  },
  {
    slug: 'google-meet',
    name: 'Google Meet',
    domain: 'meet.google.com',
    category: 'Video & Meetings',
    description: 'Create meeting spaces, list conference records and transcripts. API base: https://meet.googleapis.com/v2. Key endpoints: /spaces, /conferenceRecords. Uses the same OAuth2 credential as Google Workspace — connect that first if you need both.',
    authType: 'bearer',
    authLabel: 'OAuth2 Access Token',
    authPlaceholder: 'ya29.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Same Google Cloud OAuth client as Google Workspace, with the Meet API enabled and meetings.space scope granted',
    baseUrl: 'https://meet.googleapis.com/v2',
    docsUrl: 'https://developers.google.com/meet/api/guides/overview',
  },
  {
    slug: 'microsoft-teams',
    name: 'Microsoft Teams',
    domain: 'microsoft.com',
    category: 'Video & Meetings',
    description: 'Create/join online meetings, list attendance and transcripts. Via Microsoft Graph. API base: https://graph.microsoft.com/v1.0. Key endpoints: /me/onlineMeetings, /me/onlineMeetings/{id}/transcripts.',
    authType: 'bearer',
    authLabel: 'OAuth2 Access Token',
    authPlaceholder: 'eyJ0eXAiOiJKV1QiLCJhbGc...',
    authHint: 'Same Azure app registration as Microsoft 365, with OnlineMeetings.ReadWrite permission granted',
    baseUrl: 'https://graph.microsoft.com/v1.0',
    docsUrl: 'https://learn.microsoft.com/en-us/graph/api/resources/onlinemeeting',
  },
  // ── Recruiting & ATS ───────────────────────────────────────────────────────
  // Distinct from HR & People (BambooHR/Rippling/Darwinbox), which is
  // post-hire HRIS/payroll. A recruiter employee needs the actual pipeline
  // it's hiring through — candidates, stages, offers — which none of those
  // three cover.
  {
    slug: 'greenhouse',
    name: 'Greenhouse',
    domain: 'greenhouse.io',
    category: 'Recruiting & ATS',
    description: 'The most common mid-market/enterprise ATS. Candidates, applications, jobs, stages, scorecards, offers. Harvest API base: https://harvest.greenhouse.io/v1. Auth: HTTP Basic with the API key as username, blank password.',
    authType: 'basic',
    authLabel: 'Harvest API Key',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Greenhouse → Configure → Dev Center → API Credential Management → Create New API Key (Harvest)',
    baseUrl: 'https://harvest.greenhouse.io/v1',
    docsUrl: 'https://developers.greenhouse.io/harvest.html',
  },
  {
    slug: 'lever',
    name: 'Lever',
    domain: 'lever.co',
    category: 'Recruiting & ATS',
    description: 'ATS + CRM for recruiting, common at growth-stage companies. Opportunities, postings, stages, interviews. API base: https://api.lever.co/v1. Auth: HTTP Basic with the API key as username, blank password.',
    authType: 'basic',
    authLabel: 'API Key',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Lever → Settings → Integrations and API → API Credentials → Create Key',
    baseUrl: 'https://api.lever.co/v1',
    docsUrl: 'https://hire.lever.co/developer/documentation',
  },
  {
    slug: 'workable',
    name: 'Workable',
    domain: 'workable.com',
    category: 'Recruiting & ATS',
    description: 'SMB-friendly ATS. Jobs, candidates, stages, offers. API base: https://{subdomain}.workable.com/spi/v3 — subdomain is your Workable account name, set as config when connecting.',
    authType: 'bearer',
    authLabel: 'API Access Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Workable → Settings → Integrations → API Access Tokens → Generate new token',
    baseUrl: 'https://{subdomain}.workable.com/spi/v3',
    docsUrl: 'https://workable.readme.io/reference/getting-started-1',
  },
  // ── Payroll & Expenses ─────────────────────────────────────────────────────
  // Distinct from Accounting (QuickBooks/Xero, general ledger) and Finance &
  // Payments (Stripe/Razorpay, customer-facing money movement) — this is
  // internal spend: paying the team and reimbursing them.
  {
    slug: 'gusto',
    name: 'Gusto',
    domain: 'gusto.com',
    category: 'Payroll & Expenses',
    description: 'US payroll, benefits, and HR for SMBs. Employees, payrolls, time-off, compensations. API base: https://api.gusto.com/v1. OAuth2.',
    authType: 'oauth',
    authLabel: 'OAuth2 Access Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Gusto Developer Portal → Create App → OAuth 2.0 flow (or Personal Access Token for testing)',
    baseUrl: 'https://api.gusto.com/v1',
    docsUrl: 'https://docs.gusto.com/embedded-payroll/reference/gusto-api-getting-started',
  },
  {
    slug: 'expensify',
    name: 'Expensify',
    domain: 'expensify.com',
    category: 'Payroll & Expenses',
    description: 'Expense reports, receipt capture, reimbursement. Integration Server API base: https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations. Auth: a partnerUserID/partnerUserSecret pair sent in every request body, not a header.',
    authType: 'api_key',
    authLabel: 'partnerUserID:partnerUserSecret',
    authPlaceholder: 'PARTNER_USER_ID:PARTNER_USER_SECRET',
    authHint: 'Expensify → Settings → Integrations → Expensify API → generate partnerUserID and partnerUserSecret',
    baseUrl: 'https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations',
    docsUrl: 'https://integrations.expensify.com/Integration-Server/doc/',
  },
  {
    slug: 'ramp',
    name: 'Ramp',
    domain: 'ramp.com',
    category: 'Payroll & Expenses',
    description: 'Corporate cards + expense management, common at VC-backed startups. Transactions, cardholders, reimbursements, bills. API base: https://api.ramp.com/developer/v1. OAuth2 client credentials.',
    authType: 'oauth',
    authLabel: 'OAuth2 Access Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Ramp → Developer → API Keys → create an OAuth client, request the scopes you need',
    baseUrl: 'https://api.ramp.com/developer/v1',
    docsUrl: 'https://docs.ramp.com/developer-api/v1/overview',
  },
  // ── Reviews & Reputation ───────────────────────────────────────────────────
  {
    slug: 'google-business-profile',
    name: 'Google Business Profile',
    domain: 'google.com',
    category: 'Reviews & Reputation',
    description: 'Manage local business listings and respond to reviews. API base: https://mybusinessbusinessinformation.googleapis.com/v1 (info) and https://mybusiness.googleapis.com/v4 (reviews/Q&A). OAuth2 — same Google Cloud project pattern as Workspace/Meet.',
    authType: 'bearer',
    authLabel: 'OAuth2 Access Token',
    authPlaceholder: 'ya29.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Google Cloud Console → enable "My Business Business Information API" and "My Business API" → OAuth2 credential (requires a verified Business Profile)',
    baseUrl: 'https://mybusiness.googleapis.com/v4',
    docsUrl: 'https://developers.google.com/my-business',
  },
  {
    slug: 'trustpilot',
    name: 'Trustpilot',
    domain: 'trustpilot.com',
    category: 'Reviews & Reputation',
    description: 'Review collection and reputation management. Reviews, invitations, business unit stats. API base: https://api.trustpilot.com/v1.',
    authType: 'api_key',
    authLabel: 'API Key',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Trustpilot Business → Integrations → API → Register an application → copy API Key',
    baseUrl: 'https://api.trustpilot.com/v1',
    docsUrl: 'https://developers.trustpilot.com/',
  },
  // ── Compliance & GRC ───────────────────────────────────────────────────────
  // Directly closes a gap this repo already flagged on itself: the
  // Compliance Officer employee's own watchPatterns ("Control evidence
  // gaps," "Access review overdue," "New vendor onboarded without DPA")
  // describe exactly what these two products track — there was no way to
  // ever check them for real.
  {
    slug: 'vanta',
    name: 'Vanta',
    domain: 'vanta.com',
    category: 'Compliance & GRC',
    description: 'Continuous compliance monitoring (SOC 2, ISO 27001, etc). Controls, tests, evidence, vendors, access reviews. API base: https://api.vanta.com. OAuth2 client credentials.',
    authType: 'oauth',
    authLabel: 'OAuth2 Access Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Vanta → Settings → API Tokens → Generate Application Credentials (client ID + secret, exchange for a token)',
    baseUrl: 'https://api.vanta.com',
    docsUrl: 'https://developer.vanta.com/docs',
  },
  {
    slug: 'drata',
    name: 'Drata',
    domain: 'drata.com',
    category: 'Compliance & GRC',
    description: 'Continuous compliance monitoring, alternative to Vanta. Controls, monitors, evidence, personnel, vendors. API base: https://public-api.drata.com/public/v1.',
    authType: 'bearer',
    authLabel: 'API Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Drata → Settings → Developers → API Tokens → Generate Token',
    baseUrl: 'https://public-api.drata.com/public/v1',
    docsUrl: 'https://developers.drata.com/',
  },
  // ── Data Warehouse ─────────────────────────────────────────────────────────
  // Distinct from Data & BI (Tableau/Looker, visualization on top of a
  // warehouse) — this is the warehouse itself, for an analyst employee that
  // actually needs to query real tables, not just view someone else's dashboard.
  {
    slug: 'snowflake',
    name: 'Snowflake',
    domain: 'snowflake.com',
    category: 'Data Warehouse',
    description: 'Cloud data warehouse. Run SQL statements, poll for results. SQL API base: https://{account}.snowflakecomputing.com/api/v2 — account identifier set as config when connecting. Key-pair JWT or OAuth Bearer.',
    authType: 'bearer',
    authLabel: 'OAuth2 Access Token or Key-Pair JWT',
    authPlaceholder: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    authHint: 'Snowsight → Admin → Security → generate a key pair and register the public key on the user, or set up OAuth via a Security Integration',
    baseUrl: 'https://{account}.snowflakecomputing.com/api/v2',
    docsUrl: 'https://docs.snowflake.com/en/developer-guide/sql-api/index',
  },
  {
    slug: 'bigquery',
    name: 'BigQuery',
    domain: 'cloud.google.com',
    category: 'Data Warehouse',
    description: 'Google Cloud data warehouse. Run queries, list datasets/tables. API base: https://bigquery.googleapis.com/bigquery/v2. Key endpoints: /projects/{projectId}/queries, /projects/{projectId}/datasets. OAuth2 via a Google Cloud service account.',
    authType: 'bearer',
    authLabel: 'OAuth2 Access Token (Service Account)',
    authPlaceholder: 'ya29.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Google Cloud Console → IAM → Service Accounts → create with BigQuery Data Viewer + Job User roles → generate key → exchange for an access token',
    baseUrl: 'https://bigquery.googleapis.com/bigquery/v2',
    docsUrl: 'https://cloud.google.com/bigquery/docs/reference/rest',
  },
  // ── Additional vendors for existing categories ────────────────────────────
  // Kept together here rather than threaded into each category's original
  // block above, purely to avoid a much larger, riskier diff against a file
  // that's already 1000+ lines — category filtering is by the `category`
  // field, not file position, so this changes nothing functionally.
  {
    slug: 'close',
    name: 'Close',
    domain: 'close.com',
    category: 'CRM',
    description: 'SMB/startup-focused sales CRM with built-in calling and SMS. Leads, contacts, opportunities, activities. API base: https://api.close.com/api/v1. Auth: HTTP Basic with the API key as username, blank password.',
    authType: 'basic',
    authLabel: 'API Key',
    authPlaceholder: 'api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Close → Settings → API Keys → Create API Key',
    baseUrl: 'https://api.close.com/api/v1',
    docsUrl: 'https://developer.close.com/',
  },
  {
    slug: 'freshsales',
    name: 'Freshsales',
    domain: 'freshsales.io',
    category: 'CRM',
    description: 'Freshworks CRM. Contacts, deals, accounts, tasks. API base: https://{domain}.freshsales.io/api — domain set as config when connecting. API key in the Authorization header.',
    authType: 'api_key',
    authLabel: 'API Key',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Freshsales → Settings → API Settings → copy your API key',
    baseUrl: 'https://{domain}.freshsales.io/api',
    docsUrl: 'https://developers.freshworks.com/crm/api/',
  },
  {
    slug: 'amazon-ads',
    name: 'Amazon Ads',
    domain: 'advertising.amazon.com',
    category: 'Paid Ads',
    description: 'Sponsored Products/Brands/Display on Amazon — essential for any e-commerce employee running paid. Campaigns, ad groups, keywords, reports. API base: https://advertising-api.amazon.com. OAuth2 (Login with Amazon).',
    authType: 'oauth',
    authLabel: 'OAuth2 Access Token',
    authPlaceholder: 'Atza|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Amazon Ads Console → register an app under Login with Amazon → OAuth2 flow → also requires a registered Advertising API profile',
    baseUrl: 'https://advertising-api.amazon.com',
    docsUrl: 'https://advertising.amazon.com/API/docs/en-us',
  },
  {
    slug: 'amazon-seller-central',
    name: 'Amazon Seller Central',
    domain: 'sellercentral.amazon.com',
    category: 'E-commerce',
    description: 'Orders, inventory, listings, fulfillment for Amazon sellers. Selling Partner API base: https://sellingpartnerapi-na.amazon.com (region-specific — eu/fe variants exist). Auth is unusually heavy: LWA OAuth2 token PLUS AWS SigV4 request signing — genuinely harder to self-serve than most tools here; expect to need a developer to set up the LWA app and IAM role once.',
    authType: 'oauth',
    authLabel: 'LWA Access Token',
    authPlaceholder: 'Atza|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Amazon Seller Central → Apps and Services → Develop Apps → register an SP-API app (requires an AWS IAM role too)',
    baseUrl: 'https://sellingpartnerapi-na.amazon.com',
    docsUrl: 'https://developer-docs.amazon.com/sp-api/',
  },
  {
    slug: 'bigcommerce',
    name: 'BigCommerce',
    domain: 'bigcommerce.com',
    category: 'E-commerce',
    description: 'Storefront platform, alternative to Shopify/WooCommerce. Products, orders, customers, carts. API base: https://api.bigcommerce.com/stores/{store_hash}/v3 — store_hash set as config when connecting.',
    authType: 'api_key',
    authLabel: 'X-Auth-Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'BigCommerce → Settings → API Accounts → Create API Account → copy the Access Token',
    baseUrl: 'https://api.bigcommerce.com/stores/{store_hash}/v3',
    docsUrl: 'https://developer.bigcommerce.com/docs/rest-management',
  },
  {
    slug: 'gorgias',
    name: 'Gorgias',
    domain: 'gorgias.com',
    category: 'Customer Support',
    description: 'Help desk built specifically for Shopify/e-commerce stores — order data inline with tickets. Tickets, customers, macros. API base: https://{domain}.gorgias.com/api — domain set as config when connecting. HTTP Basic with your Gorgias email as username, API key as password.',
    authType: 'basic',
    authLabel: 'Email + API Key',
    authPlaceholder: 'you@company.com:API_KEY',
    authHint: 'Gorgias → Settings → REST API → Create new API key',
    baseUrl: 'https://{domain}.gorgias.com/api',
    docsUrl: 'https://developers.gorgias.com/reference/introduction',
  },
  {
    slug: 'help-scout',
    name: 'Help Scout',
    domain: 'helpscout.com',
    category: 'Customer Support',
    description: 'Shared-inbox-style help desk, common at SMBs that find Zendesk too heavy. Conversations, customers, mailboxes. API base: https://api.helpscout.net/v2. OAuth2 client credentials.',
    authType: 'oauth',
    authLabel: 'OAuth2 Access Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Help Scout → Your Profile → My Apps → Create My App → client credentials flow',
    baseUrl: 'https://api.helpscout.net/v2',
    docsUrl: 'https://developer.helpscout.com/mailbox-api/',
  },
  {
    slug: 'segment',
    name: 'Segment',
    domain: 'segment.com',
    category: 'Analytics',
    description: 'Customer data platform — the plumbing many companies already have connecting every other tool. Track/identify events, source/destination config. Tracking API base: https://api.segment.io/v1. Config/Public API base: https://api.segmentapis.com.',
    authType: 'basic',
    authLabel: 'Write Key',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Segment → Source → Settings → API Keys → copy the Write Key (used as Basic auth username, blank password)',
    baseUrl: 'https://api.segment.io/v1',
    docsUrl: 'https://segment.com/docs/connections/sources/catalog/libraries/server/http-api/',
  },
  {
    slug: 'freshbooks',
    name: 'FreshBooks',
    domain: 'freshbooks.com',
    category: 'Accounting',
    description: 'Invoicing and accounting for freelancers/small agencies. Invoices, clients, expenses, time tracking. API base: https://api.freshbooks.com. OAuth2.',
    authType: 'oauth',
    authLabel: 'OAuth2 Access Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'FreshBooks Developer Portal → Create an App → OAuth2 flow',
    baseUrl: 'https://api.freshbooks.com',
    docsUrl: 'https://www.freshbooks.com/api/start',
  },
  {
    slug: 'zoho-books',
    name: 'Zoho Books',
    domain: 'zoho.com',
    category: 'Accounting',
    description: 'Accounting, common at companies already in the Zoho ecosystem (pairs with Zoho CRM). Invoices, bills, contacts, chart of accounts. API base: https://www.zohoapis.com/books/v3. OAuth2.',
    authType: 'oauth',
    authLabel: 'OAuth2 Access Token',
    authPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authHint: 'Zoho API Console → Self Client or Server-based app → generate token with ZohoBooks scopes',
    baseUrl: 'https://www.zohoapis.com/books/v3',
    docsUrl: 'https://www.zoho.com/books/api/v3/introduction/',
  },
]

// ── Lookup helpers ──────────────────────────────────────────────────────────

const REGISTRY_MAP = new Map<string, ToolDef>(
  TOOL_REGISTRY.map(t => [t.slug, t])
)

export function getTool(slug: string): ToolDef | undefined {
  return REGISTRY_MAP.get(slug)
}

export function getToolsByCategory(category: ToolCategory): ToolDef[] {
  return TOOL_REGISTRY.filter(t => t.category === category)
}

// Maps an employee's tool-fluency groups (EmployeeProfile.tools — display
// names like "HubSpot", "Meta Ads") to real registry slugs, for anything that
// needs to know which tools a specific employee actually cares about
// (moved here from employees/[slug]/_workspace.tsx so the onboarding flow
// can reuse the exact same mapping instead of guessing at a new one).
export const TOOL_NAME_TO_SLUG: Record<string, string> = {
  'HubSpot': 'hubspot', 'Salesforce': 'salesforce', 'Marketo': 'marketo',
  'ActiveCampaign': 'activecampaign', 'Mailchimp': 'mailchimp', 'Klaviyo': 'klaviyo',
  'Customer.io': 'customer-io', 'SendGrid': 'sendgrid', 'Google Ads': 'google-ads',
  'Meta Ads': 'meta-ads', 'LinkedIn Ads': 'linkedin-ads', 'TikTok Ads': 'tiktok-ads',
  'Semrush': 'semrush', 'SEMrush': 'semrush', 'Ahrefs': 'ahrefs',
  'Search Console': 'search-console', 'GA4': 'ga4', 'Mixpanel': 'mixpanel',
  'Amplitude': 'amplitude', 'Looker': 'looker', 'WhatsApp Business API': 'whatsapp-api',
  'Twilio': 'twilio', 'Shopify': 'shopify', 'WooCommerce': 'woocommerce',
  'Razorpay': 'razorpay', 'PayU': 'payu', 'CleverTap': 'clevertap',
  'MoEngage': 'moengage', 'Slack': 'slack', 'Intercom': 'intercom',
  'Zendesk': 'zendesk', 'Freshdesk': 'freshdesk', 'Jira': 'jira',
  'GitHub': 'github', 'Sentry': 'sentry', 'DataDog': 'datadog', 'Datadog': 'datadog',
  'Linear': 'linear', 'Notion': 'notion', 'Asana': 'asana', 'Figma': 'figma',
  'BambooHR': 'bamboohr', 'Rippling': 'rippling', 'Darwinbox': 'darwinbox',
  'Stripe': 'stripe', 'QuickBooks': 'quickbooks', 'Xero': 'xero',
  'Chargebee': 'chargebee', 'Outreach': 'outreach', 'Salesloft': 'salesloft',
  'Apollo': 'apollo', 'Pipedrive': 'pipedrive', 'Canva': 'canva',
  'Buffer': 'buffer', 'Hootsuite': 'hootsuite', 'Monday.com': 'monday',
  'Monday': 'monday', 'ClickUp': 'clickup', 'Airtable': 'airtable',
  'Google Workspace': 'google-workspace', 'PostHog': 'posthog', 'Hotjar': 'hotjar',
  'Tableau': 'tableau', 'Zoho CRM': 'zoho-crm',
  'Microsoft 365': 'microsoft-365', 'Microsoft Bookings': 'microsoft-bookings',
  'Calendly': 'calendly', 'Cal.com': 'cal-com', 'Acuity Scheduling': 'acuity-scheduling',
  'DocuSign': 'docusign', 'Dropbox Sign': 'dropbox-sign', 'HelloSign': 'dropbox-sign',
  'PandaDoc': 'pandadoc', 'Adobe Sign': 'adobe-sign', 'Adobe Acrobat Sign': 'adobe-sign',
  'Zoom': 'zoom', 'Google Meet': 'google-meet', 'Microsoft Teams': 'microsoft-teams',
  'Greenhouse': 'greenhouse', 'Lever': 'lever', 'Workable': 'workable',
  'Gusto': 'gusto', 'Expensify': 'expensify', 'Ramp': 'ramp',
  'Google Business Profile': 'google-business-profile', 'Trustpilot': 'trustpilot',
  'Vanta': 'vanta', 'Drata': 'drata',
  'Snowflake': 'snowflake', 'BigQuery': 'bigquery',
  'Close': 'close', 'Freshsales': 'freshsales', 'Amazon Ads': 'amazon-ads',
  'Amazon Seller Central': 'amazon-seller-central', 'BigCommerce': 'bigcommerce',
  'Gorgias': 'gorgias', 'Help Scout': 'help-scout', 'Segment': 'segment',
  'FreshBooks': 'freshbooks', 'Zoho Books': 'zoho-books',
  // Aliases for real registry entries referenced under a slightly different
  // name in employee profile prose — without these, a genuinely connectable
  // tool gets miscategorized as advisory-only purely from copy-editing drift.
  'WhatsApp Business': 'whatsapp-api',
}

export function employeeToolSlugs(toolGroups: { tools?: string[] }[]): string[] {
  const slugs = new Set<string>()
  for (const group of toolGroups ?? []) {
    for (const t of group.tools ?? []) {
      const s = TOOL_NAME_TO_SLUG[t]
      if (s) slugs.add(s)
    }
  }
  return [...slugs]
}

// Splits an employee's claimed tool list into what's actually connectable
// (real registry entry) vs advisory-only (the employee can strategize/draft
// about it from training knowledge but can't execute real actions in it).
// Shared by the MCP server (src/app/api/mcp/route.ts) and the human-facing
// employee profile page (_workspace.tsx) so both surfaces agree — the
// profile page previously just hid the tools section entirely when an
// employee had zero connectable tools, silently, with no honesty note, even
// though the surrounding "How I Work" prose kept making unqualified
// automation claims.
export function splitToolsByConnectability(toolGroups: { category: string; tools: string[] }[]) {
  const connectable: string[] = []
  const advisoryOnly: string[] = []
  for (const group of toolGroups ?? []) {
    for (const t of group.tools ?? []) {
      if (TOOL_NAME_TO_SLUG[t]) connectable.push(t)
      else advisoryOnly.push(t)
    }
  }
  return { connectable, advisoryOnly }
}

// Clearbit logo URL for a tool slug
export function toolLogoUrl(slug: string): string {
  const tool = REGISTRY_MAP.get(slug)
  if (!tool) return ''
  return `https://logo.clearbit.com/${tool.domain}`
}

// Build tool description context for Claude system prompt
// Every employee's system prompt narrates broad tool fluency in prose
// (e.g. "You use Modash for creator discovery") regardless of whether that
// tool is even in the registry, let alone connected by this customer. Without
// this guardrail the AI will confidently claim to "pull this from Modash"
// mid-chat even when no real API call to Modash could ever be made. Appended
// to every system prompt rather than hand-editing ~100 profiles' prose.
export const TOOL_HONESTY_GUARDRAIL = `

IMPORTANT — tool honesty: your background above may mention tools you're expert in using. You can only take REAL, automated action in a tool if it appears in a "CONNECTED TOOLS" list provided separately in this prompt. For any other tool — including ones you describe yourself as expert in — you can strategize, draft content, and give expert advice using your training knowledge, but you must say plainly that you cannot directly execute or pull live data from it yet (e.g. "I can draft this brief, but I can't pull live data from Modash until it's connected"). Never claim or imply you performed a real action in a tool that isn't connected.`

export function buildToolContext(connectedSlugs: string[]): string {
  if (!connectedSlugs.length) return ''
  const lines = connectedSlugs.map(slug => {
    const t = REGISTRY_MAP.get(slug)
    if (!t) return null
    return `- **${t.name}** (${t.category}): ${t.description}`
  }).filter(Boolean)
  return lines.length
    ? `\n\nCONNECTED TOOLS:\n${lines.join('\n')}`
    : ''
}
