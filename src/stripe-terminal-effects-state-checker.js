import { collectStripeUserSubscriptions } from "./stripe-subscription-inventory.js";
import { verifyTerminalEffectCurrentState } from "./stripe-terminal-effects-state-verifier.js";

// Trusted read-only adapter for the draft outbox processor. This module does
// not execute side effects, run migrations, register cron, or write to D1.
export function createStripeTerminalStateChecker({
  db, secretKey, paymentMode, fetchImpl,
} = {}) {
  const livemode=paymentMode==="live";
  if (!db || typeof db.prepare!=="function" ||
      !["live","test"].includes(paymentMode) ||
      typeof secretKey!=="string" ||
      !secretKey.startsWith(livemode?"sk_live_":"sk_test_") ||
      typeof fetchImpl!=="function") {
    return async()=>({
      currentPlanVerified:false,newerEventsVerified:false,newerEventExists:null
    });
  }
  return async effect=>{
    if (!effect || effect.livemode!==(livemode?1:0)) {
      return {currentPlanVerified:false,newerEventsVerified:false,newerEventExists:null};
    }
    return verifyTerminalEffectCurrentState({
      db,effect,
      getCompleteInventory:({userId,livemode:mode})=>
        collectStripeUserSubscriptions({
          userId,livemode:mode,secretKey,fetchImpl
        })
    });
  };
}
