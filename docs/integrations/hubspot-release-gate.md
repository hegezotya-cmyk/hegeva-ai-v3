# HubSpot CRM integration — production release gate (DRAFT)

Status: **NOT READY**. Scope: central HEGEVA sales leads only. This document does not authorize production deploy, schema migration, HubSpot writes or tenant-workspace data export.

## Evidence available
- Draft default-off privacy/eligibility policy, contact allowlist, D1 outbox/lease fencing, mock transport tests, SQLite draft-schema contract tests and draft batch-upsert response correlation.
- HubSpot portal read-only inspection: portal 149482745 reports onboarding incomplete; built-in `email` property exists. A HEGEVA-specific unique identity has **not** been verified.
- The batch-upsert prototype is a pure function; it is **not** wired to a production route or scheduler. Even HTTP 200 and matching email are classified as reconciliation-required.

## Isolated D1 manual evidence (2026-11-20)
- Owner-provided Cloudflare Console screenshots confirm draft tables/index, synthetic event, initial lease (attempts=1), simulated lease reclaim (attempts=2), opt-out marker, guarded delivery update returning no rows, and final `suppressed` state with NULL lease token.
- Evidence is documented in `docs/integrations/hubspot-isolated-d1-manual-evidence-2026-11-20.md`. This is a **manual partial PASS**, not an automated Worker concurrency test. Full account/database IDs and exact runtime bindings have not been independently authenticated.
- Do not treat the manual SQL sequence as evidence of provider event idempotency, complete privacy erasure, or production readiness.

## Release blockers — require explicit evidence, not assumptions
- [ ] **Purpose and privacy approval**: document lawful basis, privacy notice, marketing vs service follow-up scope, retention, withdrawal and erasure workflow, and owner sign-off. Do not export tenant customers.
- [ ] **Provider identity**: verify portal property metadata for the chosen stable unique key, behavior of changed emails and pre-existing/merged contacts, and required scopes. Do not create properties without owner approval.
- [ ] **Provider reconciliation**: implement read-only lookup of the chosen key after ambiguous timeout/409/429/5xx and partial responses; distinguish missing, one matching record, multiple/conflicting records and API failure. Never blindly retry ambiguous writes.
- [ ] **Exact write/finalize contract**: only mark an event delivered after correlated provider evidence, with the correct active lease token and suppression recheck. Confirm handling of lease expiry during HTTP and worker crashes.
- [ ] **Privacy race and erasure**: ensure opt-out between claim and send prevents writes; define treatment of in-flight HTTP calls and remote records after erasure.
- [ ] **End-to-end isolated verification**: test real SQL claim/send/finalize behavior, crash recovery, concurrent workers, duplicate events, partial responses, 429/5xx and data isolation with synthetic identities. No real customer records.
- [ ] **Operational readiness**: feature flag defaults off, limited scopes/secrets, observable audit metadata without sensitive payloads, rollback/kill switch, owner-approved staging proof and separate production authorization.
- [ ] **CI and review**: verify latest branch HEAD checks all completed successfully; review PR #144, then obtain explicit merge/deploy approval.

## Stop conditions
Any unverified provider outcome, consent/notice failure, suppression, missing key, stale lease, identity mismatch or unresolved privacy request means **block and reconcile**, never assume delivery or re-send automatically.

## Immediate next engineering task
1. Confirm exact isolated account/database IDs and Worker binding isolation before any automated remote writes.
2. Prepare a **default-off Worker-level synthetic integration harness** that executes the existing D1 claim/finalize SQL, tests two competing claims and suppression between claim and send, and makes no HubSpot API request.
3. Separately approve the HubSpot identity, legal basis and provider read scope before any real CRM interaction.
4. Keep PR Draft; do not merge or deploy without a new explicit approval.
