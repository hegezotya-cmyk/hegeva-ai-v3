import { planHubspotDeliveryFromClaim } from "./hubspot-delivery-policy.js";

// Default-off, read-only, isolated pre-send gate. No HTTP transport or Worker route.
// This is a checkpoint, NOT an atomic guarantee against opt-out during an in-flight send.
export async function checkHubspotPreSend({ enabled = false, claim, userId, db, legalBasisApproved = false, noticeProvided = false } = {}) {
  if (enabled !== true) return { action: "block", reason: "disabled" };
  if (legalBasisApproved !== true || noticeProvided !== true) return { action: "block", reason: "privacy_not_approved" };
  if (typeof userId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(userId)) return { action: "block", reason: "invalid_user" };
  const planned = planHubspotDeliveryFromClaim(claim);
  if (planned.action !== "attempt") return { action: "block", reason: planned.reason };
  if (!db || typeof db.prepare !== "function") return { action: "block", reason: "db_unavailable" };
  let row;
  try {
    row = await db.prepare(`SELECT o.state, o.attempts, o.lease_token,
      o.lease_until, o.user_id,
      EXISTS(SELECT 1 FROM hubspot_lead_suppressions s WHERE s.user_id=o.user_id) AS suppressed
      FROM hubspot_lead_outbox o WHERE o.event_id=?1 AND o.user_id=?2`)
      .bind(claim.eventId, userId).first();
  } catch {
    return { action: "block", reason: "read_failed" };
  }
  if (!row || row.user_id !== userId || row.state !== "leased" ||
      row.attempts !== 1 || row.suppressed !== 0 ||
      typeof claim.leaseToken !== "string" || row.lease_token !== claim.leaseToken ||
      typeof row.lease_token !== "string" || row.lease_token.length < 16 ||
      !Number.isFinite(Date.parse(row.lease_until || "")) ||
      Date.parse(row.lease_until) <= Date.now()) {
    return { action: "block", reason: "lease_or_privacy_unverified" };
  }
  // Never return a transport permission: a separate, approved atomic privacy
  // protocol is still required before any provider write.
  return { action: "manual_review", reason: "pre_send_snapshot_only" };
}
