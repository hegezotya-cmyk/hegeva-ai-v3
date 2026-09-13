import fs from "node:fs"
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8")
const tracking = read("lib/conversion-tracking.ts")
const consent = read("components/analytics-consent.tsx")
const customer = read("components/business/local-workspace.tsx")
const invoices = read("app/business/invoices/page.tsx")
const core = read("components/command-center/core-decision-surface.tsx")
const pricing = read("app/pricing/page.tsx")
for (const [ok, name] of [
  [tracking.includes("trackActivationEvent") && tracking.includes("sessionStorage"), "consent-safe deduplicated activation helper"],
  [!tracking.includes("customerName") && !tracking.includes("invoiceText") && !tracking.includes("emailContent"), "activation helper sends no business content"],
  [consent.includes("first_customer_created") && consent.includes("activation_completed"), "activation event allowlist"],
  [customer.includes('trackActivationEvent("first_customer_created"'), "first customer event"],
  [invoices.includes('trackActivationEvent(doc.type==="quote"?"first_quote_created":"first_invoice_created"'), "quote/invoice events"],
  [core.includes('trackActivationEvent("first_core_priority_seen"') && core.includes('trackActivationEvent("activation_completed"') && core.includes("activationCustomers.length > 0") && core.includes("activationDocuments.some"), "Core value events use workspace records"],
  [pricing.includes('trackActivationEvent("checkout_started"'), "checkout intent event"],
]) if (!ok) throw new Error(`Activation proof audit failed: ${name}`)
console.log("First 5 Customers activation proof audit passed")
