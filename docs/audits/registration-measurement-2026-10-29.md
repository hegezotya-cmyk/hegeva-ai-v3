# Registration measurement repair and reconciliation — 29 October 2026

## Scope
Forward the existing registration_submitted event through the consented GA4 receiver. Submitted is not email verification, completed registration, activation, or purchase. No production deployment, real account creation, email, financial writes, or GA4 test uploads.

## Evidence
- Base: fdfdee4b781fc95527b6801341d024c6195d7913 (origin/v0-rebuild).
- Regression against base: REGISTRATION_BASE_REF=origin/v0-rebuild node scripts/registration-ga4-audit.mjs fails expected 1 actual 0 for granted consent.
- Same regression against patch: PASS. Executes actual tracker and receiver; absent/denied consent emit nothing and preserve marker availability; consented event forwards once with safe payload.
- Local browser: PASS accepted signup=1, rejected=0, denied consent=0, no email in payload. API fixture only, GA network blocked.
- Subscription consent/dedup regression: PASS.
- Campaign attribution regression: PASS for existing approved labels.
- TypeScript: npx tsc --noEmit --incremental false PASS.

## Fresh Windsor read-only results
Period 2026-10-01 through 2026-10-29; current day may be incomplete. GA4 account 553012718; Stripe account 2392. Snapshot is not a full financial reconciliation.
- GA4: 75 session_start events; 3 registration_start; 1 activation_completed; no rows for registration_submitted, registration_completed, email_verified, subscription_success or purchase. Absence does not prove no underlying customer action.
- Session source/medium: Netlify shiny-stardust-e0dcb3 referral 28; direct 24; (not set)/organic_social 15; facebook/organic_social 2; google/organic 2; directory/organic 1; instagram/organic 1; nicheloom referral 1; tiktok/organic 1. Do not classify Netlify referrals as prospective customers without further evidence.
- Both returned active Stripe subscriptions have livemode=False. They do not establish live paying customers.
- Stripe transaction report: GBP charges 84.51, fees 6.07, net 78.44; payouts -42.64; separate stripe_fee -0.32. This table lacks charge livemode and customer ownership evidence, so it cannot establish external customer revenue or be joined to those test subscriptions by assumption. Payout is not a sale or refund.

## Remaining findings
- subscription_success is a consented, deduplicated paid-entitlement confirmation after the account checkout return. It is not a transaction ledger and cannot capture customers who do not return or consent. An already-paid user can also return with billing=success; do not use this event as verified purchase revenue.
- Never backfill purchase events from aggregate Stripe data. A future financial conversion design needs a verified transaction, idempotency, consent policy and test/live separation before changes.
- New public Instagram campaign ig_launch_2026_10 and LinkedIn company_* content labels are absent from the custom attribution allowlist. Automatic GA4 attribution and custom campaign parameters are distinct; exact approved labels need their own regression coverage before expanding the allowlist.
- Netlify origin and missing organic_social source require source-link investigation; no referral exclusions were changed.

## Release status
Local candidate only. Browser fixture and code-level evidence do not prove production GA4 delivery or a real payment flow. No production analytics or Stripe setting was changed.

## Final broader verification
- npm run audit:roadmap: PASS, exit 0 (rerun with localhost access after initial EACCES from local Miniflare).
- Full conversion-v2-browser-test.cjs: PASS, including consent/revocation, dedup, approved campaigns, PII exclusion, five locale mobile layout, signup and mocked account billing return.
- Updated stale browser fixtures: unverified accepted signup has no token/session; authenticated billing fixture is verified; pending basic entitlement preserves return marker and emits no subscription success.
- Independent review: no blockers in production change and regression wiring; final browser fixture review also passed without blockers.
- No full release build or staging/production delivery was performed for this local candidate.
