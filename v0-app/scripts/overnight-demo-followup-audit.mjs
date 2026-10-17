import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const challenge = readFileSync(join(root, "components/growth/sixty-second-challenge.tsx"), "utf8")
const account = readFileSync(join(root, "app/account/page.tsx"), "utf8")

assert.match(challenge, /type PreparedAction = "invoice_followup" \| "quote_followup"/,
  "the demo must keep invoice and quote preparation as distinct actions")
assert.match(challenge, /prepareAction\("invoice_followup", 1200\)/,
  "the overdue invoice card must keep its existing prepared action")
assert.match(challenge, /prepareAction\("quote_followup", 850\)/,
  "the stale quote card must offer its own prepared action")
assert.match(challenge, /preparedAction === "quote_followup" \? c\.quoteReminder : c\.reminder/,
  "the prepared preview must match the card selected by the visitor")
assert.equal((challenge.match(/quoteReminder:/g) || []).length, 5,
  "the quote follow-up preview must be available in all five locales")
assert.doesNotMatch(challenge, /fetch\(/,
  "the public fictional demo must not call a live business API")

for (const locale of ["en", "hu", "de", "fr", "es"]) {
  assert.match(account, new RegExp(`${locale}:\\s*\\{[^}]*title:`),
    `the Top-Up panel needs translated copy for ${locale}`)
}
for (const field of ["title", "description", "balance", "success", "cancelled", "usageOrder", "unavailable"]) {
  assert.match(account, new RegExp(`topUpCopy\\.${field}`),
    `the Top-Up panel must use localized ${field} copy`)
}
assert.doesNotMatch(account, />Extra AI credits</,
  "the Top-Up heading must not be hard-coded in English")

console.log("Overnight demo follow-up and account copy audit passed.")

