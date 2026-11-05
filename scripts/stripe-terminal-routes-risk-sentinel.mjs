import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ledger = readFileSync(new URL("../src/index-ledger.js", import.meta.url), "utf8");
const worker = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

// Integration contract: explicitly enumerate BOTH terminal mutation paths.
// This test is a risk-inventory sentinel, NOT evidence that the defect is fixed.
assert.match(ledger, /async function downgradeTerminalSubscription\(/);
assert.match(ledger, /claim\?\.eventType !== "customer\.subscription\.updated"/);
assert.match(ledger, /plan = 'basic'/);
assert.match(worker, /"customer\.subscription\.deleted"/);
assert.match(worker, /await applyStripePlanEvent\(\s*env,\s*userId,\s*"basic",\s*event/);
console.log("CONFIRMED: two unprotected webhook downgrade paths exist.");
console.log("Integration must protect both updated and deleted and pass signed-event + live D1 tests.");
