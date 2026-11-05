import assert from "node:assert/strict";
import { reviewTerminalStripeEvent } from "../src/stripe-terminal-event-review.js";
const userId="user-test";
const old={id:"sub_old",customerId:"cus_old",userId,livemode:false,status:"canceled",plan:"premium"};
const next={id:"sub_next",customerId:"cus_next",userId,livemode:false,status:"active",plan:"premium"};
const event={type:"customer.subscription.deleted",livemode:false,data:{object:{id:old.id,customer:old.customerId,status:"canceled"}}};
const review=(subscriptions,extra={})=>reviewTerminalStripeEvent({
  event,userId,livemode:false,getCompleteInventory:async()=>({complete:true,subscriptions}),...extra
});
assert.deepEqual(await review([old,next]),{decision:"retain",plan:"premium"});
assert.deepEqual(await review([old]),{decision:"downgrade",plan:"basic"});
assert.deepEqual(await review([next]),{decision:"defer",reason:"terminal-subscription-unconfirmed"});
assert.deepEqual(await review([{...old,userId:"another-user"},next]),
  {decision:"defer",reason:"terminal-subscription-unconfirmed"});
assert.deepEqual(await review([{...old,customerId:"cus_other"},next]),
  {decision:"defer",reason:"terminal-subscription-unconfirmed"});
assert.deepEqual(await review([{...old,status:"active"},next]),
  {decision:"defer",reason:"terminal-subscription-unconfirmed"});
assert.deepEqual(await review([]),{decision:"defer",reason:"terminal-subscription-unconfirmed"});
assert.deepEqual(await review([old],{getCompleteInventory:async()=>({complete:false,subscriptions:[old]})}),
  {decision:"defer",reason:"incomplete-inventory"});
assert.deepEqual(await review([old],{getCompleteInventory:async()=>{throw Error("network");}}),
  {decision:"defer",reason:"inventory-error"});
assert.deepEqual(await review([old],{event:{...event,livemode:true}}),
  {decision:"defer",reason:"unverified-terminal-event"});
assert.deepEqual(await review([old],{event:{...event,data:{object:{...event.data.object,customer:"cus_wrong"}}}}),
  {decision:"defer",reason:"terminal-subscription-unconfirmed"});
assert.deepEqual(await review([old],{event:{...event,type:"checkout.session.completed"}}),
  {decision:"defer",reason:"unverified-terminal-event"});
console.log("Terminal Stripe webhook review isolated tests PASS");
