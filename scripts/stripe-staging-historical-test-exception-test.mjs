import assert from "node:assert/strict";
import { evaluateHistoricalTestExceptions } from "../src/stripe-staging-historical-test-exception.js";

const base = {
  accountId: "acct_main_test",
  subscriptionId: "sub_history",
  customerId: "cus_history",
  userId: "user_history",
  createdAt: "2026-09-02T02:50:39.000Z",
  status: "active",
};
const approval = {...base, historicalTest: true, ownerApproved: true, livemode: false};

const accepted = evaluateHistoricalTestExceptions({accountId: base.accountId, livemode: false, rawUnrepresented: [base], approvedExceptions: [approval]});
assert.deepEqual(accepted, {
  rawUnrepresentedCount: 1, approvedHistoricalTestExceptionCount: 1,
  remainingBlockerCount: 0, releaseSafeEligible: true,
  evaluated: [{subscriptionId: "sub_history", status: "approved-historical-test-exception"}],
});

for (const changed of [
  {...approval, customerId: "cus_other"},
  {...approval, userId: "user_other"},
  {...approval, subscriptionId: "sub_unknown"},
  {...approval, ownerApproved: false},
  {...approval, historicalTest: false},
]) {
  const result = evaluateHistoricalTestExceptions({accountId: base.accountId, livemode: false, rawUnrepresented: [base], approvedExceptions: [changed]});
  assert.equal(result.releaseSafeEligible, false);
  assert.equal(result.remainingBlockerCount, 1);
}

const multiple = evaluateHistoricalTestExceptions({accountId: base.accountId, livemode: false, rawUnrepresented: [base, {...base, subscriptionId: "sub_unknown"}], approvedExceptions: [approval]});
assert.equal(multiple.rawUnrepresentedCount, 2);
assert.equal(multiple.approvedHistoricalTestExceptionCount, 1);
assert.equal(multiple.remainingBlockerCount, 1);
assert.equal(multiple.releaseSafeEligible, false);

for (const context of [
  {livemode: true, accountId: base.accountId},
  {livemode: false, accountId: "acct_wrong"},
]) {
  const result = evaluateHistoricalTestExceptions({accountId: context.accountId, livemode: context.livemode, rawUnrepresented: [base], approvedExceptions: [approval]});
  assert.equal(result.releaseSafeEligible, false);
  assert.equal(result.remainingBlockerCount, 1);
}

const noPagination = evaluateHistoricalTestExceptions({accountId: base.accountId, livemode: false, rawUnrepresented: [base], approvedExceptions: []});
assert.equal(noPagination.releaseSafeEligible, false);
assert.equal(noPagination.remainingBlockerCount, 1);
console.log("Historical TEST exception policy regressions PASS (exact TEST approval only; no remote I/O).");
