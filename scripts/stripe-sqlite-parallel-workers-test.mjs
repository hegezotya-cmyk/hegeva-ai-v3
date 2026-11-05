import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const source=readFileSync(new URL("../src/index-ledger.js",import.meta.url),"utf8");
const marker=source.indexOf("const changes = await env.DB.batch([");
assert(marker>=0);
const tick=String.fromCharCode(96);
const pattern=new RegExp("env\\.DB\\.prepare\\("+tick+"([\\s\\S]*?)"+tick+"\\)\\.bind","g");
const statements=[...source.slice(marker).matchAll(pattern)].slice(0,2).map(x=>x[1]);
assert.equal(statements.length,2);

if (!isMainThread) {
  const db=new DatabaseSync(workerData.path);
  db.exec("PRAGMA busy_timeout=5000");
  parentPort.postMessage({ready:true});
  parentPort.once("message",()=>{
    let result;
    try {
      db.exec("BEGIN IMMEDIATE");
      const changed=db.prepare(statements[0]).run("u",workerData.plan,workerData.time).changes;
      const closed=db.prepare(statements[1]).run(workerData.time,workerData.eventId).changes;
      assert.equal(closed,1);
      db.exec("COMMIT");
      result={done:true,changed};
    } catch(error) {
      try {db.exec("ROLLBACK");} catch {}
      result={error:String(error)};
    } finally {
      try {db.close();} catch(error) { result={error:String(error)}; }
    }
    // Report completion only after SQLite releases connection locks.
    parentPort.postMessage(result);
  });
} else {
  const dir=mkdtempSync(join(tmpdir(),"hegeva-parallel-"));
  try {
    for(let round=0;round<8;round++){
      const path=join(dir,"race-"+round+".db");
      const db=new DatabaseSync(path);
      db.exec("PRAGMA journal_mode=WAL");
      db.exec("CREATE TABLE user_plans (userId TEXT PRIMARY KEY, plan TEXT, createdAt TEXT, updatedAt TEXT)");
      db.exec("CREATE TABLE stripe_webhook_events (eventId TEXT PRIMARY KEY, userId TEXT, eventType TEXT, plan TEXT, eventCreatedAt TEXT, processedAt TEXT, outcome TEXT)");
      const old="2026-11-05T12:00:00.000Z";
      const newer="2026-11-05T12:01:00.000Z";
      const ins=db.prepare("INSERT INTO stripe_webhook_events(eventId,userId,eventType,plan,eventCreatedAt,processedAt,outcome) VALUES (?1,'u','customer.subscription.deleted','premium',?2,?2,'ignored')");
      ins.run("evt_old",old);ins.run("evt_new",newer);db.close();
      const workers=[
        new Worker(new URL(import.meta.url),{workerData:{path,eventId:"evt_old",time:old,plan:"basic"}}),
        new Worker(new URL(import.meta.url),{workerData:{path,eventId:"evt_new",time:newer,plan:"premium"}})
      ];
      try {
        await Promise.all(workers.map(w=>new Promise((resolve,reject)=>{
          w.once("message",x=>x.ready?resolve():reject(Error("worker not ready")));
          w.once("error",reject);
        })));
        const outcomes=await Promise.all(workers.map(w=>new Promise((resolve,reject)=>{
          w.once("message",m=>m.done?resolve(m):reject(Error(m.error||"worker failed")));
          w.once("error",reject);
          w.postMessage("start");
        })));
        assert.equal(outcomes.length,2);
        const read=new DatabaseSync(path);
        read.exec("PRAGMA busy_timeout=5000");
        assert.equal(read.prepare("SELECT plan FROM user_plans WHERE userId='u'").get().plan,"premium");
        assert.equal(read.prepare("SELECT updatedAt FROM user_plans WHERE userId='u'").get().updatedAt,newer);
        assert.equal(read.prepare("SELECT COUNT(*) AS n FROM stripe_webhook_events WHERE outcome='reconciled'").get().n,2);
        read.close();
      } finally {await Promise.all(workers.map(w=>w.terminate()));}
    }
    console.log("Concurrent SQLite worker-thread regression PASS: 8 races, newest entitlement preserved.");
  } finally {rmSync(dir,{recursive:true,force:true});}
}
