# HEGEVA AI — PR #89 remote staging acceptance & rollback gate
Date: 2026-11-04. Scope: business safety, customer conversion and separate remote staging.
Status: **NOT READY FOR PRODUCTION**. This file does not authorise staging activation, writes, email delivery, payments or merge.

## Exact source and already proven evidence

- Integration draft PR #89: `integration/security-growth-validation-20261104`, **candidate base/HEAD at time of this report** `125b7fa848ccc34db4b96ad7a86a8ac952abf767`; verify the current PR SHA again before any action.
- PR #89 combines security PR #86 and growth PR #88, retaining the stronger #86 Better Auth origin and registration-browser checks; #85's old campaign labels are retained in #88.
- Four integration CI suites completed SUCCESS on that exact candidate:
  - Growth privacy/UTM/Chromium and mocked signup: https://github.com/hegezotya-cmyk/hegeva-ai-v3/actions/runs/41904525379
  - Offline staging/Cloudflare build: https://github.com/hegezotya-cmyk/hegeva-ai-v3/actions/runs/41904525095
  - X20 security/dependency and mock signup: https://github.com/hegezotya-cmyk/hegeva-ai-v3/actions/runs/41904525146
  - Local D1, two signed Better Auth users and synthetic signed Stripe TEST webhook lifecycle: https://github.com/hegezotya-cmyk/hegeva-ai-v3/actions/runs/41904525254
- Read-only remote staging audit **of the already-deployed older runtime**, NOT this PR #89 candidate: https://github.com/hegezotya-cmyk/hegeva-ai-v3/actions/runs/41904525183 ; public billing reports test mode/Stripe selected/connected/checkout enabled/webhook configured; email recovery provider key present, not delivery; anonymous protected routes return HTTP 401, login and recovery pages render without writes.
- Last witnessed **staging-only** API deployment run #41873702151, commit `d19f6685e20b423478e9b763d15b036b66fb4c05`, API Worker version `3fdeef54-c692-425f-9408-40e0dcbffc2d` at ~17:05 UTC.
- Last witnessed **staging-only** UI deployment run #41874231822, commit `2f5f5e639996d1fcd209f17499e98f94c5121de5`, UI Worker version `d42743d3-d554-4314-9134-f1f0dd50848d` at ~17:09 UTC.
- Those Worker versions are **history from GitHub deploy logs, not an independently read current Cloudflare version-state**. Capture current Cloudflare versions before any staging change. No remote deploy of PR #89 is evidenced.
- Staging D1 migration ledger 31/31 was checked via owner-provided read-only Cloudflare screenshots on 2026-11-04 (Issue #83); count does not validate table structure or E2E persistence.

## Staging TEST billing configuration check (read-only)

- `wrangler.staging.jsonc` declares `PAYMENT_MODE=test` and five Stripe test-price ID strings (Premium, Pro, three Top-Ups).
- Against the connected **LIVE-only** Stripe account, read-only lookup of all five IDs returned *No such price* (2026-11-04). This is consistent with separation, **not proof that they exist in TEST mode**.
- Before permitting Stripe-hosted test checkout, an authorised person must switch to the correct Stripe **TEST/SANDBOX** environment and verify the five price IDs, active status, currency, amounts, recurring versus one-off types, and webhook endpoint + event subscriptions. Do not use a live key/price or a real card as a workaround. Never copy API keys into issues, code or chat.
- The public billing flags reflect configuration only, not actual Stripe-hosted checkout success.

## Remote staging acceptance matrix — currently BLOCKED / not executed on PR #89

| Gate | Required acceptance proof | Restrictions |
|---|---|---|
| Stage-0 deployment permission | Explicit owner consent to deploy the exact PR #89 commit to **staging only** with no D1 migration; screenshot/metadata of pre-existing staging UI/API Worker version + rollback plan | A generic "continue" is not permission; no production deploy |
| Stage-1 isolated account | Dedicated test-only inbox; staging signup with separate identity, actual verification email received and link used; sign in and sign out | No personal mailbox, production signup, fabricated "verified" URL, or leaked token |
| Stage-2 workspace tenant A | Create a synthetic customer, quote, invoice draft, task and unsent message draft; refresh and re-login; verify persisted associations | Only disposable staging records, no real customer data or sent messages |
| Stage-3 tenant B isolation | Second synthetic account cannot read, modify or learn account A's records; unauthenticated access is 401; logout revokes session | No cross-tenant user IDs in public logs; no production data |
| Stage-4 hosted Stripe TEST | Validate test prices; create a **TEST** checkout session for synthetic account; complete using Stripe's test card only; confirm signed webhook received and staged entitlement matches | No Stripe LIVE charges, real card, or production webhook |
| Stage-5 Stripe negative lifecycle | Duplicate webhook idempotency, failed payment, pending cancellation, completed cancellation/downgrade, stale event handling and replay protections; read staging entitlement after each | Use TEST-only events; don't force-write production D1 |
| Stage-6 privacy and attribution | From approved UTM Challenge campaign, consent denied has zero analytics, consent accepted has one event per milestone; signup/verify/payment distinguished; rejection stops subsequent analytics; no PII/query string; old Netlify referrer excluded precisely | No analytics identity leakage; successful local test is not production delivery proof |
| Stage-7 rollback and smoke | Record exact source commit/UI/API Worker version of deployment, HTTP/functional smoke, no schema drift; prove ability to revert UI and API individually to recorded versions if failure | No rollback action unless separately authorised |

## Safe execution order

1. **READ ONLY, no permission needed:** confirm exact current PR/CI SHA; latest successful staging public browser audit; owner-provided 31/31 staging migration ledger; obtain *metadata only* for actual current staging Worker versions and check whether staging API deployment token and sandbox credentials exist and are valid without exposing values. The 2026-11-04 staging preflight and uploads passed, but that does not certify all future token validity.
2. **STOP: ask explicit approval** for a staging-only deploy of the exact reviewed commit, no remote D1 migrations or production changes.
3. On approval: keep the existing current stage versions as rollback targets; deploy only staging using the protected staged workflow, with preflight, smoke and no production domain. If D1 migration is newly required, stop for a separate D1-impact review rather than silently migrating.
4. **STOP: obtain test-inbox and Stripe TEST-only access** through proper secure providers. Do not request raw passwords, verification tokens or API secrets in the chat.
5. Run staged auth/tenancy and Stripe-hosted TEST end-to-end; record redacted PASS/FAIL, screenshots or restricted CI artifact IDs; remove synthetic data under a separately authorised cleanup protocol.
6. Reconcile code, security advisory gate, conversion and billing paths, document rollback version IDs and actual release SHA. Only then request separate **production** owner approval. Do not merge to `v0-rebuild` before that approval: a push with `v0-app/**` may auto-deploy the production UI.

## Explicit blockers & decision

- **PASS**: local combined codebase safety, builds, isolated local data and Stripe webhook tests, and read-only checks of the *older deployed staging*.
- **UNKNOWN/BLOCKED**: PR #89 running remotely on staging; delivered verification email; actual Stripe TEST prices and hosted test Checkout/webhook; authenticated remote D1 persistence and cross-tenant isolation; confirmed current Worker-version metadata and rollback acceptance.
- **Production release decision: BLOCKED** until these are evidenced separately. Local CI cannot substitute for actual remote customer acceptance.

Related: Issues #83 and #87, draft PRs #85, #86, #88, #89.
