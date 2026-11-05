import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../src/index-ledger.js",import.meta.url),"utf8");
const start=source.indexOf("async function releaseStripeEvent(");
const end=source.indexOf("function isTerminalSubscriptionEvent(",start);
assert(start>=0 && end>start);
const section=source.slice(start,end);
const needle="DELETE FROM stripe_webhook_events WHERE eventId = ?1 AND outcome = 'ignored'";
assert(section.includes(needle),"cleanup must be scoped to unfinalized claims");
const db=new DatabaseSync(":memory:");
try{
 db.exec("CREATE TABLE stripe_webhook_events(eventId TEXT PRIMARY KEY,outcome TEXT)");
 const add=db.prepare("INSERT INTO stripe_webhook_events VALUES (?1,?2)");
 const release=db.prepare(needle);
 add.run("evt_final","reconciled");
 add.run("evt_applied","applied");
 add.run("evt_pending","ignored");
 assert.equal(release.run("evt_final").changes,0);
 assert.equal(release.run("evt_applied").changes,0);
 assert.equal(release.run("evt_pending").changes,1);
 assert.equal(db.prepare("SELECT COUNT(*) AS n FROM stripe_webhook_events").get().n,2);
 console.log("Stripe webhook release safety PASS: completed events survive cleanup, only pending claims removed.");
}finally{db.close();}
