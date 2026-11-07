import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA, prepareTerminalEffect } from "../src/stripe-terminal-effects-outbox.js";
import { runTerminalEffectTestCycle } from "../src/stripe-terminal-effects-runner.js";
import { reverseTerminalReferralRewardsAtomically } from "../src/stripe-terminal-referral-reversal.js";

// Test-only integration: real SQLite effects, Stripe subscription GET mock,
// exact customer/subscription match, one-way referral reversal and retry.
// No billing identity write, scheduler, remote D1 or live Stripe activity.
const sqlite=new DatabaseSync(":memory:");
try {
 sqlite.exec(TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA);
 sqlite.exec("CREATE TABLE stripe_webhook_events(eventId TEXT PRIMARY KEY,userId TEXT,eventCreatedAt TEXT,outcome TEXT,eventType TEXT)");
 sqlite.exec("CREATE TABLE user_plans(userId TEXT PRIMARY KEY,plan TEXT)");
 sqlite.exec("CREATE TABLE referral_reward_reviews(id TEXT PRIMARY KEY,referredUserId TEXT,status TEXT,reviewedBy TEXT,reviewedAt TEXT,decisionReason TEXT,updatedAt TEXT)");
 sqlite.exec("CREATE TABLE referral_rewards(id TEXT PRIMARY KEY,referredUserId TEXT,status TEXT,eligibilityReason TEXT,updatedAt TEXT)");
 const adapter={prepare(sql){return {bind(...args){const stmt=sqlite.prepare(sql);return {
  first:async()=>stmt.get(...args)??null,
  run:async()=>({meta:{changes:stmt.run(...args).changes}})
 };}}},async batch(statements){
  sqlite.exec("BEGIN IMMEDIATE");
  try {
   const results=[];
   for(const item of statements)results.push(await item.run());
   sqlite.exec("COMMIT");return results;
  }catch(e){sqlite.exec("ROLLBACK");throw e;}
 }};
 const at="2026-11-05T03:00:00.000Z";
 sqlite.prepare("INSERT INTO user_plans VALUES ('u','basic')").run();
 sqlite.prepare("INSERT INTO stripe_webhook_events VALUES ('evt_cancel','u',?1,'reconciled','customer.subscription.deleted')").run(at);
 sqlite.prepare("INSERT INTO referral_reward_reviews(id,referredUserId,status) VALUES('r','u','approved')").run();
 sqlite.prepare("INSERT INTO referral_rewards(id,referredUserId,status) VALUES('w','u','APPROVED')").run();
 const queued=prepareTerminalEffect({eventId:"evt_cancel",userId:"u",subscriptionId:"sub_cancel",customerId:"cus_cancel",livemode:false,effectType:"billing-and-referral-downgrade",now:at});
 sqlite.prepare(queued.sql).run(...queued.values);
 let effectCalls=0;
 const executor=async job=>{
  effectCalls++;
  assert.equal(job.idempotencyKey,"evt_cancel");
  const r=await reverseTerminalReferralRewardsAtomically({db:adapter,userId:job.userId,now:at});
  assert.equal(r.ok,true);
  // Billing identity reconciliation is NOT implemented. Do not report
  // the composed downgrade job as successfully complete.
  throw Error("billing-identity-reconciliation-unavailable");
 };
 const stripe=async()=>({ok:true,json:async()=>({has_more:false,data:[
   {id:"sub_cancel",customer:"cus_cancel",livemode:false,status:"canceled",metadata:{userId:"u",hegevaPlan:"premium"}}
 ]})});
 const opts={db:adapter,now:at,paymentMode:"test",secretKey:"sk_test_fixture",fetchImpl:stripe,executeIdempotently:executor,enableIsolatedTest:true};
 const first=await runTerminalEffectTestCycle(opts);
 assert.equal(first.status,"retry-scheduled","unimplemented billing stage must not complete job");
 assert.equal(effectCalls,1);
 assert.equal(sqlite.prepare("SELECT status FROM referral_reward_reviews WHERE id='r'").get().status,"reversed");
 assert.equal(sqlite.prepare("SELECT status FROM referral_rewards WHERE id='w'").get().status,"REJECTED");
 assert.equal(sqlite.prepare("SELECT state FROM stripe_terminal_effect_outbox WHERE eventId='evt_cancel'").get().state,"pending");
 const second=await runTerminalEffectTestCycle({...opts,now:"2026-11-05T03:00:31.000Z"});
 assert.equal(second.status,"retry-scheduled");
 assert.equal(effectCalls,2);
 assert.equal(sqlite.prepare("SELECT status FROM referral_reward_reviews WHERE id='r'").get().status,"reversed");
 assert.equal(sqlite.prepare("SELECT status FROM referral_rewards WHERE id='w'").get().status,"REJECTED");
 console.log("Integrated Stripe TEST mock -> D1 state -> outbox -> atomic referral reversal PASS.");
 console.log("RELEASE BLOCK: billing identity not reconciled; job remains pending by design.");
}finally{sqlite.close();}
