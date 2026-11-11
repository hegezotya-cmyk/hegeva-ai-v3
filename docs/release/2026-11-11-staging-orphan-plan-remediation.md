# HEGEVA staging: orphan Premium plan remediation proposal (NOT DEPLOYED)

**Owner checkpoint:** GitHub Issue #102. **Scope:** staging only. **Status:** DRAFT / REVIEW REQUIRED / releaseSafe=false.

## Verified evidence

- Two recent main HEGEVA Stripe TEST canceled subscriptions have Basic entitlement in staging D1; remote SELECT proved this, no retest needed.
- One staging user_plans Premium row has no auth user and no stripe_customers row; it has five historical webhook events, latest customer.subscription.deleted with outcome applied.
- A **different** Stripe TEST Sandbox has two subscriptions with the same full metadata user ID: one canceled at the exact second that the orphan row was last updated, and one still active. This Sandbox is NOT the main HEGEVA TEST account and must not be merged into its inventory.
- The owner confirms all records are historical HEGEVA testing, not external paying customers.

## Root cause and important caveat

The user_plans table has no FK or ON DELETE CASCADE to Better Auth "user"(id), unlike auth sessions and accounts. Deleting an auth user can therefore leave a stale Premium plan. The exact past deletion flow was not instrumented.

A canceled subscription **does not imply Basic** when the same user has another verified active subscription. Do not revoke paid access solely on receipt of customer.subscription.deleted. Full, account-correct Stripe inventory remains authoritative for an existing user.

## Proposed safeguards (NO RUNTIME CHANGE)

The SQL at docs/release/2026-11-11-staging-orphan-plan-guards.sql proposes two D1 triggers:
1. AFTER DELETE on "user": remove only that deleted user's user_plans row. **Preserve** Stripe customer mappings and webhook ledger for investigation.
2. BEFORE INSERT into user_plans: **RAISE(ABORT)** when a webhook or another caller attempts to create a plan for a nonexistent auth user. **Never use RAISE(IGNORE)**: a silently skipped INSERT could cause `applyStripePlanEvent` to return true and a webhook to be acknowledged as successful despite no entitlement change.
3. BEFORE UPDATE on user_plans: fail closed for already-orphaned rows (prevents a later update from reactivating or silently modifying them).

**Important:** The SQL lives under docs/, **not migrations/**. It has not been applied anywhere and does not touch the existing orphan. A successful offline SQLite test is NOT a staging migration acceptance.

**Fail-closed trade-off:** `RAISE(ABORT)` makes an invalid plan write fail visibly. The current legacy `src/index.js` handler catches DB errors and returns HTTP 500, and `src/index-ledger.js` does not mark an unsuccessful delegated webhook as applied; this avoids a false 2xx ACK. However, endlessly retrying a signed event for a permanently deleted user is **not yet a complete design**. Before deployment, a deletion tombstone and safe idempotent terminal disposition (or equivalent) must be reviewed. Likewise `syncStripeBillingIdentity` can write `stripe_customers` before plan processing; this proposal alone is insufficient to prevent all orphan billing identities or all partial writes. **Do not deploy it as-is.**

## Required review before ANY staging write or deploy

1. Review the actual Better Auth account deletion lifecycle and D1 transaction ordering, including existing sessions and multiple Stripe Customer IDs.
2. Review late webhook behavior in src/index.js and src/index-ledger.js: fail-closed plan INSERT/UPDATE must propagate to the webhook and never be reported as a grant. Design a tombstone-aware, idempotent, auditable response for permanently deleted accounts so that unexpected Stripe retries are bounded and safe. Audit non-atomic `syncStripeBillingIdentity` writes before delegated processing; missing auth users must not create new billing mappings. Preserve signature verification, replay handling and outbox idempotency.
3. Take an owner-approved staging bookmark/backup and document verified rollback. Inventory all orphan rows read-only, privately compare **complete** user IDs, and verify whether any outbox/referral effects remain.
4. Treat this current historical orphan separately: **no automatic backfill, deletion or downgrade**. A narrowly targeted, idempotent cleanup requires owner approval, full ID match, proof that the auth user is gone, no billing identity mapping and no active legitimate app entitlement.
5. Verify actual Cloudflare D1 semantics, remote account deletion and Stripe TEST delayed-webhook race against an **isolated staging account**; run CI and review security impact before requesting any migration/deployment.
6. Production merge/deploy, production D1 writes/migrations and Stripe writes remain prohibited without separate explicit approval. Release stays NOT READY.

## Offline regression

Run:

```bash
node --test scripts/staging-orphan-plan-guards-test.mjs
```

The test uses in-memory node:sqlite and the **exact proposed SQL file**; no Cloudflare/Stripe connectivity or secrets are used. It verifies deleting a user removes their plan, preserves the billing audit, rejects late re-creation with a visible database error, rejects updates/upserts to existing orphans, leaves prior orphans intact, and does not break multi-subscription entitlement decisions. A transaction rollback test proves an invalid plan write cannot coexist with a finalized `applied` ledger in the same SQLite transaction. The current production/staging webhook's cross-statement transaction behavior is **not** established by that isolated test.
