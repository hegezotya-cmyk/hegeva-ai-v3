# HEGEVA V3 — Remote TEST webhook acceptance, isolated D1 (STOP-gated)

**Status 2026-11-13:** PREPARED ONLY, remote NOT RUN. Owner said "csináljuk" for the isolated test, **not** for production or live billing. Related: #102, Draft #103–#105.

## Safety boundary: do not use an existing HEGEVA database

- Production Worker: `hegeva-ai-v3`, D1 `hegeva-ai-db`. **NEVER target.**
- Shared running staging Worker: `hegeva-ai-v3-staging`, D1 `hegeva-ai-staging-db`. **Do not test destructive schema or user deletion here.**
- An existing cron synthetic Worker/D1 is also present in config. **Do not reuse**, unless independently proven disposable and explicitly authorized.
- Use a **new D1 database in a separately authorized synthetic Cloudflare account** and a test-only Worker route. Its account ID must differ from both staging and production account IDs; its DB UUID must differ from ALL three existing configured databases. Use no real auth/user/customer/Stripe LIVE data.
- Production and shared staging Webhooks and their secrets remain unchanged. Feature `HEGEVA_DELETED_USER_WEBHOOK_GUARD_ENABLED` must remain unset in real Workers.
- **No remote write, migration, deploy, subscription mutation, or Stripe event resend before all preflight gates pass.** If a gate fails, stop and report BLOCKED.

## A. Identity/access & read-only preflight — evidence required

1. Cloudflare owner signs in to dashboard; verify account selection, not by URL text alone. Confirm test-only Cloudflare account and brand-new synthetic D1 UUID are distinct from production, shared staging, and existing cron synthetic fixtures.
2. Inspect dedicated isolated test Worker bindings: only the new D1, no production/shared-staging service binding, AI, Durable Object, custom domain, cron, public production route, or outgoing-email capability. `PAYMENT_MODE=test`; production `PUBLIC_APP_URL` is prohibited. The test Worker requires a separate private endpoint with access control and an isolated TEST webhook secret.
3. Inspect the exact proposed SQL `docs/release/2026-11-11-staging-orphan-plan-guards.sql` and `src/stripe-deleted-user-webhook-disposition.js` from Draft #105. Validate account-deletion lifecycle, Stripe event metadata user ID provenance, customer/subscription ID matching, row-count semantics, D1 transaction/replay and referral/outbox effects in a code review.
4. Verify read-only access to the newly created isolated D1; run a narrow schema query. Verify the D1 Time Travel facility for THIS database. **Capture its current bookmark privately**, with account and database identity. No tokens or user data in GitHub issue/logs.
5. Verify that a reverse path is available to restore ONLY that synthetic D1, and that the test Worker can be disabled independently. Record the exact steps and authorized operator. **Never run a real Time Travel restore on shared staging or production**.

Cloudflare docs (checked 2026-11-13):
- https://developers.cloudflare.com/d1/reference/time-travel/ — time travel is automatic; restoration overwrites the chosen database. Retention is plan-dependent (7 days Free / 30 days Paid on supported D1 storage).
- https://developers.cloudflare.com/d1/best-practices/import-export-data/ — D1 export SQL possible; exported SQL contains sensitive data and must be stored privately.
- https://developers.cloudflare.com/workers/wrangler/commands/d1/ — remote D1 schema/SELECT, export, Time Travel operations and flags.

**Examples, do not run until the target is verified and owner-approved:**

```bash
# TEST DB only: never substitute production or existing staging D1.
npx wrangler d1 info <NEW_SYNTHETIC_DB_NAME> --config <GENERATED_SYNTHETIC_CONFIG>
npx wrangler d1 time-travel info <NEW_SYNTHETIC_DB_NAME> --config <GENERATED_SYNTHETIC_CONFIG>
npx wrangler d1 export <NEW_SYNTHETIC_DB_NAME> --remote --config <GENERATED_SYNTHETIC_CONFIG> --output=<PRIVATE_BACKUP_PATH>.sql
```

A recorded bookmark is rollback evidence, **not proof** that the rollback has been tested. Restore is destructive and must be tested against the isolated DB only, then re-verify schema + fixture state.

## B. Isolated acceptance matrix — signed TEST fixtures only

1. Valid signed TEST event for existing synthetic auth user is processed normally; Premium/Basic plan and Stripe customer mapping match complete TEST subscription inventory; no accidental cross-tenant access.
2. Synthetic user is deleted using the real Better Auth deletion lifecycle. Verify exactly one tombstone, removal of its plan, preservation of intended audit rows, no inconsistent active entitlement. Multiple customer/subscription mappings must be tested.
3. Deliver a fresh, correctly signed TEST subscription/invoice event for **that verified deleted test user**. Expect HTTP 2xx with `ignored:true`, `entitlementChanged:false`, exactly one `ignored` ledger row; **no** new `stripe_customers` or `user_plans`.
4. Replay the same signed event, including concurrent replay. Verify one ledger record and no duplicate outbox/referral/credit side effects. Unknown event ID, mismatched user/customer/subscription or malformed signature must not be accepted.
5. Signed TEST event for a missing auth user **without** a verified tombstone must fail closed and produce an actionable operator alert; do not turn such a 503 into a silent success. Define bounded manual resolution before production readiness.
6. Confirm that canceled plus another verified active Premium subscription retains Premium for a **live synthetic auth user**, and confirmed complete cancellation downgrades to Basic. Never mix subscription inventories across Stripe accounts.
7. Test schema/DB unavailable, partial batch failure, race between deletion and webhook, and restore after an injected synthetic failure. Capture per-step remote results and D1 query evidence with only masked identifiers.
8. Disable the isolated test Worker and any secret, remove test routing/fixture safely, verify no residual scheduled actions. Retain audit evidence per approved policy.

## C. Release gates and stop rules

- **NOT READY** if the Cloudflare login is unavailable, isolated test D1 not confirmed, account scope overlaps, required auth token/permission missing, backup/bookmark not recorded, rollback not tested, signed delivery is unverified, D1 ledger/outbox states mismatch, or any data isolation anomaly appears.
- Existing main TEST payments (Nov canceled→Basic) were previously proven; do not retest or accidentally charge customers.
- Do not claim production authorization from an isolated test PASS. Production deployment and Stripe LIVE actions require distinct explicit owner approval after all master acceptance gates are green.
- Issue #102 must state the exact account/D1/Worker alias, git SHA, build/CI result, remote bookmark evidence status (redacted), signed-event test result, observed rollback, unresolved gaps, and whether production changed.

## D. Current blocker (2026-11-13)

Browser Cloudflare tab resolves to **Cloudflare sign-in**, not an authenticated D1 console; no direct Cloudflare mutation connector is available here. The owner must reauthenticate to verify the selected TEST account and provide test-only authorized access through the appropriate runtime. **No remote migration/rollback or signed webhook test has occurred.**
