import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Two SQLite connections to one temporary DB reproduce ordering and atomicity
// with distinct terminal events. This is not a Cloudflare D1 concurrency test.
const source=readFileSync(new URL("../src/index-ledger.js",import.meta.url),"utf8");
const marker=source.indexOf("const statements = [");
assert(marker>=0);
const tick=String.fromCharCode(96);
const pattern=new RegExp("env\\.DB\\.prepare\\("+tick+"([\\s\\S]*?)"+tick+"\\)\\.bind","g");
const sql=[...source.slice(marker).matchAll(pattern)].slice(0,2).map(x=>x[1]);
assert.equal(sql.length,2);
const dir=mkdtempSync(join(tmpdir(),"hegeva-sqlite-order-"));
const first=new DatabaseSync(join(dir,"ledger.db"));
const second=new DatabaseSync(join(dir,"ledger.db"));
try {
 first.exec("PRAGMA journal_mode=WAL");
 first.exec("CREATE TABLE user_plans (userId TEXT PRIMARY KEY, plan TEXT, createdAt TEXT, updatedAt TEXT)");
 first.exec("CREATE TABLE stripe_webhook_events (eventId TEXT PRIMARY KEY, userId TEXT, eventType TEXT, plan TEXT, eventCreatedAt TEXT, processedAt TEXT, outcome TEXT)");
 const t1="2026-11-05T12:00:00.000Z", t2="2026-11-05T12:01:00.000Z";
 const put=(db,id,time)=>db.prepare("INSERT INTO stripe_webhook_events(eventId,userId,eventType,plan,eventCreatedAt,processedAt,outcome) VALUES (?1,'u','customer.subscription.deleted','premium',?2,?2,'ignored')").run(id,time);
 put(first,"evt_old",t1);put(first,"evt_new",t2);
 function transact(db,id,time,plan){
  db.exec("BEGIN IMMEDIATE");
  try {
   const changed=db.prepare(sql[0]).run("u",plan,time).changes;
   const finalized=db.prepare(sql[1]).run(time,id).changes;
   assert.equal(finalized,1);
   db.exec("COMMIT");return changed;
  } catch(e){db.exec("ROLLBACK");throw e;}
 }
 assert.equal(transact(second,"evt_new",t2,"premium"),1);
 assert.equal(transact(first,"evt_old",t1,"basic"),0);
 assert.equal(first.prepare("SELECT plan FROM user_plans WHERE userId='u'").get().plan,"premium");
 assert.equal(first.prepare("SELECT outcome FROM stripe_webhook_events WHERE eventId='evt_old'").get().outcome,"applied");
 // An event processed after newer state can finalize as applied without
 // having applied its plan. This is currently an audit ambiguity.
 assert.equal(first.prepare("SELECT updatedAt FROM user_plans WHERE userId='u'").get().updatedAt,t2);
 console.log("SQLite two-connection stale-order PASS: older event cannot overwrite newer entitlement.");
 console.log("RELEASE GAP: event ledger may say reconciled even when timestamp rejected its plan update.");
} finally {first.close();second.close();rmSync(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
