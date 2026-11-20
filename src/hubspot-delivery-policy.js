// Pure delivery decisions only. No database, network, timers or personal-data logs.
// The production outbox must enforce unique event IDs transactionally in D1.
export function planHubspotDelivery({ eventId, eventType, suppressed = false, alreadyDelivered = false, attempts = 0, status = null } = {}) {
  if (typeof eventId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(eventId)) return { action: "block", reason: "invalid_event_id" };
  if (eventType !== "lead_upsert") return { action: "block", reason: "unsupported_event" };
  if (suppressed) return { action: "block", reason: "suppressed" };
  if (alreadyDelivered) return { action: "skip", reason: "duplicate" };
  if (!Number.isSafeInteger(attempts) || attempts < 0) return { action: "block", reason: "invalid_attempts" };
  if (attempts >= 5) return { action: "block", reason: "attempts_exhausted" };
  if (status === null) return { action: "attempt", reason: "new" };
  if (status === 429 || (Number.isInteger(status) && status >= 500 && status <= 599)) {
    return { action: "retry", reason: "transient_failure", delaySeconds: Math.min(3600, 30 * 2 ** attempts) };
  }
  return { action: "block", reason: "permanent_failure" };
}
