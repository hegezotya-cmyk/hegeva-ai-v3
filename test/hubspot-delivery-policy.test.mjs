import test from "node:test";
import assert from "node:assert/strict";
import { planHubspotDelivery as plan, planClaimedHubspotDelivery as planClaimed, planHubspotDeliveryFromClaim as fromClaim } from "../src/hubspot-delivery-policy.js";
const base = { eventId: "event_1", eventType: "lead_upsert" };
test("new lead event is eligible for delivery planning", () => assert.equal(plan(base).action, "attempt"));
test("duplicate event is skipped", () => assert.deepEqual(plan({ ...base, alreadyDelivered: true }), { action: "skip", reason: "duplicate" }));
test("suppressed lead blocks delivery", () => assert.equal(plan({ ...base, suppressed: true }).reason, "suppressed"));
test("deletion events cannot be silently treated as upserts", () => assert.equal(plan({ ...base, eventType: "delete" }).reason, "unsupported_event"));
test("invalid event id is blocked", () => assert.equal(plan({ ...base, eventId: "a/b" }).reason, "invalid_event_id"));
test("429 blocks pending provider reconciliation", () => assert.deepEqual(plan({ ...base, status: 429, attempts: 2 }), { action: "block", reason: "reconciliation_required" }));
test("503 blocks pending provider reconciliation", () => assert.equal(plan({ ...base, status: 503 }).reason, "reconciliation_required"));
test("400 is permanent failure", () => assert.equal(plan({ ...base, status: 400 }).reason, "permanent_failure"));
test("attempt cap blocks", () => assert.equal(plan({ ...base, status: 503, attempts: 5 }).reason, "attempts_exhausted"));
test("invalid attempts are blocked", () => assert.equal(plan({ ...base, attempts: -1 }).reason, "invalid_attempts"));

test("previously claimed event without status cannot be blindly retried", () => assert.deepEqual(plan({ ...base, attempts: 1 }), { action: "block", reason: "reconciliation_required" }));

test("first confirmed D1 claim permits first send", () => assert.deepEqual(planClaimed({ ...base, claimSucceeded: true, claimAttempts: 1 }), { action: "attempt", reason: "first_claim" }));
test("second D1 claim requires reconciliation", () => assert.equal(planClaimed({ ...base, claimSucceeded: true, claimAttempts: 2 }).reason, "reconciliation_required"));
test("unconfirmed claim cannot send", () => assert.equal(planClaimed({ ...base, claimSucceeded: false, claimAttempts: 1 }).reason, "claim_not_confirmed"));
test("suppression blocks claimed send", () => assert.equal(planClaimed({ ...base, claimSucceeded: true, claimAttempts: 1, suppressed: true }).reason, "suppressed"));
test("missing claim attempt count blocks", () => assert.equal(planClaimed({ ...base, claimSucceeded: true }).reason, "invalid_claim_attempts"));

test("atomic first-claim proof is eligible for first delivery", () => assert.deepEqual(fromClaim({ claimed: true, eventId: "event_1", eventType: "lead_upsert", claimAttempts: 1 }), { action: "attempt", reason: "first_claim" }));
test("second claim proof cannot authorize duplicate send", () => assert.deepEqual(fromClaim({ claimed: true, eventId: "event_1", eventType: "lead_upsert", claimAttempts: 2 }), { action: "block", reason: "reconciliation_required" }));
test("missing claim proof blocks delivery", () => assert.equal(fromClaim(null).reason, "claim_not_confirmed"));
test("suppression after claim blocks delivery", () => assert.equal(fromClaim({ claimed: true, eventId: "event_1", eventType: "lead_upsert", claimAttempts: 1 }, { suppressed: true }).reason, "suppressed"));
