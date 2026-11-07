import { decideStripeEntitlement } from "./stripe-entitlement-reconciliation-policy.js";

// Trusted read-only gate for the DRAFT terminal-effect processor. The source
// of truth is a complete Stripe snapshot, cross-checked with the user's D1
// entitlement and this job's verified webhook ledger identity. Fail closed.
// No scheduler, executor or deployment is enabled by this module.
export async function verifyTerminalEffectCurrentState({
  db, effect, getCompleteInventory,
} = {}) {
  const deny = { currentPlanVerified:false, newerEventsVerified:false, newerEventExists:null };
  if (!db || typeof db.prepare !== "function" ||
      typeof getCompleteInventory !== "function" ||
      !effect || typeof effect.userId !== "string" || !effect.userId ||
      typeof effect.eventId !== "string" || !effect.eventId.startsWith("evt_") ||
      !["billing-and-referral-downgrade","referral-retain"].includes(effect.effectType) ||
      ![0,1].includes(effect.livemode) ||
      typeof effect.subscriptionId !== "string" || !effect.subscriptionId.startsWith("sub_") ||
      typeof effect.customerId !== "string" || !effect.customerId.startsWith("cus_")) return deny;
  let ledger, plan, newer, inventory;
  try {
    // The ledger row proves the outbox task belongs to a reconciled event
    // for the same user. Do not trust the queued userId by itself.
    ledger = await db.prepare(`
      SELECT eventId,eventType,eventCreatedAt
      FROM stripe_webhook_events
      WHERE eventId=?1 AND userId=?2 AND outcome IN ('applied','reconciled')
      LIMIT 1
    `).bind(effect.eventId,effect.userId).first();
    if (!ledger?.eventId ||
        !["customer.subscription.deleted", "customer.subscription.updated"].includes(ledger.eventType) ||
        typeof ledger.eventCreatedAt !== "string" ||
        !Number.isFinite(Date.parse(ledger.eventCreatedAt))) return deny;
    plan = await db.prepare(
      "SELECT plan FROM user_plans WHERE userId=?1 LIMIT 1"
    ).bind(effect.userId).first();
    // Stripe timestamps have second precision; distinct events at the same
    // timestamp may be concurrent. Defer rather than assume their order.
    newer = await db.prepare(`
      SELECT eventId FROM stripe_webhook_events
      WHERE userId=?1 AND eventId<>?2 AND eventCreatedAt>=?3
      LIMIT 1
    `).bind(effect.userId,effect.eventId,ledger.eventCreatedAt).first();
    if (newer?.eventId) {
      return {currentPlanVerified:false,newerEventsVerified:true,newerEventExists:true};
    }
    inventory = await getCompleteInventory({
      userId:effect.userId,livemode:effect.livemode===1,
    });
  } catch {
    return deny;
  }
  if (inventory?.complete !== true || !Array.isArray(inventory.subscriptions)) return deny;
  // A valid user-level plan does NOT prove that the queued terminal event
  // belonged to this subscription. Require exact subscription + Customer ID,
  // mapped user, mode, and a terminal Stripe status before any side effect.
  const terminalStatuses = new Set(["canceled", "unpaid", "incomplete_expired"]);
  const triggeringSubscription = inventory.subscriptions.find(row =>
    row?.id === effect.subscriptionId &&
    row?.customerId === effect.customerId &&
    row?.userId === effect.userId &&
    row?.livemode === (effect.livemode === 1) &&
    terminalStatuses.has(String(row?.status || "").toLowerCase())
  );
  if (!triggeringSubscription) return deny;
  const decision = decideStripeEntitlement({
    userId:effect.userId,livemode:effect.livemode===1,
    inventoryComplete:true,subscriptions:inventory.subscriptions
  });
  if (!["retain","downgrade"].includes(decision.decision) ||
      !["basic","premium","pro"].includes(decision.plan) ||
      decision.plan !== plan?.plan) return deny;
  return {
    currentPlanVerified:true,currentPlan:decision.plan,
    newerEventsVerified:true,newerEventExists:false,
  };
}
