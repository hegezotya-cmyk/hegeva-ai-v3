import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ACTIVE_STRIPE_SUBSCRIPTION_STATUSES,
  checkoutLockIsFresh,
  hasActiveStripeSubscription,
} from "../src/stripe-checkout-guard.js";

assert.deepEqual(
  ACTIVE_STRIPE_SUBSCRIPTION_STATUSES,
  ["active", "trialing", "past_due"],
  "only paid/grace-period subscription states should block a second checkout",
);

for (const status of ACTIVE_STRIPE_SUBSCRIPTION_STATUSES) {
  assert.equal(
    hasActiveStripeSubscription({ subscriptionStatus: status }),
    true,
    `${status} must block a second subscription checkout`,
  );
}

for (const status of ["canceled", "unpaid", "incomplete_expired", null, ""]) {
  assert.equal(
    hasActiveStripeSubscription({ subscriptionStatus: status }),
    false,
    `${status || "empty"} must not be treated as active`,
  );
}

const now = Date.parse("2026-11-05T12:00:00.000Z");
assert.equal(
  checkoutLockIsFresh({ updatedAt: "2026-11-05T11:59:00.000Z" }, now),
  true,
);
assert.equal(
  checkoutLockIsFresh({ updatedAt: "2026-11-05T11:44:59.999Z" }, now),
  false,
  "expired checkout locks must not block a later attempt",
);
assert.equal(checkoutLockIsFresh(null, now), false);

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
assert.match(source, /dataType='stripe_checkout_lock'/);
assert.match(source, /catch \(error\)/);
assert.match(source, /reason: "network_error"/);
assert.match(source, /status: 409/);

// Guard against accidentally releasing another in-flight request's lock.
assert.match(source, /lockId: crypto\\.randomUUID\\(\\)/);
assert.match(source, /AND updatedAt=\\?4 AND data=\\?5/);
assert.match(source, /data=\\?2/);
assert.match(source, /await releaseOwnedCheckoutLock\\(\\)/);
assert.doesNotMatch(
  source,
  /DELETE FROM workspace_data WHERE userId=\\?1 AND dataType='stripe_checkout_lock'"/,
  "unconditional lock deletion can remove a newer request's lock",
);

console.log("Stripe duplicate-checkout guard test PASS");
