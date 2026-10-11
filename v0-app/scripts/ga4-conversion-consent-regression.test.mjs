import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const tracking = fs.readFileSync(new URL("../lib/conversion-tracking.ts", import.meta.url), "utf8")
const analytics = fs.readFileSync(new URL("../components/analytics-consent.tsx", import.meta.url), "utf8")
const challenge = fs.readFileSync(new URL("../components/growth/sixty-second-challenge.tsx", import.meta.url), "utf8")

test("subscription conversion requires analytics consent before consuming its dedup marker", () => {
  const fn = tracking.match(/export function trackSubscriptionSuccess\(plan: string, period: string\) \{[\s\S]*?\n\}/)?.[0]
  assert.ok(fn, "subscription conversion function must exist")
  assert.match(fn, /localStorage\.getItem\("hegeva:analytics-consent:v1"\) !== "granted"/)
  assert.ok(fn.indexOf('localStorage.getItem("hegeva:analytics-consent:v1")') < fn.indexOf('sessionStorage.getItem(key)'), "consent must precede dedup")
  assert.match(fn, /event: "subscription_success"/)
})

test("subscription events are forwarded only after consent", () => {
  assert.match(analytics, /if \(consent !== "granted" \|\| !window\.gtag\) return/)
  assert.match(analytics, /"subscription_success"/)
})

test("challenge start and completion retain separate events", () => {
  assert.match(challenge, /recordAnalyticsEvent\("challenge_start", "\/challenge"/)
  assert.match(challenge, /recordAnalyticsEvent\("challenge_complete", "\/challenge"/)
})

test("each new Challenge attempt can be counted without re-emitting protected subscription conversions", () => {
  const repeatable = analytics.match(/const repeatable = ([^\n]+)/)?.[1]
  assert.ok(repeatable, "event deduplication rule must exist")
  for (const event of ["challenge_start", "challenge_complete"]) {
    assert.ok(repeatable.includes('detail.event === "' + event + '"'), event + " should count repeat attempts")
  }
  assert.ok(!repeatable.includes('detail.event === "subscription_success"'), "paid conversions must remain deduplicated")
  assert.ok(!repeatable.includes('detail.event === "registration_completed"'), "completed registrations must remain deduplicated")
})
