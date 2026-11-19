import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const production = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
const staging = JSON.parse(readFileSync(new URL("../wrangler.staging.jsonc", import.meta.url), "utf8"));
const workerSource = readFileSync(new URL("../src/index-ledger.js", import.meta.url), "utf8");

assert.equal(production.version_metadata?.binding, "CF_VERSION_METADATA");
assert.equal(staging.version_metadata?.binding, "CF_VERSION_METADATA");
assert.equal(production.vars?.SENTRY_ENVIRONMENT, "production");
assert.equal(staging.vars?.SENTRY_ENVIRONMENT, "staging");
assert.equal(production.upload_source_maps, true);
assert.equal(staging.upload_source_maps, true);
assert.match(workerSource, /release:\s*env\.SENTRY_RELEASE\s*\|\|\s*env\.CF_VERSION_METADATA\?\.id/);

process.stdout.write("Sentry environment, release, and source-map config: PASS\n");
