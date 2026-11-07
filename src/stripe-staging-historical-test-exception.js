// Narrow, runtime-only exception evaluator.
// It never removes records from the raw reconciliation and never applies to live data.
const HISTORICAL_TEST_STATUSES = new Set(["active", "trialing", "past_due", "canceled", "unpaid", "incomplete_expired"]);

function exact(value, expected) {
  return typeof value === "string" && value.length > 0 && value === expected;
}

export function evaluateHistoricalTestExceptions({
  accountId,
  livemode,
  rawUnrepresented = [],
  approvedExceptions = [],
} = {}) {
  const raw = Array.isArray(rawUnrepresented) ? rawUnrepresented : [];
  const approved = Array.isArray(approvedExceptions) ? approvedExceptions : [];
  const invalidContext = livemode !== false || typeof accountId !== "string" || !accountId.startsWith("acct_");
  const evaluated = [];
  const consumed = new Set();

  for (const item of raw) {
    const candidate = approved.find((entry, index) =>
      !consumed.has(index) &&
      entry?.ownerApproved === true &&
      entry?.historicalTest === true &&
      entry?.livemode === false &&
      exact(entry.accountId, accountId) &&
      exact(entry.subscriptionId, item.subscriptionId) &&
      exact(entry.customerId, item.customerId) &&
      exact(entry.userId, item.userId) &&
      exact(entry.createdAt, item.createdAt) &&
      HISTORICAL_TEST_STATUSES.has(String(item.status || "").toLowerCase())
    );
    if (candidate && !invalidContext) {
      const index = approved.indexOf(candidate);
      consumed.add(index);
      evaluated.push({ subscriptionId: item.subscriptionId, status: "approved-historical-test-exception" });
    } else {
      evaluated.push({ subscriptionId: item.subscriptionId, status: invalidContext ? "blocked-invalid-context" : "blocking-unapproved-unmatched" });
    }
  }

  const approvedCount = evaluated.filter(item => item.status === "approved-historical-test-exception").length;
  const remainingBlockers = evaluated.length - approvedCount;
  return {
    rawUnrepresentedCount: raw.length,
    approvedHistoricalTestExceptionCount: approvedCount,
    remainingBlockerCount: remainingBlockers,
    releaseSafeEligible: !invalidContext && remainingBlockers === 0,
    evaluated,
  };
}
