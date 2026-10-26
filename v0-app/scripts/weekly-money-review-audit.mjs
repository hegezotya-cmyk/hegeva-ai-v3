import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const business = readFileSync(new URL("../app/business/page.tsx", import.meta.url), "utf8")
const moneyToday = readFileSync(new URL("../components/business/money-today.tsx", import.meta.url), "utf8")
const weekly = readFileSync(new URL("../components/business/weekly-money-review.tsx", import.meta.url), "utf8")
const selector = readFileSync(new URL("../lib/weekly-money-review.ts", import.meta.url), "utf8")

assert.match(business, /"\/business\/weekly-review"/)
assert.match(moneyToday, /"\/business\/weekly-review"/)
assert.match(weekly, /selectWeeklyMoneyReview/)
assert.match(selector, /"\/business\/invoices\?focus=payment-followup"/)
assert.match(selector, /"\/business\/invoices\?focus=quote-followup"/)
assert.match(selector, /"\/business\/customers"/)
assert.doesNotMatch(weekly, /fetch\s*\(|method:\s*["']POST|external-actions|send-email/)
console.log("Weekly money review safety audit passed.")
