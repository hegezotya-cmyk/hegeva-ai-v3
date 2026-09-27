# Referral V2 Safe Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the existing Referral V1 flow with server-authoritative paid qualification and owner-reviewed reward eligibility, without automatic reward execution or payment-system changes.

**Architecture:** Keep Referral V1 code and routes intact. Add one D1 migration and a focused server module that derives eligibility from existing workspace activation plus verified billing entitlement, then creates an idempotent `ELIGIBLE`/review record. Reuse existing Account UI and consent analytics, exposing aggregate referral data only.

**Tech Stack:** Cloudflare Worker JavaScript, D1 SQL migrations, Next.js/React TypeScript, existing auth/session and Stripe webhook entitlement tables.

**Spec:** Approved Referral V2 design in the preceding conversation; Referral V1 baseline is PR #21 / commit `9665a73027fc117d58e022c6669789e17d0aa180`.

## Global Constraints

- Source-only/local verification; no production deploy or remote migration.
- Do not modify Stripe pricing, checkout, webhook semantics, subscriptions, secrets, quotas, providers, or existing entitlements.
- Paid qualification must use only existing verified entitlement state.
- `EXECUTED` must never be created by an automatic path.
- Referral V1 routes, consent handling, first-touch attribution, and privacy boundaries remain intact.
- No payout, refund, credit, discount, subscription change, email, or external action is performed.

## Review Focus

- Replayed signup/billing callbacks must not duplicate attribution or reward rows; test unique constraints and idempotent reconciliation.
- A self-referral must fail even when the referral code is otherwise valid; test creator/referred identity equality server-side.
- A cancelled/refunded/chargeback entitlement must not qualify a reward and must reverse an existing approved review only through the existing entitlement state.
- Missing, malformed, revoked, or expired referral data must return generic safe responses without internal IDs or PII.
- Client analytics and Account responses must contain no referral code, email, user ID, workspace ID, payment ID, or raw billing data.

### Task 1: Isolated branch and baseline audit

**Files:**
- Create branch: `referral-v2-safe-ledger-20260927` from the current verified baseline.
- Inspect: `src/referral-attribution.js`, `src/referral-reward-review.js`, `src/index.js`, `v0-app/app/account/page.tsx`, `v0-app/components/growth/referral-review.tsx`, `v0-app/components/analytics-consent.tsx`, migrations `0024` and `0025`.

- [ ] Verify the worktree is clean, record the baseline HEAD, and confirm the existing referral routes and billing tables before editing.

### Task 2: Reward ledger migration

**Files:**
- Create: `migrations/0031_referral_rewards.sql`.
- Test: local migration validation through `0031`.

**Schema:**

```sql
CREATE TABLE IF NOT EXISTS referral_rewards (
  id TEXT PRIMARY KEY,
  attributionId TEXT NOT NULL UNIQUE,
  referrerUserId TEXT NOT NULL,
  referredUserId TEXT NOT NULL UNIQUE,
  rewardType TEXT NOT NULL DEFAULT 'owner-reviewed',
  rewardValue TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','ELIGIBLE','APPROVED','REJECTED','EXECUTED')),
  eligibilityReason TEXT NOT NULL,
  eligibleAt TEXT,
  approvedAt TEXT,
  approvedBy TEXT,
  executedAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (attributionId) REFERENCES referral_attributions(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS referral_rewards_referrer_idx ON referral_rewards(referrerUserId, createdAt DESC);
CREATE INDEX IF NOT EXISTS referral_rewards_referred_idx ON referral_rewards(referredUserId, createdAt DESC);
CREATE INDEX IF NOT EXISTS referral_rewards_status_idx ON referral_rewards(status, updatedAt DESC);
```

- [ ] Validate the migration locally only; prove it cannot create `EXECUTED` rows and does not alter Stripe or existing entitlement tables.

### Task 3: Server-authoritative qualification module

**Files:**
- Create/modify: `src/referral-v2.js`.
- Modify: `src/index.js` only for authenticated routes and existing entitlement/activation reconciliation call sites.
- Test: `v0-app/scripts/referral-v2-audit.mjs` plus local D1 fixture tests.

**Interfaces:**
- `evaluatePaidReferralEligibility(db, referredUserId)` returns `{ eligible, reason, attribution }` using existing `serverActivationState` and entitlement rows (`user_plans`, `stripe_customers`, applied `stripe_webhook_events`).
- `reconcileReferralReward(db, referredUserId, now)` performs `INSERT ... ON CONFLICT(attributionId) DO UPDATE` only to `ELIGIBLE` or a non-executing pending/rejected state; it never writes `EXECUTED`.
- `reverseReferralReward(db, referredUserId, reason, now)` changes `APPROVED`/`ELIGIBLE` to `REJECTED` or a documented reversal state only when entitlement is no longer valid, idempotently.

- [ ] Add failing tests for activation-before-payment, payment-before-activation, missing entitlement, missing activation, duplicate reconciliation, and invalidation reversal.
- [ ] Implement the module with generic errors and server-derived user IDs only.
- [ ] Add authenticated owner/referrer read endpoints that return aggregate counts/status and never return internal identifiers to creator-facing clients.
- [ ] Reuse existing entitlement invalidation paths; do not redesign Stripe webhook handling.
- [ ] Add explicit guards preventing creator self-approval and any automatic `EXECUTED` transition.

### Task 4: Account referral surface and consent analytics

**Files:**
- Modify: `v0-app/components/growth/referral-review.tsx`.
- Modify only if needed: `v0-app/app/account/page.tsx`, `v0-app/components/analytics-consent.tsx`.
- Test: localization/privacy audit.

- [ ] Preserve the current referral link/copy behavior and add truthful aggregate totals: referred signups, paid-qualified referrals, pending rewards, eligible rewards.
- [ ] Keep all new copy in EN/HU/DE/FR/ES and avoid promises of cash, credits, discounts, or free months.
- [ ] Emit only consent-gated `referral_link_copy` and `referral_paid_qualified` events with no PII, referral code, or IDs.
- [ ] Ensure empty states are truthful and no client-provided counters or statuses are trusted.

### Task 5: Focused verification

**Files:**
- Modify: `v0-app/scripts/referral-v2-audit.mjs` only for focused coverage.

- [ ] Run referral V1 and V2 audits, malformed/revoked/self-referral checks, duplicate attribution/reconciliation checks, paid qualification order tests, invalidation reversal tests, privacy/authorization tests, and consent/localization tests.
- [ ] Run JavaScript syntax checks, TypeScript with `--incremental false`, Next production build, OpenNext dry-run/build, local migration validation through `0031`, and `git diff --check`.
- [ ] Confirm provider calls, Stripe operations, production D1 writes, emails, payouts, credits, discounts, and deployments are all zero.

### Task 6: Review handoff

- [ ] Inspect the complete diff and confirm only Referral V2 migration/server/UI/audit files changed.
- [ ] Report branch, HEAD, migration status (created but not applied remotely), tests/build results, remaining abuse risks, and recommended next step.
- [ ] Stop without commit, push, deployment, or production migration until separately approved.
