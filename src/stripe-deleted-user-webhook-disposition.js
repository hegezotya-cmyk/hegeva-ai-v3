// Staging-only, opt-in disposition for signed TEST Stripe events referring to
// an already deleted HEGEVA auth user. Invoked ONLY after webhook signature and
// livemode verification in index-ledger.js. Not a general billing-grant path.
const STAGING_ORIGIN = "https://staging.hegevaai.co.uk";
const TRACKED_TYPES = new Set([
  "checkout.session.completed",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export function deletedUserWebhookGuardEnabled(env) {
  return String(env?.HEGEVA_DELETED_USER_WEBHOOK_GUARD_ENABLED || "")
    .trim().toLowerCase() === "true";
}

function userMetadata(event) {
  const object = event?.data?.object;
  if (!object || typeof object !== "object") return {};
  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    return object.parent?.subscription_details?.metadata ||
      object.subscription_details?.metadata || {};
  }
  return object.metadata || {};
}

const TOMBSTONE = `
  SELECT t.userId, u.id AS liveUserId
  FROM hegeva_deleted_user_tombstones t
  LEFT JOIN "user" u ON u.id = t.userId
  WHERE t.userId = ?1 LIMIT 1
`;
const RECORD = `
  INSERT INTO stripe_webhook_events
    (eventId,eventType,userId,plan,eventCreatedAt,processedAt,outcome)
  SELECT ?1,?2,t.userId,?3,?4,?5,'ignored'
  FROM hegeva_deleted_user_tombstones t
  WHERE t.userId = ?6
    AND NOT EXISTS (SELECT 1 FROM "user" WHERE id=t.userId)
  ON CONFLICT(eventId) DO NOTHING
`;
const LEDGER = `
  SELECT userId,eventType,outcome
  FROM stripe_webhook_events WHERE eventId=?1 LIMIT 1
`;

// Return {handled:false} to keep existing webhook flow when there is no
// tombstone. Never synthesize tombstones from untrusted Stripe metadata.
// D1's conditional INSERT is atomic and eventId-unique; it only records a
// signed, mode-verified event for a verified already-deleted auth account.
export async function dispositionForDeletedTestUser({
  db, event, paymentMode, publicAppUrl, now = new Date().toISOString(),
} = {}) {
  if (paymentMode !== "test" || publicAppUrl !== STAGING_ORIGIN ||
      !db || typeof db.prepare !== "function" || event?.livemode !== false ||
      event?.object !== "event") {
    throw new Error("deleted-user-guard-context-invalid");
  }
  if (!TRACKED_TYPES.has(event.type)) return { handled: false };
  const metadata = userMetadata(event);
  const userId = typeof metadata.userId === "string" ? metadata.userId.trim() : "";
  if (!userId) return { handled: false };
  const eventId = typeof event.id === "string" ? event.id.trim() : "";
  if (!/^evt_[A-Za-z0-9]+$/.test(eventId) ||
      !Number.isSafeInteger(event.created) || event.created <= 0 ||
      !Number.isFinite(Date.parse(now))) {
    throw new Error("deleted-user-guard-event-invalid");
  }
  const tombstone = await db.prepare(TOMBSTONE).bind(userId).first();
  if (!tombstone) return { handled: false };
  if (tombstone.liveUserId) {
    // A recreated identity with an old tombstone requires manual review.
    throw new Error("deleted-user-guard-identity-conflict");
  }

  const candidatePlan = typeof metadata.hegevaPlan === "string" ?
    metadata.hegevaPlan.trim().toLowerCase() : "";
  const plan = ["basic", "premium", "pro"].includes(candidatePlan) ?
    candidatePlan : null;
  const createdAt = new Date(event.created * 1000).toISOString();
  const result = await db.prepare(RECORD)
    .bind(eventId, event.type, plan, createdAt, now, userId).run();
  const changes = Number(result?.meta?.changes ?? result?.changes);
  if (!Number.isSafeInteger(changes) || changes < 0 || changes > 1) {
    throw new Error("deleted-user-guard-write-unconfirmed");
  }
  const ledger = await db.prepare(LEDGER).bind(eventId).first();
  if (!ledger || ledger.userId !== userId ||
      ledger.eventType !== event.type ||
      !["applied", "ignored"].includes(ledger.outcome)) {
    // No 2xx acknowledgment for an unconfirmed or conflicting event.
    throw new Error("deleted-user-guard-ledger-conflict");
  }
  if (changes === 0 && ledger.outcome === "applied") {
    // Event legitimately applied before the user was deleted: don't rewrite
    // its audit outcome; do not perform any further billing mutations.
    return { handled: true, duplicate: true, ignored: false };
  }
  return { handled: true, duplicate: changes === 0, ignored: true };
}
