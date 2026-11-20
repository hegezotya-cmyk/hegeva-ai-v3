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

## Additional integration mismatch discovered

The D1 claim operation increments `attempts` **before** the first HTTP send. The delivery planner currently treats `attempts > 0` as requiring reconciliation. Therefore a future processor must not pass the post-claim attempt count into that planner as if it were the number of *previously completed* attempts: that would block even the first send. Also, the D1 claim SQL still permits claiming expired leases, while the planner refuses blind repeat sends. This mismatch is a **release blocker**, not evidence of working retries. Resolve with an explicit pre-claim/post-claim state contract and a tested recovery state machine before wiring any scheduler or route. Do not infer remote success from D1 lease state.

## First-claim planner contract (draft)

`planClaimedHubspotDelivery` interprets the **post-claim** D1 attempts count: `1` means first claim; `2+` means a previous claim existed and reconciliation is mandatory. The pre-claim `planHubspotDelivery` remains separate. This fixes the count interpretation in pure policy, but **does not yet connect** the D1 claim result to the planner, validate an atomic read of the post-claim count, or establish provider exactly-once semantics. No Worker route, cron or HubSpot API transport is enabled. Future orchestration must prove those contracts in isolated integration tests before release.

## Official HubSpot API research (2026-11-20)

HubSpot documents `POST /crm/v3/objects/{objectType}/batch/upsert` with per-input `id`, `idProperty`, and `properties`. For contacts, a stable unique key may provide a safer reconciliation/upsert design than the current blind `POST /crm/v3/objects/contacts` create operation. Source: https://developers.hubspot.com/docs/api-reference/legacy/crm/objects/objects/batch/upsert-objects . This is a **candidate design, not validated behavior for this portal**.

Before any implementation is enabled: verify the portal supports the selected unique contact property (email vs explicitly provisioned custom unique ID), confirm authorization/scopes, define how existing contacts and erasure/suppression are handled, validate 200/207/409/429/5xx and partial batch responses using synthetic mocks, and ensure a timeout is not mistaken for non-delivery. Do not change production contact properties or send live API writes to test this. A stable key cannot replace the independent legal-basis, notice and suppression checks.

## Portal read-only inspection (2026-11-20)

Connected HubSpot portal `149482745` returned `onboarded: false`. A read-only contact-property search confirmed a built-in `email` property; it did **not** establish a provisioned HEGEVA-specific unique contact key. Search results are not exhaustive proof that no custom key exists. No property, contact, or account setting was modified. Do not assume this portal supports a custom unique-ID upsert without explicit property metadata verification and owner approval for any schema changes.

**Release gate:** choose and document a stable unique contact identity and provider reconciliation procedure, including the implications of email changes, existing CRM records, consent withdrawals, and erasure. Verify the actual upsert semantics with approved isolated testing before enabling any automatic writes. Portal onboarding is incomplete; do not initiate it implicitly.
