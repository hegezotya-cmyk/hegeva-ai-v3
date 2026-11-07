import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

test("cleanup removes only synthetic fixture rows and keeps non-fixture data", () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE staging_synthetic_fixture_effect(namespace TEXT, operation_key TEXT, fencing_token TEXT, created_at INTEGER);
    CREATE TABLE staging_synthetic_fixture_lease(namespace TEXT, nonce TEXT, lease_until INTEGER, active INTEGER);
    CREATE TABLE stripe_terminal_effect_outbox(eventId TEXT, userId TEXT, effectType TEXT, subscriptionId TEXT, customerId TEXT, livemode INTEGER, state TEXT, attempts INTEGER, nextAttemptAt TEXT, leaseUntil TEXT, lastError TEXT, createdAt TEXT, updatedAt TEXT);
    CREATE TABLE staging_scheduled_test_runs(scenario TEXT, namespace TEXT, status TEXT, attempts INTEGER, cleanup_verified INTEGER, updated_at TEXT);
    INSERT INTO staging_synthetic_fixture_effect VALUES ('staging-fixture:one','synthetic','n',1),('ordinary:one','synthetic','n',1);
    INSERT INTO staging_synthetic_fixture_lease VALUES ('staging-fixture:one','n',1,1),('ordinary:one','n',1,1);
    INSERT INTO stripe_terminal_effect_outbox VALUES ('evt_one','fixture_one','billing-and-referral-downgrade','sub_one','cus_one',0,'completed',2,'n',NULL,NULL,'n','n'),('evt_keep','ordinary_user','billing-and-referral-downgrade','sub_keep','cus_keep',0,'completed',1,'n',NULL,NULL,'n','n');
    INSERT INTO staging_scheduled_test_runs VALUES ('retry-recovery','staging-fixture:one','completed',2,1,'n'),('other','ordinary:one','completed',0,1,'n');
  `);
  const cleanup = readFileSync(new URL("./staging-scheduled-test-cleanup.sql", import.meta.url), "utf8");
  db.exec(cleanup);
  for (const table of ["staging_synthetic_fixture_effect", "staging_synthetic_fixture_lease"]) {
    assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE substr(namespace,1,16)='staging-fixture:'`).get().n, 0);
    assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE namespace='ordinary:one'`).get().n, 1);
  }
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM stripe_terminal_effect_outbox WHERE substr(userId,1,8)='fixture_'").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM stripe_terminal_effect_outbox WHERE userId='ordinary_user'").get().n, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM staging_scheduled_test_runs WHERE scenario='retry-recovery'").get().n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM staging_scheduled_test_runs WHERE scenario='other'").get().n, 1);
  db.close();
});
