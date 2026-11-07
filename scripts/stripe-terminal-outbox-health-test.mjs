import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA,prepareTerminalEffect,readTerminalEffectHealth} from "../src/stripe-terminal-effects-outbox.js";
import {processNextTerminalEffect} from "../src/stripe-terminal-effects-processor.js";
const sql=new DatabaseSync(":memory:");
try {
 sql.exec(TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA);
 const db={prepare(query){return {bind(...args){const statement=sql.prepare(query);return {
  first:async()=>statement.get(...args)??null,
  run:async()=>({meta:{changes:statement.run(...args).changes}})
 };}}}};
 const t="2026-11-05T02:00:00.000Z";
 const p=prepareTerminalEffect({eventId:"evt_broken",userId:"u",effectType:"referral-retain",
  subscriptionId:"sub_old",customerId:"cus_old",livemode:false,now:t});
 sql.prepare(p.sql).run(...p.values);
 const refuse=async()=>{throw Error("simulated read-only Stripe unavailability");};
 const execute=async()=>{throw Error("must not execute");};
 const first=await processNextTerminalEffect({db,now:t,checkCurrentState:refuse,executeIdempotently:execute,maxAttempts:2});
 assert.equal(first.status,"retry-scheduled");
 const later="2026-11-05T02:00:31.000Z";
 const second=await processNextTerminalEffect({db,now:later,checkCurrentState:refuse,executeIdempotently:execute,maxAttempts:2});
 assert.equal(second.status,"blocked");
 assert.equal(sql.prepare("SELECT attempts FROM stripe_terminal_effect_outbox WHERE eventId='evt_broken'").get().attempts,2);
 assert.equal(sql.prepare("SELECT state FROM stripe_terminal_effect_outbox WHERE eventId='evt_broken'").get().state,"blocked");
 const third=await processNextTerminalEffect({db,now:"2026-11-05T03:00:00.000Z",checkCurrentState:refuse,executeIdempotently:execute,maxAttempts:2});
 assert.equal(third.status,"empty","blocked jobs must not execute again automatically");
 const health=await readTerminalEffectHealth(db,"2026-11-05T03:00:00.000Z");
 assert.deepEqual(health,{verified:true,due:0,scheduled:0,running:0,expiredLeases:0,blocked:1,completed:0,attentionRequired:true});
 assert.deepEqual(await readTerminalEffectHealth(null,t),{verified:false});
 console.log("SQLite terminal outbox release alert PASS: bounded retries, blocked quarantine, read-only aggregate monitoring.");
} finally {sql.close();}
