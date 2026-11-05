# HEGEVA AI V3 — Production Readiness Report

Date: 2026-11-05  
Decision: **NOT READY — STOP BEFORE MERGE OR DEPLOY**

## Safety boundary

This branch is based on PR #94 commit `233e6e2510507be7c2b913859f33257e37cb9476`. After explicit owner authorization, staging D1 migration `0032` and cleanup of the 4 Sandbox-origin billing identity rows were performed. The owner completed one main-account TEST Checkout (£14.99; `livemode=false`). With separate authorization, a TEST event destination was configured for the staging webhook, the staging signing secret was updated, and staging Worker version `4d125e76` was promoted to 100% traffic. The existing Checkout event was resent once to that endpoint; Stripe reports `200 OK` / Delivered, and D1 records `checkout.session.completed` as `applied`, with Premium entitlement and one Stripe customer mapping. No new payment, production D1 change, production deployment, or merge occurred.

## Evidence

| Area | Status | Evidence |
|---|---|---|
| Isolated clone and branch | PASS | `codex/production-readiness-20261105`, HEAD verified at the requested #94 commit before changes |
| Required #94 files | PASS | Entitlement, subscription inventory, terminal outbox, processor, runner, referral, billing identity, migration 0032 and tests present |
| Checkout-lock CAS | PASS | Local CAS regression; owned token and observed-version predicates; no whole-file replacement |
| Stripe entitlement/reconciliation regressions | PASS | Multi-subscription policy, inventory, event review and billing identity CAS tests |
| Outbox atomicity/retry/monitoring regressions | PASS | SQLite atomic, processor, runner, state verifier/checker and health tests |
| Referral safety regressions | PASS | Atomic reversal and integrated mocked outbox referral tests |
| Worker check | PASS | `npm run worker:check`, exit 0; 17 assistant-response subtests passed |
| GitHub CI at verified #94 commit | PASS | [workflow run 41954016538](https://github.com/hegezotya-cmyk/hegeva-ai-v3/actions/runs/41954016538), policy-tests success |
| GitHub CI at PR #95 head | PASS | [workflow run 41956313645](https://github.com/hegezotya-cmyk/hegeva-ai-v3/actions/runs/41956313645), policy-tests success |
| Cloudflare DNS/HTTPS diagnosis | PASS | External read-only diagnostics resolved `api.cloudflare.com` and received HTTP 301; the earlier failure was local sandbox DNS/log-write restriction, not endpoint outage |
| Wrangler identity and account access | PASS | Read-only `wrangler whoami` succeeded; token scopes were displayed without token values |
| Real staging D1 read-only verification | PASS | Remote migration listing and aggregate/schema queries succeeded; `rows_written=0`, `changes=0` |
| Staging D1 migration state | PASS (STAGING ONLY) | After explicit owner authorization, the exact `0032_stripe_terminal_effect_outbox.sql` DDL was applied in Cloudflare D1 Console. Read-only verification confirms the outbox table and index exist and migration `0032` is recorded once. No Worker deployment occurred. |
| Staging D1 billing snapshot | PASS (POST-WEBHOOK) | After the authorized cleanup, the successful resent TEST webhook added one `stripe_customers` row and one `premium` plan; 3 unrelated `basic` plans remain. Read-only counts: 1 customer mapping, 19 webhook-ledger rows, 0 outbox rows, and migration `0032` remains present. No user rows were deleted. |
| Separate Stripe sandbox inventory | NOT TARGET | Read-only Dashboard view of the separate `Hegevaai sandbox` shows 6 subscriptions in `All`: 5 active and 1 cancelled. This is contextual evidence only; these records were not joined to staging D1 and are excluded from the main-account TEST reconciliation. |
| Local private exact-identity comparison regression | PASS | New offline comparison function checks full subscription/customer/user mapping and statuses with synthetic fixtures including 5 active subscriptions across 4 users, multiple Customer IDs, and identity mismatch cases. CI run [41960361225](https://github.com/hegezotya-cmyk/hegeva-ai-v3/actions/runs/41960361225) PASS. No real D1 identifiers accessed by this check. |
| Private staging D1 ↔ Stripe TEST local read-only runner | PASS (isolated) | Added opt-in `scripts/stripe-staging-private-reconcile.mjs` (default dry-run) and injected-reader regression tests; no raw customer/user/subscription IDs printed. Requires dedicated restricted `rk_test_` key and authorized staging D1 READ credentials. No real joint execution was performed. |
| Precise Stripe TEST ↔ staging D1 record matching | PARTIAL | In-memory comparison confirmed the single current staging D1 customer/subscription pair matches the main Hegevaai TEST subscription inventory returned by Stripe Shell; D1 status is active. Stripe's delivered webhook response also confirms `verified=true`, `userMapped=true`, `entitlementChanged=true`, and `resultingPlan=premium`. The complete private paginated reconciliation runner was not rerun with a locally available restricted key, so the all-record release-safe reconciliation is not claimed. | 
| Stripe TEST full customer journey | PARTIAL (CHECKOUT→WEBHOOK→ENTITLEMENT) | The original £14.99/month TEST Checkout was resent once to the staging-only endpoint, with no second payment. Stripe shows 200 OK / Delivered; the response says signature verified, user mapped, and Premium entitlement changed. D1 now has one customer mapping and a new `checkout.session.completed` ledger row with outcome `applied`; its plan is Premium. This proves the checkout→signed webhook→entitlement path for this account. Duplicate delivery, cancellation, referral side effects, and the full all-subscription exact reconciliation remain unverified. |
| Stripe TEST recent Events read | PARTIAL | Dashboard read confirms the specific completed Checkout, created subscription, and successful £14.99 payment events in TEST mode (`livemode=false`). This is event-level evidence for the latest checkout, not an exhaustive account event audit. | 
| Private reconciliation dry-run | PASS | `node scripts/stripe-staging-private-reconcile.mjs` completed with the documented no-remote-read dry-run message. |
| Private orchestration regression (local) | PASS | Ran the PR-head files in an isolated temporary directory: syntax checks passed, `scripts/stripe-staging-private-reconciliation-test.mjs` passed offline synthetic fixtures, and CLI dry-run passed. No remote reads, secrets, D1 writes, or Stripe writes. |
| Staging account diagnostic key handling | PASS | `scripts/stripe-staging-account-config-diagnostic.mjs` accepts a process-scoped TEST key for GET-only account and price checks, including `STRIPE_TEST_SECRET_KEY`; it never reads the Worker secret. Syntax and mocked account-403/price lookup tests pass. No key value was read, printed, or persisted. |
| Account-read 403 fallback regression | PASS (synthetic) | Mocked `GET /v1/account` 403 while five TEST price GETs succeeded. Updated diagnostic proceeded, reported `accountReadStatus=BLOCKED`, `priceCheck=PASS`, and overall `REVIEW_REQUIRED`; no real network or key used. |
| Exact D1-Stripe runner with standard TEST key | PASS (synthetic) | Updated `scripts/stripe-staging-private-reconcile.mjs` accepts `sk_test_` in process for Stripe GETs plus fixed D1 SELECT; removes all Stripe key variables from the Wrangler child environment. Node syntax and mocked end-to-end D1/Stripe matching PASS; no real remote data used. |
| Primary-account TEST guard | PASS (synthetic) | Account diagnostic now requires the known main Hegevaai TEST account ID and all five configured TEST prices. Mocked primary account returned PASS; mocked separate Sandbox returned `REVIEW_REQUIRED` / `unexpected-test-account` and exit 2, blocking the D1 join. |
| Private reconciliation execute gate | BLOCKED | `node scripts/stripe-staging-private-reconcile.mjs --execute` failed closed before any remote read with `stripe-test-readonly-key-unavailable`; no `STRIPE_TEST_READONLY_KEY` was available locally. |
| Current exact four-to-five record join | BLOCKED | The newly fetched runner was not allowed to contact Stripe without the restricted key; no exact D1-to-Stripe join is claimed. |
| Earlier executed private reconciliation | REVIEW_REQUIRED (prior key scope) | Owner-local run under the prior restricted key returned 4 D1 identities versus 1 Stripe subscription, 0 matches, 4 unmatched identities, and `releaseSafe=false`. Account context was not established; do not treat this as the final main-account TEST join. The run used fixed D1 SELECTs and Stripe GETs; no writes. |
| Main-account TEST D1 ↔ Stripe reconciliation | REVIEW_REQUIRED (AFTER CHECKOUT) | The earlier owner-local run found one unrepresented active main-account TEST subscription. The newly completed checkout created another subscription, but its webhook did not add a D1 identity: `stripe_customers=0`, webhook ledger remains at 18 rows, and the account stays Basic with `entitlement_pending`. The exact reconciliation therefore remains unsafe; no manual identity row was fabricated. |
| Staging Worker source vs deployed price config | PASS (price vars) | PR config and Cloudflare staging runtime expose the same five main Hegevaai TEST price IDs. After the webhook-secret update, active staging version `4d125e76` is Ready at 100% traffic. The encrypted Stripe API key remains unreadable. |
| Revoked Sandbox key repository check | PARTIAL | PR #95 source reads Stripe credentials from `env.STRIPE_SECRET_KEY`; staging Wrangler config contains no literal `sk_test_`, `sk_live_`, or `rk_test_` credential and no `STRIPE_SECRET_KEY` value. Cloudflare Worker secret contents are not accessible here, so whether the exact revoked key had been configured remotely cannot be determined. |
| Staging Worker Stripe account identity | PASS (runtime evidence) | The staging Worker successfully created a Checkout using the configured main Hegevaai TEST price, Stripe recorded that Checkout in the main account with `livemode=false`, and the main-account event was accepted by the staging webhook with a verified signature. Together with the owner-local account/price diagnostic, this establishes the Worker is operating against the intended main TEST account without reading or exposing its encrypted secret. |
| Staging Worker Stripe key status | REVIEW_REQUIRED | Cloudflare still stores `STRIPE_SECRET_KEY` encrypted and its value/account cannot be read. The webhook signing secret was updated under owner authorization, but that does not prove which Stripe account the Worker API key uses. |
| Local restricted-key environment identity | REVIEW_REQUIRED | Codex has no local `STRIPE_TEST_READONLY_KEY`; owner-local diagnostic returned HTTP 403 from `GET /v1/account` under its restricted key. No account ID was emitted; no key value was shared. |
| Main TEST mode vs separate sandbox separation | PASS | Owner clarified the target is the main Hegevaai account in TEST mode. The separate sandbox is excluded from target-account subscription, price, and D1 reconciliation evidence; no customer records are joined across accounts. |
| Owner-reported five active TEST subscriptions | REVIEW_REQUIRED | The latest GET-only inventory under the verified main-account TEST key returned 1 subscription (1 active), and the Stripe Dashboard's Hegevaai / Test mode `All` subscriptions view also shows 1 item. The earlier five-subscription count is not confirmed for this account; do not mix it with the separate Sandbox. |
| Main Hegevaai TEST catalogue and PR config | PASS | Read-only check verified Premium `price_1UDa3fHECF9iDE3lyFzhEB3T` (£14.99/month) and Pro `price_1UDa46HECF9iDE3lrC8m8Xge` (£29.99/month). At the owner's explicit request, added three one-time TEST products: Small `price_1UYJpOHECF9iDE3lOMUbVNwb` (£1.99 / 100 credits), Medium `price_1UYJqYHECF9iDE3lta3DI13x` (£3.99 / 300 credits), Large `price_1UYJr9HECF9iDE3lxVxs0DuS` (£7.99 / 1,000 credits). PR config now matches the main TEST account. No live-mode items, payments, subscriptions, D1 writes, or deployments occurred. |
| Cloudflare staging runtime price variables | PASS | Read-only post-deployment inspection confirms all five active Worker variables match the main Hegevaai TEST catalogue. Active version `f7795129` is Ready with 100% traffic. |
| Stripe user-identity mapping code path | PASS (source review) | Checkout writes authenticated userId metadata to the session and subscription; the webhook reads it and persists the Stripe/customer mapping. Exact cross-account comparison proved the 4 prior D1 rows were Sandbox data; those rows were removed from the main-TEST staging snapshot. The main-account active subscription still has no D1 mapping. |
| Owner context on four D1 identities | VERIFIED | Owner said these were their own TEST subscription attempts and suspected a separate context. A privacy-preserving exact join now confirms that all 4 D1 rows match Sandbox subscriptions by userId, Stripe Customer ID, and Subscription ID. They are not records from the configured main Hegevaai TEST target. |
| Separate Sandbox API and D1 cross-check | PASS (SANDBOX ONLY) | Stripe API returned 5 active TEST subscriptions, each with userId metadata. An in-memory comparison using ephemeral hashes matched all 4 D1 identity rows to Sandbox subscriptions on userId, Customer ID, and Subscription ID; no raw identifiers were included in the report or committed; only aggregate match counts are retained. The fifth active Sandbox subscription has a userId represented in D1 but no matching D1 Customer ID or Subscription ID row. The API `status=canceled` query returned 0 while the earlier Dashboard All view showed 1 cancelled subscription; this discrepancy is outside the 4-row exact join. Sandbox remains NOT TARGET. |
| Latest owner-local account and price diagnostic | PASS | Fresh owner-local diagnostic verified the expected main TEST account and all five configured prices (HTTP 200; `livemode:false`). No key value was printed or persisted; Worker secret remains unread. 
| Latest owner-local exact D1–Stripe reconciliation | REVIEW_REQUIRED | Immediately following the account/price check, fixed staging D1 SELECTs and Stripe TEST subscription GETs returned 4 D1 identities, 1 Stripe subscription (1 active), 0 matches, 4 unmatched D1 identities, and 1 unrepresented active subscription; `releaseSafe=false`. No raw identifiers were printed or persisted. |
| Exact staging D1 ↔ Stripe reconciliation | REVIEW_REQUIRED (POST-WEBHOOK) | The latest active main-account TEST subscription now has a matching staging D1 customer/subscription row, verified in memory. The complete private runner and full paginated inventory comparison were not rerun, so `releaseSafe=true` is not established. No Stripe write was performed. |
| PR #95 staging API deploy gate | PASS | Workflow run [41981516924](https://github.com/hegezotya-cmyk/hegeva-ai-v3/actions/runs/41981516924) completed `check` and staging preflight successfully after the owner-authorized branch allowlist update. The earlier run [41980885217](https://github.com/hegezotya-cmyk/hegeva-ai-v3/actions/runs/41980885217) was blocked before build/deploy. |
| Staging price-variable rollout | PASS | After the API code release, Cloudflare staging Worker version `f7795129` is `Ready` at 100% traffic. All five runtime TEST price variables still match the main Hegevaai TEST catalogue; `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` remain encrypted and were not changed. |
| Staging API deployment approval gate | PASS | With the owner's explicit approval, `codex/production-readiness-20261105` was added as a single branch rule to the GitHub `staging` environment allowlist; the rule persisted after reload. No other environment protections or secrets were changed. |
| Staging API release and smoke test | PASS | Workflow run [41981822471](https://github.com/hegezotya-cmyk/hegeva-ai-v3/actions/runs/41981822471) `deploy-api-no-migrate` succeeded: staging API deploy and staging smoke test passed. The workflow did not run `staging:db:migrate`; no D1 migration/write occurred. Cloudflare shows active version `f7795129`, Ready with 100% traffic. 
| Latest PR #95 head CI | PASS | GitHub Actions run [41984552926](https://github.com/hegezotya-cmyk/hegeva-ai-v3/actions/runs/41984552926), Stripe Multi-Subscription Policy PR Checks, completed successfully for head `82f78cb14414ab262ff8a2574699bcdf25808a84`. This does not clear the live staging reconciliation blocker. |
| Production deploy readiness | FAIL | The latest checkout-to-entitlement path now passes in staging TEST. Production remains NOT READY because the staging Worker's encrypted Stripe API key cannot be verified against the target account and the complete all-record D1↔Stripe reconciliation, duplicate/cancellation behavior, and release-safe result are still unproven. No production merge or deployment occurred. |

## Local change

The checkout guard was ported as a focused diff into `src/index.js`, adding active-subscription blocking, token/version CAS acquisition, and owner-scoped provider-failure cleanup. The existing PR #94 file contents and prior changes were preserved.

## Latest local verification

- PASS: commit `c588d09` replaces the fragile Windows `execFileSync` D1 reader with `spawnSync`, explicit process-status checks, and JSON-shape validation.
- PASS: offline private reconciliation and syntax tests.
- BLOCKED: full private D1-to-Stripe reconciliation was not rerun in this Codex PTY because the hidden Stripe-key prompt cannot receive a secret here. No real Stripe key was used or persisted.

## Latest reconciliation evidence

- PASS: Aggregate read-only staging D1 query returned 1 active `stripe_customers` row, 1 Customer, 1 subscription, 4 users, 4 plans, and 19 webhook-ledger rows; `changes=0` and `rows_written=0`.
- REVIEW_REQUIRED: owner-local private reconciliation returned 2 active Stripe TEST subscriptions and 2 mapped Stripe users against 1 D1 identity: 1 stored identity matched, 1 active Stripe subscription was unrepresented, and `releaseSafe=false`.
- BLOCKED: no automatic D1 identity creation, Stripe Customer merge, subscription cancellation, or mapping repair is permitted. The unrepresented record must first be classified as stale/legitimate TEST data, wrong-account data, or an authorized missing identity.

## Current masked discrepancy review

- PASS: Read-only D1 identity query returned one active mapping (`user=Cy3n…FTTe`, `customer=cus_VZdV…mCN2`, `subscription=sub_1UYU…VTxi`, no period-end cancellation) with no raw identifiers exported.
- PASS: The latest `checkout.session.completed` ledger row for the same masked user is `premium`/`applied`, supporting one valid current staging path.
- REVIEW_REQUIRED: Other recent ledger rows belong to a different masked user and include `invoice.paid`/`customer.subscription.updated`; they are historical context, not proof that the current D1 identity represents both active Stripe subscriptions.
- UNKNOWN/BLOCKED: The two active Stripe subscription objects, their masked creation dates, and the account ID used by the reconciliation cannot be independently re-read in this process without the separate Stripe TEST read-only key. Therefore the unmatched subscription cannot yet be classified as wrong-account, legitimate test, stale/orphan, or missing identity mapping.
- Owner action: run the exact paginated Stripe TEST GET inventory with the restricted key and provide only aggregate/masked output including account ID, subscription count, masked subscription/customer/user IDs, creation dates, status, and metadata user mapping. No key or raw identifiers are required in chat.

## Rollback

Do not merge or deploy this branch. Revert the local commit or delete the isolated clone only after preserving the diff for review. If later promoted under separate approval, disable the executor, preserve ledger/outbox rows, revert the application commit, and restore the approved staging backup before any production repair.

## Required owner action

Review the draft PR and separately authorize any future staging migration, staging deployment, production deployment, or merge. This report must not be interpreted as deployment approval.

## Independent review addendum — 2026-11-05

- Reviewed PR #95 repository commit `acced270e6585c0e64fe9c4555925e3204c7fca5` and its release report. The supplied owner-local aggregate reconciliation is `verified=true`, `status=REVIEW_REQUIRED`, `releaseSafe=false`: two active TEST subscriptions, two mapped Stripe users, one matching D1 identity, one unrepresented active subscription, and no status disagreement.
- The intended Stripe target is the **main Hegevaai account in TEST mode**; the separately connected Hegevaai sandbox account must not be joined to staging D1. Repo `scripts/stripe-staging-account-config-diagnostic.mjs` pins the expected main account, and prior report records a successful owner-local account/price diagnostic. No fresh Worker secret or runtime account assertion was obtained in this review.
- Current available Stripe connector exposes main Hegevaai in live mode and the separately created sandbox in test mode; this review did **not** read the main account's TEST subscription inventory or a live staging D1 SELECT. Consequently subscription/customer/user masked per-record details, creation dates and metadata cannot be independently verified here. **Classification: UNKNOWN** (possible legitimate/stale TEST subscription or missing identity). No source evidence proves a code defect, wrong-account condition, or authorization for repair.
- To close: perform a fresh local restricted-key TEST account/price check; then a GET-only, fully paginated main-account TEST inventory and fixed staging D1 SELECT join, with a locally generated masked two-record comparison and webhook-ledger provenance. Keep raw IDs, metadata user IDs, personal data and secrets out of logs/PR. Obtain explicit owner classification before proposing an identity repair or a rollback. No D1/Stripe mutations, secret changes, merge or deployment authorized by this addendum.
- Release decision remains **NOT READY**; reconciliation **REVIEW_REQUIRED**; `releaseSafe=false`. Additional duplicate/cancellation and full customer-journey gates remain as documented above.

## Final focused verification — PR #95 head `04aab62`

- PASS: clean checkout was fast-forwarded to the PR head without local changes or force operations.
- PASS: offline private reconciliation fixture, offline identity comparison fixture, affected-module syntax checks, and `npm run worker:check` completed successfully; worker check reported 17/17 assistant-response subtests passing.
- PASS: GitHub `policy-tests` for this exact head completed successfully: run `42084849144`, job `127447070134`.
- BLOCKED: no new live Stripe TEST inventory or staging D1 join was performed in this process because the restricted key is not available to the process. The owner-local aggregate remains the only evidence for the second active subscription.
- Final gate remains **NOT READY** / `releaseSafe=false`; no code defect was reproduced and no data repair was executed.

## Owner-confirmed CI and current access gate

- PASS: owner confirmed GitHub `policy-tests` run `42085885192` succeeded for the PR #95 update.
- BLOCKED: the current local process has no `STRIPE_TEST_READONLY_KEY` or `STRIPE_TEST_SECRET_KEY` in process, user, or machine environment. Presence was checked without reading or printing any value.
- BLOCKED: consequently, the requested fresh main-Hegevaai TEST `GET /v1/account` and fully paginated `GET /v1/subscriptions?status=all&limit=100` comparison cannot be performed in this process. No sandbox data is used as a substitute.
- Required owner action: run the existing read-only diagnostic locally with the restricted key available only to that process, then retain only masked subscription/customer/user identifiers, creation dates, statuses, metadata-userId presence, D1 match, webhook-ledger match, account identity and pagination result. No key value is required in chat.
- The second subscription remains **UNKNOWN** pending that evidence; no Stripe or D1 repair is authorized. Final status remains **NOT READY**, `releaseSafe=false`.

## Focused masked subscription diagnostic — post `70d6c2d`

- PASS: added `scripts/stripe-staging-subscription-diagnostic.mjs`, a Windows-safe read-only diagnostic. It validates TEST mode, reads `/v1/account`, retrieves `/v1/subscriptions` with `status=all`, `limit=100`, and `starting_after` pagination, and performs only staging D1 SELECTs.
- PASS: raw Stripe/D1 identifiers remain process-local; output is limited to masked subscription/customer/user values, creation time, status, metadata-userId presence, exact D1 match, and applied/reconciled webhook-ledger evidence. Secrets, email and full identifiers are never printed.
- PASS: classification is evidence-based: wrong-account requires account mismatch; missing-identity-mapping requires metadata userId plus D1/ledger evidence; otherwise the result remains UNKNOWN. No record is created, deleted, merged, cancelled, or repaired automatically.
- PASS: syntax and fail-closed no-key checks completed locally; the no-key run returned only `stripe-test-readonly-key-unavailable`.
- REVIEW_REQUIRED: owner-local aggregate still proves 2 active TEST subscriptions, 1 exact D1 identity match, 1 unrepresented active subscription and 1 Stripe user without D1 identity. Per-subscription masked dates/metadata/ledger evidence have not been captured in this process.
- Required owner action: run the new diagnostic in the existing PowerShell process where the restricted TEST key is already available, then retain only its masked JSON output. If it proves a missing identity, obtain approval before any idempotent D1 repair; if it proves stale/orphan data, document an exclusion rule without weakening the release gate or deleting data.
- Proposed repair/rollback only (not executed): insert/update the exact identity under a uniqueness guard and pre-change snapshot; rollback by restoring the prior row from that snapshot, with no Stripe mutation. Owner approval is required before either action.
- Final status remains **NOT READY**, `releaseSafe=false`.

## Owner-local automatic identity-proof result

- PASS: owner-local run verified the main TEST account identity, TEST mode and complete subscription pagination.
- BLOCKED: the exact historical reference (`sub_1UDB…21gr`, `cus_VLE3…4xHA`, `2026-09-02T02:50:39.000Z`) produced `candidateCount=0` in that main-account inventory. No approval prompt was shown and no tuple was accepted.
- Interpretation: this proves only that the reference is absent from the specific read-only inventory returned by the verified account at run time. It does not prove deletion, wrong account or a Stripe/D1 data defect. No data was changed.
- Fix: the diagnostic now reports only a masked active TEST inventory summary when the reference is absent or ambiguous, so the next owner run can distinguish a stale reference/account-context mismatch without manual ID entry or raw data exposure.
- Final status remains **NOT READY**, `releaseSafe=false`.

## Automatic historical identity proof

- PASS: added `scripts/stripe-staging-historical-auto-proof.mjs`; it requires no manual subscription/customer/user ID entry. It reads the main TEST account and five configured TEST Prices, retrieves the complete paginated TEST subscription inventory, and selects exactly one active record by the owner-supplied masked subscription/customer reference and exact creation timestamp.
- PASS: the selected record's full account/subscription/customer/user/createdAt tuple remains memory-only. The local owner attestation occurs only after the unique candidate is found; output contains only booleans and masked record fields.
- PASS: zero candidates, multiple candidates, missing metadata userId, wrong account, live mode, non-TEST mode and incomplete pagination fail closed. The raw reconciliation is not filtered.
- PASS: static safety, syntax and no-key fail-closed checks completed without network or secrets.
- BLOCKED: this Codex process cannot run the owner PowerShell restricted-key flow, so `historicalExceptionExactMatch=true` is not claimed here. No staging acceptance deployment or data-changing test was started.
- Final status remains **NOT READY**, `releaseSafe=false`.

## Final historical TEST identity-proof tool

- PASS: added `scripts/stripe-staging-historical-identity-proof.mjs`. It performs TEST-only Stripe GETs for `/v1/account`, all five configured Prices, and fully paginated subscriptions; the owner-approved full tuple is supplied only as process-scoped runtime input.
- PASS: the tool compares exact internal `accountId + subscriptionId + customerId + userId + createdAt`, requires `livemode=false`, active status, explicit `APPROVE-HISTORICAL-TEST` attestation and complete pagination, and emits only `exactMatch`, verification booleans and masked record data.
- PASS: missing key, missing approval, incomplete tuple, unknown record, wrong account, live mode, incomplete pagination and mismatches fail closed.
- PASS: static safety/syntax checks completed locally without network or secrets; no tuple was written to a file, GitHub, report or log.
- BLOCKED: this Codex process cannot provide the owner’s full internal tuple or restricted key, so `historicalExceptionExactMatch=true` has not been claimed. The existing masked owner confirmation remains insufficient for machine approval.
- Final status remains **NOT READY**, `releaseSafe=false`.

## Final historical TEST resolution — cff4302 follow-up

- PASS: owner confirmation is recorded for the exact historical TEST record represented in the masked report (`2026-09-02`, not a real customer and not production data). The record remains unchanged.
- PASS: the raw reconciliation remains `unrepresentedActiveSubscriptions=1`; the historical policy is a separate evaluation layer and does not hide or delete the raw mismatch.
- PASS: exact-match-only exception policy and tests cover owner approval, account, TEST mode, subscription/customer/user/createdAt equality, customer/user mismatch, unknown subscription, multiple missing records, wrong account, live mode and incomplete/partial inventory. Every non-exact case fails closed.
- PASS: local signed webhook duplicate/terminal tests, multi-subscription entitlement, terminal review, outbox idempotency/retry/fencing/atomicity, referral reversal/integration and historical exception tests completed successfully.
- PASS: GitHub `policy-tests` for cff4302 succeeded: run `42091068721`, job `127468915029`.
- BLOCKED: real staging duplicate delivery, cancellation/entitlement restoration and complete customer-journey E2E are not re-run here because they require staging-side events/data changes. The outbox test explicitly reports no background processor/deployed migration, so that production gate is not PASS.
- Final status remains **NOT READY**, `releaseSafe=false`; no merge, deployment, D1/Stripe write, or secret change occurred.

## Final staging acceptance evidence — be5fe61

| Gate | Result | Evidence |
|---|---|---|
| be5fe61 GitHub CI | PASS | `policy-tests` success, run `42091630073`, job `127470860322`. |
| Historical TEST exception identity | BLOCKED | Owner classification is recorded, but the full internal account/subscription/customer/user/createdAt tuple is not stored in the report and was not independently re-read here. Masked confirmation alone cannot authorize the machine exception. |
| Raw reconciliation | REVIEW_REQUIRED | Raw mismatch remains 1 unrepresented active TEST subscription; no record was hidden or deleted. |
| Exception-evaluated reconciliation | BLOCKED | Exact runtime tuple and owner approval policy are implemented and tested, but no production/staging run supplied the full tuple to the evaluator. |
| Staging migration 0032 | PASS (read-only) | Wrangler reports `No migrations to apply`; no migration command was executed. |
| Staging tables | PASS (read-only) | `stripe_customers`, `stripe_webhook_events`, and `stripe_terminal_effect_outbox` exist; outbox count 0, webhook ledger count 19; all queries report `rows_written=0`. |
| Background outbox processor | BLOCKED | Source/config review shows `stripe-terminal-effects-outbox.js` is explicitly not wired to production/staging and no scheduled processor trigger is present. Local policy tests do not prove deployment. |
| Duplicate/cancellation/E2E | BLOCKED | Local signed webhook/terminal tests PASS, but real staging duplicate delivery, cancellation and entitlement restoration require a separate approved staging test plan and data-changing actions. |

### Isolated staging test plan (approval required)

Prepare disposable, owner-labelled TEST fixtures only; snapshot the relevant staging rows first; run one duplicate delivery and one terminal cancellation/restore scenario; assert ledger idempotency, entitlement restoration, outbox state and retry/monitoring; then verify aggregate counts read-only. No replay, subscription change, D1 write or deployment is authorized by this report. Rollback is fixture-specific restoration under separate approval, never a production repair.

Final acceptance remains **NOT READY**, `releaseSafe=false`.

## Historical TEST exception policy — owner-confirmed record

- PASS: owner confirmed the masked `sub_1UDB…21gr` / `cus_VLE3…4xHA` record created on `2026-09-02` is intentional historical TEST data, not a real customer or production data.
- PASS: added `docs/release/staging-historical-test-data-policy.md` and `src/stripe-staging-historical-test-exception.js`. The raw reconciliation remains unchanged and continues to report the one unrepresented active subscription.
- PASS: an exception is evaluated separately only from exact runtime internal `accountId + subscriptionId + customerId + userId + createdAt`, `livemode=false`, active status, and explicit owner approval. Masked IDs cannot authorize it.
- PASS: live mode, wrong account, altered customer/user/subscription, missing approval, unknown subscriptions, additional unmatched records and incomplete inventory remain blockers.
- PASS: the policy reports raw unmatched count, approved historical exception count, and remaining blocker count; it never deletes or hides records.
- PASS: historical exception policy regression suite covers exact approval, customer/user/subscription mismatch, unknown subscription, multiple missing records, wrong account and live mode; all fail closed except the exact approved TEST fixture.
- REVIEW_REQUIRED: owner confirmation classifies the record, but duplicate delivery, cancellation/entitlement restoration, full webhook E2E and other staging release gates remain unproven in this turn.
- Final status remains **NOT READY**, `releaseSafe=false`.

## Owner-local corrected diagnostic result

- PASS: the corrected Windows diagnostic completed with a valid main TEST account/price/pagination read and returned masked per-subscription details; no secret, email or full identifier was emitted.
- PASS: one active subscription has applied/reconciled webhook evidence (`checkout.session.completed` and `invoice.paid`) and is the represented path.
- REVIEW_REQUIRED: the second active subscription is masked as `sub_1UDB…21gr`, customer `cus_VLE3…4xHA`, user `aAJ0…ub7MI`; created `2026-09-02T02:50:39.000Z`, status `active`, TEST mode, metadata `userId` present, exact D1 match `false`, same-user/different-identity `false`, applied/reconciled ledger count `0`.
- Classification: **UNKNOWN**. The record is not proven stale/orphan, legitimate historical TEST data, wrong-account, or missing identity mapping. The absence of ledger evidence means no automatic identity repair is justified.
- Confirmed aggregate: `stripeActiveSubscriptions=2`, `unrepresentedActiveSubscriptions=1`, `stripeUsersWithoutD1Identity=1`, `releaseSafe=false`.
- Required owner decision: confirm whether the masked subscription is an intentionally retained historical TEST subscription. If yes, document the release policy without deleting or excluding it from the gate; if no, approve a separate idempotent D1 identity-repair plan only after ledger/account provenance is established. No repair was executed.

## Owner diagnostic follow-up — D1 schema probe

- Evidence: owner-local corrected diagnostic reached `d1-schema-read-failed`; no Stripe/D1 mutation occurred. The same two Wrangler PRAGMA calls were independently reproduced successfully with exit code 0 and valid schema rows, so the failure is not a demonstrated schema mismatch.
- Fix: the diagnostic now retries the two read-only PRAGMA probes once within the same run before returning `d1-schema-read-failed`, while preserving fail-closed behavior.
- PASS: syntax and the two affected offline reconciliation regressions pass after this fix.
- BLOCKED: no live Stripe subscription detail is claimed from this process. The owner must run the corrected commit `5741bb6` if detailed masked records are still required; `releaseSafe=false` remains unchanged.

## Follow-up diagnostic error isolation

- PASS: direct staging D1 `PRAGMA table_info(stripe_customers)` and `PRAGMA table_info(stripe_webhook_events)` succeeded with the required columns; no D1 schema mismatch was found and no rows were written.
- PASS: the diagnostic now distinguishes account HTTP 403, Stripe network/invalid-JSON failures, price-read failures, subscription-read failures, incomplete pagination, D1 schema-read failures, D1 schema mismatch and D1 reader failures. It never prints response bodies, secrets or raw identifiers.
- PASS: after the change, syntax, no-key fail-closed, private-reconciliation and identity-comparison checks passed locally.
- BLOCKED: the owner run that returned `read-only-diagnostic-failed` was from the pre-follow-up diagnostic behavior; the current process has no key, so no live Stripe request is claimed here. The next owner run must use the corrected commit and will return the concrete category if a read still fails.
- Final status remains **NOT READY**, `releaseSafe=false`.

## Targeted diagnostic fix — restricted-key 403, D1 schema and fail-closed gate

- PASS: `scripts/stripe-staging-subscription-diagnostic.mjs` now treats a restricted-key `GET /v1/account` HTTP 403 as a distinct `account-read-403` condition and continues only through the five configured TEST Price GETs. Account identity is PASS only when the account response matches the expected TEST account or the complete configured TEST price catalogue is verified; otherwise it remains BLOCKED.
- PASS: staging D1 is inspected first with read-only `PRAGMA table_info(...)`; only verified existing columns are queried. Schema, child-process, subscription, price and pagination failures return structured non-secret categories such as `d1-schema-mismatch`, `d1-reader-failed`, `stripe-subscription-read-failed` and `pagination-incomplete`.
- PASS: every active Stripe TEST subscription without an exact D1 user/customer/subscription tuple is counted as unrepresented, including `UNKNOWN` classifications. `releaseSafe` cannot become true from a partial two-record assumption.
- PASS: targeted syntax, no-key fail-closed, private reconciliation and identity-comparison regression tests completed locally.
- BLOCKED: the owner-provided aggregate still identifies one unrepresented active subscription, but the detailed diagnostic has not yet run in this process with the restricted key. No owner rerun of the old faulty script is requested; only the corrected command below is relevant.
- Final status remains **NOT READY**, `releaseSafe=false`.

## Owner confirmation — historical TEST subscription (2026-11-05)

Owner explicitly confirmed that the masked main-account TEST subscription `sub_1UDB…21gr` (customer `cus_VLE3…4xHA`, created 2026-09-02) is an **intentionally created historical TEST subscription**, is **not a real customer**, and is **not production data**. This is an owner-provided classification, not independent proof of Stripe provenance or a D1 match.

**Disposition:** retain the historical TEST subscription unchanged; do not cancel/delete it, invent a D1 identity, or silently exclude it from raw reconciliation. The underlying observed inventory remains 2 active TEST subscriptions and 1 matching D1 identity. The owner's classification resolves the human-origin uncertainty, but does not itself make an all-active-subscriptions exact-identity join PASS.

**Next targeted work:** implement/review a separately reported, explicit historical-TEST exception policy or test-data isolation approach with deterministic regression tests and evidence that production customer entitlements and billing identities cannot be masked by the exception. Preserve both raw mismatch counts and scoped release-policy outcome; default fail-closed for any unknown/unapproved subscription. Recheck other necessary release gates (duplicate/cancellation, end-to-end evidence) before production approval. Any D1/Stripe change or production merge/deploy requires separate owner approval.

**Current decision:** `releaseSafe=false`, **NOT READY** pending validated exception policy and other release gates. No billing/database mutation authorized.
