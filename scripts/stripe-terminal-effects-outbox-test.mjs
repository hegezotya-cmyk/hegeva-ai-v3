import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
 TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA,effectForDecision,prepareTerminalEffect,
 CLAIM_TERMINAL_EFFECT_SQL,COMPLETE_TERMINAL_EFFECT_SQL,RETRY_TERMINAL_EFFECT_SQL
} from "../src/stripe-terminal-effects-outbox.js";
const db=new DatabaseSync(":memory:");
try {
 db.exec(TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA);
 assert.equal(effectForDecision("downgrade",true),"billing-and-referral-downgrade");
 assert.equal(effectForDecision("retain",true),"referral-retain");
 assert.equal(effectForDecision("retain",false),null);
 const now="2026-11-05T01:00:00.000Z", later="2026-11-05T01:05:00.000Z", expiry="2026-11-05T01:06:00.000Z";
 const prepared=prepareTerminalEffect({eventId:"evt_test",userId:"u",subscriptionId:"sub_old",
  customerId:"cus_old",livemode:false,effectType:"billing-and-referral-downgrade",now});
 assert(prepared);
 assert.equal(db.prepare(prepared.sql).run(...prepared.values).changes,1);
 assert.equal(db.prepare(prepared.sql).run(...prepared.values).changes,0,"idempotent event job");
 const claim=db.prepare(CLAIM_TERMINAL_EFFECT_SQL),complete=db.prepare(COMPLETE_TERMINAL_EFFECT_SQL),retry=db.prepare(RETRY_TERMINAL_EFFECT_SQL);
 assert.equal(claim.run(expiry,now,"evt_test").changes,1);
 assert.equal(claim.run(expiry,now,"evt_test").changes,0,"cannot double-claim live lease");
 assert.equal(db.prepare("SELECT attempts FROM stripe_terminal_effect_outbox WHERE eventId='evt_test'").get().attempts,1);
 assert.equal(retry.run(later,now,"provider-unavailable","evt_test",1).changes,1);
 assert.equal(claim.run(expiry,now,"evt_test").changes,0,"respect retry schedule");
 const secondLease="2026-11-05T01:10:00.000Z";
 assert.equal(claim.run(secondLease,later,"evt_test").changes,1);
 assert.equal(complete.run(later,"evt_test",1).changes,0,"stale attempt must not finalize new lease");
 assert.equal(complete.run(later,"evt_test",2).changes,1);
 assert.equal(claim.run(secondLease,later,"evt_test").changes,0,"completed job cannot be reclaimed");
 // Crash recovery must be fenced by the increasing attempts counter.
 const p2=prepareTerminalEffect({eventId:"evt_crash",userId:"u",subscriptionId:"sub_old",
  customerId:"cus_old",livemode:false,effectType:"referral-retain",now});
 db.prepare(p2.sql).run(...p2.values);
 assert.equal(claim.run(expiry,now,"evt_crash").changes,1);
 assert.equal(claim.run(secondLease,later,"evt_crash").changes,0,"still leased before expiry");
 assert.equal(claim.run(secondLease,"2026-11-05T01:07:00.000Z","evt_crash").changes,1,"expired lease reclaimed");
 assert.equal(retry.run(later,later,"late-owner","evt_crash",1).changes,0,"old owner cannot reset newer lease");
 assert.equal(complete.run(later,"evt_crash",2).changes,1);
 console.log("SQLite durable terminal outbox policy PASS: idempotency, leases, retries, fencing, recovery.");
 console.log("NOT YET WIRED: no background processor, Stripe webhook batch integration, or deployed migration.");
} finally {db.close();}
