import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const checkout = source.slice(source.indexOf("async function createStripeCheckoutSession("), source.indexOf("function getAssistantTopUpPack("));
assert.match(checkout, /lockId: crypto\.randomUUID\(\)/);
assert.match(checkout, /AND updatedAt=\?4 AND data=\?5/);
assert.match(checkout, /dataType='stripe_checkout_lock' AND data=\?2/);
assert.equal((checkout.match(/DELETE FROM workspace_data WHERE userId/g) || []).length, 1);
console.log("Stripe checkout lock CAS regression test PASS");
