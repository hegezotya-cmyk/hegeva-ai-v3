#!/usr/bin/env node
// Read-only, fail-closed preflight. Never deploys, migrates, sends or logs secrets.
// Usage: node scripts/hubspot-isolated-worker-preflight.mjs path/to/isolated-wrangler.jsonc
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
    if (config.workers_dev !== false) errors.push("workers_dev must be false");
    if (config.preview_urls !== false) errors.push("preview_urls must be false");
    if (Array.isArray(config.routes) && config.routes.length) errors.push("routes must be empty");
    if (config.route) errors.push("route must be absent");
    if (!/isolated.*hubspot|hubspot.*isolated/i.test(config.name || "")) errors.push("Worker name must clearly identify isolated HubSpot test");
    const d1 = config.d1_databases || [];
    if (d1.length !== 1 || d1[0].binding !== "DB" || d1[0].database_name !== "hegeva-hubspot-isolated-test-db" ||
        !/^[a-f0-9-]{36}$/i.test(d1[0].database_id || "")) errors.push("exactly one isolated D1 DB binding with UUID required");
    if (config.ai || config.durable_objects) errors.push("AI and Durable Objects must not be bound");
    if (config.triggers?.crons?.length) errors.push("cron triggers must be absent");
    if (config.vars?.HUBSPOT_ENABLED !== "false") errors.push("HUBSPOT_ENABLED must be string false");
    if (config.vars?.HUBSPOT_TRANSPORT_ENABLED !== "false") errors.push("HUBSPOT_TRANSPORT_ENABLED must be string false");
    if (errors.length) { for (const e of errors) console.error("BLOCKED:", e); process.exitCode = 1; }
    else console.log("PASS: static isolated Worker configuration preflight only; account ownership, remote binding, permissions and runtime tests NOT verified");
  } catch { console.error("BLOCKED: missing or non-strict-JSON configuration; do not deploy"); process.exitCode = 2; }
}
