# HubSpot integration — design and release gates (Issue #143)

Status: DESIGN ONLY. No runtime integration or CRM writes. Branch based on `v0-rebuild`.

## Evidence
- HubSpot portal has an existing HEGEVA Sales Pipeline; read-only audit found 0 contacts, 1 company and 0 deals.
- GitHub default-branch search for `hubspot` returned no matches; search coverage is not a complete integration audit.
- HEGEVA maintains its own authenticated workspace CRM. **Tenant-owned customer records are out of scope.**

## Data boundary
Only HEGEVA's own first-party leads and lifecycle events may be considered for outbound sync. No tenant workspace contacts, invoices, quotes, assistant prompts, payment details, or secrets may leave HEGEVA. Registration is not marketing consent. A legal basis and privacy notice must be documented for each purpose before enabling any data transfer.

## Implementation proposal (not implemented)
1. Inventory registration, verification, unsubscribe/erasure, retention, worker routes, deployment gates, and existing integrations. Document actual field names before coding.
2. Introduce server-side adapter with `HUBSPOT_SYNC_ENABLED=false` default, minimal read/write scopes and secret storage; never expose credentials to browser or logs.
3. Define an allowlisted field map, purpose and legal basis, with no implicit marketing subscription.
4. Add idempotent outbox, stable external lead identifier, retries with backoff and rate limiting; resolve duplicates and email changes safely.
5. Handle deletion, suppression, opt-outs, replays and cross-tenant isolation. No mass backfill by default.
6. Write synthetic tests for success, failure, unauthorized access, duplicate events, deletion and privacy constraints.
7. Run CI, stage-only tests and rollback rehearsal. Require explicit owner approval before any real HubSpot writes, migrations, merge or production deploy.

## Acceptance checklist
- [ ] Actual integration code reviewed and design adapted to existing architecture
- [ ] Data protection review completed
- [ ] No tenant CRM data exported
- [ ] Idempotency, deletion and suppression tests pass
- [ ] Staging evidence and rollback documented
- [ ] Production remains disabled until separate approval
