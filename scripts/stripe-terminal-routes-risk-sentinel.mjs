import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const ledger = readFileSync(new URL("../src/index-ledger.js", import.meta.url), "utf8");
const worker = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

// Integration source-level sentinel: both terminal event types must pass
// through the common reconciliation gate BEFORE calling the legacy worker.
assert.match(ledger, /import \{ reviewTerminalStripeEvent \} from "\.\/stripe-terminal-event-review\.js"/);
assert.match(ledger, /import \{ collectStripeUserSubscriptions \} from "\.\/stripe-subscription-inventory\.js"/);
assert.match(ledger, /type === "customer\.subscription\.updated"/);
assert.match(ledger, /type === "customer\.subscription\.deleted"/);
assert.doesNotMatch(ledger, /async function downgradeTerminalSubscription\(/);
assert.match(ledger, /if \(isTerminalSubscriptionEvent\(event\)\) \{/);
assert.match(ledger, /await reconcileTerminalStripeEvent\(env, event, claim\)/);
assert.match(ledger, /if \(reviewed\.deferred\)/);
assert.match(ledger, /status: 503/);
const intercepted = ledger.indexOf("if (isTerminalSubscriptionEvent(event))");
const delegate = ledger.indexOf("const delegatedRequest = new Request(request.url", intercepted);
assert(intercepted > 0 && delegate > intercepted,
  "terminal verification must precede normal webhook delegation");
assert.match(worker, /"customer\.subscription\.deleted"/);
assert.match(worker, /await applyStripePlanEvent\(\s*env,\s*userId,\s*"basic",\s*event/);
console.log("Terminal source-route sentinel PASS: updated+deleted guarded before legacy delegation.");
console.log("NOTE: legacy inner handler remains; this check does not replace signed end-to-end tests.");
