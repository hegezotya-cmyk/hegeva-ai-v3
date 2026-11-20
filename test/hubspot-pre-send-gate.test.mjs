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
