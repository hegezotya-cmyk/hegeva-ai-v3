import assert from "node:assert/strict"
import fs from "node:fs"
import { createRequestHandler } from "../../src/index.js"
import { prepareOverdueInvoiceEmailDraft } from "../../src/email-draft-action.js"

const checkpointInvoice = {
  id: "invoice-email-draft-e2e-test",
  type: "invoice",
  status: "sent",
  number: "INV-EMAIL-DRAFT-E2E-TEST",
  dueDate: "2026-01-01",
  currency: "GBP",
  vatRate: 20,
  businessName: "HEGEVA Ltd",
  clientName: "HEGEVA Draft Test Customer",
  clientDetails: "draft-test@example.test",
  items: [{ quantity: 1, unitPrice: 100 }],
}
const customer = { id: "customer-email-draft-e2e-test", title: "HEGEVA Draft Test Customer" }

for (const locale of ["en", "hu", "de", "fr", "es"]) {
  const result = prepareOverdueInvoiceEmailDraft({
    invoice: checkpointInvoice,
    customers: [customer],
    messages: [],
    locale,
    now: "2026-02-01T12:00:00.000Z",
  })
  assert.equal(result.ok, true, `${locale} must produce a supported draft`)
  assert.equal(result.draft.workflowStatus, "draft")
  assert.equal(result.draft.approvalState, "awaiting-approval")
  assert.equal(result.draft.deliveryStatus, "not-sent")
  assert.equal(result.draft.executionStatus, "not-executed")
  assert.equal(result.draft.sent, false)
  assert.equal(result.draft.recipient, "draft-test@example.test")
  assert.match(result.draft.body, /INV-EMAIL-DRAFT-E2E-TEST/)
  assert.match(result.draft.body, /120/)
  assert.match(result.draft.body, /2026-01-01/)
}

assert.equal(prepareOverdueInvoiceEmailDraft({ invoice: { ...checkpointInvoice, clientDetails: "" }, customers: [customer], messages: [], now: "2026-02-01T12:00:00.000Z" }).reason, "insufficient-evidence")
assert.equal(prepareOverdueInvoiceEmailDraft({ invoice: checkpointInvoice, customers: [], messages: [], now: "2026-02-01T12:00:00.000Z" }).reason, "customer-not-authorized")
assert.equal(prepareOverdueInvoiceEmailDraft({ invoice: { ...checkpointInvoice, status: "paid" }, customers: [customer], messages: [], now: "2026-02-01T12:00:00.000Z" }).reason, "insufficient-evidence")
const first = prepareOverdueInvoiceEmailDraft({ invoice: checkpointInvoice, customers: [customer], messages: [], now: "2026-02-01T12:00:00.000Z" })
const repeated = prepareOverdueInvoiceEmailDraft({ invoice: checkpointInvoice, customers: [customer], messages: [first.draft], now: "2026-02-01T12:00:00.000Z" })
assert.equal(repeated.ok, true)
assert.equal(repeated.created, false, "the same invoice action must reuse its existing draft")
assert.equal(repeated.draft.id, first.draft.id)
const legacyDraft = { ...first.draft }
delete legacyDraft.approvalState
delete legacyDraft.approvalVersion
delete legacyDraft.approvedAt
delete legacyDraft.approvedByActorHash
delete legacyDraft.executionStatus
delete legacyDraft.audit
const upgraded = prepareOverdueInvoiceEmailDraft({ invoice: checkpointInvoice, customers: [customer], messages: [legacyDraft], now: "2026-02-01T12:00:00.000Z" })
assert.equal(upgraded.ok, true)
assert.equal(upgraded.created, false)
assert.equal(upgraded.updated, true, "a safe existing V1 draft must gain approval metadata without a migration")
assert.equal(upgraded.draft.approvalState, "awaiting-approval")
assert.equal(upgraded.draft.deliveryStatus, "not-sent")
assert.equal(upgraded.draft.executionStatus, "not-executed")

function database(records) {
  return {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (!sql.includes("SELECT data")) return null
              return records.get(`${args[0]}:${args[1]}`) || null
            },
            async run() {
              if (sql.includes("INSERT INTO workspace_data")) {
                records.set(`${args[1]}:messages`, { data: args[2] })
              }
              return { meta: { changes: 1 } }
            },
          }
        },
      }
    },
  }
}

const records = new Map([
  ["u1:invoice_documents", { data: JSON.stringify([checkpointInvoice]) }],
  ["u1:customers", { data: JSON.stringify([customer]) }],
  ["u1:messages", { data: "[]" }],
  ["u2:invoice_documents", { data: JSON.stringify([{ ...checkpointInvoice, id: "invoice-other-tenant" }]) }],
  ["u2:customers", { data: JSON.stringify([customer]) }],
  ["u2:messages", { data: "[]" }],
])
const handler = createRequestHandler({ getLoggedInUserFn: async () => ({ id: "u1" }) })
const request = (invoiceId) => new Request("https://hegevaai.co.uk/api/external-actions/email-draft", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "https://hegevaai.co.uk" },
  body: JSON.stringify({ invoiceId, locale: "en" }),
})
const originalFetch = globalThis.fetch
let externalDeliveryCalls = 0
globalThis.fetch = async () => {
  externalDeliveryCalls += 1
  throw new Error("External delivery is forbidden during the email draft E2E test.")
}
const created = await handler.fetch(request("invoice-email-draft-e2e-test"), { DB: database(records) }, {})
assert.equal(created.status, 200)
assert.deepEqual(await created.json(), { draft: JSON.parse(records.get("u1:messages").data)[0], created: true, state: "awaiting-approval", sent: false })
const reused = await handler.fetch(request("invoice-email-draft-e2e-test"), { DB: database(records) }, {})
assert.equal(reused.status, 200)
assert.equal((await reused.json()).created, false)
assert.equal(JSON.parse(records.get("u1:messages").data).length, 1, "retries must not create duplicate drafts")
const crossTenant = await handler.fetch(request("invoice-other-tenant"), { DB: database(records) }, {})
assert.equal(crossTenant.status, 404, "another tenant's invoice must not be visible")
const unauthenticated = createRequestHandler({ getLoggedInUserFn: async () => null })
assert.equal((await unauthenticated.fetch(request("invoice-email-draft-e2e-test"), { DB: database(records) }, {})).status, 401)
globalThis.fetch = originalFetch
assert.equal(externalDeliveryCalls, 0, "the complete route must make zero external delivery calls")

const worker = fs.readFileSync(new URL("../../src/index.js", import.meta.url), "utf8")
const endpointStart = worker.indexOf('"/api/external-actions/email-draft"')
const endpointEnd = worker.indexOf("// HEGEVA CORE V1 DECIDE", endpointStart)
const endpoint = worker.slice(endpointStart, endpointEnd)
assert(endpointStart >= 0 && endpointEnd > endpointStart, "governed email draft endpoint must exist")
assert(/getLoggedInUserFn\(request, env, ctx\)/.test(endpoint), "endpoint must authenticate server-side")
assert(/WHERE userId = \?1 AND dataType = \?2/.test(endpoint), "endpoint must tenant-scope every workspace read")
assert(/workflowStatus:\s*"draft"/.test(fs.readFileSync(new URL("../../src/email-draft-action.js", import.meta.url), "utf8")), "draft state must be explicit")
assert(/approvalState:\s*"awaiting-approval"/.test(fs.readFileSync(new URL("../../src/email-draft-action.js", import.meta.url), "utf8")), "approval state must be explicit")
assert(/executionStatus:\s*"not-executed"/.test(fs.readFileSync(new URL("../../src/email-draft-action.js", import.meta.url), "utf8")), "execution boundary must be explicit")
assert(!/sendResendEmail|sendMail|smtp|gmail\.googleapis|graph\.microsoft|mailto:/.test(endpoint), "email draft endpoint must never invoke delivery")
assert(!/fetch\(/.test(endpoint), "email draft endpoint must not make external network calls")
const core = fs.readFileSync(new URL("../components/command-center/core-decision-surface.tsx", import.meta.url), "utf8")
assert(core.includes('"/api/external-actions/email-draft"') && core.includes("NOT SENT"), "Core must expose a clearly non-sending draft action")

console.log("External Actions email draft audit passed: authenticated tenant-scoped evidence, idempotent DRAFT-only storage, five locales, and no delivery boundary")
