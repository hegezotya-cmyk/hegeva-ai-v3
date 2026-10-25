import assert from "node:assert/strict"
import { ASSISTANT_TOPUP_PACKS, validateAssistantTopUpCheckoutPayment } from "../../src/assistant-topup.js"

const pack = ASSISTANT_TOPUP_PACKS.small

const taxedCheckout = validateAssistantTopUpCheckoutPayment(pack, {
  mode: "payment",
  payment_status: "paid",
  amount_subtotal: 199,
  amount_total: 239,
  currency: "gbp",
})
assert.deepEqual(taxedCheckout, { eligible: true, amountTotal: 239 }, "VAT must not prevent a paid, fixed-price credit pack from being granted")

assert.equal(validateAssistantTopUpCheckoutPayment(pack, {
  mode: "payment", payment_status: "paid", amount_subtotal: 198, amount_total: 238, currency: "gbp",
}).eligible, false, "a different pack subtotal must be rejected")

assert.equal(validateAssistantTopUpCheckoutPayment(pack, {
  mode: "payment", payment_status: "paid", amount_subtotal: 199, amount_total: 198, currency: "gbp",
}).eligible, false, "an underpaid checkout must be rejected")

assert.equal(validateAssistantTopUpCheckoutPayment(pack, {
  mode: "payment", payment_status: "paid", amount_subtotal: 199, amount_total: 239, currency: "usd",
}).eligible, false, "a checkout in another currency must be rejected")

console.log("Assistant Top-Up checkout tax audit: PASS (taxed paid checkout accepted; price, currency and underpayment rejected)")
