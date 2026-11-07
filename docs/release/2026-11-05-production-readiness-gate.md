# HEGEVA AI — production release gate (2026-11-05)

**Decision: NOT READY. STOP BEFORE MERGE, MIGRATION OR DEPLOY.**

The candidate fixes on PR #94 are isolated from the live release.
A green workflow only proves the specified local regressions. The 2026-10-25
production smoke tests did not establish all multi-subscription or D1 cases.

## Already evidenced
- Signed terminal Stripe HTTP handler with mocked Stripe inventory / D1.
- Multiple subscriptions across Customer IDs (policy and inventory fixtures).
- Local SQLite transaction rollback of entitlement, ledger and outbox record.
- Local SQLite race tests, including separate worker threads.
- Draft lease-based outbox worker with injected mock executor.
- Read-only Stripe TEST snapshot + D1 entitlement cross-check (mock provider).
- Draft migration 0032 exists, **not applied**.

## Blocking release conditions
- [ ] Implement an idempotent, least-privilege billing identity/referral
      side-effect executor. Do not overwrite the active Stripe Customer ID
      with a canceled subscription's Customer ID.
- [ ] Wire the trusted current-state checker into that executor; prove
      negative tests for missing Stripe mapping, stale snapshot, mixed modes,
      multiple Customer IDs, and interrupted/expired leases.
- [ ] Wire a bounded durable recovery trigger/scheduler and alerting for jobs
      whose retries are exhausted; verify replay after simulated process crash.
- [ ] Establish the staging 0032 migration procedure and explicit owner
      approval, take an approved backup and verify rollback (no D1 writes yet).
- [ ] Verify real Cloudflare D1 transactional behavior and read-only historical
      mapping with appropriately scoped staging credentials.
- [ ] Verify full authenticated test customer journey in staging:
      checkout -> signed Stripe TEST webhook -> entitlement -> billing identity
      -> eventual referral effects -> duplicate and cancellation -> retry.
- [ ] Review PR #92 duplicate checkout guard, PR #93 staging read audit,
      PR #94 together against current integration branch and production version.
- [ ] Independent security review: authorization, secret scope, logs, mixed
      payment mode and webhook idempotency; production smoke and rollback plan.
- [ ] Obtain separate owner approval **before** any branch merge, migration,
      staging deployment or production deployment.

**Never infer production readiness from PR CI alone.** All changes remain on
a draft branch, and the outbox executor is NOT enabled.
