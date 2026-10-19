import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const fixture = readFileSync(resolve(appRoot, "lib/demo-workspace.ts"), "utf8")
const component = readFileSync(resolve(appRoot, "components/demo-workspace.tsx"), "utf8")
const demoPage = readFileSync(resolve(appRoot, "app/demo/page.tsx"), "utf8")
for (const value of [
  "Northgate Property Care Ltd",
  "Riverside Estates Management",
  "Amelia Carter",
  "Annual property maintenance contract",
  "2400",
  "23 September 2026",
]) assert.match(fixture, new RegExp(value))

for (const legacyName of ["BrightSpark", "PrimeCare", "Crystal Clean", "Urban Retail"]) {
  assert.doesNotMatch(fixture, new RegExp(legacyName))
}

assert.equal((fixture.match(/Follow up with Riverside Estates Management/g) || []).length, 1)
assert.match(component, /awaitingApproval/)
assert.match(component, /notSent/)
assert.match(component, /notExecuted/)
for (const locale of ["en", "hu", "de", "fr", "es"]) {
  assert.match(component, new RegExp(`${locale}:\\{preparedAction:`))
}
assert.doesNotMatch(component, /followup-approval-pending|HEGEVA TEST LEAD|HEGEVA E2E TEST CUSTOMER/)
assert.doesNotMatch(component, /\b(fetch|POST|PUT|PATCH|DELETE)\b/)
assert.match(demoPage, /<DemoWorkspace\/>/)

console.log("Demo presentation audit: PASS")
