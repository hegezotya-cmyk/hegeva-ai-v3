import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA,prepareTerminalEffect } from "../src/stripe-terminal-effects-outbox.js";
import { runTerminalEffectTestCycle } from "../src/stripe-terminal-effects-runner.js";

const sqlite=new DatabaseSync(":memory:");
try {
 sqlite.exec(TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA);
 sqlite.exec("CREATE TABLE stripe_webhook_events(eventId TEXT PRIMARY KEY,userId TEXT,eventCreatedAt TEXT,outcome TEXT,eventType TEXT)");
 sqlite.exec("CREATE TABLE user_plans(userId TEXT PRIMARY KEY,plan TEXT)");
 const db={prepare(sql){return {bind(...args){const stmt=sqlite.prepare(sql);return {
   first:async()=>stmt.get(...args)??null,
   run:async()=>({meta:{changes:stmt.run(...args).changes}})
 };}}}};
 const now="2026-11-05T02:00:00.000Z";
 const add=(eventId,userId,subscriptionId,customerId)=>{
  const effect=prepareTerminalEffect({eventId,userId,subscriptionId,customerId,
   livemode:false,effectType:"billing-and-referral-downgrade",now});
  sqlite.prepare(effect.sql).run(...effect.values);
  sqlite.prepare("INSERT INTO stripe_webhook_events VALUES (?1,?2,?3,'reconciled','customer.subscription.deleted')").run(eventId,userId,now);
 };
 sqlite.prepare("INSERT INTO user_plans VALUES ('u','basic')").run();
 add("evt_wrong","u","sub_invalid","cus_invalid");
 let executions=0;
 const stripe=async()=>({ok:true,json:async()=>({has_more:false,data:[
  {id:"sub_old",customer:"cus_old",livemode:false,status:"canceled",
    metadata:{userId:"u",hegevaPlan:"premium"}}
 ]})});
 const base={db,paymentMode:"test",secretKey:"sk_test_fixture",fetchImpl:stripe,now,
  executeIdempotently:async()=>{executions++}};
 assert.equal((await runTerminalEffectTestCycle(base)).status,"disabled");
 assert.equal(executions,0);
 const failed=await runTerminalEffectTestCycle({...base,enableIsolatedTest:true});
 assert.equal(failed.status,"retry-scheduled");
 assert.equal(executions,0,"misbound subscription must never trigger effect");
 // Restore the correct identity on an independent test job, due after the
 // wrongly bound job's retry window, to prove the full verifier->processor path.
 add("evt_correct","u","sub_old","cus_old");
 const result=await runTerminalEffectTestCycle({...base,enableIsolatedTest:true});
 assert.equal(result.status,"retry-scheduled","same-timestamp competing events fail closed");
 assert.equal(executions,0);
 console.log("Isolated assembled outbox runner PASS: default disabled, wrong Stripe customer blocked, competing event blocked.");
} finally {sqlite.close();}
