import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { verifyTerminalEffectCurrentState } from "../src/stripe-terminal-effects-state-verifier.js";
const db=new DatabaseSync(":memory:");
db.exec("CREATE TABLE stripe_webhook_events (eventId TEXT PRIMARY KEY,userId TEXT,eventCreatedAt TEXT,outcome TEXT)");
db.exec("CREATE TABLE user_plans (userId TEXT PRIMARY KEY,plan TEXT)");
const adapter={prepare(sql){return {bind(...args){return {first:async()=>db.prepare(sql).get(...args)??null};}};}};
const t="2026-11-05T01:00:00.000Z";
db.prepare("INSERT INTO stripe_webhook_events VALUES (?1,?2,?3,'reconciled')").run("evt_old","user_a",t);
db.prepare("INSERT INTO user_plans VALUES ('user_a','basic')").run();
const effect={eventId:"evt_old",userId:"user_a",effectType:"billing-and-referral-downgrade",livemode:0};
const old={id:"sub_old",customerId:"cus_old",userId:"user_a",livemode:false,status:"canceled",plan:"premium"};
const active={id:"sub_new",customerId:"cus_new",userId:"user_a",livemode:false,status:"active",plan:"premium"};
const check=async(rows,changes={})=>verifyTerminalEffectCurrentState({
 db:adapter,effect:{...effect,...changes},
 getCompleteInventory:async()=>({complete:true,subscriptions:rows})
});
try {
 assert.deepEqual(await check([old]),{
  currentPlanVerified:true,currentPlan:"basic",newerEventsVerified:true,newerEventExists:false
 });
 assert.equal((await check([old,active])).currentPlanVerified,false,"Stripe active sub disagrees with stale D1 basic");
 assert.equal((await check([old],{userId:"another"})).currentPlanVerified,false);
 assert.equal((await check([old],{livemode:1})).currentPlanVerified,false);
 assert.equal((await verifyTerminalEffectCurrentState({db:adapter,effect,
  getCompleteInventory:async()=>({complete:false,subscriptions:[old]})})).currentPlanVerified,false);
 db.prepare("INSERT INTO stripe_webhook_events VALUES (?1,?2,?3,'ignored')").run("evt_new","user_a","2026-11-05T01:01:00.000Z");
 const newer=await check([old]);
 assert.equal(newer.newerEventExists,true);
 assert.equal(newer.currentPlanVerified,false,"newer even-pending event blocks older effects");
 db.prepare("UPDATE stripe_webhook_events SET eventCreatedAt=?1 WHERE eventId='evt_new'").run(t);
 const sameTimestamp=await check([old]);
 assert.equal(sameTimestamp.newerEventExists,true,
  "different events at same Stripe second must block stale side effects");
 assert.equal(sameTimestamp.currentPlanVerified,false);
 db.prepare("DELETE FROM stripe_webhook_events WHERE eventId='evt_new'").run();
 db.prepare("UPDATE user_plans SET plan='premium' WHERE userId='user_a'").run();
 const mismatched=await check([old]);
 assert.equal(mismatched.currentPlanVerified,false);
 db.prepare("UPDATE user_plans SET plan='premium' WHERE userId='user_a'").run();
 const paid=await check([old,active]);
 assert.equal(paid.currentPlanVerified,true);
 assert.equal(paid.currentPlan,"premium");
 assert.equal((await check([{...active,userId:"other"}])).currentPlanVerified,false);
 console.log("Read-only Stripe+D1 outbox state verifier PASS: ownership, newer event, incomplete inventory, mismatch, paid restore.");
} finally {db.close();}
