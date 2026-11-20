# HubSpot provider idempotency gate (PR #144)

**Status: BLOCKED — no production activation or HubSpot writes.**

## Verified code behavior

- `src/hubspot-contact-adapter.js` sends `POST /crm/v3/objects/contacts` when a caller injects a transport. This is a create operation, **not** a demonstrated idempotent upsert.
- `src/hubspot-outbox-d1.js` prevents concurrent ownership of a single D1 event through a lease token, but cannot atomically commit a remote HTTP request and a D1 delivered marker.
- The SQL draft is not a migration; no Cloudflare D1 tables were created by this PR.

## Failure scenario to resolve

1. Processor claims event `event_1` and submits the contact to HubSpot.
2. HubSpot accepts it; the Worker crashes or loses the response before marking D1 delivered.
3. Lease expires, another processor claims the event and submits it again.
4. D1 lease fencing does **not** guarantee exactly-once effects at HubSpot.

## Release requirements

1. Choose and verify an **officially supported** provider upsert/reconciliation contract, including the unique identifier and its behavior for existing contacts. Do not assume `POST /objects/contacts` is idempotent.
2. Add a stable, purpose-limited HEGEVA identity mapping, with privacy review and no tenant workspace records.
3. Before each send, recheck the user's current consent/legal-basis evidence, suppression status and deletion status; design the unavoidable race between a send in progress and opt-out/erasure.
4. On timeout or ambiguous provider response, reconcile with HubSpot before retrying; distinguish create, update, already-exists and terminal errors.
5. Exercise fake-transport crash-after-acceptance, timeout, 409, 429, 5xx, concurrent leases, opt-out and erasure cases; then test against an isolated, approved HubSpot sandbox.
6. Define retention and erasure behavior for the suppression marker and any provider mapping. Require explicit owner approval before any CRM write.

Until these gates are met, keep the integration **default-off**, the PR **Draft**, and production unchanged.
