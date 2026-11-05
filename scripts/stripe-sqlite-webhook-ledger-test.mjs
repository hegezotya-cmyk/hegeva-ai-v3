import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

// Execute actual SQL statements extracted from the candidate Worker source.
// No deployed or remote D1 and no Stripe traffic.
const src=readFileSync(new URL("../src/index-ledger.js",import.meta.url),"utf8");
const claim=src.match(/INSERT INTO stripe_webhook_events \([\s\S]*?ON CONFLICT\(eventId\) DO NOTHING/);
const finalize=src.match(/UPDATE stripe_webhook_events[\s\S]*?WHERE eventId = \?3/);
const plan=src.match(/INSERT INTO user_plans \(userId, plan, createdAt, updatedAt\)[\s\S]*?WHERE user_plans\.updatedAt IS NULL[\s\S]*?OR user_plans\.updatedAt <= excluded\.updatedAt/);
const stale=src.match(/SELECT eventId[\s\S]*?FROM stripe_webhook_events[\s\S]*?ORDER BY eventCreatedAt DESC[\s\S]*?LIMIT 1/);
assert(claim && finalize && plan && stale,"expected SQL in Worker source");
const db=new DatabaseSync(":memory:");
try {
 db.exec("CREATE TABLE stripe_webhook_events (eventId TEXT PRIMARY KEY, eventType TEXT, userId TEXT, plan TEXT, eventCreatedAt TEXT, processedAt TEXT, outcome TEXT)");
 db.exec("CREATE TABLE user_plans (userId TEXT PRIMARY KEY, plan TEXT, createdAt TEXT, updatedAt TEXT)");
 const c=db.prepare(claim[0]),f=db.prepare(finalize[0]),p=db.prepare(plan[0]),newer=db.prepare(stale[0]);
 const t1="2026-11-05T12:00:00.000Z",t2="2026-11-05T12:01:00.000Z";
 assert.equal(c.run("evt_1","customer.subscription.deleted","test_user","premium",t1,t1).changes,1);
 assert.equal(c.run("evt_1","customer.subscription.deleted","test_user","premium",t1,t1).changes,0);
 assert.equal(db.prepare("SELECT outcome FROM stripe_webhook_events WHERE eventId=?1").get("evt_1").outcome,"ignored");
 assert.equal(p.run("test_user","premium",t1).changes,1);
 assert.equal(f.run("reconciled",t1,"evt_1").changes,1);
 assert.equal(c.run("evt_2","customer.subscription.updated","test_user","premium",t2,t2).changes,1);
 assert.equal(newer.get("test_user",t1),undefined,"pending newer event not finalized");
 assert.equal(p.run("test_user","basic",t2).changes,1);
 assert.equal(f.run("reconciled",t2,"evt_2").changes,1);
 assert.equal(newer.get("test_user",t1).eventId,"evt_2","reconciled newer event blocks stale order");
 assert.equal(p.run("test_user","premium",t1).changes,0,"older event cannot overwrite newer plan");
 assert.equal(db.prepare("SELECT plan FROM user_plans WHERE userId='test_user'").get().plan,"basic");
 // Explicitly demonstrate the unresolved crash window, not a fixed issue.
 assert.equal(c.run("evt_crash","customer.subscription.deleted","other_user","premium",t2,t2).changes,1);
 assert.equal(p.run("other_user","basic",t2).changes,1);
 assert.equal(db.prepare("SELECT outcome FROM stripe_webhook_events WHERE eventId='evt_crash'").get().outcome,"ignored");
 assert.equal(db.prepare("SELECT plan FROM user_plans WHERE userId='other_user'").get().plan,"basic");
 console.log("SQLite statement regression PASS: duplicate claim, ordering, timestamps.");
 console.log("BLOCKER CONFIRMED: entitlement can commit before event finalization; transaction design still required.");
} finally {db.close();}
