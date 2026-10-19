# HEGEVA approved production baseline — 2026-09-05

## Identity

- Branch: `approved-ui-integration`
- Base HEAD before closure: `6996ca202054821f645d94545f66e8195a319df9`
- Production UI version: `29a58407-03a2-4d6b-9e17-f9dd1115f765`
- Public application: `https://hegevaai.co.uk`

## Included product baseline

- Five-locale responsive shell, authentication and cloud/local workspace data.
- Honest guest SAMPLE DATA and authenticated LIVE WORKSPACE presentation.
- Customer, document, expense, planner, report, message, invoice, quote, contract,
  receipt, tax summary, vault, tools and Financial Guard workspaces.
- Business Intelligence overdue-invoice follow-up chain with linked drafts and
  Planner tasks, duplicate protection and no automatic sending.
- HEGEVA Core V1 real-record interpretation and ranked next actions.
- Revenue journey proof: Opportunity → Customer → Quote → Follow-up → Invoice → Payment.
- Intelligence & Autopilot Phase 1 with Suggest → Prepare → Approve → Execute,
  Opportunity Radar, owner approval, duplicate-safe local execution and audit trail.
- Guided App Studio/X10/X20, bounded X30 contracts, Advertising and Video Studio
  planning workflows, AI Bot controls, Enterprise foundations and paper simulation.
- Live monthly Premium and Pro Stripe path with webhook-authoritative entitlement.

## Explicit boundaries

- Gmail/Outlook, Google Calendar and CRM/commerce integrations are not connected.
- AI, advertising, image and video provider execution remains gated unless a
  separately approved production configuration says otherwise.
- No unrestricted Autopilot, automatic message sending or live broker execution.
- Annual billing, trials and final AI-credit policy remain unapproved.

## Verification

- Full `release:check`: passed before production version above.
- TypeScript, Next.js production build and OpenNext Cloudflare build: passed.
- Worker dry-run, complete roadmap audit and Autopilot Phase 1 audit: passed.
- Production smoke tests for the homepage, Command Center, Assistant and relevant
  business routes: passed.

## Release closure rule

This baseline must not be reverted or overwritten by work created from an older
repository state. Future changes must preserve the combined product baseline, pass
the full release gate and record the new production version after deployment.
