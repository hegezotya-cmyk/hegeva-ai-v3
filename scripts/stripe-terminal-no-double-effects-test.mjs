import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(new URL("../src/index-ledger.js",import.meta.url),"utf8");
const start=source.indexOf("async function reconcileTerminalStripeEvent(");
const end=source.indexOf("async function handleStripeWebhook(",start);
assert(start>=0&&end>start);
const section=source.slice(start,end);
assert.match(section,/env\.DB\.batch\(\[/);
assert.match(section,/env\.DB\.prepare\(queuedEffect\.sql\)/);
assert.doesNotMatch(section,/await syncStripeBillingIdentity\(/,
 "terminal path must not sync canceled customer identity directly");
assert.doesNotMatch(section,/await reverseApprovedReferralRewards\(/,
 "terminal path must not reverse referral immediately");
assert.doesNotMatch(section,/await reconcileReferralRewardForUser\(/,
 "terminal path must not reconcile referral immediately");
assert.match(section,/Number\(changes\[2\]\?\.meta\?\.changes\) !== 1/);
console.log("Terminal webhook side-effect exclusivity PASS: only persisted outbox job; no inline billing/referral effects.");
