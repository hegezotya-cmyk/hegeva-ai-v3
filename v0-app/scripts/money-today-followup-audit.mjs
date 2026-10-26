import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const page = readFileSync(new URL("../app/business/invoices/page.tsx", import.meta.url), "utf8")
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
const workflow = readFileSync(new URL("../../.github/workflows/main.yml", import.meta.url), "utf8")

assert.match(page, /searchParams\.get\("focus"\).*payment-followup/)
assert.match(page, /searchParams\.get\("focus"\).*quote-followup/)
assert.match(page, /id="payment-follow-up"/)
assert.match(page, /id="quote-follow-up"/)
assert.match(page, /paymentFollowUpBlockReason\(followUpRecord\)/)
assert.doesNotMatch(page, /useEffect\([^)]*fetch\([^)]*external-actions/s)
assert.equal(packageJson.scripts["audit:money-today-followup"], "node scripts/money-today-followup-audit.mjs")
assert.match(workflow, /audit:money-today-followup/)

console.log("Money Today follow-up focus audit passed.")
