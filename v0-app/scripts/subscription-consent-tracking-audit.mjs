import assert from "node:assert/strict"
import fs from "node:fs"

const source = fs.readFileSync(new URL("../lib/conversion-tracking.ts", import.meta.url), "utf8")
const fn = source.match(/export function trackSubscriptionSuccess\(plan: string, period: string\) \{[\s\S]*?\n\}/)?.[0]
assert.ok(fn, "subscription conversion helper must exist")
const compiled = fn.replace("export function", "function").replace("plan: string, period: string", "plan, period")
const emitted = []
const values = new Map()
const storage = {
  getItem(key) { return values.get(key) ?? null },
  setItem(key, value) { values.set(key, value) },
}
const window = { dispatchEvent(event) { emitted.push(event.detail) } }
class CustomEvent { constructor(type, options) { this.type = type; this.detail = options.detail } }
const track = new Function("window", "localStorage", "sessionStorage", "CustomEvent", compiled + "; return trackSubscriptionSuccess")(window, storage, storage, CustomEvent)

track("premium", "2026-10")
assert.equal(emitted.length, 0, "no consent must not emit")
assert.equal(values.has("hegeva:subscription-success:v1:premium:2026-10"), false, "no consent must not consume dedup marker")
values.set("hegeva:analytics-consent:v1", "denied")
track("premium", "2026-10")
assert.equal(emitted.length, 0, "denied consent must not emit")
values.set("hegeva:analytics-consent:v1", "granted")
track("premium", "2026-10")
assert.deepEqual(emitted, [{ event: "subscription_success", path: "/account" }], "consented entitlement conversion must emit once")
track("premium", "2026-10")
assert.equal(emitted.length, 1, "repeated conversion must be deduplicated")
assert.equal(values.get("hegeva:subscription-success:v1:premium:2026-10"), "1")
console.log("Consented subscription tracking regression: PASS")
