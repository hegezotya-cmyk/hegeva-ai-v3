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
