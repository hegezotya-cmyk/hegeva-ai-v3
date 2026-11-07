import test from "node:test";
import assert from "node:assert/strict";
import { runStagingScheduledTestCron } from "../src/staging-scheduled-test-cron-handler.js";

test("cron handler is disabled by default and before any D1 or guard access", async () => {
  let called = 0;
  const result = await runStagingScheduledTestCron({ scheduledTime: Date.now() }, { PAYMENT_MODE: "test" }, {
    runScenario: async () => { called++; return { status: "completed" }; },
  });
  assert.equal(result.status, "disabled");
  assert.equal(called, 0);
});

test("cron handler runs only fixed synthetic scenarios on the isolated TEST bindings", async () => {
  const calls = [];
  const scheduledTime = Date.parse("2026-11-07T21:00:00.000Z");
  const result = await runStagingScheduledTestCron({ scheduledTime }, {
    PAYMENT_MODE: "test", STAGING_SCHEDULED_TEST_ENABLED: "true",
    SYNTHETIC_TEST_DB: { tag: "synthetic-db" }, GUARD: { tag: "guard" },
  }, {
    runScenario: async input => { calls.push(input); return { status: "completed" }; },
  });
  assert.equal(result.status, "completed");
  assert.deepEqual(calls.map(call => call.scenario), ["retry-recovery", "lease-fencing"]);
  assert.ok(calls.every(call => call.db.tag === "synthetic-db" && call.guard.tag === "guard"));
  assert.ok(calls.every(call => call.namespace.startsWith("staging-fixture:")));
  assert.ok(calls.every(call => call.now === new Date(scheduledTime).toISOString()));
});

test("wrong mode, missing D1, missing guard and non-exact enable values fail closed", async () => {
  const runScenario = async () => { throw Error("must not run"); };
  for (const env of [
    { PAYMENT_MODE: "live", STAGING_SCHEDULED_TEST_ENABLED: "true", SYNTHETIC_TEST_DB: {}, GUARD: {} },
    { PAYMENT_MODE: "test", STAGING_SCHEDULED_TEST_ENABLED: "true", GUARD: {} },
    { PAYMENT_MODE: "test", STAGING_SCHEDULED_TEST_ENABLED: "true", SYNTHETIC_TEST_DB: {} },
    { PAYMENT_MODE: "test", STAGING_SCHEDULED_TEST_ENABLED: "TRUE", SYNTHETIC_TEST_DB: {}, GUARD: {} },
  ]) {
    assert.equal((await runStagingScheduledTestCron({}, env, { runScenario })).status, "disabled");
  }
});
