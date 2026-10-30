import assert from "node:assert/strict"
import fs from "node:fs"
import { execFileSync } from "node:child_process"
import ts from "typescript"

const read = (name) => fs.readFileSync(new URL(`../${name}`, import.meta.url), "utf8")
const auth = read("components/auth/auth-panel.tsx")
const tracking = read("lib/conversion-tracking.ts")
// Exercise the baseline without reverting local work.
const source = process.env.REGISTRATION_BASE_REF
  ? execFileSync("git", ["show", `${process.env.REGISTRATION_BASE_REF}:v0-app/components/analytics-consent.tsx`], { encoding: "utf8" })
  : read("components/analytics-consent.tsx")
const receiver = source.match(/const receive = \(event: Event\) => \{[\s\S]*?\n    }/)?.[0]
const tracker = tracking.match(/export function trackRegistrationSubmitted\(\)[\s\S]*?\n}/)?.[0]
assert.ok(receiver && tracker, "production tracking functions must exist")
const compile = (text) => ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
assert.match(auth, /trackRegistrationSubmitted\(\)/)
assert.match(auth, /if \(result\.error\)[\s\S]*?setError\(c\.authFailed\)/)
for (const consent of [null, "denied", "granted"]) {
  const calls = []
  const values = new Map(consent ? [["hegeva:analytics-consent:v1", consent]] : [])
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  const window = { gtag: (...args) => calls.push(args) }
  const receive = new Function("window", "consent", "sent", "PUBLIC_ANALYTICS_PATHS", "analyticsPageLocation", "currentPageReferrer", "campaignAttribution", "ANALYTICS_DEBUG_MODE", `${compile(receiver)}; return receive`)(window, consent, { current: new Set() }, ["/login"], (path) => `https://hegevaai.co.uk${path}`, { current: "" }, () => ({}), false)
  window.dispatchEvent = (event) => receive(event)
  class CustomEvent { constructor(type, options) { this.type = type; this.detail = options.detail } }
  const track = new Function("window", "localStorage", "sessionStorage", "CustomEvent", `${compile(tracker.replace("export function", "function"))}; return trackRegistrationSubmitted`)(window, storage, storage, CustomEvent)
  track()
  track()
  assert.equal(calls.length, consent === "granted" ? 1 : 0, `${consent}: signup must reach GA4 once only with consent`)
  if (consent === "granted") {
    assert.deepEqual(calls[0], ["event", "registration_submitted", { page_path: "/login", page_location: "https://hegevaai.co.uk/login", page_title: "HEGEVA AI", page_referrer: "" }])
    receive({ detail: { event: "registration_submitted", path: "/login" } })
    assert.equal(calls.length, 1, "receiver also deduplicates")
  } else {
    assert.equal(values.has("hegeva:registration-submitted:v1"), false, "no consent must not consume marker")
  }
}
console.log("Registration GA4 regression: PASS (real tracker + receiver, consent, deduplication, safe payload)")
