# HEGEVA AI — Isolated Stripe TEST webhook harness acceptance

**Status: DRAFT / CODE ONLY / NOT DEPLOYED / NOT READY.** Depends on Draft #105; related to #102 and the previously completed isolated D1 Time Travel rollback proof.

## Exact authorized scope

- Only Cloudflare account **HEGEVA Synthetic Tests**, `ab362645fc03b7e63a26fd8e46e631b6`.
- Only **new disposable** D1 `hegeva-deleted-user-webhook-test-db`, `84f4c3b0-c175-4458-bad1-e3f826d6ea96`. It is currently restored to its empty baseline.
- Not the older isolated Cron D1, running staging D1 or production D1, and not any user-facing HEGEVA app.
- Proposed Worker name: `hegeva-isolated-deleted-user-webhook-test`. Distinct from staging and live Workers. No cron, custom route, service bindings, AI, email or Stripe API calls.
- Dedicated TEST Sandbox Stripe account configured: `acct_1U4YkdHH1vUED8ZN`, **not** main HEGEVA TEST or LIVE. Direct Stripe webhook payloads may lack `event.account`, so account separation must additionally be verified against the official Stripe TEST endpoint ownership and webhook-signing secret. This is **not yet proven**.
- **No secrets in repository, GitHub issues or chat.** Any test-only `whsec_...` must be stored exclusively in the isolated Cloudflare Worker secret manager, and never reused from live/shared staging.
- No one has approved a remote Worker deployment, test schema install, activation, or real Stripe event resend as part of this Draft PR. No remote changes have been performed by this PR.

## What was coded, and what it cannot do

- `src/isolated-deleted-user-webhook-test-worker.js`: valid HMAC SHA-256 Stripe-Signature with max 5-minute tolerance, `livemode=false`, optional `event.account` mismatch rejection, strict disposable database marker check, and direct call to the actual Draft #105 deleted-user disposition function.
- Endpoint: `POST /__hegeva/isolated/stripe-test-webhook`, no other route accepts webhooks. Valid signed TEST event for a verified synthetic deleted user may be recorded once as `outcome=ignored`. **No plan grant, Stripe customer synchronization, payment, referral, credit or outbox code is present.**
- A live synthetic user (no tombstone) or unrelated signed event yields 409 with no ledger write; unknown auth user fails closed with 503. Unsigned/wrongly signed/LIVE events cannot write.
- `wrangler.isolated-deleted-user-webhook-test.jsonc` pins exact account/DB. The feature is explicitly `HEGEVA_ISOLATED_STRIPE_TEST_ENABLED=false` and `workers_dev=false`. Thus simply applying a DB schema would not create a live endpoint.
- `scripts/isolated-deleted-user-webhook-test-schema.sql` creates synthetic-only fixture versions of `"user"`, `user_plans`, `stripe_customers`, `stripe_webhook_events`, tombstone, triggers and a single immutable-in-practice identity marker. **Never run against the real application D1.** This is **not the Better Auth migration**.
- Offline tests sign event payloads with a **made-up local HMAC secret**; 200 replies in these tests prove only the source-code contract. They do not prove a real Stripe TEST endpoint was contacted, nor real Better Auth deletion or Cloudflare D1 eventual ordering.

## Strict STOP-gated remote sequence for a later owner authorization

1. Review Draft PR, all tests, Wrangler compile check, SQL, and account/DB IDs. Require green and no unexpected network interactions. Keep PR Draft, never merge to production or shared-staging branch.
2. Capture a **new current Time Travel bookmark** for exactly this disposable D1, because the earlier pre-probe bookmark predates a restore and should not be reused as a blanket rollback point. Save privately; prove backup/restore path. Do not print bookmark to CI/GitHub/chat.
3. Confirm synthetic account credentials have scoped Worker Editor + only this disposable D1's minimum permissions. If Cloudflare token scope cannot limit to only this D1, **STOP**; do not grant broad D1 writes or reuse existing production/staging token.
4. Confirm D1 empty. Review synthetic fixture schema with owner, then apply **only the fixture SQL** to that disposable D1 after express approval. Verify exact tables/triggers and the pinned identity record. No real user/subscription imports.
5. Verify isolated Worker name and D1 DB binding. Stage a test-only signing secret in the synthetic account; prove which Stripe Sandbox account's endpoint owns it, without reading/printing the secret. The unrelated production/shared staging secrets remain untouched.
6. Keep network endpoint disabled until explicit approval for a temporary TEST-only `workers.dev` URL and a distinct feature enable. Protect isolated endpoint with a TEST-only signing secret, timestamp and content-size limit. Determine if additional Cloudflare Access restrictions are needed for manual synthetic replay; real Stripe cannot send an additional custom bearer token.
7. Deliver signed synthetic fixture events locally/remote; inspect receipt, single `ignored` ledger row, replay/concurrency, bad signature, LIVE payload, deleted/live/unknown user, and no customer/plan rows. Then separately verify official Stripe **real TEST** endpoint delivery and `/v1/account` identity; note these are different evidence levels.
8. Disable the temporary endpoint, remove or rotate test-only secret, verify no public route remains. Preserve masked evidence and owner-approved retention. If any failure occurs, restore **only disposable D1** from its verified bookmark and rerun schema query. Do not touch previous Cron synthetic DB, shared staging, or production.

## Open correctness blockers before any staging or production release

- The Draft #105 helper's existing `ignored` event replay does not carry a distinct deletion-disposition provenance field. An unrelated preexisting `ignored` ledger row could be accepted as if owned by the deleted-user guard; this needs a reviewed audit/provenance design before broad activation.
- Stripe signature authenticity authenticates the **endpoint secret**, but alone does not independently establish complete Stripe account/customer/subscription identity.
- The isolated Worker intentionally never applies valid entitlements: only the **deleted-user ignore path** is exercised, not full active-user billing.
- Minimal fixture auth deletion trigger does not establish Better Auth's real deletion hook or all foreign keys/transactions.
- Cloudflare D1 concurrent writes, actual Stripe TEST webhook retries, account isolation on signed-in app APIs, outbox/referral and complete multi-subscription cancellation still require remote end-to-end proof.
- **Final release remains `releaseSafe=false`.** No main staging or production deployment until separate owner signoff.
