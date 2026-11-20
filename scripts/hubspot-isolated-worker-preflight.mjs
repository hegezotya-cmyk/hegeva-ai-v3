#!/usr/bin/env node
// Read-only, fail-closed preflight. Never deploys, migrates, sends or logs secrets.
// Usage: node scripts/hubspot-isolated-worker-preflight.mjs path/to/isolated-wrangler.json
import fs from "node:fs";
import path from "node:path";

const file = process.argv[2];
if (!file) { console.error("BLOCKED: isolated Worker configuration path required"); process.exitCode = 2; }
else {
  try {
    const resolved = path.resolve(file);
    const raw = fs.readFileSync(resolved, "utf8");
    // This intentionally accepts only strict JSON; no unsafe eval/JSONC stripping.
    const config = JSON.parse(raw);
    const errors = [];
    if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("invalid config");
    const allowedTopLevel = new Set(["name", "main", "compatibility_date", "workers_dev", "preview_urls", "routes", "d1_databases", "vars"]);
    for (const key of Object.keys(config)) if (!allowedTopLevel.has(key)) errors.push("unapproved top-level setting: " + key);
    if (config.name !== "hegeva-isolated-hubspot-test") errors.push("exact isolated Worker name required");
    if (config.compatibility_date !== "2026-09-02") errors.push("pinned compatibility date required");
    if (Array.isArray(config.d1_databases) && config.d1_databases.length === 1 && config.d1_databases[0] &&
        Object.keys(config.d1_databases[0]).some(key => !["binding", "database_name", "database_id"].includes(key))) errors.push("unapproved D1 binding field");
    if (config.main !== "src/hubspot-isolated-worker.js") errors.push("main must be the inert isolated HubSpot Worker entrypoint");
    if (config.workers_dev !== false) errors.push("workers_dev must be false");
    if (config.preview_urls !== false) errors.push("preview_urls must be false");
    if (config.routes !== undefined && (!Array.isArray(config.routes) || config.routes.length)) errors.push("routes must be absent or empty");
    if (config.route) errors.push("route must be absent");
    if (!/isolated.*hubspot|hubspot.*isolated/i.test(config.name || "")) errors.push("Worker name must clearly identify isolated HubSpot test");
    const d1 = config.d1_databases;
    if (!Array.isArray(d1)) errors.push("D1 binding list must be an array");
    if (!Array.isArray(d1) || d1.length !== 1 || !d1[0] || d1[0].binding !== "DB" || d1[0].database_name !== "hegeva-hubspot-isolated-test-db" ||
        d1[0].database_id !== "53fd518c-9b5c-45b5-9a74-4565f7acdd22") errors.push("exactly one verified isolated D1 DB binding and exact UUID required");
    if (config.ai || config.durable_objects || config.r2_buckets?.length || config.kv_namespaces?.length || config.services?.length || config.queues || config.hyperdrive?.length || config.vectorize?.length) errors.push("unapproved bindings must not be present");
    if (config.env && Object.keys(config.env).length) errors.push("environment overrides are not allowed");
    if (config.vars && Object.keys(config.vars).some(key => !["HUBSPOT_ENABLED", "HUBSPOT_TRANSPORT_ENABLED"].includes(key))) errors.push("unexpected environment variables");
    if (config.secrets || config.unsafe) errors.push("secret or unsafe bindings must not be configured");
    if (config.triggers && (Object.keys(config.triggers).some(key => key !== "crons") || !Array.isArray(config.triggers.crons) || config.triggers.crons.length)) errors.push("cron triggers must be absent");
    if (config.vars?.HUBSPOT_ENABLED !== "false") errors.push("HUBSPOT_ENABLED must be string false");
    if (config.vars?.HUBSPOT_TRANSPORT_ENABLED !== "false") errors.push("HUBSPOT_TRANSPORT_ENABLED must be string false");
    if (errors.length) { for (const e of errors) console.error("BLOCKED:", e); process.exitCode = 1; }
    else console.log("PASS: static isolated Worker configuration preflight only; account ownership, remote binding, permissions and runtime tests NOT verified");
  } catch { console.error("BLOCKED: missing or non-strict-JSON configuration; do not deploy"); process.exitCode = 2; }
}
