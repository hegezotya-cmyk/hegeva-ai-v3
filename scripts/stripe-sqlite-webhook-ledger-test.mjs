import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
// Execute candidate D1 SQL against real SQLite transactions and test rollback.
// A deployed D1 batch has not been tested by this test.
const src=readFileSync(new URL("../src/index-ledger.js",import.meta.url),"utf8");
const marker=src.indexOf("const changes = await env.DB.batch([");
assert(marker>=0,"terminal commits must use D1 batch");
const tick=String.fromCharCode(96);
const pattern=new RegExp("env\\.DB\\.prepare\\("+tick+"([\\s\\S]*?)"+tick+"\\)\\.bind","g");
const sql=[...src.slice(marker).matchAll(pattern)].slice(0,2).map(x=>x[1]);
assert.equal(sql.length,2);
assert.match(sql[0],/INSERT INTO user_plans/);
assert.match(sql[1],/UPDATE stripe_webhook_events/);
assert.match(sql[1],/outcome = 'applied'/);
const db=new DatabaseSync(":memory:");
try {
 db.exec("CREATE TABLE stripe_webhook_events (eventId TEXT PRIMARY KEY, eventType TEXT, userId TEXT, plan TEXT, eventCreatedAt TEXT, processedAt TEXT, outcome TEXT)");
 db.exec("CREATE TABLE user_plans (userId TEXT PRIMARY KEY, plan TEXT, createdAt TEXT, updatedAt TEXT)");
 const claim=db.prepare("INSERT INTO stripe_webhook_events (eventId,eventType,userId,plan,eventCreatedAt,processedAt,outcome) VALUES (?1,?2,?3,?4,?5,?6,'ignored') ON CONFLICT(eventId) DO NOTHING");
 const plan=db.prepare(sql[0]),finalize=db.prepare(sql[1]);
 const t="2026-11-05T12:00:00.000Z",now="2026-11-05T12:00:01.000Z";
 assert.equal(claim.run("evt_one","customer.subscription.deleted","test_user","premium",t,t).changes,1);
 assert.equal(claim.run("evt_one","customer.subscription.deleted","test_user","premium",t,t).changes,0);
 db.exec("BEGIN");
 assert.equal(plan.run("test_user","basic",t).changes,1);
 assert.equal(finalize.run(now,"evt_one").changes,1);
 db.exec("COMMIT");
 assert.equal(db.prepare("SELECT plan FROM user_plans WHERE userId='test_user'").get().plan,"basic");
assert.equal(db.prepare("SELECT outcome FROM stripe_webhook_events WHERE eventId='evt_one'").get().outcome,"applied");
 claim.run("evt_fail","customer.subscription.deleted","other_user","premium",t,t);
 db.exec("CREATE TRIGGER fail_finalize BEFORE UPDATE ON stripe_webhook_events WHEN NEW.eventId='evt_fail' BEGIN SELECT RAISE(ABORT,'simulated finalize crash'); END");
 db.exec("BEGIN");
 assert.equal(plan.run("other_user","basic",t).changes,1);
 assert.throws(()=>finalize.run(now,"evt_fail"),/simulated finalize crash/);
 db.exec("ROLLBACK");
 assert.equal(db.prepare("SELECT plan FROM user_plans WHERE userId='other_user'").get(),undefined);
 assert.equal(db.prepare("SELECT outcome FROM stripe_webhook_events WHERE eventId='evt_fail'").get().outcome,"ignored");
 console.log("SQLite transaction PASS: entitlement and terminal ledger commit or rollback together");
} finally {db.close();}
