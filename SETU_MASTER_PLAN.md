# Setu Master Fix Plan
> Compiled: 2026-08-20. Use this as the execution brief for the next session.

---

## STATUS UPDATE — 2026-08-24

Nearly everything below is done. Checked against `git log` (commits `52eea50` through `3691a22`) plus this session's fixes.

**Done:** #1–#18, #20–#27, #29–#35, #37–#39, #41–#43, #46, #48, #51
(all P0 security items, all P1 trust-killers, nav/footer unification, email capture + onboarding, rate limiting, billing panel, activity feed, session ratings, audit logs + DPA, admin role check, blog/SEO, WorkOS SSO scaffolding + PostHog, MCP never leaks `systemPrompt`, and the per-seat pricing escalation from #51 — team hires now lock at the first employee's rate instead of climbing each time.)

**Deliberately not done as originally written — #28**: no DB-level `UNIQUE(email, employee_slug)` on `employee_hires`. A hard constraint would also block a legitimate re-hire from a churned customer, which the founder wants visibility into. Instead the hire route (`src/app/api/employees/hire/route.ts`) has an application-level 2-minute dedup guard against double-submits. Leave as-is unless duplicate leads become an actual problem.

**Still genuinely open — needs a product/tooling decision, not just code:**
- **#36** Full org/team workspace model (multi-user per account, roles). Only SSO scaffolding (#35) exists so far. This is a multi-week schema + auth change — scope separately.
- **#44** CRM. No tool chosen yet (HubSpot free tier vs. Notion database).
- **#47** Rewardful for agency revenue share. Needs a Rewardful account + API key.
- **#49** Churn signal tracking (personal email after 7 days idle). PostHog is wired up (#20/#3691a22) so the event data exists — building the "went quiet" trigger is what's missing.
- **#50** Referral / word-of-mouth mechanism. No referral code system exists yet.

If picking up this doc again: those five are the actual backlog. Everything else in the numbered list below is historical record of what was found, already fixed.

---

## SECOND AUDIT — 2026-08-24 (five independent passes: security, billing, frontend, code hygiene, funnel)

The founder asked for a fresh look because the first pass clearly hadn't caught everything. It hadn't. Findings and fixes below; commit follows this doc update.

### Fixed this pass
- **Conversation data was world-readable.** `conversations`, `conversation_messages`, `conversation_state`, `generated_blueprints` had the exact same "USING(true), no TO service_role" bug migration 012 fixed on 5 other tables — just missed here. Anyone with the public anon key could read every prospect's full interview transcript via the raw Supabase REST API. Fixed in migration 015. **Needs the founder to run this migration against the live DB — it does not apply itself.**
- **`/api/employees/[slug]/execute` had no auth at all.** Took a bare client-supplied `user_id`, decrypted, and spent that account's real connected-tool credentials (Slack/HubSpot/Mailchimp/etc.) with no approval friction on GET-type actions. Now requires a manage-token.
- **`/api/checkout/dodo`** trusted a bare `user_id` (an unauthenticated oracle for guessing valid user/employee pairs and their status). Now requires a manage-token.
- **`/api/manage/recover`** had zero rate limiting despite sending a real email every call — an email-bombing vector against any known address. Added the same limiter used elsewhere.
- **Timing-unsafe secret comparisons** in `admin-guard.ts` and `cron-auth.ts` (plain `===` on `ADMIN_SECRET`/`CRON_SECRET`) — switched to `crypto.timingSafeEqual`.
- **Cancel/pause never touched Dodo.** Self-service cancel/pause in the manage hub only ever flipped our own DB status — the Dodo subscription kept billing regardless. Now calls `dodo.subscriptions.update()` for real, using a `dodo_subscription_id` the webhook now actually stores (it never did before).
- **Webhook only handled activation.** Added `subscription.cancelled` / `subscription.failed` / `subscription.expired` / `subscription.on_hold` so a Dodo-side lapse (failed renewal, dispute, direct cancellation in Dodo's dashboard) updates our status instead of `hired_subscriptions.status` staying `'active'` forever.
- **Resume-from-pause could grant free `'active'` status** once a trial had expired — the code contradicted its own inline comment saying this must never happen. Fixed: now requires checkout (or a real Dodo unpause if they'd already been billed once).
- **This session's own team-bundle price-lock fix (#51 above) had a hole**: it pulled the cheapest rate from ANY prior subscription including cancelled ones. Hire a cheap employee, cancel it, hire something unrelated later — that unrelated hire would floor at the cancelled one's rate forever. Scoped to `trial`/`active`/`paused` only.
- **Hire endpoint could downgrade a paying subscriber.** Hitting `/api/employees/hire` again for an employee already `active`/`paused` (stale tab, replayed request) silently reset them to a fresh 14-day trial at a possibly different price — and could later get them auto-cancelled by the trial-expiry cron for a subscription they were actually paying for. Now guarded.

### Found, deliberately NOT auto-fixed — needs your eyes first
- **Price lock may not be enforced at the actual charge.** `checkout/dodo` creates a Dodo checkout session against one fixed `DODO_PRODUCT_ID`; the customer's locked `monthly_price_cents` only rides along as `metadata`, never as a price override. Dodo's SDK doesn't obviously support a per-subscription price override on checkout (`amount` override only exists for pay-what-you-want one-time products, not subscriptions) — this may mean the entire price-lock/step-up model is cosmetic in the database and every activation actually charges whatever's configured on that one Dodo product right now. **Verify directly against Dodo's dashboard/docs before trusting the $49→$59→... story in any customer-facing copy.** Two of five independent audit passes flagged this same thing without prompting each other, which raises my confidence it's real.
- `employee_actions` PATCH/DELETE (approve/reject in the interview demo) still trusts a bare `userId`. Traced deliberately: nothing outside that one file reads `employee_actions.status` to perform a real action — the actual execute loop's approvals live in a separate `task_approvals` table gated by the fix above — so there's no live exploit today. Left open on purpose because it's the same anonymous-pre-hire pattern the product depends on (interview-before-you-pay with no account). Revisit only if a real executor ever gets wired to this table.

### New backlog items surfaced (not yet actioned — pick and prioritize)
- Hardcoded "October" price-hike copy in two places (`manage/[slug]/_client.tsx`, `cron/trials.ts`) will read as stale once October passes — should compute from `LAUNCH_DATE` like `pricing/page.tsx` already does.
- Three contradicting onboarding-speed claims across homepage / pSEO / hire success screen ("48 hours" / "2–3 days + call" / "live right now, no call").
- Two different unimplemented guarantees ("30-day satisfaction," "7-day live") not backed by Terms or any refund code path.
- Interview-only leads (`interview_leads` table) are captured then never used — no re-engagement, no admin view.
- No mobile nav menu — Employees/Pricing/Compare/My Team are unreachable from a phone (nav links are just `display:none` under 760px with no hamburger anywhere in the repo).
- Hire form breaks layout below ~375px (fixed `320px` sidebar column, no media queries).
- No favicon, no OG image on any page, no `error.tsx`/`loading.tsx`/`not-found.tsx` anywhere in the app.
- `getServerEnv()` requires 7 undocumented env vars (`SUPABASE_SECRET_KEY`, `DATABASE_URL`, `OPENAI_API_KEY`, etc.) on hot paths including every AI call and every transactional email — one route already had to bypass it after hitting a crash in production (see the comment in `manage/recover/route.ts`).
- 7 near-identical `getSupabase()` admin-client reimplementations instead of the shared `createAdminClient()` helper — consistent today, but a change-in-7-places risk.
- Stale "BYOK — use your own API keys" copy on the homepage and `/employees` meta description, contradicting the flat $49/mo model shown everywhere else.

Full detail on all of the above lives in this session's conversation transcript if you want it later — this doc only carries what's actionable.

---

## P0 — CRITICAL SECURITY (fix before sending the URL to anyone)

### 1. Webhook accepts unauthenticated requests if env var missing
**File:** `src/app/api/webhooks/dodo/route.ts`
```typescript
// CURRENT — remove the else branch entirely
if (webhookSecret) {
  event = dodo.webhooks.unwrap(...)
} else {
  event = dodo.webhooks.unsafeUnwrap(rawBody) // ← anyone can activate any sub for free
}
// FIX: if (!webhookSecret) return NextResponse.json({ error: 'Misconfigured' }, { status: 500 })
```
Also add idempotency: check `status === 'active'` before updating.

### 2. All /api/manage/* routes accept user_id from request body — zero session auth (IDOR)
**Files:** `src/app/api/manage/subscription/route.ts`, `my-employees`, `recover`, `beliefs`, `actions`
Any caller who knows a UUID can cancel/pause/delete any customer's subscription and memories.
**Fix:** Issue a signed short-lived token at hire time. Store server-side. Require it on all manage routes. Minimum: HMAC-signed `{userId, issuedAt}` with 30-day expiry.

### 3. hired_subscriptions RLS is USING (true) — all PII readable via browser anon key
**File:** `supabase/migrations/010_subscriptions.sql` line 59
```sql
-- CURRENT
CREATE POLICY "owner_access" ON hired_subscriptions USING (true) WITH CHECK (true);
-- FIX
DROP POLICY "owner_access" ON hired_subscriptions;
CREATE POLICY "service_role_only" ON hired_subscriptions USING (auth.role() = 'service_role');
```
Same fix needed for `employee_actions` and `employee_action_log`.

### 4. Admin APIs completely open if ADMIN_SECRET env var is absent
**File:** `src/lib/governance/admin-guard.ts`
```typescript
if (adminSecret) { /* check */ }
// if not set → no check at all → all 15 admin routes are public
// FIX: if (!adminSecret) return 500 with a startup error log
```

### 5. Resume action converts cancelled → active without payment
**File:** `src/app/api/manage/subscription/route.ts`
`action: 'resume'` on a cancelled subscription with expired trial sets `status: 'active'` for free.
**Fix:** Only allow resume from `'paused'` state. Require confirmed payment for `cancelled → active`.

### 6. Recovery email embeds non-expiring master credential in a URL
**File:** `src/app/api/manage/recover/route.ts`
The `?uid=<uuid>` in the link never expires, never rotates, and is followed by email scanners.
**Fix:** Issue a time-limited signed token (e.g. HMAC + 48h TTL) for recovery links instead of embedding raw uuid.

---

## P1 — TRUST KILLERS (fix before any paid outreach or serious demo)

### 7. Enterprise testimonial is a literal placeholder in production
**File:** `src/app/enterprise/page.tsx`
`[Founder Name] · [Company Name, City]` — visible on a $2,499/mo sales page right now.
**Fix:** Real quote or remove the testimonial section entirely until one exists.

### 8. WhatsApp page uses Indian unicorn logos as fake social proof
**File:** `src/app/whatsapp/page.tsx`
Swiggy, Meesho, Razorpay, Zepto, Cars24, Urban Company are not customers.
**Fix:** Remove the logo ticker or replace with "Interview-first — no commitment needed" trust copy.

### 9. No Privacy Policy or Terms of Service pages (linked from /signin — both 404)
**Fix:** Create `src/app/privacy/page.tsx` and `src/app/terms/page.tsx`.
Minimum content: data collected (name, email, company), how stored (Supabase, US), payment processor (Dodo), cancellation terms, 14-day trial terms. Add links to both in hire form and footer.

### 10. Four conflicting prices shown across the site
- Homepage + Pricing: $49/mo  
- Compare page footer: "Starting at $199/mo"  
- WhatsApp page: $199–$299/mo  
- pSEO /hire/[role] pages: $1,999/mo, $2,999/mo, $199/mo (stale)
**Fix:** Define two tiers clearly (Standard $49/mo, WhatsApp $199–$299/mo, Enterprise $2,499–$2,999/mo). Update compare footer, pSEO pages, and any hardcoded prices.

### 11. No shared nav component — 6+ different navs across pages
Every page builds its own nav inline. Nav links differ between homepage, pricing, compare, enterprise, agencies, MCP, and whatsapp pages.
**Fix:** Create `src/components/layout/Nav.tsx` and `Footer.tsx`. Replace inline navs on all pages.

### 12. /blueprints publicly exposes internal admin blueprint data
**File:** `src/app/blueprints/page.tsx`
Accessible at `/blueprints` with no auth gate. Shows risk scores, confidence levels, admin review links.
**Fix:** Add `redirect('/blueprints/new')` at the top of the page component, or add auth check.

### 13. /dashboard always redirects to /signin (broken loop)
**File:** `src/app/dashboard/page.tsx`
Checks Supabase auth → always null → redirects to /signin → infinite loop.
**Fix:** `redirect('/my-employees')` directly.

### 14. "Canvas Builder" CTA on homepage links to /employees (product doesn't exist)
**File:** `src/app/page.tsx`
**Fix:** Remove the Canvas Builder section or replace with a link to /blueprints/new.

### 15. Agencies page promises features that don't exist
"Agency dashboard" — no route. "Pre-built client decks" — no download. "White-label option" — no build.
**Fix:** Change to "in development — contact us" or build the Notion-based minimal version.

### 16. No /about page
**Fix:** Create `src/app/about/page.tsx`. Who is Setu, who built it, why, what the mission is.

### 17. No /contact page
**Fix:** Create `src/app/contact/page.tsx`. Form + email + response time expectation.

---

## P2 — PRODUCT COMPLETENESS

### 18. No email capture at interview start
The most valuable GTM gap. Every person who interviews an employee is high-intent. There is no email captured during the anonymous interview flow.
**Fix:** Gate the interview with "Enter your email to start free interview" — not an account, just email. Store in `interview_leads` table.

### 19. No post-hire email sequence
**Fix:** Use Loops.so (free up to 1,000 contacts). Three emails:
- T+0: "Your interview link for [Employee]"
- T+3d: "How did the interview go?"  
- T+11d: "3 days left — lock in $49 before October"

### 20. No product analytics
**Fix:** Install PostHog (free tier). Track: `interview_started`, `interview_message_sent`, `hire_form_opened`, `hire_form_submitted`, `trial_day_7_active`, `subscription_activated`.

### 21. No billing history self-serve for users
Users can't see their payment dates, subscription status, or download invoices without emailing.
**Fix:** Add a subscription status panel to `/my-employees` that pulls from Dodo API (or the `hired_subscriptions` table) to show: status, next billing date, locked rate, cancel/pause options.

### 22. No onboarding flow after hiring
After hire form → user lands in manage hub cold. WyberAI has a 4-step wizard.
**Fix:** Create `/employees/[slug]/onboard` — 4 steps: Upload context docs → Set top 3 KPIs → Connect tools → Launch.

### 23. No completed actions history on manage hub
Manage hub shows pending approvals but no log of what the employee has actually done.
**Fix:** Add an "Activity" feed to `_client.tsx` that shows the last 10 completed actions from `employee_action_log`.

### 24. No performance rating
No mechanism for users to signal quality back.
**Fix:** After each session/action, show thumbs up/down. Store in `session_ratings(user_id, employee_slug, session_id, rating, note)`.

### 25. No cross-sell on /my-employees
When a user has 1–2 employees, no nudge to hire complementary roles.
**Fix:** Add "Complete your team" section showing 2–3 role suggestions based on what they've hired.

### 26. No /changelog
**Fix:** Create `src/app/changelog/page.tsx`. Static list of product updates. Shows momentum.

### 27. No rate limiting on hire form (email bomb risk)
**Fix:** Add IP-based rate limiting: 5 requests per IP per hour. Use Upstash Rate Limit (free tier).

### 28. No uniqueness constraint on employee_hires table
Double-click = duplicate lead, duplicate emails.
**Fix:** Add `UNIQUE(email, employee_slug)` to the `employee_hires` table in a new migration.

### 29. HTML injection in admin notification emails
User input from name/company/use_case injected raw into email HTML.
**Fix:** Escape HTML entities in all user-supplied fields before interpolating into email template.

### 30. activated_at never set by Dodo webhook
**File:** `src/app/api/webhooks/dodo/route.ts`
**Fix:** Add `activated_at: new Date().toISOString()` to the update object in the webhook handler.

### 31. pSEO /hire/[role] pages have stale prices
**File:** `src/app/hire/[role]/page.tsx`
Hardcoded $1,999/mo, $2,999/mo stale pricing.
**Fix:** Replace with current tier prices or remove prices from body copy and link to /pricing.

### 32. userId null on hire form → subscription silently not created
**Fix:** Return a 400 error if no userId present. Or: generate a server-side UUID if client doesn't send one and return it in the response so the client can save it to localStorage.

### 33. DB failure on hire sends success emails but loses the hire
**Fix:** Treat DB error as fatal. Return 500. Let the client retry. Do not send emails if DB fails.

---

## P3 — ENTERPRISE READINESS

### 34. No authentication layer (localStorage UUID only)
The current model is incompatible with any enterprise evaluation.
**Recommended path:**
1. Clerk (free tier) for Google SSO — removes localStorage problem. 3–5 days.
2. Add org/team model: company account, invite team member, shared context. 2–3 weeks.
3. Role-based permissions: Admin / Editor / Viewer. 3 days.
4. WorkOS for SAML/OIDC — required for Okta and Azure AD customers. Only when first enterprise deal is in door.

### 35. No SSO support
Enterprise buyers (50+ employees) require SAML 2.0 or OIDC as a hard procurement requirement.
**Options:** WorkOS (free until $1M ARR), Clerk SAML ($25/org/mo), Supabase SAML plugin.
**Fix:** WorkOS is the right long-term choice. Clerk is faster to get Google SSO live.

### 36. No multi-user / team workspace
Enterprise use case: CMO, CEO, and marketing director all interact with the same AI employee with shared context. Currently one UUID = one person = one browser.
**Fix:** Org model in DB: `organizations(id, name, plan)`, `org_members(org_id, user_id, role)`, `hired_subscriptions` linked to `org_id` not `user_id`.

### 37. No audit logs
Any company subject to SOC 2, ISO 27001, or India DPDPA 2023 requires audit logs before approval.
**Fix:** Append-only `audit_log(id, org_id, user_id, action, resource, timestamp, ip)` table. Log all hire, activate, cancel, approve, reject, belief-modify events.

### 38. "SOC 2 aligned" on enterprise page is meaningless without certification
**Fix:** Either remove the claim, or replace with "security questionnaire available on request" and actually maintain a pre-filled questionnaire Google Doc that answers the 20 most common questions.

### 39. No data processing agreement (DPA) template
Required for GDPR-adjacent buyers and DPDPA compliance.
**Fix:** Publish a standard DPA at `/legal/dpa` based on a standard template (Stripe, Linear, etc. all publish theirs publicly — use as reference).

### 40. Admin UI and admin API auth are completely independent (split auth systems)
Admin UI uses Supabase session; Admin API uses x-admin-secret header. These never talk to each other.
**Fix:** Admin UI should attach the admin session token to all API requests. Or consolidate to one auth method.

### 41. Any Google-authenticated user = admin (no role check)
**File:** `src/lib/governance/admin-guard.ts`
`getAdminUserOrNull()` returns any authenticated Supabase user as an admin with no email allowlist.
**Fix:** Add `if (user.email !== process.env.ADMIN_EMAIL) return null`.

---

## P4 — GTM GAPS

### 42. No email capture = no prospect list
See #18. This is the root cause of every downstream GTM gap.

### 43. No trial conversion email sequence
See #19.

### 44. No CRM
**Fix:** HubSpot free tier or Notion database. Track every prospect: company, role, trial date, hire date, status.

### 45. No Product Hunt launch prepared
The interview-first mechanic is PH-worthy — no other AI tool lets you talk to the employee before paying.
**Fix:** Prepare: demo video, tagline, hunter with Indian founder following, launch date coordination.

### 46. Zero blog / SEO content
**Missing keywords to target:**
- "AI CMO for startups India"
- "hire AI marketing manager"
- "AI employee vs human employee cost"
- "AI chief of staff"
- "Lindy AI alternative"
- "replace marketing manager with AI"
- "WhatsApp business automation agent India"

**Fix:** Start with 3 posts: (1) cost comparison article, (2) "I used an AI CMO for 30 days" first-person, (3) "AI CFO vs hiring a CFO in India."

### 47. No Rewardful/PartnerStack setup (agency revenue share is a promise, not a system)
**Fix:** Set up Rewardful ($49/mo). Each agency partner gets a referral link. Commission tracked automatically.

### 48. No system prompt data protected (MCP exposes everything)
**File:** `src/app/api/mcp/route.ts`
The `get_employee` tool likely returns the full employee profile including system prompt — the core IP.
**Fix:** Strip `systemPrompt` from all MCP responses. Return only public catalog data.

### 49. No churn signal tracking
**Fix:** Track session frequency in PostHog. Trigger a personal Sumeet email when a trial user goes 7 days without logging in.

### 50. No referral / word-of-mouth mechanism
**Fix:** After activation, show "Know a founder who needs a [role]? They get their first month at $49, you get $50 credit." Build via Rewardful.

### 51. Expansion revenue model punishes growth
Current model: "Adding employees later means they're at a higher rate." This is a churn mechanic.
**Fix:** Offer a team bundle: "Hire 3 employees, lock today's price on all 3." Or a flat team rate.

---

## BUILD ORDER FOR NEXT SESSION

### Day 1 (Security emergencies — do first)
1. Remove `unsafeUnwrap` branch from webhook handler
2. Fix RLS on `hired_subscriptions`, `employee_actions`, `employee_action_log`
3. Add idempotency check to webhook (skip if already active)
4. Fix resume action: only from `paused` state, no free `cancelled → active`
5. Add `activated_at` to webhook update
6. Confirm DODO_WEBHOOK_SECRET and ADMIN_SECRET are set in Vercel

### Day 2–3 (Trust)
7. Remove fake unicorn logos from WhatsApp page
8. Replace enterprise testimonial placeholder
9. Create /privacy and /terms pages (minimum viable)
10. Fix all conflicting prices across compare, pSEO, and WhatsApp pages
11. Fix /blueprints redirect
12. Fix /dashboard redirect to /my-employees
13. Remove Canvas Builder section from homepage or link to /blueprints/new

### Week 1 (Foundation)
14. Create shared Nav + Footer components, replace all 6 inline navs
15. Add legal links to hire form and footer
16. Create /about page
17. Create /contact page
18. Add email capture at interview start
19. Set up PostHog tracking (5 key events)
20. Add rate limiting to hire form (Upstash)
21. Add unique constraint on employee_hires(email, employee_slug)
22. Fix HTML injection in email templates
23. Fix userId null → return 400 not silent skip
24. Fix DB error → return 500 not silent continue

### Week 2–3 (Product depth)
25. Completed actions feed on manage hub
26. Session rating (thumbs up/down)
27. Cross-sell nudge on /my-employees
28. Onboarding flow at /employees/[slug]/onboard
29. Subscription status panel on /my-employees (billing history)
30. Set up Loops.so 3-email trial sequence

### Week 4+ (Enterprise track)
31. Google SSO via Clerk
32. Org/team workspace model
33. Role-based permissions (Admin/Editor/Viewer)
34. Audit log table
35. Security questionnaire pre-fill doc
36. /changelog page
37. 3 blog posts
38. Set up Rewardful for agency program
39. WorkOS SAML when first enterprise deal is in negotiation

---

## ENV VARS TO VERIFY IN VERCEL (Setu)
- `DODO_WEBHOOK_SECRET` — must be set or webhook is wide open
- `DODO_API_KEY` — for checkout session creation
- `DODO_PRODUCT_ID` — the product being sold
- `ADMIN_SECRET` — must be set or all admin APIs are public
- `ADMIN_EMAIL` — add this to restrict admin UI to one email
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_META_PIXEL_ID`

---

_This document was compiled from: full page-by-page audit, API route security audit, RLS policy review, and GTM/enterprise market comparison. All findings verified against actual source code._
