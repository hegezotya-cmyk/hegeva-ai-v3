import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");
const [worker, handler, runner, configText, production, cleanup] = await Promise.all([
  read("src/staging-scheduled-test-worker.js"),
  read("src/staging-scheduled-test-cron-handler.js"),
  read("src/staging-scheduled-runtime-runner.js"),
  read("wrangler.staging-scheduled-test.jsonc"),
  read("src/index-ledger.js"),
  read("scripts/staging-scheduled-test-cleanup.sql"),
]);
const config = JSON.parse(configText);

assert.equal(config.name, "hegeva-ai-v3-staging-scheduled-test");
assert.equal(config.workers_dev, false);
assert.equal(config.vars.PAYMENT_MODE, "test");
assert.equal(config.vars.STAGING_SCHEDULED_TEST_ENABLED, "false");
assert.deepEqual(config.triggers.crons, ["*/1 * * * *"]);
assert.equal(config.d1_databases.length, 1);
assert.equal(config.d1_databases[0].binding, "SYNTHETIC_TEST_DB");
assert.equal(config.d1_databases[0].database_name, "hegeva-ai-v3-staging-scheduled-test-db");
assert.match(config.d1_databases[0].database_id, /^[0-9a-f-]{36}$/i,
  "D1 id must be a UUID placeholder or an actual Cloudflare id");
assert.equal(config.durable_objects.bindings.length, 1);
assert.equal(config.durable_objects.bindings[0].name, "GUARD");
assert.match(worker, /async fetch\(\)[\s\S]*status: 404/);
assert.match(worker, /scheduled\(event, env, ctx\)/);
assert.match(handler, /STAGING_SCHEDULED_TEST_ENABLED !== "true"/);
assert.match(handler, /PAYMENT_MODE !== "test"/);
assert.match(handler, /retry-recovery/);
assert.match(handler, /lease-fencing/);
assert.doesNotMatch(handler, /request\.|searchParams|SQL|stripe/i);
assert.match(runner, /processNextTerminalEffect/);
assert.match(runner, /fixture_/);
assert.match(runner, /livemode: false/);
assert.doesNotMatch(runner, /fetch\(|stripe\.com|https?:\/\//i);
assert.doesNotMatch(production, /staging-scheduled-test-worker|SYNTHETIC_TEST_DB/);
assert.match(cleanup, /substr\(userId,1,8\) = 'fixture_'/);
assert.doesNotMatch(cleanup, /DELETE FROM (users|stripe_customers|subscriptions)\b/i);
console.log("Synthetic Worker isolation safeguards PASS");
