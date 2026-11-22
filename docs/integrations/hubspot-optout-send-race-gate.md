# HubSpot opt-out versus send race — blocking design gate

**Status: NOT READY.** No production wiring, D1 migration, HubSpot API call, merge or deploy is authorized.

## What is proven
- Isolated D1 manual tests: opt-out marker was written; a guarded delivery UPDATE returned zero rows; the synthetic outbox event was transitioned to `suppressed` with a NULL lease token.
- `checkHubspotPreSend` reads the current outbox row and suppression marker, and fails closed on missing/stale data. It returns `manual_review` even for an apparently eligible event.
- Neither result proves the absence of a race between a read-only suppression check and a subsequent external HTTP request.

## Unsafe interleaving (must not be released)
1. Worker A obtains lease and checks that suppression is absent.
2. User requests opt-out; Worker B commits a suppression marker.
3. Worker A issues an external HubSpot write using the previously checked state.
4. Finalization correctly fails, but the provider write may already have occurred. **A failed finalize cannot undo an external write.**

## Required protocol before enabling transport
- Define a documented opt-out linearization point and the maximum acceptable propagation window, approved by the owner and privacy reviewer.
- Specify a durable per-contact send state that can coordinate in-flight requests with opt-out. A read-only pre-send SELECT is insufficient.
- Handle an opt-out arriving while a provider request is in flight: stop future sends, reconcile provider outcome, and perform approved provider-side suppression/erasure as appropriate. Never claim the write was prevented.
- Require exact event/provider identity correlation before delivered finalization. On timeout, 409, 429, 5xx, malformed or partial responses, fail closed and reconcile rather than blindly retry.
- Ensure tenant workspace customer data never enters central HubSpot. Allowlisted central lead identity only, with documented lawful basis and notice.
- Test deterministic interleavings: opt-out before claim, between claim and pre-send, after pre-send before HTTP, during HTTP, after HTTP before finalize, and crash/recovery. Test concurrent claims and lease expiration separately.
- Capture sanitized evidence from isolated Worker + D1 with synthetic identities. Do not enable live provider writes as a substitute for race tests.

## Acceptance
No send permission is granted by the current pre-send module. Do not change this behavior until the protocol, tests, provider reconciliation, privacy review, and explicit owner release approval are complete.
