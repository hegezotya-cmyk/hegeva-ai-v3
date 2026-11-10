import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"

// Exercise the real component helper with fake responses, never the live API.
const source = readFileSync(new URL("../components/auth/auth-panel.tsx", import.meta.url), "utf8")
const start = source.indexOf("  async function attributeCapturedReferral() {")
const end = source.indexOf("  async function handleSubmit(", start)
assert(start >= 0 && end > start, "find the referral helper in auth-panel")
const helperSource = source.slice(start, end)
assert.match(helperSource, /result\?\.attributed === true/, "new attribution must be confirmed in the response body")
assert.match(source.slice(end), /if \(referralAttributed\)\s*\{[\s\S]*?event: "referral_signup"/, "conversion must wait for successful attribution")

const testCases = [
  { label: "no stored referral", referral: null, expect: false, clears: 0, calls: 0 },
  { label: "first verified referral", status: 201, body: { attributed: true }, expect: true, clears: 1, calls: 1 },
  { label: "idempotent duplicate is not new conversion", status: 200, body: { attributed: false, duplicate: true }, expect: false, clears: 1, calls: 1 },
  { label: "unverified session rejected", status: 401, body: { error: "Authentication required" }, expect: false, clears: 0, calls: 1 },
  { label: "expired/refused referral", status: 409, body: { error: "Referral window expired" }, expect: false, clears: 0, calls: 1 },
  { label: "unavailable provider", networkError: true, expect: false, clears: 0, calls: 1 },
  { label: "malformed success body", status: 200, badJson: true, expect: false, clears: 0, calls: 1 },
  { label: "success without attribution", status: 200, body: { attributed: false }, expect: false, clears: 0, calls: 1 },
]

for (const item of testCases) {
  let clears = 0
  let calls = 0
  const context = {
    captureReferralAttribution: () => item.referral === null ? null : { code: "fixture-only-code" },
    clearReferralAttribution: () => { clears++ },
    fetch: async (url, init) => {
      calls++
      assert.equal(url, "/api/referrals/attribute", "never call a production URL")
      assert.equal(init.method, "POST")
      assert.equal(init.credentials, "include")
      assert.deepEqual(JSON.parse(init.body), { code: "fixture-only-code" })
      if (item.networkError) throw new Error("simulated network outage")
      return {
        ok: item.status >= 200 && item.status < 300,
        json: async () => { if (item.badJson) throw new Error("bad JSON"); return item.body },
      }
    },
  }
  if (item.referral !== null) item.referral = { code: "fixture-only-code" }
  const helper = runInNewContext(`${helperSource}\nattributeCapturedReferral`, context, { timeout: 1000 })
  assert.equal(await helper(), item.expect, item.label)
  assert.equal(clears, item.clears, `${item.label}: referral storage cleanup`)
  assert.equal(calls, item.calls, `${item.label}: API calls`)
  console.log(`PASS ${item.label}`)
}
console.log("Referral attribution client contract: PASS (mocked, no external requests)")
