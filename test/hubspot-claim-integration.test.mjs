import test from "node:test";
import assert from "node:assert/strict";
import { claimHubspotLeadWithProof } from "../src/hubspot-outbox-d1.js";
import { planHubspotDeliveryFromClaim } from "../src/hubspot-delivery-policy.js";

// Synthetic D1 facade: the claim SQL must atomically return its own post-update
// attempts value. No HubSpot credentials, network calls or customer data.
const args = { eventId: "evt_synthetic", now: "2026-11-20T10:00:00.000Z", leaseUntil: "2026-11-20T10:01:00.000Z", leaseToken: "lease_synthetic_123456789" };
function fakeD1({ attempts = 0, suppressed = false, claimable = true } = {}) {
  const state = { attempts, suppressed, claimable, calls: 0 };
  return {
    state,
    db: {
      prepare(sql) {
        assert.match(sql, /UPDATE hubspot_lead_outbox/);
        assert.match(sql, /RETURNING event_id,event_type,attempts,lease_token/);
        return {
          bind(eventId, _now, _leaseUntil, leaseToken) {
            return {
              async first() {
                state.calls++;
                if (!state.claimable || state.suppressed) return null;
                state.claimable = false;
                state.attempts++;
                return { event_id: eventId, event_type: "lead_upsert", attempts: state.attempts, lease_token: leaseToken };
              },
            };
          },
        };
      },
    },
  };
}
test("first atomic claim proof permits one planned delivery", async () => {
  const { db } = fakeD1();
  const claim = await claimHubspotLeadWithProof(db, args);
  assert.deepEqual(planHubspotDeliveryFromClaim(claim), { action: "attempt", reason: "first_claim" });
});
test("second worker cannot claim already leased event", async () => {
  const { db } = fakeD1();
  const first = await claimHubspotLeadWithProof(db, args);
  const second = await claimHubspotLeadWithProof(db, { ...args, leaseToken: "lease_second_1234567890" });
  assert.equal(planHubspotDeliveryFromClaim(first).action, "attempt");
  assert.equal(planHubspotDeliveryFromClaim(second).reason, "claim_not_confirmed");
});
test("expired prior claim requires reconciliation", async () => {
  const { db } = fakeD1({ attempts: 1 });
  const claim = await claimHubspotLeadWithProof(db, args);
  assert.deepEqual(planHubspotDeliveryFromClaim(claim), { action: "block", reason: "reconciliation_required" });
});
test("suppression before claim prevents delivery", async () => {
  const { db } = fakeD1({ suppressed: true });
  const claim = await claimHubspotLeadWithProof(db, args);
  assert.equal(planHubspotDeliveryFromClaim(claim).action, "block");
});
test("suppression discovered after claim prevents delivery", async () => {
  const { db } = fakeD1();
  const claim = await claimHubspotLeadWithProof(db, args);
  assert.equal(planHubspotDeliveryFromClaim(claim, { suppressed: true }).reason, "suppressed");
});

test("malformed claim inputs fail closed without querying D1", async () => {
  for (const overrides of [
    { eventId: "../other" },
    { eventId: "" },
    { leaseToken: "short" },
    { leaseUntil: args.now },
    { leaseUntil: "invalid" },
    { now: "invalid" },
  ]) {
    const { db, state } = fakeD1();
    const claim = await claimHubspotLeadWithProof(db, { ...args, ...overrides });
    assert.deepEqual(claim, { claimed: false, reason: "invalid_input" });
    assert.equal(state.calls, 0);
  }
});
test("unexpected D1 proof cannot authorize delivery", async () => {
  const badRows = [
    { event_id: "wrong", event_type: "lead_upsert", attempts: 1, lease_token: args.leaseToken },
    { event_id: args.eventId, event_type: "other", attempts: 1, lease_token: args.leaseToken },
    { event_id: args.eventId, event_type: "lead_upsert", attempts: 0, lease_token: args.leaseToken },
    { event_id: args.eventId, event_type: "lead_upsert", attempts: 1.5, lease_token: args.leaseToken },
    { event_id: args.eventId, event_type: "lead_upsert", attempts: 1, lease_token: "wrong" },
  ];
  for (const row of badRows) {
    const db = { prepare: () => ({ bind: () => ({ first: async () => row }) }) };
    const claim = await claimHubspotLeadWithProof(db, args);
    assert.equal(claim.reason, "invalid_claim_proof");
    assert.equal(planHubspotDeliveryFromClaim(claim).action, "block");
  }
});
