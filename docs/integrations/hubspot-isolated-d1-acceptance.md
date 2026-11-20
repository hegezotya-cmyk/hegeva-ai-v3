# HubSpot isolated D1 acceptance gate (DRAFT / NOT READY)

## Scope and non-negotiable safety
- PR #144 remains Draft. No merge, production or staging deploy, migrations, live CRM reads/writes, or secret changes.
- Use a **new disposable D1 database** in the isolated HEGEVA Synthetic Tests account, never `hegeva-ai-db` or `hegeva-ai-staging-db`.
- Before any remote action, owner must explicitly approve the account, disposable database name, SQL schema, and precise test commands. Do not infer authorization from approval to write code.
- Use synthetic identities only. Do not copy production or staging customer data. Keep HubSpot outbound transport disabled.
- The draft schema contains a foreign key to `user`; create a synthetic minimal `user` table **only inside the disposable database** before applying the draft schema.
- The test runner must assert account ID, database ID and expected empty database before executing writes; fail closed if any value differs.

## Evidence required for isolated D1 PASS
1. Document target Cloudflare account ID and disposable D1 database ID without publishing credentials.
2. Read-only check of existing tables and migration history before writes. Abort if nonempty/unexpected.
3. Apply the exact draft schema to disposable D1 only; record schema and checksum.
4. Create a single synthetic user and event, enqueue twice: one outbox row only.
5. Two concurrent claim attempts: exactly one first claim succeeds, and `RETURNING` yields attempts=1 and correct lease token.
6. Reclaim only after lease expiration: attempts=2, prior lease token cannot finalize.
7. Suppress synthetic user: no new enqueue, no new claim and no delivered finalization; suppression persists independently of outbox deletion.
8. Test lease expiry, malformed identifiers and retention cleanup. Check no tenant workspace records are read or written.
9. Capture sanitized query outcomes and verify no HubSpot API request, Cloudflare route or production worker was invoked.
10. Destroy the disposable D1 database only with separate explicit owner approval; retain sanitized evidence.

## Separate remaining release gates
- Owner-approved lawful basis, notice, opt-out, erasure, retention and suppression/send race policy.
- Approved stable unique HubSpot contact identity in the actual portal, with documented read-only verification and duplicate strategy.
- Provider idempotency and reconciliation for ambiguous or partial outcomes; matching contact is not proof of delivery of a particular event.
- Complete claim -> suppression recheck -> send -> fenced finalize with concurrency and crash recovery proven.
- Operational monitoring, rate limits, rollback, feature flag and explicit production authorization.

**Release decision: NOT READY.** A successful GitHub CI or isolated D1 test does not authorize deployment.

## Existing isolated D1 discovered — do not treat as disposable
The authenticated Cloudflare browser tab identifies `hegeva-hubspot-isolated-test-db` (UUID `53fd518c-9b5c-45b5-9a74-4565f7acdd22`) in HEGEVA Synthetic Tests account `ab362645fc03b7e63a26fd8e46e631b6`. The owner screenshots show existing tables and writes. Therefore this database is **not empty** and must not be treated as a new disposable database. The original empty-database instructions above apply only to a separately created, verified disposable database.

For this existing database, perform **read-only schema/table/row-classification inspection first**. Do not drop tables, recreate schema, run migrations, clear rows, or execute concurrent write tests until the owner approves a specific non-destructive plan after inspecting existing synthetic records. Exact identity pinning is not proof of permissions or remote runtime binding.
