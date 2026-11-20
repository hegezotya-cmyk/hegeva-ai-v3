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

## Latest GitHub verification (2026-11-20)
- PR #144 HEAD `2bceb75aa205ab042315d6c61918a1e3698ecacb`: GitHub reports `mergeable=true`, Draft.
- GitHub Actions run `44689684553`, `build-check`: completed **SUCCESS**, including Cloudflare OpenNext build. This proves the repository CI checks, **not** remote D1 isolation, HubSpot delivery, staging E2E or production safety.
- The isolated Worker preflight now rejects a missing or non-inert `main` entrypoint. Its config still has an unverified D1 UUID placeholder; **no deploy authorized**.
- Decision: **NOT READY** for HubSpot production; keep Draft until owner-reviewed release gates are evidenced.

## Final release decision matrix (2026-11-20)
| Gate | Current evidence | Decision |
| --- | --- | --- |
| Git branch conflict | PR #144 `mergeable=true` at latest check | PASS (recheck at merge time) |
| GitHub CI latest HEAD | `c386d4e476f07619c5eea10e44d6dbafbdd8d2ff`, run `44691523608` in progress | PENDING |
| Isolated D1 identity | Browser-confirmed Synthetic Tests account `ab362645fc03b7e63a26fd8e46e631b6`, D1 `53fd518c-9b5c-45b5-9a74-4565f7acdd22` | PARTIAL (remote binding unverified) |
| Isolated D1 runtime concurrency, crash/opt-out | Historical manual synthetic SQL; no verified Worker-level remote concurrency | BLOCKED |
| HubSpot portal identity/idempotency | Unique provider key and ambiguous-response reconciliation not proven | BLOCKED |
| Lawful basis, privacy notice, retention, opt-out and erasure | No owner-approved final evidence | BLOCKED |
| Staging end-to-end and rollback | Not proven for this integration | BLOCKED |
| Production deployment | Separate protected approval and post-deploy smoke evidence needed | BLOCKED |

**Release rule:** never treat a green CI as permission to enable HubSpot outbound delivery. A safe non-HubSpot application release and a HubSpot transport launch are distinct decisions. Do not merge this Draft or enable transport until the applicable gate has been explicitly accepted. Do not migrate/write production D1 as part of HubSpot preparation.
