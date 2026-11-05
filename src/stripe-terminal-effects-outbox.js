// Draft durable side-effect outbox. Not wired to production or staging.
// Each terminal event needs a durable job, committed in the same transaction
// as the user plan and Stripe event ledger. No emails/customer metadata stored.
export const TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA = `
CREATE TABLE IF NOT EXISTS stripe_terminal_effect_outbox (
  eventId TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  effectType TEXT NOT NULL CHECK (effectType IN ('billing-and-referral-downgrade','referral-retain')),
  subscriptionId TEXT NOT NULL,
  customerId TEXT NOT NULL,
  livemode INTEGER NOT NULL CHECK(livemode IN (0,1)),
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','processing','completed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  nextAttemptAt TEXT NOT NULL,
  leaseUntil TEXT,
  lastError TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stripe_terminal_effect_due
 ON stripe_terminal_effect_outbox(state, nextAttemptAt);
`;

export function effectForDecision(decision, entitlementChanged) {
  if (decision === "downgrade") return "billing-and-referral-downgrade";
  if (decision === "retain" && entitlementChanged === true) return "referral-retain";
  return null;
}

export function prepareTerminalEffect({eventId,userId,subscriptionId,customerId,livemode,effectType,now}) {
  if (![eventId,userId,subscriptionId,customerId,now].every(v=>typeof v==="string" && !!v.trim()) ||
      !eventId.startsWith("evt_") || !subscriptionId.startsWith("sub_") ||
      !customerId.startsWith("cus_") ||
      (livemode !== true && livemode !== false) ||
      !["billing-and-referral-downgrade","referral-retain"].includes(effectType)) {
    return null;
  }
  return {
    sql: `INSERT INTO stripe_terminal_effect_outbox
    (eventId,userId,effectType,subscriptionId,customerId,livemode,nextAttemptAt,createdAt,updatedAt)
    VALUES (?1,?2,?3,?4,?5,?6,?7,?7,?7)
    ON CONFLICT(eventId) DO NOTHING`,
    values:[eventId,userId,effectType,subscriptionId,customerId,livemode?1:0,now]
  };
}

// Lease acquisition prevents two workers from claiming a currently active
// attempt. If the worker crashes, the lease may be recovered after expiration.
// Completing the job is conditional on worker-held lease identity at the
// future integration boundary; this module does not execute effects.
export const CLAIM_TERMINAL_EFFECT_SQL = `
UPDATE stripe_terminal_effect_outbox
SET state = 'processing', leaseUntil = ?1, attempts = attempts + 1,
    updatedAt = ?2
WHERE eventId = ?3
  AND nextAttemptAt <= ?2
  AND (state = 'pending' OR (state = 'processing' AND leaseUntil < ?2))
`;
export const COMPLETE_TERMINAL_EFFECT_SQL = `
UPDATE stripe_terminal_effect_outbox SET state='completed',
  leaseUntil=NULL, updatedAt=?1, lastError=NULL
WHERE eventId=?2 AND state='processing' AND attempts=?3
`;
export const RETRY_TERMINAL_EFFECT_SQL = `
UPDATE stripe_terminal_effect_outbox SET state='pending',
  leaseUntil=NULL, nextAttemptAt=?1, updatedAt=?2, lastError=?3
WHERE eventId=?4 AND state='processing' AND attempts=?5
`;

// A delayed outbox job may no longer reflect the account's current state.
// This pure gate is invoked BEFORE a future side-effect executor. Refuse any
// effect based on an incomplete current entitlement check or newer ledger event.
export function reviewTerminalEffectExecution({
  effect, currentPlan, currentPlanVerified, newerEventExists, newerEventsVerified,
} = {}) {
  if (!effect || currentPlanVerified !== true || newerEventsVerified !== true ||
      newerEventExists !== false ||
      !["basic", "premium", "pro"].includes(currentPlan)) {
    return { decision: "defer", reason: "current-state-unverified" };
  }
  if (effect.effectType === "billing-and-referral-downgrade") {
    return currentPlan === "basic"
      ? { decision: "run" }
      : { decision: "skip", reason: "paid-entitlement-restored" };
  }
  if (effect.effectType === "referral-retain") {
    return ["premium", "pro"].includes(currentPlan)
      ? { decision: "run" }
      : { decision: "skip", reason: "paid-entitlement-no-longer-active" };
  }
  return { decision: "defer", reason: "unrecognized-effect" };
}
