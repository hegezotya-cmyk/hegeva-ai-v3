import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {prepareTerminalEffect} from "../src/stripe-terminal-effects-outbox.js";

// Exercise all three writes of candidate batch as a single real SQLite
// transaction. Simulated failure in outbox insertion must roll back plan
// and event finalization. This does not access remote D1.
const src=readFileSync(new URL("../src/index-ledger.js",import.meta.url),"utf8");
const migration=readFileSync(new URL("../migrations/0032_stripe_terminal_effect_outbox.sql",import.meta.url),"utf8");
assert.match(src,/const statements = \[/);
assert.match(src,/env\.DB\.batch\(statements\)/);
assert.match(src,/env.DB.prepare\(queuedEffect.sql\).bind\(\.\.\.queuedEffect.values\)/);
const tick=String.fromCharCode(96);
const sql=[...src.slice(src.indexOf("const statements = [" )).matchAll(
 new RegExp("env\\.DB\\.prepare\\("+tick+"([\\s\\S]*?)"+tick+"\\)\\.bind","g")
)].slice(0,2).map(x=>x[1]);
assert.equal(sql.length,2);
const db=new DatabaseSync(":memory:");
try {
 db.exec("CREATE TABLE user_plans(userId TEXT PRIMARY KEY,plan TEXT,createdAt TEXT,updatedAt TEXT)");
 db.exec("CREATE TABLE stripe_webhook_events(eventId TEXT PRIMARY KEY,userId TEXT,outcome TEXT,processedAt TEXT)");
 db.exec(migration);
 const t="2026-11-05T01:00:00.000Z";
 const effect=prepareTerminalEffect({eventId:"evt_a",userId:"user_a",subscriptionId:"sub_a",customerId:"cus_a",livemode:false,effectType:"billing-and-referral-downgrade",now:t});
 assert(effect);
 const plan=db.prepare(sql[0]),finish=db.prepare(sql[1]),queue=db.prepare(effect.sql);
 db.prepare("INSERT INTO stripe_webhook_events(eventId,userId,outcome) VALUES('evt_a','user_a','ignored')").run();
 db.exec("BEGIN IMMEDIATE");
 assert.equal(plan.run("user_a","basic",t).changes,1);
 assert.equal(finish.run(t,"evt_a").changes,1);
 assert.equal(queue.run(...effect.values).changes,1);
 db.exec("COMMIT");
assert.equal(db.prepare("SELECT outcome FROM stripe_webhook_events WHERE eventId='evt_a'").get().outcome,"applied");
 assert.equal(db.prepare("SELECT state FROM stripe_terminal_effect_outbox WHERE eventId='evt_a'").get().state,"pending");
 // Failure at the THIRD statement must roll back the first two.
 db.prepare("INSERT INTO stripe_webhook_events(eventId,userId,outcome) VALUES('evt_b','user_b','ignored')").run();
 const other=prepareTerminalEffect({eventId:"evt_b",userId:"user_b",subscriptionId:"sub_b",customerId:"cus_b",livemode:false,effectType:"referral-retain",now:t});
 db.exec("CREATE TRIGGER block_outbox BEFORE INSERT ON stripe_terminal_effect_outbox WHEN NEW.eventId='evt_b' BEGIN SELECT RAISE(ABORT,'forced-outbox-failure'); END");
 db.exec("BEGIN IMMEDIATE");
 assert.equal(plan.run("user_b","premium",t).changes,1);
 assert.equal(finish.run(t,"evt_b").changes,1);
 assert.throws(()=>db.prepare(other.sql).run(...other.values),/forced-outbox-failure/);
 db.exec("ROLLBACK");
 assert.equal(db.prepare("SELECT * FROM user_plans WHERE userId='user_b'").get(),undefined);
 assert.equal(db.prepare("SELECT outcome FROM stripe_webhook_events WHERE eventId='evt_b'").get().outcome,"ignored");
 assert.equal(db.prepare("SELECT * FROM stripe_terminal_effect_outbox WHERE eventId='evt_b'").get(),undefined);
 console.log("SQLite three-write outbox transaction PASS: plan, event and retry job commit or rollback together");
} finally {db.close();}
