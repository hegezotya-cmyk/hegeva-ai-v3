// Durable D1 outbox state and policy used by the scheduled handler in index-ledger.js.
// Terminal jobs are committed with the plan and webhook ledger; no Stripe writes
// or customer email data are stored in this outbox.
export const TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA = `
CREATE TABLE IF NOT EXISTS stripe_terminal_effect_outbox (
  eventId TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  effectType TEXT NOT NULL CHECK (effectType IN ('billing-and-referral-downgrade','referral-retain')),
  subscriptionId TEXT NOT NULL,
  customerId TEXT NOT NULL,
  livemode INTEGER NOT NULL CHECK(livemode IN (0,1)),
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','processing','completed','blocked')),
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

export const BLOCK_TERMINAL_EFFECT_SQL = `
UPDATE stripe_terminal_effect_outbox
SET state='blocked',leaseUntil=NULL,updatedAt=?1,lastError=?2
WHERE eventId=?3 AND state='processing' AND attempts=?4
`;

// Read-only operational observability for pending or stuck effects.
// Do not log raw eventId/customerId/subscriptionId or userId.
export const TERMINAL_EFFECT_HEALTH_SQL = `
SELECT
  SUM(CASE WHEN state='pending' AND nextAttemptAt <= ?1 THEN 1 ELSE 0 END) AS due,
  SUM(CASE WHEN state='pending' AND nextAttemptAt > ?1 THEN 1 ELSE 0 END) AS scheduled,
  SUM(CASE WHEN state='processing' AND leaseUntil >= ?1 THEN 1 ELSE 0 END) AS running,
  SUM(CASE WHEN state='processing' AND leaseUntil < ?1 THEN 1 ELSE 0 END) AS expiredLeases,
  SUM(CASE WHEN state='blocked' THEN 1 ELSE 0 END) AS blocked,
  SUM(CASE WHEN state='completed' THEN 1 ELSE 0 END) AS completed
FROM stripe_terminal_effect_outbox
`;

export async function readTerminalEffectHealth(db, now = new Date().toISOString()) {
  if (!db || typeof db.prepare !== "function" ||
      typeof now !== "string" || !Number.isFinite(Date.parse(now))) {
    return {verified:false};
  }
  try {
    const row = await db.prepare(TERMINAL_EFFECT_HEALTH_SQL)
      .bind(new Date(now).toISOString()).first();
    if (!row) return {verified:false};
    const result = {verified:true};
    for (const key of ["due","scheduled","running","expiredLeases","blocked","completed"]) {
      const n=Number(row[key]??0);
      if (!Number.isSafeInteger(n) || n<0) return {verified:false};
      result[key]=n;
    }
    result.attentionRequired=result.blocked>0 || result.expiredLeases>0;
    return result;
  } catch {
    return {verified:false};
  }
}
