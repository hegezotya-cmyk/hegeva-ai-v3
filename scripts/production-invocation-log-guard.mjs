import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Production client-portal share tokens can appear in URL paths.
// Never restore URL-bearing Worker invocation logs during deployments.
const config = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
assert.equal(config.name, "hegeva-ai-v3", "Expected production API Worker");
assert.equal(config.observability?.logs?.enabled, true, "Keep sanitized application logs enabled");
assert.equal(config.observability?.logs?.invocation_logs, false, "Production invocation logs must stay disabled");
console.log("Production API invocation-log privacy guard: PASS");
