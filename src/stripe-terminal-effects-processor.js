import {
  CLAIM_TERMINAL_EFFECT_SQL, COMPLETE_TERMINAL_EFFECT_SQL,
  RETRY_TERMINAL_EFFECT_SQL, reviewTerminalEffectExecution
} from "./stripe-terminal-effects-outbox.js";

// Candidate on-demand processor; deliberately NOT scheduled / registered in Worker.
// Caller MUST provide a trusted current-state verifier, an idempotent executor,
// and an explicitly authorized database. No Stripe writes are performed here.
const SELECT_DUE = `
SELECT eventId, userId, effectType, subscriptionId, customerId, livemode,
       attempts, nextAttemptAt, leaseUntil
FROM stripe_terminal_effect_outbox
WHERE nextAttemptAt <= ?1
 AND (state='pending' OR (state='processing' AND leaseUntil < ?1))
ORDER BY nextAttemptAt, eventId LIMIT 1`;
const SELECT_CLAIMED = `
SELECT eventId, userId, effectType, subscriptionId, customerId, livemode, attempts
FROM stripe_terminal_effect_outbox
WHERE eventId = ?1 AND state='processing' AND attempts=?2`;

export async function processNextTerminalEffect({
  db, now, checkCurrentState, executeIdempotently, leaseMs = 60000
} = {}) {
  if (!db || typeof db.prepare !== "function" ||
      typeof now !== "string" || !Number.isFinite(Date.parse(now)) ||
      typeof checkCurrentState !== "function" ||
      typeof executeIdempotently !== "function" ||
      !Number.isInteger(leaseMs) || leaseMs < 1000 || leaseMs > 300000) {
    return {status:"invalid-input"};
  }
  const iso=new Date(now).toISOString();
  const candidate=await db.prepare(SELECT_DUE).bind(iso).first();
  if (!candidate) return {status:"empty"};
  const leaseUntil=new Date(Date.parse(iso)+leaseMs).toISOString();
  const acquired=await db.prepare(CLAIM_TERMINAL_EFFECT_SQL)
    .bind(leaseUntil,iso,candidate.eventId).run();
  if (Number(acquired?.meta?.changes)!==1) return {status:"contended"};
  const attempt=Number(candidate.attempts)+1;
  const claimed=await db.prepare(SELECT_CLAIMED).bind(candidate.eventId,attempt).first();
  if (!claimed) return {status:"unconfirmed-claim"};
  const defer=async reason=>{
    const delay=Math.min(3600,30*(2**Math.min(attempt-1,7)));
    const retryAt=new Date(Date.parse(iso)+delay*1000).toISOString();
    const result=await db.prepare(RETRY_TERMINAL_EFFECT_SQL)
      .bind(retryAt,iso,reason,claimed.eventId,attempt).run();
    return {status:Number(result?.meta?.changes)===1?"retry-scheduled":"lease-lost"};
  };
  let check;
  try {
    check=await checkCurrentState(claimed);
  } catch {
    return defer("state-check-error");
  }
  const policy=reviewTerminalEffectExecution({effect:claimed,...check});
  if (policy.decision==="defer") return defer("state-unverified");
  if (policy.decision==="run") {
    try {
      // Executions MUST be idempotent by eventId; the lease cannot guarantee
      // exactly-once external effects after a crash or expired lease.
      await executeIdempotently({...claimed,idempotencyKey:claimed.eventId});
    } catch {
      return defer("effect-error");
    }
  }
  const completed=await db.prepare(COMPLETE_TERMINAL_EFFECT_SQL)
    .bind(iso,claimed.eventId,attempt).run();
  return {status:Number(completed?.meta?.changes)===1
      ? (policy.decision==="run"?"completed":"skipped-stale")
      : "lease-lost"};
}
