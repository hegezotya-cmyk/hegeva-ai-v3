import test from "node:test";
import assert from "node:assert/strict";
import { classifyHubspotInFlightOptOut as classify } from "../src/hubspot-inflight-optout-policy.js";
test("never permits an unstarted request", () => assert.deepEqual(classify(), { action: "block", reason: "request_not_started" }));
test("invalid provider status blocks", () => assert.equal(classify({ requestStarted: true, providerStatus: "delivered" }).reason, "invalid_provider_status"));
for (const status of ["accepted", "rejected", "unknown"]) {
  test(`opt-out during in-flight ${status} requires provider reconciliation`, () => {
    const result = classify({ requestStarted: true, optOutObserved: true, providerStatus: status, providerEventCorrelated: true });
    assert.equal(result.action, "manual_review");
    assert.equal(result.reason, "opt_out_during_inflight");
    assert.equal(result.providerReconciliationRequired, true);
  });
}
test("timeout requires reconciliation", () => assert.equal(classify({ requestStarted: true }).reason, "provider_outcome_unknown"));
test("provider rejection requires review", () => assert.equal(classify({ requestStarted: true, providerStatus: "rejected" }).reason, "provider_rejection_requires_review"));
test("uncorrelated acceptance cannot finalize", () => assert.equal(classify({ requestStarted: true, providerStatus: "accepted" }).reason, "provider_event_not_correlated"));
test("correlated acceptance still cannot bypass fenced finalize", () => assert.deepEqual(classify({ requestStarted: true, providerStatus: "accepted", providerEventCorrelated: true }), { action: "manual_review", reason: "fenced_finalize_not_proven", providerReconciliationRequired: false }));

// Exhaustive fail-closed acceptance invariant: no combination of observed
// provider response and opt-out state can authorize an external send or
// delivered finalization. This is an offline policy test, NOT a remote race proof.
test("all in-flight decision combinations remain non-authorizing", () => {
  for (const requestStarted of [false, true]) {
    for (const optOutObserved of [false, true]) {
      for (const providerStatus of ["accepted", "rejected", "unknown"]) {
        for (const providerEventCorrelated of [false, true]) {
          const result = classify({ requestStarted, optOutObserved, providerStatus, providerEventCorrelated });
          assert.ok(["block", "manual_review"].includes(result.action));
          assert.notEqual(result.action, "attempt");
          assert.notEqual(result.action, "delivered");
          if (requestStarted && optOutObserved) {
            assert.equal(result.reason, "opt_out_during_inflight");
            assert.equal(result.providerReconciliationRequired, true);
          }
        }
      }
    }
  }
});
