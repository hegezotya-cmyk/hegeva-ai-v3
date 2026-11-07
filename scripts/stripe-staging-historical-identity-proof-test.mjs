import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("./stripe-staging-historical-identity-proof.mjs",import.meta.url),"utf8");
assert.match(source,/historical-approval-missing/);
assert.match(source,/account-identity-unverified/);
assert.match(source,/pagination-incomplete/);
assert.match(source,/livemode===false/);
assert.match(source,/metadata\?\.userId/);
console.log("Historical identity proof safety gates PASS (static, no network or secrets).");
