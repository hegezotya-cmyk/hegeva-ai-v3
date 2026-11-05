import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {createStripeTerminalStateChecker} from "../src/stripe-terminal-effects-state-checker.js";
const raw=new DatabaseSync(":memory:");
try {
 raw.exec("CREATE TABLE stripe_webhook_events(eventId TEXT PRIMARY KEY,userId TEXT,outcome TEXT,eventCreatedAt TEXT,eventType TEXT)");
 raw.exec("CREATE TABLE user_plans(userId TEXT PRIMARY KEY,plan TEXT)");
 raw.prepare("INSERT INTO stripe_webhook_events VALUES ('evt_a','u','reconciled','2026-11-05T00:00:00.000Z','customer.subscription.deleted')").run();
 raw.prepare("INSERT INTO user_plans VALUES ('u','premium')").run();
 const db={prepare(sql){return {bind(...args){return {first:async()=>raw.prepare(sql).get(...args)||null}}}}};
 let requests=0;
 const fetchImpl=async url=>{
   requests++;
   const parsed=new URL(url);
   assert.equal(parsed.pathname,"/v1/subscriptions");
   return {ok:true,json:async()=>({has_more:false,data:[
     {id:"sub_cancelled",customer:"cus_cancelled",livemode:false,status:"canceled",metadata:{userId:"u",hegevaPlan:"premium"}},
     {id:"sub_a",customer:"cus_a",livemode:false,status:"active",metadata:{userId:"u",hegevaPlan:"premium"}}
   ]})};
 };
 const effect={eventId:"evt_a",userId:"u",effectType:"referral-retain",livemode:0,subscriptionId:"sub_cancelled",customerId:"cus_cancelled"};
 const verified=createStripeTerminalStateChecker({db,secretKey:"sk_test_fixture",paymentMode:"test",fetchImpl});
 assert.deepEqual(await verified(effect),{
   currentPlanVerified:true,currentPlan:"premium",newerEventsVerified:true,newerEventExists:false
 });
 assert.equal(requests,1);
 const wrongMode=await verified({...effect,livemode:1});
 assert.equal(wrongMode.currentPlanVerified,false);
 assert.equal(requests,1,"wrong-mode attempt must not contact Stripe");
 const invalid=createStripeTerminalStateChecker({db,secretKey:"sk_live_fixture",paymentMode:"test",fetchImpl});
 assert.equal((await invalid(effect)).currentPlanVerified,false);
 assert.equal(requests,1);
 raw.prepare("INSERT INTO stripe_webhook_events VALUES ('evt_new','u','ignored','2026-11-05T00:00:01.000Z','customer.subscription.updated')").run();
 const pending=await verified(effect);
 assert.equal(pending.currentPlanVerified,false);
 assert.equal(pending.newerEventExists,true);
 assert.equal(requests,1,"pending newer event blocks Stripe fetch");
 console.log("Read-only outbox state checker PASS: mode, identity, paid inventory, new event, invalid secret.");
} finally {raw.close();}
