// Draft-only atomic referral reward reversal for terminal subscription effects.
// Not registered in a Worker, scheduler, or live executor. Caller must verify
// current Stripe state and ownership before invoking this SQL operation.
// This module executes local D1 SQL only; it NEVER modifies Stripe.
export async function reverseTerminalReferralRewardsAtomically({
  db, userId, now, reason = "entitlement-invalid",
} = {}) {
  if (!db || typeof db.prepare !== "function" || typeof db.batch !== "function" ||
      typeof userId !== "string" || !userId.trim() ||
      typeof now !== "string" || !Number.isFinite(Date.parse(now)) ||
      reason !== "entitlement-invalid") {
    return {ok:false,reason:"invalid-input"};
  }
  // Batch executes both updates as a single D1 transaction. Existing
  // conditional statuses also make a repeat invocation a no-op.
  const statements = [
    db.prepare(`
      UPDATE referral_reward_reviews
      SET status='reversed', reviewedBy='system', reviewedAt=?1,
          decisionReason=?2, updatedAt=?1
      WHERE referredUserId=?3 AND status='approved'
    `).bind(now,reason,userId),
    db.prepare(`
      UPDATE referral_rewards
      SET status='REJECTED', eligibilityReason=?1, updatedAt=?2
      WHERE referredUserId=?3 AND status IN ('ELIGIBLE','APPROVED')
    `).bind(reason,now,userId),
  ];
  const results=await db.batch(statements);
  if (!Array.isArray(results) || results.length!==2 ||
      results.some(x=>!Number.isSafeInteger(Number(x?.meta?.changes)) ||
        Number(x.meta.changes)<0)) {
    throw new Error("referral_atomic_reversal_unconfirmed");
  }
  return {ok:true,
    reviewsReversed:Number(results[0].meta.changes),
    rewardsRejected:Number(results[1].meta.changes)};
}
