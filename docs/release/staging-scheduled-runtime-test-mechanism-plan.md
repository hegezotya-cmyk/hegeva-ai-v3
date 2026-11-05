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
