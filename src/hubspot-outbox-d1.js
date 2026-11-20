import { hubspotLeadEligibility } from "./hubspot-lead-policy.js";
// Isolated D1 outbox operations. No endpoint or scheduled handler imports this module.
// Schema: docs/integrations/hubspot-outbox-schema-DRAFT.sql
const validId = value => typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const validLease = value => validId(value) && value.length >= 16;
const validUser = value => typeof value === "string" && value.length > 0 && value.length <= 256;
const changed = result => Number(result?.meta?.changes ?? 0) === 1;

// INSERT OR IGNORE is atomic under D1 unique event_id, and suppression is
// checked in the same statement. Legal-basis/notice gating is enforced here.
export async function enqueueHubspotLead(db, { eventId, userId, now, enabled = false, purpose, legalBasisApproved = false, noticeProvided = false, suppressed = false, user } = {}) {
  const eligibility = hubspotLeadEligibility({ enabled, purpose, legalBasisApproved, noticeProvided, suppressed, user });
  if (!eligibility.eligible) return { enqueued: false, reason: eligibility.reason };
  if (userId !== user.id) return { enqueued: false, reason: "identity_mismatch" };
  if (!validId(eventId) || !validUser(userId) || !Number.isFinite(Date.parse(now || ""))) return { enqueued: false, reason: "invalid_input" };
  const result = await db.prepare(`INSERT OR IGNORE INTO hubspot_lead_outbox
    (event_id,user_id,event_type,state,attempts,next_attempt_at,created_at,updated_at)
    SELECT ?1,?2,'lead_upsert','pending',0,?3,?3,?3
    WHERE NOT EXISTS (SELECT 1 FROM hubspot_lead_suppressions WHERE user_id=?2)`)
    .bind(eventId, userId, now).run();
  return { enqueued: changed(result), reason: changed(result) ? "queued" : "duplicate_or_suppressed" };
}

// Atomic claim prevents two processors from claiming the same pending event.
// The processor MUST recheck suppression and account eligibility before any send.
export async function claimHubspotLead(db, { eventId, now, leaseUntil, leaseToken } = {}) {
  if (!validId(eventId) || !validLease(leaseToken) || !Number.isFinite(Date.parse(now || "")) || !Number.isFinite(Date.parse(leaseUntil || "")) || Date.parse(leaseUntil) <= Date.parse(now)) return { claimed: false, reason: "invalid_input" };
  const result = await db.prepare(`UPDATE hubspot_lead_outbox
    SET state='leased',lease_until=?3,lease_token=?4,updated_at=?2,attempts=attempts+1
    WHERE event_id=?1 AND attempts<5 AND
      ((state='pending' AND (next_attempt_at IS NULL OR next_attempt_at<=?2))
        OR (state='leased' AND lease_until<=?2))
      AND NOT EXISTS (SELECT 1 FROM hubspot_lead_suppressions s WHERE s.user_id=hubspot_lead_outbox.user_id)`)
    .bind(eventId, now, leaseUntil, leaseToken).run();
  return { claimed: changed(result), reason: changed(result) ? "claimed" : "not_claimable" };
}

// An explicit opt-out persists even if the outbox row is removed.
// Must run in a D1 transaction/batch with relevant outbox suppression.
export async function suppressHubspotLead(db, { userId, reason, now } = {}) {
  if (!validUser(userId) || !["opt_out","erasure","legal_hold"].includes(reason) || !Number.isFinite(Date.parse(now || ""))) return { suppressed: false, reason: "invalid_input" };
  await db.batch([
    db.prepare("INSERT INTO hubspot_lead_suppressions(user_id,reason,created_at) VALUES(?1,?2,?3) ON CONFLICT(user_id) DO NOTHING").bind(userId, reason, now),
    db.prepare("UPDATE hubspot_lead_outbox SET state='suppressed',lease_until=NULL,lease_token=NULL,updated_at=?2 WHERE user_id=?1 AND state IN ('pending','leased','failed')").bind(userId, now),
  ]);
  return { suppressed: true, reason: "recorded" };
}

 // Finalization is fenced by the unique claim token, not just an event ID.
 // The owner of an expired lease cannot overwrite a later processor's result.
export async function finalizeHubspotLead(db, { eventId, leaseToken, now, outcome, nextAttemptAt = null } = {}) {
  if (!validId(eventId) || !validLease(leaseToken) || !Number.isFinite(Date.parse(now || "")) ||
      !["delivered", "retry", "failed"].includes(outcome) ||
      (outcome === "retry" && (!Number.isFinite(Date.parse(nextAttemptAt || "")) || Date.parse(nextAttemptAt) <= Date.parse(now)))) {
    return { finalized: false, reason: "invalid_input" };
  }
  const state = outcome === "retry" ? "pending" : outcome;
  const result = await db.prepare(`UPDATE hubspot_lead_outbox
    SET state=?3,lease_until=NULL,lease_token=NULL,
        next_attempt_at=?4,delivered_at=CASE WHEN ?3='delivered' THEN ?5 ELSE delivered_at END,
        updated_at=?5
    WHERE event_id=?1 AND lease_token=?2 AND state='leased' AND lease_until>?5
      AND NOT EXISTS (SELECT 1 FROM hubspot_lead_suppressions s WHERE s.user_id=hubspot_lead_outbox.user_id)`)
    .bind(eventId, leaseToken, state, outcome === "retry" ? nextAttemptAt : null, now).run();
  return { finalized: changed(result), reason: changed(result) ? "finalized" : "stale_or_suppressed" };
}

// Experimental proof-bearing claim. UPDATE ... RETURNING reads the post-claim
// counter from the same atomic SQL statement, never a separate SELECT.
// Not wired to a Worker route, cron or HubSpot transport.
export async function claimHubspotLeadWithProof(db, { eventId, now, leaseUntil, leaseToken } = {}) {
  if (!validId(eventId) || !validLease(leaseToken) ||
      !Number.isFinite(Date.parse(now || "")) || !Number.isFinite(Date.parse(leaseUntil || "")) ||
      Date.parse(leaseUntil) <= Date.parse(now)) return { claimed: false, reason: "invalid_input" };
  const row = await db.prepare(`UPDATE hubspot_lead_outbox
    SET state='leased',lease_until=?3,lease_token=?4,updated_at=?2,attempts=attempts+1
    WHERE event_id=?1 AND attempts<5 AND
      ((state='pending' AND (next_attempt_at IS NULL OR next_attempt_at<=?2))
        OR (state='leased' AND lease_until<=?2))
      AND NOT EXISTS (SELECT 1 FROM hubspot_lead_suppressions s WHERE s.user_id=hubspot_lead_outbox.user_id)
    RETURNING event_id,event_type,attempts,lease_token`)
    .bind(eventId, now, leaseUntil, leaseToken).first();
  if (!row) return { claimed: false, reason: "not_claimable" };
  if (row.event_id !== eventId || row.event_type !== "lead_upsert" ||
      row.lease_token !== leaseToken || !Number.isSafeInteger(row.attempts) || row.attempts < 1) {
    return { claimed: false, reason: "invalid_claim_proof" };
  }
  return { claimed: true, reason: "claimed", eventId, eventType: row.event_type, claimAttempts: row.attempts };
}
