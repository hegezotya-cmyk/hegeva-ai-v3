import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const base = { compatibility_date: "2026-09-02", main: "src/hubspot-isolated-worker.js", name: "hegeva-isolated-hubspot-test", workers_dev: false, preview_urls: false, d1_databases: [{ binding: "DB", database_name: "hegeva-hubspot-isolated-test-db", database_id: "53fd518c-9b5c-45b5-9a74-4565f7acdd22" }], vars: { HUBSPOT_ENABLED: "false", HUBSPOT_TRANSPORT_ENABLED: "false" } };
function check(config) {
  const dir = mkdtempSync(join(tmpdir(), "hegeva-preflight-"));
  try {
    const file = join(dir, "config.json");
    writeFileSync(file, JSON.stringify(config));
    return spawnSync(process.execPath, ["scripts/hubspot-isolated-worker-preflight.mjs", file], { encoding: "utf8" });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
test("strict isolated static configuration passes only local preflight", () => {
  const result = check(base);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /runtime tests NOT verified/);
});
for (const [name, patch] of [
  ["wrong Worker name", { name: "hegeva-ai-v3" }],
  ["unknown config field", { observability: { enabled: true } }],
  ["unexpected D1 override", { d1_databases: [{ ...base.d1_databases[0], jurisdiction: "eu" }] }],
  ["wrong compatibility date", { compatibility_date: "2026-01-01" }],
  ["wrong entrypoint", { main: "src/index.js" }],
  ["missing entrypoint", { main: undefined }],
  ["public route", { routes: ["example.com/*"] }],
  ["malformed routes", { routes: "example.com/*" }],
  ["worker preview", { preview_urls: true }],
  ["cron", { triggers: { crons: ["* * * * *"] } }],
  ["missing D1", { d1_databases: undefined }],
  ["null D1", { d1_databases: null }],
  ["malformed D1", { d1_databases: [null] }],
  ["different valid UUID", { d1_databases: [{ ...base.d1_databases[0], database_id: "11111111-2222-4333-8444-555555555555" }] }],
  ["invalid UUID", { d1_databases: [{ ...base.d1_databases[0], database_id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }] }],
  ["extra D1", { d1_databases: [...base.d1_databases, ...base.d1_databases] }],
  ["wrong database", { d1_databases: [{ ...base.d1_databases[0], database_name: "hegeva-ai-db" }] }],
  ["HubSpot enabled", { vars: { ...base.vars, HUBSPOT_TRANSPORT_ENABLED: "true" } }],
  ["extra variable", { vars: { ...base.vars, API_TOKEN: "synthetic" } }],
  ["service binding", { services: [{ binding: "API", service: "production" }] }],
  ["environment override", { env: { production: {} } }],
  ["queue binding", { queues: { producers: [{ binding: "QUEUE", queue: "test" }] } }],
]) test(`blocks ${name}`, () => {
  const result = check({ ...base, ...patch });
  assert.notEqual(result.status, 0, name);
  assert.match(result.stderr, /BLOCKED/);
});
