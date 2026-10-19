import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
const source = readFileSync(new URL("../app/account/page.tsx", import.meta.url), "utf8")
const confirmation = source.match(/if \(returnedFromCheckout\) \{([\s\S]*?)\n      \}/)
assert.ok(confirmation, "Checkout confirmation block must exist")
assert.match(confirmation[1], /const paid = PAID_PLANS\.has\(latest\.plan\)/)
assert.match(confirmation[1], /if \(paid\) clearBillingQuery\(\)/)
assert.doesNotMatch(confirmation[1], /\n\s*clearBillingQuery\(\)/)
console.log("Billing return regression passed")
