# HEGEVA AI PR #95 — Staging-only Activation Package

Status: preparation only. No endpoint, Durable Object binding, secret, permission, deployment, Stripe write, or remote D1 write is authorized by this document.

Implementation status: the controller, persistent DO guard, RPC method, local SQLite fencing fixture and local Wrangler runtime harness exist. The offline HTTP adapter is in `src/staging-scheduled-test-endpoint.js`, the namespace-enforcing D1-shaped adapter is in `src/staging-synthetic-fixture-adapter.js`, and the inactive staging-only build entrypoint is `src/staging-scheduled-test-worker.js`. None is wired into `src/index.js` or `src/index-ledger.js`; the staging `GUARD` binding and remote fixture adapter remain inactive. This package is therefore a GO/NO-GO package, not an activation claim.

## Scope and invariants

- Target: `hegeva-ai-v3-staging` only, `PAYMENT_MODE=test`, main TEST Stripe account only.
- Fixtures: disposable synthetic identifiers with a dedicated fixture namespace; never an existing customer, entitlement, referral, subscription, webhook, or ledger identity.
- The raw reconciliation remains visible. Historical TEST exceptions are evaluated separately and only by exact internal tuple plus explicit owner attestation.
- Production entrypoints must not import the test controller/guard/DO and production configuration must not contain the test binding.
- Any failed cleanup, lease verification, fencing check, or observability check is a failed acceptance, not a warning.

## Proposed staging-only configuration (not activated)

| Item | Required value | Evidence before activation |
|---|---|---|
| Worker | `hegeva-ai-v3-staging` | Dashboard name and deployment target read-only check |
| D1 binding | existing `hegeva-ai-staging-db` | binding name/account/database read-only check |
| DO binding | `GUARD` → `StagingTestGuardDurableObject` | explicit staging-only config diff and owner approval |
| Endpoint | one staging-only route, default denied | route is absent from production build; unauthorized request test |
| Authorization | dedicated staging test secret, supplied by owner at deploy time | presence/rotation metadata only; value never read or logged |
| Enable flag | `STAGING_SCHEDULED_TEST_CONTROL_ENABLED=false` until activation window | non-secret variable snapshot |
| Mode | `PAYMENT_MODE=test` | non-secret variable snapshot |
| Processor | `OUTBOX_PROCESSOR_ENABLED=true` | non-secret variable snapshot |
| Cron | `*/5 * * * *` | Dashboard trigger read-only evidence |
| Observability | logs/traces/issues remain owner-approved settings; no sensitive payload logging | Dashboard snapshot; no activation if unknown |

The endpoint must accept only a fixed scenario (`retry-recovery` or `lease-fencing`) and a server-generated fixture nonce. It must not accept SQL, database IDs, Stripe IDs, event IDs, user IDs, arbitrary operation names, or callbacks.

## Fencing and cross-storage protocol

1. The DO atomically claims a scenario lease in `storage.transaction()` and returns a nonce-bound fencing token.
2. Before each synthetic effect, the controller verifies deadline and lease ownership.
3. The D1 operation is a separate conditional transaction: it must require the current fixture namespace, nonce/fencing token, unexpired lease marker, and unique operation key in the same D1 write transaction.
4. A stale grant fails the D1 predicate and changes zero rows. A new lease uses a different nonce, so the old grant cannot write after expiry or re-acquisition.
5. A repeated operation key is a no-op. It must not create a second effect, entitlement, referral, ledger, or outbox record.
6. DO and D1 are not treated as one atomic transaction; acceptance requires the stale-write-zero proof and cleanup proof separately.

## Remote acceptance protocol (owner-approved window required)

For each run, record only masked fixture nonce, state, counts, and timestamps.

1. Read-only preflight: verify Worker, DO class, D1 binding, TEST mode, cron, Dashboard-only variables, secret presence, and keep-vars/keep-secrets preservation behavior.
2. Create one disposable synthetic fixture in the dedicated staging-test namespace. Snapshot only aggregate counts; do not use existing rows.
3. Retry/recovery: force one controlled synthetic failure; prove `pending → processing → retry-scheduled`, then remove only the synthetic failure and prove `processing → completed`.
4. Fencing: run competing claims, stale lease release, stale D1 write, and duplicate operation. Require one winner, stale-write count zero, one effect, and no late side effect.
5. Idempotency: repeat the same scenario and require no additional ledger/outbox/effect rows.
6. Cleanup: execute success, failure, timeout, lease-loss, and cleanup-failure paths. Cleanup failure must fail acceptance. Verify synthetic outbox/ledger/plan counts are zero and real-user aggregate counts are unchanged.
7. Read-only postflight: verify Worker version, cron, bindings, non-secret vars and secret-preservation metadata. Do not enable logs/traces solely for this test.

## Rollback and removal

- Disable the staging flag before removing the endpoint binding.
- Remove only the staging test binding/route and the dedicated test authorization secret through an owner-approved change.
- Re-run dry-run and production exclusion checks.
- Verify the deployed Worker has no test route and no `GUARD` binding.
- Verify synthetic fixture counts are zero and no existing aggregate changed.
- If any rollback step fails, stop; do not retry with broader permissions or mutate real data.

## Acceptance matrix

| Gate | Required proof | Current status |
|---|---|---|
| Offline DO RPC and atomic lease | local Wrangler DO runtime | PASS |
| Cross-storage stale-write fencing | isolated SQLite/D1-shaped conditional race test | PASS locally; remote BLOCKED |
| Retry → recovery → completed | isolated local fixture | PASS locally; remote BLOCKED |
| Fencing/concurrency/idempotency | local runtime and SQLite tests | PASS locally; remote BLOCKED |
| Cleanup / zero residue | local fixture tests | PASS locally; remote BLOCKED |
| Production exclusion | source/config scan | PASS |
| Staging endpoint activation | not performed | BLOCKED — owner approval and deploy window required |
| Historical identity exact proof | full internal tuple + attestation | BLOCKED |
| Duplicate/cancellation/entitlement E2E | real staging evidence | BLOCKED |

## Required owner actions

1. Approve one staging-only activation window and the dedicated staging test secret/binding configuration without changing production or existing secrets.
2. Provide read-only evidence of the exact staging Worker, DO binding, D1 binding, cron, keep-vars/keep-secrets behavior, and Dashboard-only variable preservation.
3. Approve disposable synthetic fixture writes and the rollback procedure.
4. Separately provide the historical TEST exact tuple through the private owner attestation flow, or keep that gate BLOCKED.
5. Approve and execute the remote duplicate/cancellation/entitlement E2E acceptance; no existing subscription may be modified.

Current release decision: `releaseSafe=false`, **NOT READY**.
