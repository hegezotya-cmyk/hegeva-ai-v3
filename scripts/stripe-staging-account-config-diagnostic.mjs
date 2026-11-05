// Read-only staging Stripe account/config diagnostic.
// Never reads or exports the Worker STRIPE_SECRET_KEY.
// Uses one process-scoped TEST key only for read-only GET /v1/account and GET /v1/prices/{id}; never reads the Worker's secret.
import { readFileSync } from "node:fs";

const EXPECTED_TEST_ACCOUNT_ID = "acct_1U4YkEHECF9iDE3l";
const config = readFileSync(new URL("../wrangler.staging.jsonc", import.meta.url), "utf8");
const mode = /"PAYMENT_MODE"\s*:\s*"([^"]+)"/.exec(config)?.[1] || null;
const priceIds = [...config.matchAll(/"(STRIPE_[A-Z_]+PRICE_ID)"\s*:\s*"(price_[^"]+)"/g)]
  .map(([, name, id]) => ({ name, id }));
const localKey = process.env.STRIPE_TEST_READONLY_KEY?.trim() || process.env.STRIPE_TEST_SECRET_KEY?.trim() || process.env.STRIPE_SANDBOX_READONLY_KEY?.trim() || "";
const summary = {
  configMode: mode,
  configuredPriceCount: priceIds.length,
  configuredPricePrefixes: priceIds.map(({ name, id }) => ({ name, prefix: id.slice(0, 8) })),
  workerSecretRead: false,
};

if (mode !== "test" || priceIds.length === 0) {
  console.log(JSON.stringify({ status: "FAIL", reason: "invalid-staging-test-config", ...summary }));
  process.exitCode = 2;
} else if (!/^(rk|sk)_test_/.test(localKey)) {
  console.log(JSON.stringify({ status: "BLOCKED", reason: "stripe-test-readonly-key-unavailable", ...summary }));
  process.exitCode = 2;
} else {
  const accountResponse = await fetch("https://api.stripe.com/v1/account", {
    headers: { Authorization: `Bearer ${localKey}` },
    signal: AbortSignal.timeout(30000),
  });
  const account = await accountResponse.json().catch(() => ({}));
  // /v1/account describes the merchant account, not a mode-specific object; TEST mode is enforced by the key prefix and each Price.livemode.
  const accountReadable = accountResponse.ok && typeof account.id === "string";

  // Continue with price reads even if a least-privilege key cannot read /v1/account.
  const prices = await Promise.all(priceIds.map(async ({ name, id }) => {
    const response = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${localKey}` },
      signal: AbortSignal.timeout(30000),
    });
    const data = await response.json().catch(() => ({}));
    return {
      name,
      idPrefix: id.slice(0, 8),
      found: response.ok && data.id === id,
      livemode: data.livemode ?? null,
      httpStatus: response.status,
    };
  }));
  const allFound = prices.every((price) => price.found && price.livemode === false);
  const accountMatches = accountReadable && account.id === EXPECTED_TEST_ACCOUNT_ID;
  const priceCheck = allFound ? "PASS" : "REVIEW_REQUIRED";
  const status = accountMatches && allFound ? "PASS" : "REVIEW_REQUIRED";
  console.log(JSON.stringify({
    status,
    reason: status === "PASS" ? null : !accountReadable ? "account-identity-unavailable" : !accountMatches ? "unexpected-test-account" : "configured-prices-unavailable-or-mismatched",
    accountId: accountReadable ? account.id : null,
    accountMatchesExpected: accountMatches,
    accountReadStatus: accountReadable ? "PASS" : "BLOCKED",
    accountHttpStatus: accountResponse.status,
    livemode: accountReadable ? account.livemode : null,
    priceCheck,
    prices,
    ...summary,
  }));
  if (status !== "PASS") process.exitCode = 2;
}
