import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCronAcceptanceSnapshot } from "./staging-scheduled-cron-acceptance.mjs";

const completedSnapshot = () => ({
  retry_status: "completed",
  retry_attempts: 2,
  fencing_status: "completed",
  fencing_cleanup_verified: 1,
  fixture_outbox_rows: 1,
  completed_test_outbox_rows: 1,
  processor_effect_rows: 1,
  active_fixture_leases: 0,
});

test("accepts remote retry recovery and fencing only with completed synthetic state", () => {
  assert.deepEqual(evaluateCronAcceptanceSnapshot(completedSnapshot()), {
    status: "PASS",
    retryAttempts: 2,
    completedOutboxRows: 1,
    processorEffects: 1,
    activeLeases: 0,
  });
});

test("keeps polling while Cron has not written both scenario results", () => {
  assert.deepEqual(evaluateCronAcceptanceSnapshot(null), { status: "PENDING" });
  assert.deepEqual(evaluateCronAcceptanceSnapshot({ retry_status: "retry-scheduled" }), { status: "PENDING" });
});

test("fails closed when either remote scenario reports blocked", () => {
  assert.throws(() => evaluateCronAcceptanceSnapshot({
    ...completedSnapshot(),
    fencing_status: "blocked",
  }), /remote-synthetic-cron-scenario-failed/);
});

test("rejects completion without the exact retry and single-effect evidence", () => {
  assert.throws(() => evaluateCronAcceptanceSnapshot({ ...completedSnapshot(), retry_attempts: 1 }), /remote-synthetic-cron-evidence-mismatch/);
  assert.throws(() => evaluateCronAcceptanceSnapshot({ ...completedSnapshot(), processor_effect_rows: 2 }), /remote-synthetic-cron-evidence-mismatch/);
});

test("rejects fencing without duplicate and stale-write cleanup evidence", () => {
  assert.throws(() => evaluateCronAcceptanceSnapshot({ ...completedSnapshot(), fencing_cleanup_verified: 0 }), /remote-synthetic-cron-evidence-mismatch/);
  assert.throws(() => evaluateCronAcceptanceSnapshot({ ...completedSnapshot(), active_fixture_leases: 1 }), /remote-synthetic-cron-evidence-mismatch/);
});
