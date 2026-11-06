# Staging scheduled-runtime test mechanism plan

Status: PLAN ONLY — not enabled or deployed

## Findings

- Wrangler 4.157.0 exposes local scheduled testing through `/cdn-cgi/local/scheduled` and `--test-scheduled` development support.
- No supported Wrangler command was found to invoke the scheduled handler on the deployed Cloudflare Worker.
- Local scheduled execution must remain separate evidence from a real Cloudflare cron invocation.

## Proposed mechanism

Create a staging-only, default-deny control path that calls the same `processNextTerminalEffect` function used by `scheduled()` but has no arbitrary SQL, event, user, customer, subscription, Stripe, or D1 operation input.

Required guards, all fail-closed:

1. Compile-time staging target and runtime `PAYMENT_MODE=test` check.
2. Explicit `OUTBOX_TEST_CONTROL_ENABLED=false` default; absent or any value other than an exact approved enablement is disabled.
3. A dedicated staging-only secret-based authorization, never reused as a Stripe or webhook secret; secret value is never logged or returned.
4. Request schema contains only a fixed scenario name (`retry-recovery` or `lease-fencing`) and a server-generated fixture nonce. No caller-supplied IDs or SQL.
5. Single-flight Durable Object lock per fixed scenario, bounded rate limit, short deadline, and replay nonce storage.
6. Fixture creation uses allowlisted synthetic identifiers generated server-side, exact schema-compatible `applied` ledger values, and a transaction/cleanup record.
7. Processor invocation uses the existing scheduled processor and its fail-closed checks; no entitlement, referral, Stripe, or existing-user lookup is allowed.
8. Cleanup runs in `finally`, is idempotent, and verifies aggregate zero fixture rows before returning success.
9. Responses contain only scenario, phase, aggregate counts, reason codes, and cleanup status; never raw identifiers or D1/Stripe data.
10. Production builds must not include the route or enablement path. CI must assert the route is absent from production configuration and that the default is disabled.

## Required regression coverage before any staging enablement

- unauthorized, wrong secret, wrong mode, production build, and disabled-by-default rejection;
- staging-only route and binding isolation;
- rate-limit and Durable Object single-flight behavior;
- replay nonce rejection and duplicate request idempotency;
- allowlisted scenario/schema validation and rejection of arbitrary IDs/SQL;
- cleanup on success, timeout, exception, and lease loss;
- retry recovery: `pending -> processing -> retry-scheduled -> processing -> completed`;
- fencing: competing claims, expired lease, stale attempt, conditional completion, and no duplicate executor call;
- separate assertions proving local scheduled invocation is not reported as remote cron evidence.

## Preflight / rollback / removal

Preflight: verify target Worker, `PAYMENT_MODE=test`, D1 binding, cron, secrets-preservation behavior, disabled default, and CI PASS. Snapshot aggregate target tables read-only.

Rollback: disable the flag, redeploy the previously approved staging Worker version, run idempotent fixture cleanup, and verify zero synthetic outbox/ledger/plan rows. Never repair existing records automatically.

Removal: delete the route, control binding, tests, and config flag in one reviewed change; redeploy staging-only; verify the route is unavailable and production configuration contains no control flag.

Owner approval required before implementation is enabled: approve one dedicated staging-only authorization mechanism and one staging-only deployment of this control path. No production approval is implied.

## Offline guard implementation checkpoint — 2026-11-06

Added an unimported persistent guard contract with scenario allowlisting, durable-store single-flight, replay window, rate limit, lease expiry and stale-release fencing. It has no D1, Stripe, HTTP route or secret access. The store must be supplied by an approved Durable Object only if separately enabled; in-memory tests are not deployment proof.

## Durable Object offline integration checkpoint — 2026-11-06

Added an unregistered Durable Object harness whose store adapter calls `ctx.storage.transaction(callback)`. A local Wrangler runtime test verified parallel acquire has one winner and a stale nonce cannot release the lease. The harness is not part of the staging or production Worker configuration.

## Implementation checkpoint — offline controller contract (2026-11-05)

The owner authorized **code implementation plus local/CI tests only**, explicitly **not** activation, creation of a secret, access changes, staging deployment, or production deployment.

Added isolated `src/staging-scheduled-test-control.js` and `scripts/staging-scheduled-test-control-test.mjs`. The module is **not imported by Worker entrypoints or wired to any HTTP route** and provides no D1 or Stripe read/write operations. An explicit staging-build boolean, enable flag, TEST payment mode, a dedicated authorization token contract, strict two-field scenario schema, generated nonce, bounded deadline, adapter-denied lock/rate-limit, and mandatory cleanup verification are enforced. Seven targeted offline cases were exercised in the drafting environment; the PR's own CI execution remains to be independently confirmed.

**Important remaining implementation (not claimed PASS):** staging endpoint integration, runtime auth/secret binding, staging synthetic fixtures, timeout cancellation wiring, remote cron acceptance and deployment-specific integration runner. The persistent guard and local Durable Object harness are implemented and tested, but are not imported by any deployed Worker entrypoint. Raw credentials must never appear in logs or tests.

## Staging activation preflight checklist — 2026-11-06

### Required owner actions before activation

1. Approve one dedicated staging-only authorization secret and provision it without sharing its value in chat or repository files.
2. Approve adding a staging-only `GUARD` Durable Object binding and an explicit `OUTBOX_TEST_CONTROL_ENABLED=false` variable; production configuration must remain unchanged.
3. Approve one staging-only deploy of the endpoint integration, with `keep_vars=true`, `keepSecrets=true`, Dashboard-only variables preserved, and observability/logs/traces left OFF.
4. Provide the deployed Worker version, exact cron expression, binding snapshot, and non-secret config snapshot after deployment.
5. Authorize isolated synthetic D1 fixture writes and rollback only; no existing user, entitlement, referral, Stripe, or historical rows may be used.

### Acceptance sequence

- Preflight: target/name/account, `PAYMENT_MODE=test`, control flag default/enablement, `GUARD` binding, D1 binding, cron, secrets-preservation and observability.
- Auth: missing/wrong authorization denied; production/live mode denied; malformed scenario/ID/SQL rejected; replay and rate-limit denied.
- Retry: synthetic `pending -> processing -> retry-scheduled -> processing -> completed`, with reason code and aggregate state only.
- Fencing: parallel claim one winner, expired lease recovery, stale attempt completion rejected, duplicate executor call count one.
- Cleanup: success, exception, timeout, lease loss and concurrent-run paths all execute idempotent cleanup and verify synthetic outbox/ledger/plan counts zero.
- Safety: zero real-user/entitlement/referral/Stripe effects; no raw IDs or secrets in response/logs.
- Evidence: distinguish manually controlled endpoint result from real `*/5 * * * *` cron invocation; do not substitute local runtime results for staging cron proof.

### Rollback

Disable the control flag, redeploy the previously approved staging Worker version, remove the staging-only binding/route in a reviewed change, and verify the synthetic aggregate counts are zero. No migration rollback or data repair is authorized by this checklist.

**Status:** `releaseSafe=false`, NOT READY. No staging endpoint activation, secret/permission change, staging/production deploy, or Stripe/D1 write authorized or performed.
