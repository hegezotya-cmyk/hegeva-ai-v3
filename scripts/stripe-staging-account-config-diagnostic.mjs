// Read-only staging Stripe account/config diagnostic.
// Never reads or exports the Worker STRIPE_SECRET_KEY.
// Optional separate sandbox key: STRIPE_SANDBOX_READONLY_KEY (rk_test_...).
import { readFileSync } from "node:fs";

const config = readFileSync(new URL("../wrangler.staging.jsonc", import.meta.url), "utf8");
const mode = /"PAYMENT_MODE"\s*:\s*"([^"]+)"/.exec(config)?.[1] || null;
const priceIds = [...config.matchAll(/"(STRIPE_[A-Z_]+PRICE_ID)"\s*:\s*"(price_[^"]+)"/g)]
  .map(([, name, id]) => ({ name, id }));
const localKey = process.env.STRIPE_SANDBOX_READONLY_KEY?.trim() || "";
const summary = {
  configMode: mode,
  configuredPriceCount: priceIds.length,
  configuredPricePrefixes: priceIds.map(({ name, id }) => ({ name, prefix: id.slice(0, 8) })),
  workerSecretRead: false,
};

if (mode !== "test" || priceIds.length === 0) {
  console.log(JSON.stringify({ status: "FAIL", reason: "invalid-staging-test-config", ...summary }));
  process.exitCode = 2;
} else if (!/^rk_test_/.test(localKey)) {
  console.log(JSON.stringify({ status: "BLOCKED", reason: "separate-sandbox-readonly-key-required", ...summary }));
  process.exitCode = 2;
} else {
  const accountResponse = await fetch("https://api.stripe.com/v1/account", {
    headers: { Authorization: `Bearer ${localKey}` },
    signal: AbortSignal.timeout(30000),
  });
  const account = await accountResponse.json().catch(() => ({}));
  if (!accountResponse.ok || typeof account.id !== "string" || account.livemode !== false) {
    console.log(JSON.stringify({ status: "BLOCKED", reason: "sandbox-account-read-failed", httpStatus: accountResponse.status, ...summary }));
    process.exitCode = 2;
  } else {
    const prices = await Promise.all(priceIds.map(async ({ name, id }) => {
      const response = await fetch(`https://api.stripe.com/v1/prices/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${localKey}` },
        signal: AbortSignal.timeout(30000),
      });
      const data = await response.json().catch(() => ({}));
      return { name, idPrefix: id.slice(0, 8), found: response.ok && data.id === id, livemode: data.livemode ?? null };
    }));
    const allFound = prices.every((price) => price.found && price.livemode === false);
    console.log(JSON.stringify({ status: allFound ? "PASS" : "REVIEW_REQUIRED", accountId: account.id, livemode: account.livemode, prices, ...summary }));
    if (!allFound) process.exitCode = 2;
  }
}
