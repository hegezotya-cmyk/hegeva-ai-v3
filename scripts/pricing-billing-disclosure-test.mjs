import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { resolveBillingDisclosure, resolveBillingMode } from "../v0-app/lib/billing-mode-disclosure.ts"

const copy = {
  checking: "Checking billing",
  live: "Live charges",
  test: "Sandbox; no real charge",
  unavailable: "Checkout unavailable",
}

test("unresolved billing state never claims live mode", () => {
  assert.equal(resolveBillingMode(null, null), null)
  assert.equal(resolveBillingDisclosure(true, null, copy), copy.checking)
  assert.equal(resolveBillingDisclosure(false, null, copy), copy.unavailable)
})

test("recognized TEST and LIVE modes use their matching disclosure", () => {
  assert.equal(resolveBillingMode({ mode: "test" }, { mode: "live" }), "test")
  assert.equal(resolveBillingDisclosure(false, "test", copy), copy.test)
  assert.equal(resolveBillingMode(null, { mode: "live" }), "live")
  assert.equal(resolveBillingDisclosure(false, "live", copy), copy.live)
})

test("unknown provider modes fail closed", () => {
  assert.equal(resolveBillingMode(null, { mode: "staging" }), null)
  assert.equal(resolveBillingMode(null, { mode: "" }), null)
})

test("pricing page delegates mode and disclosure decisions to the tested helper", () => {
  const page = readFileSync(new URL("../v0-app/app/pricing/page.tsx", import.meta.url), "utf8")
  assert.match(page, /resolveBillingMode\(billingStatus, publicBillingStatus\)/)
  assert.match(page, /resolveBillingDisclosure\(/)
  assert.doesNotMatch(page, /\?\?\s*"live"/)
})

test("ready copy describes configuration without claiming a webhook was verified", () => {
  const source = readFileSync(new URL("../v0-app/lib/i18n/pricing-copy.ts", import.meta.url), "utf8")
  assert.doesNotMatch(source, /verified webhook handling|verifizierte Webhook-Verarbeitung|webhooks vérifiés|webhooks verificados/i)
  assert.match(source, /confirmed Stripe webhook/)
})
