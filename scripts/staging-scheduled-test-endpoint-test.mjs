import test from "node:test";
import assert from "node:assert/strict";
import { createStagingScheduledTestEndpoint } from "../src/staging-scheduled-test-endpoint.js";
import { createStagingSyntheticFixtureAdapter } from "../src/staging-synthetic-fixture-adapter.js";

const secret = "s".repeat(40);
const controller = async input => input.scenario === "retry-recovery" ? { status: "completed", code: "scenario-executed", cleanupVerified: true } : { status: "blocked", code: "invalid-request" };
const request = (body, init = {}) => new Request("https://staging.invalid/internal/test", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${secret}` }, body: JSON.stringify(body), ...init });

test("endpoint is default-deny, authenticated and allowlisted", async () => {
  const off = createStagingScheduledTestEndpoint({ controller, env: {} });
  assert.equal((await off(request({ scenario: "retry-recovery" }))).status, 404);
  const on = createStagingScheduledTestEndpoint({ controller, env: { STAGING_SCHEDULED_TEST_CONTROL_ENABLED: "true", STAGING_SCHEDULED_TEST_AUTH_SECRET: secret } });
  assert.equal((await on(request({ scenario: "retry-recovery" }))).status, 200);
  assert.equal((await on(request({ scenario: "retry-recovery", userId: "x" }))).status, 400);
  assert.equal((await on(new Request("https://staging.invalid", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }))).status, 401);
  assert.equal((await on(new Request("https://staging.invalid", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${secret}` }, body: "{" }))).status, 400);
});

test("fixture adapter requires synthetic namespace and rejects arbitrary effects", async () => {
  assert.throws(() => createStagingSyntheticFixtureAdapter({ namespace: "real-db", adapter: { isSyntheticFixture: true } }), /fixture-namespace-invalid/);
  assert.throws(() => createStagingSyntheticFixtureAdapter({ namespace: "staging-fixture:test-run-01", db: {}, adapter: {} }), /synthetic-db-binding-required/);
  const calls = [];
  const db = { prepare: () => ({ bind: () => ({ first: async () => ({ n: 0, ok: 1 }), run: async () => ({ meta: { changes: 1 } }) }) }) };
  const guard = { acquire() {}, release() {}, verifyLease() {}, fencedWrite(input) { calls.push(input); return { ok: true }; } };
  const adapter = createStagingSyntheticFixtureAdapter({ namespace: "staging-fixture:test-run-01", db, guard });
  assert.equal((await adapter.fencedWrite({ scenario: "unknown", operationCode: "sql" })).ok, false);
  await adapter.fencedWrite({ scenario: "retry-recovery", operationCode: "retry-recovery-apply" });
  assert.equal(calls[0].operationCode, "retry-recovery-apply");
});
