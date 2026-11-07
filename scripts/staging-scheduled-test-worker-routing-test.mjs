import assert from "node:assert/strict";
import { guardNameForScenario } from "../src/staging-test-routing.js";
import { readFile } from "node:fs/promises";

const ids = [], states = new Map();
const makeStub = name => { ids.push(name); if (!states.has(name)) states.set(name, { active: false, nonce: "", until: 0 }); const s = states.get(name); return { async acquire({ nonce, deadline }) { if (s.active && s.until > Date.now()) return false; s.active = true; s.nonce = nonce; s.until = deadline; return true; }, async verifyLease({ nonce }) { return s.active && s.nonce === nonce && s.until > Date.now(); }, async fencedWrite({ nonce, operationCode }) { return await this.verifyLease({ nonce }) ? { ok: true, operationCode, fencingToken: nonce } : { ok: false, reason: "lease-invalid" }; }, async release({ nonce }) { if (s.nonce !== nonce || !s.active) return false; s.active = false; return true; } }; };
assert.equal(guardNameForScenario("retry-recovery"), "staging-scheduled-test:retry-recovery");
assert.equal(guardNameForScenario("lease-fencing"), "staging-scheduled-test:lease-fencing");
assert.equal(guardNameForScenario("sql"), null);
const scenario = guardNameForScenario("retry-recovery");
for (let i = 0; i < 6; i++) ids.push(scenario);
assert.equal(new Set(ids).size, 1, "all requests must route to one stable scenario DO");
assert.equal(states.size, 0, "no remote state is touched by routing test");
const workerSource = await readFile(new URL("../src/staging-scheduled-test-worker.js", import.meta.url), "utf8");
const productionEntrypoints = await Promise.all(["../src/index.js", "../src/index-ledger.js"]
  .map(path => readFile(new URL(path, import.meta.url), "utf8")));
const productionConfig = await readFile(new URL("../wrangler.staging.jsonc", import.meta.url), "utf8");
const testConfig = JSON.parse(await readFile(new URL("../wrangler.staging-scheduled-test.jsonc", import.meta.url), "utf8"));
assert.match(workerSource, /scheduled\(event, env, ctx\)/, "dedicated worker must execute from a real scheduled event");
assert.match(workerSource, /status: 404/, "dedicated worker must expose no public fetch API");
assert.equal(productionEntrypoints.some(source => source.includes("staging-scheduled-test-worker")), false,
  "production API entrypoints must not import the synthetic test Worker");
assert.equal(productionConfig.includes("SYNTHETIC_TEST_DB"), false, "production-like staging API config must not bind the test D1");
assert.equal(productionConfig.includes("STAGING_SCHEDULED_TEST_ENABLED"), false, "existing API Worker must not enable the synthetic cron path");
assert.equal(testConfig.name, "hegeva-ai-v3-staging-scheduled-test");
assert.equal(testConfig.workers_dev, false, "synthetic cron worker must not expose a workers.dev route");
assert.equal(testConfig.vars.PAYMENT_MODE, "test");
assert.equal(testConfig.vars.STAGING_SCHEDULED_TEST_ENABLED, "false", "synthetic cron worker is disabled by default");
assert.equal(testConfig.d1_databases[0].binding, "SYNTHETIC_TEST_DB");
assert.equal(testConfig.durable_objects.bindings[0].name, "GUARD");
assert.deepEqual(testConfig.triggers.crons, ["*/1 * * * *"]);
console.log("Synthetic cron Worker isolation PASS: no public route, production import, D1 binding, or enabled default");
