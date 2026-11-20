import test from "node:test";
import assert from "node:assert/strict";
import { checkHubspotPreSend } from "../src/hubspot-pre-send-gate.js";

const claim = { claimed: true, eventId: "evt_synthetic", eventType: "lead_upsert", claimAttempts: 1, leaseToken: "synthetic_token_123456" };
const userId = "synthetic_user";
const good = { user_id: userId, state: "leased", attempts: 1, lease_token: "synthetic_token_123456", lease_until: "2099-01-01T00:00:00Z", suppressed: 0 };
const db = row => ({ prepare(sql) {
  assert.match(sql, /hubspot_lead_suppressions/);
  return { bind(eventId, id) {
    assert.equal(eventId, claim.eventId); assert.equal(id, userId);
    return { first: async () => row };
  } };
} });
const opts = { enabled: true, claim, userId, legalBasisApproved: true, noticeProvided: true };
test("disabled by default", async () => assert.equal((await checkHubspotPreSend({ claim, userId, db: db(good) })).reason, "disabled"));
test("privacy approvals mandatory", async () => assert.equal((await checkHubspotPreSend({ ...opts, legalBasisApproved: false, db: db(good) })).reason, "privacy_not_approved"));
test("no D1 read when claim is unproven", async () => assert.equal((await checkHubspotPreSend({ ...opts, claim: { claimed: false }, db: db(good) })).reason, "claim_not_confirmed"));
test("suppressed user blocks", async () => assert.equal((await checkHubspotPreSend({ ...opts, db: db({ ...good, suppressed: 1 }) })).reason, "lease_or_privacy_unverified"));
test("expired lease blocks", async () => assert.equal((await checkHubspotPreSend({ ...opts, db: db({ ...good, lease_until: "2020-01-01T00:00:00Z" }) })).reason, "lease_or_privacy_unverified"));
test("stale attempts block", async () => assert.equal((await checkHubspotPreSend({ ...opts, db: db({ ...good, attempts: 2 }) })).reason, "lease_or_privacy_unverified"));
test("missing row blocks", async () => assert.equal((await checkHubspotPreSend({ ...opts, db: db(null) })).reason, "lease_or_privacy_unverified"));
test("D1 errors fail closed", async () => assert.equal((await checkHubspotPreSend({ ...opts, db: { prepare() { throw Error("secret"); } } })).reason, "read_failed"));
test("matching read-only snapshot still cannot authorize send", async () => assert.deepEqual(await checkHubspotPreSend({ ...opts, db: db(good) }), { action: "manual_review", reason: "pre_send_snapshot_only" }));

test("different worker lease token blocks even if lease is otherwise valid", async () => {
  const result = await checkHubspotPreSend({ ...opts, claim: { ...claim, leaseToken: "other_worker_lease_1234" }, db: db(good) });
  assert.deepEqual(result, { action: "block", reason: "lease_or_privacy_unverified" });
});
test("missing claim lease proof blocks", async () => {
  const result = await checkHubspotPreSend({ ...opts, claim: { ...claim, leaseToken: undefined }, db: db(good) });
  assert.equal(result.action, "block");
});

test("non-boolean pre-send flags cannot reach D1", async () => {
  for (const field of ["enabled", "legalBasisApproved", "noticeProvided"]) {
    for (const value of ["true", 1, {}, []]) {
      let read = false;
      const guardedDb = { prepare() { read = true; throw Error("unexpected read"); } };
      const result = await checkHubspotPreSend({ ...opts, [field]: value, db: guardedDb });
      assert.equal(result.action, "block");
      assert.equal(read, false);
    }
  }
});
