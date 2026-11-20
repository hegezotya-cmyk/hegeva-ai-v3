# HubSpot isolated Cloudflare D1 manual evidence — 2026-11-20

**Status: PARTIAL PASS / NOT READY.** This report records owner-shared Cloudflare console screenshots and responses, not an independently authenticated connector session. Do not infer full D1 acceptance, production readiness, or authorization to deploy.

## Target
- Owner reports database `hegeva-hubspot-isolated-test-db` created in HEGEVA Synthetic Tests account.
- D1 database ID shown partially in screenshot: `53fd518c-9b5c-45b5...`. Full database ID and account identity have **not** been independently verified.
- Overview screenshot: 0 tables before schema creation, 0 queries/read/written rows at that point.
- Owner ran SQL manually via Cloudflare Console; no repo deployment or HubSpot API call was involved.

## Evidence observed
| Test | Evidence | Result |
|---|---|---|
| Draft schema | Screenshot of sqlite_master query: `user`, `hubspot_lead_outbox`, `hubspot_lead_suppressions` (tables), `hubspot_lead_outbox_due` (index) | PASS for object presence only; exact definitions not independently compared |
| Synthetic user | Owner reports successful insert of `hubspot_synthetic_user_001` | Owner-reported PASS |
| Synthetic event | Screenshot SELECT: `hubspot_test_001`, `pending`, attempts=0 | PASS |
| Initial lease | Screenshot UPDATE RETURNING: `leased`, attempts=1, `synthetic_lease_111111111` | PASS |
| Lease reclaim | Screenshot UPDATE RETURNING: `leased`, attempts=2, `synthetic_lease_222222222` | PASS under manually simulated timestamps, not real-time expiry |
| Stale lease update | Owner reported Success, but no explicit zero-change proof was captured | UNVERIFIED |
| Opt-out | Screenshot INSERT RETURNING: synthetic user, `opt_out` | PASS |
| Suppressed delivery guard | Screenshot guarded UPDATE RETURNING: 'This query returned no data' | PASS for tested guard, not full lifecycle |
| Transition event to suppressed | SQL instruction provided, no execution result supplied | PENDING |

## Limitations
- The manually issued SQL statements are simplified and **not** all exact production-source statements; in particular the reclaim UPDATE used simulated 2099 timestamps. No concurrent workers were tested.
- A single row after duplicate INSERT OR IGNORE is not proof of concurrent idempotency. A full event count was not shown.
- No Cloudflare D1 Worker binding/permission isolation audit, exact database ID confirmation, provider unique-key verification, actual HubSpot reads/writes, or privacy/legal approval.
- The test used a synthetic user and no tenant workspace customer data.
- **No production/staging deploy, migration or CRM contact write is authorized.**

## Next safe actions
1. Obtain the result of the previously provided guarded UPDATE to `suppressed`, then verify final state with read-only SELECT.
2. Independently verify exact isolated Cloudflare account/database IDs and binding isolation before any automated remote test.
3. Run source-equivalent atomic claim/finalize and concurrency tests only after explicit scope approval.
4. Complete provider identity, reconciliation, opt-out/erasure, privacy and release gates.

**Release decision: NOT READY.**
