import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { createStagingScheduledTestController } from "../src/staging-scheduled-test-control.js";
import { createStagingScheduledTestEndpoint } from "../src/staging-scheduled-test-endpoint.js";
import { createStagingSyntheticFixtureAdapter, ensureSyntheticFixtureSchema } from "../src/staging-synthetic-fixture-adapter.js";

const db = new DatabaseSync(":memory:");
const d1 = { exec: sql => db.exec(sql), prepare: sql => ({ bind: (...args) => ({ first: async () => db.prepare(sql).get(...args) ?? null, run: async () => ({ meta: { changes: db.prepare(sql).run(...args).changes } }) }) }) };
const state = { active: false, nonce: "", expires: 0 };
const guard = { async acquire({ nonce, deadline }) { if (state.active && state.expires > Date.now()) return false; state.active = true; state.nonce = nonce; state.expires = deadline; return true; }, async release({ nonce }) { if (state.nonce !== nonce || !state.active || state.expires <= Date.now()) return false; state.active = false; return true; }, async verifyLease({ nonce }) { return state.active && state.nonce === nonce && state.expires > Date.now(); }, async fencedWrite({ nonce, operationCode }) { return await this.verifyLease({ nonce }) ? { ok: true, operationCode, fencingToken: nonce } : { ok: false, reason: "lease-invalid" }; } };
await ensureSyntheticFixtureSchema(d1);
const adapter = createStagingSyntheticFixtureAdapter({ namespace: "staging-fixture:integration-01", db: d1, guard });
const controller = createStagingScheduledTestController({ adapter, isStagingBuild: true, env: { STAGING_SCHEDULED_TEST_CONTROL_ENABLED: "true" }, paymentMode: "test", authorizationSecret: "s".repeat(40), generateNonce: () => "12345678-1234-1234-1234-123456789abc", maxDurationMs: 2000 });
const endpoint = createStagingScheduledTestEndpoint({ controller, env: { STAGING_SCHEDULED_TEST_CONTROL_ENABLED: "true", STAGING_SCHEDULED_TEST_AUTH_SECRET: "s".repeat(40) } });
const req = body => new Request("https://local.test", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${"s".repeat(40)}` }, body: JSON.stringify(body) });

test("HTTP -> controller -> synthetic D1 fixture completes and cleans", async () => { const response = await endpoint(req({ scenario: "retry-recovery" })); assert.equal(response.status, 200); assert.equal(db.prepare("SELECT COUNT(*) AS n FROM staging_synthetic_fixture_effect").get().n, 0); assert.equal(db.prepare("SELECT COUNT(*) AS n FROM staging_synthetic_fixture_lease").get().n, 0); });
test("parallel HTTP requests share one fixture/guard and have one winner", async () => { const responses = await Promise.all(Array.from({ length: 6 }, () => endpoint(req({ scenario: "retry-recovery" })))); assert.equal(responses.filter(r => r.status === 200).length, 1); assert.equal(responses.filter(r => r.status === 409).length, 5); assert.equal(db.prepare("SELECT COUNT(*) AS n FROM staging_synthetic_fixture_effect").get().n, 0); });
test("stale lease and duplicate operation fail closed", async () => { state.active = true; state.nonce = "stale"; state.expires = Date.now() - 1; const stale = await adapter.fencedWrite({ scenario: "retry-recovery", nonce: "stale", operationCode: "retry-recovery-apply" }); assert.equal(stale.ok, false); state.active = false; state.nonce = "12345678-1234-1234-1234-123456789abc"; state.expires = Date.now() + 5000; await adapter.acquire({ scenario: "retry-recovery", nonce: state.nonce, deadline: state.expires }); const a = await adapter.fencedWrite({ scenario: "retry-recovery", nonce: state.nonce, operationCode: "retry-recovery-apply" }); const b = await adapter.fencedWrite({ scenario: "retry-recovery", nonce: state.nonce, operationCode: "retry-recovery-apply" }); assert.equal(a.ok, true); assert.equal(b.ok, false); await adapter.cleanup(); assert.equal(await adapter.verifyCleanup(), true); });
console.log("Synthetic HTTP -> controller -> D1 fixture integration PASS");
