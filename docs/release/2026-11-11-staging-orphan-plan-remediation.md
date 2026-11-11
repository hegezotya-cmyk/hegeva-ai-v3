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
2. BEFORE INSERT into user_plans: ignore an attempt to recreate an entitlement for a nonexistent auth user (such as a late webhook).

**Important:** The SQL lives under docs/, **not migrations/**. It has not been applied anywhere and does not touch the existing orphan. A successful offline SQLite test is NOT a staging migration acceptance.

## Required review before ANY staging write or deploy

1. Review the actual Better Auth account deletion lifecycle and D1 transaction ordering, including existing sessions and multiple Stripe Customer IDs.
2. Review late webhook behavior in src/index.js and src/index-ledger.js: a skipped plan insert must not be falsely reported as a successful grant, and it must not cause spurious outbox side effects. Preserve signed-webhook retry and idempotency guarantees.
3. Take an owner-approved staging bookmark/backup and document verified rollback. Inventory all orphan rows read-only, privately compare **complete** user IDs, and verify whether any outbox/referral effects remain.
4. Treat this current historical orphan separately: **no automatic backfill, deletion or downgrade**. A narrowly targeted, idempotent cleanup requires owner approval, full ID match, proof that the auth user is gone, no billing identity mapping and no active legitimate app entitlement.
5. Verify actual Cloudflare D1 semantics, remote account deletion and Stripe TEST delayed-webhook race against an **isolated staging account**; run CI and review security impact before requesting any migration/deployment.
6. Production merge/deploy, production D1 writes/migrations and Stripe writes remain prohibited without separate explicit approval. Release stays NOT READY.

## Offline regression

Run:

```bash
node --test scripts/staging-orphan-plan-guards-test.mjs
```

The test uses in-memory node:sqlite and the **exact proposed SQL file**; no Cloudflare/Stripe connectivity or secrets are used. It verifies deleting a user removes their plan, preserves the billing audit, prevents late re-creation, allows valid user grants, leaves prior orphans intact, and does not break multi-subscription entitlement decisions.
