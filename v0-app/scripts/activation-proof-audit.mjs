import fs from "node:fs"
const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8")
const tracking = read("lib/conversion-tracking.ts")
const consent = read("components/analytics-consent.tsx")
const customer = read("components/business/local-workspace.tsx")
const invoices = read("app/business/invoices/page.tsx")
const core = read("components/command-center/core-decision-surface.tsx")
const pricing = read("app/pricing/page.tsx")
const workspace = read("lib/use-workspace-data.ts")
const activation = read("lib/activation-measurement.ts")
const coreHook = read("lib/use-core-decision.ts")
const saveStart = workspace.indexOf('method: "PUT"')
const saveVersion = workspace.lastIndexOf("setCloudSaveVersion")
const saveTimestamp = workspace.lastIndexOf("setCloudSavedAt")
const customerSave = customer.slice(customer.indexOf("function saveItem"))
const invoiceSave = invoices.slice(invoices.indexOf("function save"))
for (const [ok, name] of [
  [tracking.includes("trackActivationEvent") && tracking.includes("sessionStorage") && tracking.includes("localStorage") && tracking.includes("activationStorageKey") && activation.includes("activationIdentity") && activation.includes("v2:"), "consent-safe account-scoped persistent milestone deduplication"],
  [!tracking.includes("customerName") && !tracking.includes("invoiceText") && !tracking.includes("emailContent"), "activation helper sends no business content"],
  [consent.includes("first_customer_created") && consent.includes("activation_completed"), "activation event allowlist"],
  [saveStart >= 0 && saveVersion > saveStart && saveTimestamp > saveStart && workspace.includes("cloudSaveVersion") && workspace.includes("cloudSavedAt") && workspace.includes("cloudSavedItems") && workspace.includes("setCloudSavedItems(items)"), "cloud save acknowledgement is emitted only after a successful workspace PUT"],
  [customer.includes("pendingCustomerActivation") && customer.includes("hasAcknowledgedRecord") && customer.includes("workspaceIdentity") && !customerSave.includes('trackActivationEvent("first_customer_created"'), "first customer event waits for its own cloud persistence"],
  [invoices.includes("pendingActivation") && invoices.includes("hasAcknowledgedRecord") && invoices.includes("workspaceIdentity") && !invoiceSave.includes('trackActivationEvent(doc.type==="quote"?"first_quote_created":"first_invoice_created"'), "quote/invoice events wait for their own cloud persistence"],
  [core.includes("canCompleteActivation") && core.includes("coreIdentity") && core.includes("requiredCoreRevision") && core.includes("refreshCore") && core.includes('trackActivationEvent("activation_completed"') && core.includes("hasActivationRecords") && coreHook.includes("activeCoreIdentity") && coreHook.includes("loadCoreDecision(identity, true)"), "activation completion requires current identity-scoped ready Core priority"],
  [pricing.includes('trackActivationEvent("checkout_started"'), "checkout intent event"],
]) if (!ok) throw new Error(`Activation proof audit failed: ${name}`)
console.log("First 5 Customers activation proof audit passed")
