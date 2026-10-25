import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const config = JSON.parse(readFileSync(new URL("../wrangler.staging.jsonc", import.meta.url), "utf8"))
const vars = config.vars || {}
for (const tier of ["SMALL", "MEDIUM", "LARGE"]) {
  const priceId = vars[`STRIPE_TOPUP_${tier}_PRICE_ID`]
  assert.equal(typeof priceId, "string", `${tier} staging Top-Up price must be configured`)
  assert.match(priceId, /^price_/, `${tier} staging Top-Up price must be a Stripe Price ID`)
}
assert.equal(vars.PAYMENT_MODE, "test", "Top-Up staging prices must run only in Stripe Test mode")
console.log("staging top-up checkout configuration: PASS")