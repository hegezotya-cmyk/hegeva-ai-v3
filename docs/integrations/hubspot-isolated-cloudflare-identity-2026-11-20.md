# Isolated HubSpot D1 identity — browser read-only evidence (2026-11-20)

Source: authenticated Cloudflare Chrome tab (HEGEVA Synthetic Tests), read-only page context. No secrets inspected.

- Account display name: **HEGEVA Synthetic Tests**
- Cloudflare account ID: `ab362645fc03b7e63a26fd8e46e631b6`
- D1 database name: `hegeva-hubspot-isolated-test-db`
- D1 database UUID: `53fd518c-9b5c-45b5-9a74-4565f7acdd22`
- Database URL: `https://dash.cloudflare.com/ab362645fc03b7e63a26fd8e46e631b6/workers/d1/databases/53fd518c-9b5c-45b5-9a74-4565f7acdd22/console`

This identifies the selected D1 resource and account in the user's browser. It **does not** prove deployed Worker bindings, token scope, runtime isolation, or D1 concurrency. The checked-in example Wrangler configuration intentionally retains its non-deployable placeholder. Preflight now pins the exact UUID, but preflight alone is not a deployment authorization.

## Remaining gates

1. Confirm target Worker binding `DB` maps to this exact UUID and account in an isolated deployment, with `workers_dev=false`, `preview_urls=false`, no routes or cron, no production/staging bindings and no HubSpot transport.
2. Run synthetic-only remote claim/reclaim/fencing and opt-out race tests, capture logs without secrets or customer data.
3. Verify HubSpot provider identity, legal basis, retention, erasure and in-flight send safety separately.
4. Maintain Draft / **NOT READY** until evidence and review are complete. No production deployment or HubSpot CRM write is authorized by this document.
