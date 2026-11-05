import { decideStripeEntitlement } from "./stripe-entitlement-reconciliation-policy.js";

// Proposed decision boundary for signed subscription lifecycle webhooks.
// This is deliberately NOT invoked by index-ledger.js or index.js until
// verified per-user historical Customer mapping and concurrency are solved.
// Never trust an arbitrary event's metadata alone for an entitlement downgrade.
export async function reviewTerminalStripeEvent({
  event, userId, livemode, getCompleteInventory,
} = {}) {
  const terminal = new Set(["canceled", "unpaid", "incomplete_expired"]);
  if (!event || !["customer.subscription.deleted", "customer.subscription.updated"].includes(event.type) ||
      !terminal.has(event.data?.object?.status) ||
      typeof userId !== "string" || !userId ||
      typeof event.data?.object?.id !== "string" ||
      !event.data.object.id.startsWith("sub_") ||
      typeof event.data?.object?.customer !== "string" ||
      !event.data.object.customer.startsWith("cus_") ||
      (livemode !== true && livemode !== false) ||
      event.livemode !== livemode ||
      typeof getCompleteInventory !== "function") {
    return {decision:"defer",reason:"unverified-terminal-event"};
  }
  let inventory;
  try {
    inventory = await getCompleteInventory({userId,livemode});
  } catch {
    return {decision:"defer",reason:"inventory-error"};
  }
  if (!inventory || inventory.complete !== true) {
    return {decision:"defer",reason:"incomplete-inventory"};
  }
  const decision = decideStripeEntitlement({
    userId,livemode,subscriptions:inventory.subscriptions,
    inventoryComplete:inventory.complete
  });
  // A stale inventory omitting the triggering subscription must never revoke.
  if (decision.decision === "downgrade" &&
      !inventory.subscriptions.some(s => s.id === event.data.object.id &&
        s.customerId === event.data.object.customer &&
        s.status === event.data.object.status)) {
    return {decision:"defer",reason:"terminal-subscription-unconfirmed"};
  }
  return decision;
}
