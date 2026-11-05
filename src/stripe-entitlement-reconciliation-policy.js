// Pure entitlement reconciliation policy for Stripe subscriptions.
// Intentionally not wired into production webhook processing until a complete,
// authoritative userId-scoped Stripe subscription inventory is available.
export const ACCESS_ELIGIBLE_STATUSES = Object.freeze(["active", "trialing", "past_due"]);
const TERMINAL_STATUSES = new Set(["canceled", "unpaid", "incomplete_expired"]);
const PLANS = new Set(["premium", "pro"]);

export function decideStripeEntitlement({ userId, subscriptions, inventoryComplete, livemode } = {}) {
  if (typeof userId !== "string" || !userId.trim() ||
      inventoryComplete !== true || !Array.isArray(subscriptions) ||
      (livemode !== true && livemode !== false)) {
    return { decision: "defer", reason: "unverified-inventory" };
  }

  // A verified empty inventory may mean no active subscriptions, but only when
  // produced by an authoritative, fully paginated Stripe account scan.
  const seen = new Set();
  let premium = false;
  let pro = false;
  for (const subscription of subscriptions) {
    if (!subscription || typeof subscription !== "object" ||
        subscription.userId !== userId ||
        subscription.livemode !== livemode ||
        typeof subscription.id !== "string" || !subscription.id.startsWith("sub_") ||
        typeof subscription.customerId !== "string" || !subscription.customerId.startsWith("cus_") ||
        !subscription.status || typeof subscription.status !== "string") {
      return { decision: "defer", reason: "invalid-inventory-entry" };
    }
    if (seen.has(subscription.id)) return { decision: "defer", reason: "duplicate-subscription-id" };
    seen.add(subscription.id);
    const status = subscription.status.toLowerCase();
    const plan = String(subscription.plan || "").toLowerCase();
    if (ACCESS_ELIGIBLE_STATUSES.includes(status)) {
      if (!PLANS.has(plan)) return { decision: "defer", reason: "unknown-active-plan" };
      if (plan === "premium") premium = true;
      if (plan === "pro") pro = true;
    } else if (!TERMINAL_STATUSES.has(status) && !["incomplete", "paused"].includes(status)) {
      return { decision: "defer", reason: "unknown-subscription-status" };
    }
  }
  // Never downgrade on the basis of a single cancellation event.
  if (pro) return { decision: "retain", plan: "pro" };
  if (premium) return { decision: "retain", plan: "premium" };
  return { decision: "downgrade", plan: "basic" };
}
