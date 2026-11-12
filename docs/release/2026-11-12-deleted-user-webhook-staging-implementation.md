# HEGEVA AI — deleted-user Stripe TEST webhook guard: staged implementation proposal

**Status:** DRAFT; not deployed; no D1 schema migration; no production changes. Master state: Issue #102. Parent proposals: PR #103 and #104.

## Implemented in this isolated branch

- `src/stripe-deleted-user-webhook-disposition.js` provides a durable, idempotent ledger disposition **only for a signed, mode-validated webhook when an actual auth-user deletion tombstone exists**. The insert is a single conditional SQL statement that checks the tombstone and absence of a live user; `eventId` uniqueness prevents duplicate records. Existing `applied` events remain `applied` if replayed after deletion. A missing or inconsistent ledger record is a failure, not an acknowledgment.
- `src/index-ledger.js` calls the guard **after verifying webhook signature and TEST/livemode** but **before claim, identity synchronization or legacy entitlement writes**. The guard is **disabled by default** and executes only when `HEGEVA_DELETED_USER_WEBHOOK_GUARD_ENABLED=true`, `PAYMENT_MODE=test`, and `PUBLIC_APP_URL=https://staging.hegevaai.co.uk`. It refuses production/live contexts. Missing schema or audit failures produce HTTP 503 with Retry-After (not a false 2xx).
- Revised proposal `docs/release/2026-11-11-staging-orphan-plan-guards.sql`: an account-deletion trigger records `hegeva_deleted_user_tombstones` and removes only the deleted user's `user_plans` row. Further fail-closed INSERT/UPDATE guards protect both `user_plans` and `stripe_customers` from writes **after** auth deletion. Billing ledger and existing Stripe customer mappings are intentionally preserved for review/audit, not silently destroyed.
- `scripts/stripe-deleted-user-webhook-disposition-test.mjs` tests the **actual helper and proposed SQL**, not just an abstract transaction model. It checks duplicate/concurrent replay, pre-applied event preservation, unknown identity, identifier collision, invalid context and missing schema, account deletion semantics, and prohibiting late billing identity writes.

## What is NOT proved or safe for deployment

1. The SQL is a **documented proposal, not a migration**. No Cloudflare D1 schema or data has been changed. Existing historical orphan `BNdcMt1H` is not backfilled or cleaned. A trigger only creates tombstones for deletions that happen *after* migration.
2. The protection is not a general transactional rewrite of all existing `checkout.session.completed`, `invoice.paid`, multi-subscription billing and outbox paths. Events for an **existing user**, or a removed user with **no tombstone** (including historical deleted accounts), still follow the old handler; the proposed D1 fail-closed triggers protect late orphan plan/customer writes, but cross-statement atomicity on those paths is not demonstrated.
3. Exact Stripe TEST account identity and verified user metadata remain required. Main HEGEVA TEST and the separate HEGEVA Sandbox must never be coalesced into a single subscription inventory. Signature verification alone does not prove customer/user mapping integrity.
4. The tombstone stores an immutable user ID to support replay checks; GDPR/retention policy and eventual safe purge require legal/privacy review before any real rollout.
5. D1 concurrency, worker binding, account-deletion trigger semantics, real signed-webhook E2E, rollback/restore, referral/outbox and cancellation race acceptance **remain unverified remotely**.
6. Deployment is prohibited until **separate explicit owner approval** after staging-only snapshot/backup, rollback proof, scoped permissions and isolated signed TEST acceptance. Do not merge into production or enable the feature on LIVE.

## Offline verification

```sh
node --check src/index-ledger.js
node --test scripts/staging-orphan-plan-guards-test.mjs scripts/stripe-deleted-user-transaction-model-test.mjs scripts/stripe-deleted-user-webhook-disposition-test.mjs
```

The GitHub workflow `.github/workflows/staging-deleted-user-webhook-guard-ci.yml` runs these tests **without Stripe/Cloudflare secrets, migration or deploy**. A green result is only *offline implementation evidence*, never release readiness.

**Release:** `releaseSafe=false` — NOT READY.
