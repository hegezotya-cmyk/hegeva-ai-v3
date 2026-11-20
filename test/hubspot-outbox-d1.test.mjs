import test from "node:test";
import assert from "node:assert/strict";
import { enqueueHubspotLead, claimHubspotLead, suppressHubspotLead, finalizeHubspotLead } from "../src/hubspot-outbox-d1.js";
const now = "2026-11-20T10:00:00.000Z";
const consent = userId => ({ enabled: true, purpose: "hegeva_sales_followup", legalBasisApproved: true, noticeProvided: true, user: { id: userId, email: "lead@example.com", emailVerified: true } });
function fakeDb(changes = 1) {
  const calls = [];
  const db = {
    prepare(sql) { const call = { sql, params: [] }; calls.push(call); return { bind(...params) { call.params = params; return { run: async () => ({ meta: { changes } }) }; } }; },
    async batch(statements) { assert.equal(statements.length, 2); return statements.map(() => ({ success: true })); },
  };
  return { db, calls };
}
test("enqueue uses atomic insert and suppression exclusion", async () => {
  const { db, calls } = fakeDb();
  assert.deepEqual(await enqueueHubspotLead(db, { eventId: "evt_1", userId: "user1", now, ...consent("user1") }), { enqueued: true, reason: "queued" });
  assert.match(calls[0].sql, /INSERT OR IGNORE/);
  assert.match(calls[0].sql, /NOT EXISTS.*hubspot_lead_suppressions/s);
  assert.deepEqual(calls[0].params, ["evt_1", "user1", now]);
});
test("duplicate or suppressed enqueue is not reported as success", async () => {
  assert.equal((await enqueueHubspotLead(fakeDb(0).db, { eventId: "evt_1", userId: "u", now, ...consent("u") })).enqueued, false);
});
test("invalid event id never touches DB", async () => {
  const { db, calls } = fakeDb();
  assert.equal((await enqueueHubspotLead(db, { eventId: "../bad", userId: "u", now, ...consent("u") })).reason, "invalid_input");
  assert.equal(calls.length, 0);
});
test("claim is conditional and increments attempts", async () => {
  const { db, calls } = fakeDb();
  const result = await claimHubspotLead(db, { eventId: "evt_1", now, leaseUntil: "2026-11-20T10:01:00.000Z", leaseToken: "lease_1234567890123456" });
  assert.equal(result.claimed, true);
  assert.match(calls[0].sql, /attempts=attempts\+1/);
  assert.match(calls[0].sql, /attempts<5/);
  assert.match(calls[0].sql, /lease_until<=\?2/);
});
test("invalid lease duration never claims", async () => {
  const { db, calls } = fakeDb();
  assert.equal((await claimHubspotLead(db, { eventId: "evt_1", now, leaseUntil: now, leaseToken: "lease_1234567890123456" })).reason, "invalid_input");
  assert.equal(calls.length, 0);
});
test("failed claim reports not claimable", async () => {
  assert.equal((await claimHubspotLead(fakeDb(0).db, { eventId: "evt_1", now, leaseUntil: "2026-11-20T10:01:00.000Z", leaseToken: "lease_1234567890123456" })).claimed, false);
});
test("suppression batches marker and outbox transition", async () => {
  const { db, calls } = fakeDb();
  assert.equal((await suppressHubspotLead(db, { userId: "u", reason: "opt_out", now })).suppressed, true);
  assert.equal(calls.length, 2);
  assert.match(calls[0].sql, /hubspot_lead_suppressions/);
  assert.match(calls[1].sql, /state='suppressed'/);
});
test("invalid suppression reason fails closed", async () => {
  const { db, calls } = fakeDb();
  assert.equal((await suppressHubspotLead(db, { userId: "u", reason: "marketing", now })).reason, "invalid_input");
  assert.equal(calls.length, 0);
});

test("finalize uses fencing token and suppression guard", async () => {
  const { db, calls } = fakeDb();
  const result = await finalizeHubspotLead(db, { eventId: "evt_1", leaseToken: "lease_1234567890123456", now, outcome: "delivered" });
  assert.equal(result.finalized, true);
  assert.match(calls[0].sql, /lease_token=\?2/);
  assert.match(calls[0].sql, /NOT EXISTS.*hubspot_lead_suppressions/s);
});
test("stale finalization cannot claim success", async () => {
  const result = await finalizeHubspotLead(fakeDb(0).db, { eventId: "evt_1", leaseToken: "lease_1234567890123456", now, outcome: "delivered" });
  assert.equal(result.reason, "stale_or_suppressed");
});
test("retry requires a future timestamp", async () => {
  const result = await finalizeHubspotLead(fakeDb().db, { eventId: "evt_1", leaseToken: "lease_1234567890123456", now, outcome: "retry", nextAttemptAt: now });
  assert.equal(result.reason, "invalid_input");
});

test("enqueue without explicit legal basis fails closed", async () => {
  const { db, calls } = fakeDb();
  const result = await enqueueHubspotLead(db, { eventId: "evt_2", userId: "u", now });
  assert.equal(result.enqueued, false);
  assert.equal(result.reason, "disabled");
  assert.equal(calls.length, 0);
});
test("enqueue refuses mismatched user identity", async () => {
  const { db, calls } = fakeDb();
  const result = await enqueueHubspotLead(db, { eventId: "evt_2", userId: "other", now, ...consent("u") });
  assert.equal(result.reason, "identity_mismatch");
  assert.equal(calls.length, 0);
});
test("enqueue refuses unverified email", async () => {
  const { db, calls } = fakeDb();
  const gate = consent("u");
  gate.user.emailVerified = false;
  const result = await enqueueHubspotLead(db, { eventId: "evt_2", userId: "u", now, ...gate });
  assert.equal(result.reason, "unverified");
  assert.equal(calls.length, 0);
});
