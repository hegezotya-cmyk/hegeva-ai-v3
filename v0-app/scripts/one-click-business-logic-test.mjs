import assert from "node:assert/strict"
import {
  TRADE_PRESETS,
  applyTradePreset,
  validateLaunchBrief,
} from "../lib/one-click-business.ts"

const base = {
  businessName: "Bright Works",
  customerName: "Anna Smith",
  customerEmail: "anna@example.com",
  offer: "",
  amount: 480,
  currency: "EUR",
  vatRate: 5,
  dueDate: "2026-10-20",
}

assert.deepEqual(Object.keys(TRADE_PRESETS), ["painter", "builder", "cleaner", "electrician", "small-shop"])

const painted = applyTradePreset(base, "painter", "2026-11-02")
assert.equal(painted.offer, TRADE_PRESETS.painter.offer)
assert.equal(painted.currency, "GBP")
assert.equal(painted.dueDate, "2026-11-02")
assert.equal(painted.businessName, base.businessName)
assert.equal(painted.customerName, base.customerName)
assert.equal(painted.customerEmail, base.customerEmail)
assert.equal(painted.amount, 480)
assert.equal(painted.vatRate, 5)

const existingOffer = applyTradePreset({ ...base, offer: "Custom decorating" }, "cleaner", "2026-11-02")
assert.equal(existingOffer.offer, "Custom decorating")

assert.deepEqual(applyTradePreset(base, "unknown", "2026-11-02"), base)

const invalid = validateLaunchBrief({
  ...base,
  offer: "Valid service",
  customerEmail: "bad-email",
  amount: -1,
  vatRate: 101,
  dueDate: "tomorrow",
})
assert.equal(invalid.ok, false)
assert.deepEqual(invalid.errors, ["customerEmail", "amount", "vatRate", "dueDate"])

console.log("One-Click business logic tests passed")
