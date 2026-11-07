import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA } from "../src/stripe-terminal-effects-outbox.js";
import { runStagingScheduledRuntimeTest } from "../src/staging-scheduled-runtime-runner.js";
import { createPersistentStagingTestGuard } from "../src/staging-scheduled-test-guard.js";

function fixture() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(TERMINAL_SIDE_EFFECT_OUTBOX_SCHEMA);
  sql.exec(`
    CREATE TABLE staging_synthetic_fixture_lease (
      namespace TEXT PRIMARY KEY, nonce TEXT NOT NULL, lease_until INTEGER NOT NULL,
      active INTEGER NOT NULL CHECK(active=1)
    );
    CREATE TABLE staging_synthetic_fixture_effect (
      namespace TEXT NOT NULL, operation_key TEXT NOT NULL, fencing_token TEXT NOT NULL,
      created_at INTEGER NOT NULL, PRIMARY KEY(namespace, operation_key)
    );
    CREATE TABLE staging_scheduled_test_runs (
      scenario TEXT PRIMARY KEY, namespace TEXT NOT NULL, status TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0, cleanup_verified INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);
  let now = Date.parse("2026-11-07T00:00:00.000Z");
  let tail = Promise.resolve();
  const state = new Map();
  const store = { transaction: async fn => {
    const run = tail.then(() => fn({ get: async key => state.get(key), put: async (key, value) => state.set(key, value) }));
    tail = run.catch(() => {});
    return run;
  } };
  const guard = createPersistentStagingTestGuard({ store, now: () => now, leaseMs: 30_000, windowMs: 1_000, maxRunsPerWindow: 2 });
  const db = {
    prepare(sqlText) { return { bind(...args) {
      const statement = sql.prepare(sqlText);
      return {
        first: async () => statement.get(...args) ?? null,
        run: async () => ({ meta: { changes: statement.run(...args).changes } }),
      };
    } }; },
  };
  return { sql, db, guard, now: () => now, advance: ms => { now += ms; } };
}

test("scheduled retry recovery processes a synthetic outbox row across Cron invocations exactly once", async () => {
  const x = fixture();
  const namespace = "staging-fixture:retry-run-0001";
  const first = await runStagingScheduledRuntimeTest({ scenario: "retry-recovery", namespace, db: x.db, guard: x.guard, now: new Date(x.now()).toISOString(), sleep: async () => {} });
  assert.equal(first.status, "retry-scheduled");
  assert.equal(first.attempts, 1);
  assert.equal(first.effectCount, 0);

  x.advance(31_000);
  const second = await runStagingScheduledRuntimeTest({ scenario: "retry-recovery", namespace, db: x.db, guard: x.guard, now: new Date(x.now()).toISOString(), sleep: async () => {} });
  assert.equal(second.status, "completed");
  assert.equal(second.attempts, 2);
  assert.equal(second.effectCount, 1);

  x.advance(60_000);
  const third = await runStagingScheduledRuntimeTest({ scenario: "retry-recovery", namespace, db: x.db, guard: x.guard, now: new Date(x.now()).toISOString(), sleep: async () => {} });
  assert.equal(third.status, "completed");
  assert.equal(third.effectCount, 1);
  assert.equal(x.sql.prepare("SELECT COUNT(*) AS n FROM stripe_terminal_effect_outbox WHERE state='completed'").get().n, 1);
  assert.equal(x.sql.prepare("SELECT COUNT(*) AS n FROM staging_synthetic_fixture_effect WHERE operation_key LIKE 'processor:%'").get().n, 1);
  x.sql.close();
});

test("scheduled fencing scenario proves one lease winner, stale denial and zero fixture residue", async () => {
  const x = fixture();
  const result = await runStagingScheduledRuntimeTest({
    scenario: "lease-fencing", namespace: "staging-fixture:fence-run-0001",
    db: x.db, guard: x.guard, now: new Date(x.now()).toISOString(),
    clock: x.now,
    generateNonce: (() => { let n = 0; return () => `12345678-1234-1234-1234-123456789ab${n++}`; })(),
    sleep: async ms => x.advance(ms), leaseDurationMs: 1_000,
  });
  assert.equal(result.status, "completed");
  assert.equal(result.acquireWinners, 1);
  assert.equal(result.duplicateRejected, true);
  assert.equal(result.staleRejected, true);
  assert.equal(result.cleanupVerified, true);
  assert.equal(x.sql.prepare("SELECT COUNT(*) AS n FROM staging_synthetic_fixture_lease").get().n, 0);
  assert.equal(x.sql.prepare("SELECT COUNT(*) AS n FROM staging_synthetic_fixture_effect").get().n, 0);
  x.sql.close();
});
