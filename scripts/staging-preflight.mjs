import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const config = readFileSync(new URL("../wrangler.staging.jsonc", import.meta.url), "utf8")
const required = [
  ["staging app host", /"PUBLIC_APP_URL": "https:\/\/(?!REPLACE_WITH_)[^"]+"/],
  ["test Premium Price ID", /"STRIPE_PREMIUM_PRICE_ID": "price_[^"]+"/],
  ["test Pro Price ID", /"STRIPE_PRO_PRICE_ID": "price_[^"]+"/],
  ["staging D1 database ID", /"database_id": "[0-9a-f-]{36}"/],
  ["secret provisioning confirmation", /"STAGING_SECRETS_CONFIGURED": "confirmed"/],
]

assert.equal(process.env.CLOUDFLARE_API_TOKEN ? true : false, true, "Missing staging-only CLOUDFLARE_API_TOKEN")
assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID ? true : false, true, "Missing staging-only CLOUDFLARE_ACCOUNT_ID")
assert.match(config, /"PAYMENT_MODE": "test"/)
assert.doesNotMatch(config, /"PAYMENT_MODE": "live"/)
assert.doesNotMatch(config, /hegeva-ai-db/gi)
assert.doesNotMatch(config, /"PUBLIC_APP_URL": "https:\/\/hegevaai\.co\.uk"/)
for (const [label, pattern] of required) assert.match(config, pattern, `Missing ${label}`)
console.log("Staging deployment preflight passed")
