# HEGEVA AI — Isolated Stripe TEST webhook harness acceptance

**Status: DRAFT webhook code NOT DEPLOYED / isolated placeholder created / public routes DISABLED / NOT READY.** Depends on Draft #105; related to #102 and the previously completed isolated D1 Time Travel rollback proof.

## Exact authorized scope

- Only Cloudflare account **HEGEVA Synthetic Tests**, `ab362645fc03b7e63a26fd8e46e631b6`.
- Only **new disposable** D1 `hegeva-deleted-user-webhook-test-db`, `84f4c3b0-c175-4458-bad1-e3f826d6ea96`. It is currently restored to its empty baseline.
- Not the older isolated Cron D1, running staging D1 or production D1, and not any user-facing HEGEVA app.
- Proposed Worker name: `hegeva-isolated-deleted-user-webhook-test`. Distinct from staging and live Workers. No cron, custom route, service bindings, AI, email or Stripe API calls.
- Dedicated TEST Sandbox Stripe account configured: `acct_1U4YkdHH1vUED8ZN`, **not** main HEGEVA TEST or LIVE. Direct Stripe webhook payloads may lack `event.account`, so account separation must additionally be verified against the official Stripe TEST endpoint ownership and webhook-signing secret. This is **not yet proven**.
- **No secrets in repository, GitHub issues or chat.** Any test-only `whsec_...` must be stored exclusively in the isolated Cloudflare Worker secret manager, and never reused from live/shared staging.
- Owner approved and created a **Cloudflare Hello World-only placeholder** under this exact isolated Worker name; public `workers.dev` exposure was demonstrated in an unauthenticated browser despite an attached Access policy, then owner disabled both production and preview URLs. The independent negative browser retest displays Cloudflare's 'There is nothing here yet' instead of Hello World. **Draft PR #106 code has NOT been deployed**, and no test schema, Stripe secret, signing key, or event replay was installed. Creation of the placeholder does not approve later code/schema changes.

## What was coded, and what it cannot do

- `src/isolated-deleted-user-webhook-test-worker.js`: valid HMAC SHA-256 Stripe-Signature with max 5-minute tolerance, `livemode=false`, optional `event.account` mismatch rejection, strict disposable database marker check, and direct call to the actual Draft #105 deleted-user disposition function.
- Endpoint: `POST /__hegeva/isolated/stripe-test-webhook`, no other route accepts webhooks. Valid signed TEST event for a verified synthetic deleted user may be recorded once as `outcome=ignored`. **No plan grant, Stripe customer synchronization, payment, referral, credit or outbox code is present.**
- A live synthetic user (no tombstone) or unrelated signed event yields 409 with no ledger write; unknown auth user fails closed with 503. Unsigned/wrongly signed/LIVE events cannot write.
- `wrangler.isolated-deleted-user-webhook-test.jsonc` pins exact account/DB. The feature is explicitly `HEGEVA_ISOLATED_STRIPE_TEST_ENABLED=false`, `workers_dev=false`, and `preview_urls=false`. Thus simply applying a DB schema would not create a live endpoint.
- `scripts/isolated-deleted-user-webhook-test-schema.sql` creates synthetic-only fixture versions of `"user"`, `user_plans`, `stripe_customers`, `stripe_webhook_events`, tombstone, triggers and a single immutable-in-practice identity marker. **Never run against the real application D1.** This is **not the Better Auth migration**.
- Offline tests sign event payloads with a **made-up local HMAC secret**; 200 replies in these tests prove only the source-code contract. They do not prove a real Stripe TEST endpoint was contacted, nor real Better Auth deletion or Cloudflare D1 eventual ordering.

## Strict STOP-gated remote sequence for a later owner authorization

1. Review Draft PR, all tests, Wrangler compile check, SQL, and account/DB IDs. Require green and no unexpected network interactions. Keep PR Draft, never merge to production or shared-staging branch.
2. Capture a **new current Time Travel bookmark** for exactly this disposable D1, because the earlier pre-probe bookmark predates a restore and should not be reused as a blanket rollback point. Save privately; prove backup/restore path. Do not print bookmark to CI/GitHub/chat.
3. **Cloudflare permissions must be reviewed before creating any token.** Cloudflare's 2026 Workers roles require **Workers product Admin** to create a *new* Worker, since a nonexistent Worker cannot yet receive an Individual Worker role. Perform any creation manually from the **synthetic account only**, then use a new **Individual Worker Editor** token for subsequent code deployments; never grant product-wide Workers Admin to CI or agents. Direct remote D1 queries/schema changes need separate **D1 Write/Edit** (Cloudflare API scopes vary); verify in the token UI whether that permission can be limited to only this disposable D1. **If not, STOP** and use the owner-controlled disposable D1 Console under the already verified separate account rather than adding broad D1 write authority to CI. Cloudflare's D1 export may also require D1 Write because export locks the database; don't assume an export is a read-only permission operation. Never reuse any production/shared-staging credential.
   References: https://developers.cloudflare.com/workers/authorization/workers/ ; https://developers.cloudflare.com/fundamentals/api/reference/permissions/ ; https://developers.cloudflare.com/d1/observability/debug-d1/ .
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

## 2026-11-13 code security follow-up

- Fixed a draft-only configuration hole: `scopedToDisposableDatabase()` now requires `STRIPE_TEST_ACCOUNT_ID` to equal the exact expected TEST Sandbox account, not merely any supplied environment value. This matters because direct Stripe event payloads may omit `event.account`.
- Added synthetic negative tests for wrong/absent TEST Sandbox config, plus static isolation checks against production/shared staging/older Cron DB UUIDs and the main Cloudflare account. The D1 binding marker is verified before any webhook ledger mutation.
- **Meaning of this gate:** The env variable and signing secret still do **not** independently prove ownership of Stripe TEST customer/subscription identities or official endpoint signing key provenance. Confirm those separately; the test Worker deliberately cannot grant entitlements.

## Containment and Cloudflare policy caution — 2026-11-13, 17:52 GMT

- An unauthenticated Chrome incognito request returned stock `Hello World!` despite Cloudflare's post-deployment Worker Access UI showing **All traffic / Cloudflare account members Allow**. Treat this as a **real Access protection failure for that request**, not successful access enforcement. Do not infer cause without deeper analysis (policy propagation, URL scope, session, or an unrelated issue).
- Owner manually disabled **both** production and preview `workers.dev` hostname toggles for the **isolated Worker only**; no custom domains/routes existed. A second browser request to the original URL displayed `There is nothing here yet`, demonstrating that the original public entry point stopped serving the Worker. This is *containment of a public route*, not a proof that Access enforcement itself is fixed.
- Reviewed official Cloudflare configuration: `workers_dev=false` prevents re-enabling production `workers.dev` on Wrangler upload; preview URL toggles are independent when explicitly set. Therefore Draft #106 now pins **both** `workers_dev=false` and **`preview_urls=false`**, with static CI regression.
- Official references: https://developers.cloudflare.com/workers/configuration/routing/workers-dev/ and https://developers.cloudflare.com/workers/wrangler/configuration/ .
- Do not re-enable either Worker URL as part of deploying PR #106. Even with an isolated TEST webhook secret and valid HMAC checks, **real Stripe delivery would require a separate explicitly scoped public route/access decision and approval**. Until then no remote webhooks may be sent to this Worker.
- Existing **HEGEVA Synthetic Cron CI** token is entire-account scope for Workers Scripts Write and D1 Write, expires 2026-11-15. Do not reuse; now that isolated Worker exists, create *new* Individual Worker **Editor** token only for `hegeva-isolated-deleted-user-webhook-test`; **do not add D1 Write, other Workers, or main Cloudflare account**. A direct schema change, if approved, must be done via the owner-controlled exact D1 Console with a new pre-change bookmark, not CI.
