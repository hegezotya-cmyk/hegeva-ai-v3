// Pure delivery decisions only. No database, network, timers or personal-data logs.
// The production outbox must enforce unique event IDs transactionally in D1.
export function planHubspotDelivery({ eventId, eventType, suppressed = false, alreadyDelivered = false, attempts = 0, status = null } = {}) {
  if (typeof eventId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(eventId)) return { action: "block", reason: "invalid_event_id" };
  if (eventType !== "lead_upsert") return { action: "block", reason: "unsupported_event" };
  if (suppressed) return { action: "block", reason: "suppressed" };
  if (alreadyDelivered) return { action: "skip", reason: "duplicate" };
  if (!Number.isSafeInteger(attempts) || attempts < 0) return { action: "block", reason: "invalid_attempts" };
  if (attempts >= 5) return { action: "block", reason: "attempts_exhausted" };
  // D1 attempt counters survive crashes. Never blindly resend after a prior claim.
  if (attempts > 0) return { action: "block", reason: "reconciliation_required" };
  if (status === null) return { action: "attempt", reason: "new" };
  if (status === 429 || (Number.isInteger(status) && status >= 500 && status <= 599)) {
    return { action: "block", reason: "reconciliation_required" };
  }
  return { action: "block", reason: "permanent_failure" };
}

// D1 increments attempts atomically at claim time. A newly claimed event with
// attempts === 1 is the only claim eligible for its first send. An expired
// lease or any subsequent claim requires provider reconciliation first.
export function planClaimedHubspotDelivery({ eventId, eventType, suppressed = false, claimSucceeded = false, claimAttempts } = {}) {
  if (typeof eventId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(eventId)) return { action: "block", reason: "invalid_event_id" };
  if (eventType !== "lead_upsert") return { action: "block", reason: "unsupported_event" };
  if (suppressed) return { action: "block", reason: "suppressed" };
  if (claimSucceeded !== true) return { action: "block", reason: "claim_not_confirmed" };
  if (!Number.isSafeInteger(claimAttempts) || claimAttempts < 1) return { action: "block", reason: "invalid_claim_attempts" };
  if (claimAttempts !== 1) return { action: "block", reason: "reconciliation_required" };
  return { action: "attempt", reason: "first_claim" };
}
