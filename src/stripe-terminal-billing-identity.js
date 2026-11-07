// Draft-only terminal billing identity guard. Never replaces a user-level
// Stripe Customer/Subscription ID using a cancellation payload. A complete,
// fresh inventory and verified D1 entitlement are required by the caller.
// This is NOT a production executor or connected to the Worker scheduler.
const TERMINAL_STATUSES = new Set(["canceled", "unpaid", "incomplete_expired"]);
const ELIGIBLE = new Set(["active", "trialing", "past_due"]);

export function decideTerminalBillingIdentityUpdate({
  userId, customerId, subscriptionId, currentPlan, inventory,
  existingCustomer, livemode,
} = {}) {
  const defer = reason => ({decision:"defer",reason});
  if (!userId || !customerId?.startsWith("cus_") ||
      !subscriptionId?.startsWith("sub_") ||
      (livemode!==true && livemode!==false) ||
      !inventory || inventory.complete!==true ||
      !Array.isArray(inventory.subscriptions) ||
      !existingCustomer || !["basic","premium","pro"].includes(currentPlan)) {
    return defer("unverified-billing-identity");
  }
  const rows=inventory.subscriptions;
  if (rows.some(row=>row?.userId!==userId || row?.livemode!==livemode ||
      !row?.id?.startsWith("sub_") || !row?.customerId?.startsWith("cus_"))) {
    return defer("inventory-mapping-mismatch");
  }
  const terminal=rows.find(row=>row.id===subscriptionId &&
    row.customerId===customerId && TERMINAL_STATUSES.has(row.status));
  if(!terminal) return defer("terminal-customer-unconfirmed");
  const active=rows.filter(row=>ELIGIBLE.has(String(row.status||"").toLowerCase()));
  if (active.length>0) {
    // A single user row cannot express multiple Stripe Customers. Keep its
    // current identity intact; retention is handled by entitlement policy.
    return {decision:"retain-identity",reason:"active-subscription-exists"};
  }
  if(currentPlan!=="basic") return defer("paid-entitlement-still-present");
  // A cancellation of an old subscription MUST NOT replace a newer Customer
  // or Subscription ID already recorded in stripe_customers.
  if(existingCustomer.stripeCustomerId!==customerId ||
     existingCustomer.stripeSubscriptionId!==subscriptionId) {
    return defer("stored-identity-mismatch");
  }
  if (TERMINAL_STATUSES.has(existingCustomer.subscriptionStatus)) {
    return {decision:"already-terminal"};
  }
  return {decision:"update-status",status:terminal.status};
}

export async function applyTerminalBillingIdentityStatus({
  db,userId,customerId,subscriptionId,status,now,
}={}) {
  if(!db || typeof db.prepare!=="function" ||
     !userId || !customerId?.startsWith("cus_") ||
     !subscriptionId?.startsWith("sub_") ||
     !TERMINAL_STATUSES.has(status) ||
     !Number.isFinite(Date.parse(now))) return {ok:false};
  const result=await prepareTerminalBillingIdentityStatus({db,userId,customerId,subscriptionId,status,now}).run();
  const changed=Number(result?.meta?.changes);
  return Number.isSafeInteger(changed)&&changed>=0
    ? {ok:true,updated:changed===1}
    : {ok:false};
}

export function prepareTerminalBillingIdentityStatus({
  db,userId,customerId,subscriptionId,status,now,
}={}) {
  if(!db || typeof db.prepare!=="function") throw Error("billing-identity-db-unavailable");
  return db.prepare(`
    UPDATE stripe_customers
    SET subscriptionStatus=?1, cancelAtPeriodEnd=0, updatedAt=?2
    WHERE userId=?3 AND stripeCustomerId=?4 AND stripeSubscriptionId=?5
      AND (subscriptionStatus IS NULL OR subscriptionStatus NOT IN
        ('canceled','unpaid','incomplete_expired'))
  `).bind(status,now,userId,customerId,subscriptionId);
}
