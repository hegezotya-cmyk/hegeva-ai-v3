import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const page = readFileSync(new URL("../app/business/invoices/page.tsx", import.meta.url), "utf8")

assert.match(page, /searchParams\.get\("focus"\).*payment-followup/)
assert.match(page, /searchParams\.get\("focus"\).*quote-followup/)
assert.match(page, /id="payment-follow-up"/)
assert.match(page, /id="quote-follow-up"/)
assert.match(page, /paymentFollowUpBlockReason\(followUpRecord\)/)
assert.doesNotMatch(page, /useEffect\([^)]*fetch\([^)]*external-actions/s)

console.log("Money Today follow-up focus audit passed.")
