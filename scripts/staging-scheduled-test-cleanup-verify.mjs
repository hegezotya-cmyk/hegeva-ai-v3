import { spawnSync } from "node:child_process";

const configPath = process.env.SYNTHETIC_TEST_WRANGLER_CONFIG || "wrangler.staging-scheduled-test.jsonc";
const expectedDb = "hegeva-ai-v3-staging-scheduled-test-db";
const sql = `SELECT
  (SELECT COUNT(*) FROM staging_synthetic_fixture_effect WHERE substr(namespace,1,16) = 'staging-fixture:') AS effects,
  (SELECT COUNT(*) FROM staging_synthetic_fixture_lease WHERE substr(namespace,1,16) = 'staging-fixture:') AS leases,
  (SELECT COUNT(*) FROM stripe_terminal_effect_outbox WHERE substr(userId,1,8) = 'fixture_') AS outbox,
  (SELECT COUNT(*) FROM staging_scheduled_test_runs WHERE scenario IN ('retry-recovery','lease-fencing')) AS runs`;

const config = JSON.parse(await (await import("node:fs/promises")).readFile(configPath, "utf8"));
if (config.name !== "hegeva-ai-v3-staging-scheduled-test" || config.d1_databases?.[0]?.database_name !== expectedDb ||
    config.d1_databases?.[0]?.binding !== "SYNTHETIC_TEST_DB" || config.vars?.PAYMENT_MODE !== "test" ||
    config.vars?.STAGING_SCHEDULED_TEST_ENABLED !== "false") {
  throw new Error("Refusing cleanup verification: isolated TEST target/default-off config mismatch");
}
const result = spawnSync("npx", ["wrangler", "d1", "execute", expectedDb, "--remote", "--config", configPath,
  "--command", sql, "--json"], { encoding: "utf8", env: process.env, timeout: 60_000 });
if (result.error || result.status !== 0) throw new Error("Read-only synthetic cleanup verification query failed");
let parsed;
try { parsed = JSON.parse(result.stdout); } catch { throw new Error("Cleanup verification returned invalid JSON"); }
const rows = parsed?.[0]?.results;
const row = Array.isArray(rows) ? rows[0] : null;
if (!row || ["effects", "leases", "outbox", "runs"].some(key => Number(row[key]) !== 0)) {
  throw new Error("Synthetic test fixture rows remain after cleanup");
}
console.log("Synthetic fixture cleanup verified: zero rows in four isolated fixture scopes");
