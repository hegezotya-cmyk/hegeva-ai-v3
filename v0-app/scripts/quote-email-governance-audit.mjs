import assert from "node:assert/strict"
import fs from "node:fs"
import { createRequestHandler } from "../../src/index.js"
import { prepareQuoteEmailDraft } from "../../src/quote-email-draft-action.js"
import { approveGovernedExternalAction, isGovernedExternalAction, markGovernedExternalActionReady } from "../../src/external-action-governance.js"

const quote = {
  id: "quote-email-draft-e2e-test",
  type: "quote",
  status: "draft",
  number: "QUO-EMAIL-DRAFT-E2E-TEST",
  businessName: "HEGEVA Ltd",
  clientName: "HEGEVA Quote Test Customer",
  clientDetails: "quote-test@example.test",
}
const customer = { id: "customer-quote-email-draft-e2e-test", title: quote.clientName }

for (const locale of ["en", "hu", "de", "fr", "es"]) {
  const result = prepareQuoteEmailDraft({ quote, customers: [customer], messages: [], locale, now: "2026-02-01T12:00:00.000Z" })
  assert.equal(result.ok, true, `${locale} must produce a supported quote draft`)
  assert.equal(result.draft.actionType, "email-draft")
  assert.equal(result.draft.sourceId, quote.id)
  assert.equal(result.draft.actionKey, `email-draft:quote:${quote.id}`)
  assert.equal(result.draft.approvalState, "awaiting-approval")
  assert.equal(result.draft.deliveryStatus, "not-sent")
  assert.equal(result.draft.executionStatus, "not-executed")
  assert.equal(result.draft.sent, false)
  assert.equal(isGovernedExternalAction(result.draft), true)
  assert.ok(result.draft.audit.length >= 1)
}

assert.equal(prepareQuoteEmailDraft({ quote: { ...quote, type: "invoice" }, customers: [customer] }).reason, "insufficient-evidence")
assert.equal(prepareQuoteEmailDraft({ quote: { ...quote, id: "" }, customers: [customer] }).reason, "insufficient-evidence")
assert.equal(prepareQuoteEmailDraft({ quote: { ...quote, status: "sent" }, customers: [customer] }).reason, "insufficient-evidence")
assert.equal(prepareQuoteEmailDraft({ quote, customers: [] }).reason, "customer-not-authorized")
const first = prepareQuoteEmailDraft({ quote, customers: [customer], messages: [], now: "2026-02-01T12:00:00.000Z" })
const repeated = prepareQuoteEmailDraft({ quote, customers: [customer], messages: [first.draft], now: "2026-02-01T12:00:00.000Z" })
assert.equal(repeated.created, false)
assert.equal(repeated.draft.id, first.draft.id)
const approved = approveGovernedExternalAction(first.draft, { actorHash: "owner-hash", now: "2026-02-01T12:01:00.000Z" })
assert.equal(approved.ok, true)
assert.equal(approved.action.deliveryStatus, "not-sent")
assert.equal(approved.action.executionStatus, "not-executed")
const ready = markGovernedExternalActionReady(approved.action, { actorHash: "owner-hash", now: "2026-02-01T12:02:00.000Z" })
assert.equal(ready.ok, true)
assert.equal(ready.action.approvalState, "ready-to-execute")
assert.equal(ready.action.deliveryStatus, "not-sent")
assert.equal(ready.action.executionStatus, "not-executed")
assert.equal(markGovernedExternalActionReady(first.draft, { actorHash: "owner-hash", now: "2026-02-01T12:02:00.000Z" }).reason, "invalid-transition")

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
              if (sql.includes("INSERT INTO workspace_data")) records.set(`${args[1]}:messages`, { data: args[2] })
              return { meta: { changes: 1 } }
            },
          }
        },
      }
    },
  }
}

const records = new Map([
  ["u1:invoice_documents", { data: JSON.stringify([quote]) }],
  ["u1:customers", { data: JSON.stringify([customer]) }],
  ["u1:messages", { data: "[]" }],
  ["u2:invoice_documents", { data: JSON.stringify([{ ...quote, id: "quote-other-tenant" }]) }],
  ["u2:customers", { data: JSON.stringify([customer]) }],
  ["u2:messages", { data: "[]" }],
])
const handler = createRequestHandler({ getLoggedInUserFn: async () => ({ id: "u1" }) })
const request = () => new Request("https://hegevaai.co.uk/api/external-actions/quote-email-draft", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "https://hegevaai.co.uk" },
  body: JSON.stringify({ quoteId: quote.id, locale: "en" }),
})
const originalFetch = globalThis.fetch
let externalCalls = 0
globalThis.fetch = async () => { externalCalls += 1; throw new Error("External delivery is forbidden during quote draft audit.") }
const assets = { fetch: async () => new Response("not found", { status: 404 }) }
const response = await handler.fetch(request(), { DB: database(records), ASSETS: assets }, {})
assert.equal(response.status, 200)
assert.equal((await response.json()).sent, false)
const reused = await handler.fetch(request(), { DB: database(records), ASSETS: assets }, {})
assert.equal(reused.status, 200)
assert.equal(JSON.parse(records.get("u1:messages").data).length, 1)
const crossTenant = await handler.fetch(new Request("https://hegevaai.co.uk/api/external-actions/quote-email-draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quoteId: "quote-other-tenant", locale: "en" }) }), { DB: database(records), ASSETS: assets }, {})
assert.equal(crossTenant.status, 404, "another tenant's quote must not be visible")
const unauthenticated = createRequestHandler({ getLoggedInUserFn: async () => null })
assert.equal((await unauthenticated.fetch(request(), { DB: database(records), ASSETS: assets }, {})).status, 401)
globalThis.fetch = originalFetch
assert.equal(externalCalls, 0)

const worker = fs.readFileSync(new URL("../../src/index.js", import.meta.url), "utf8")
const endpointStart = worker.indexOf('"/api/external-actions/quote-email-draft"')
assert(endpointStart >= 0, "quote email draft endpoint must exist")
const endpoint = worker.slice(endpointStart, worker.indexOf('"/api/external-actions/approve"', endpointStart))
assert(/getLoggedInUserFn\(request, env, ctx\)/.test(endpoint), "quote endpoint must authenticate server-side")
assert(/WHERE userId = \?1 AND dataType = \?2/.test(endpoint), "quote endpoint must tenant-scope workspace reads")
assert(!/sendResendEmail|sendMail|smtp|gmail\.googleapis|graph\.microsoft|mailto:|fetch\(/.test(endpoint), "quote endpoint must never deliver")

const editor = fs.readFileSync(new URL("../app/business/invoices/page.tsx", import.meta.url), "utf8")
assert(editor.includes("/api/external-actions/quote-email-draft"), "quote editor must expose explicit draft preparation")
assert(editor.includes('doc.type === "quote"') && editor.includes('doc.status === "draft"'), "quote preparation must be limited to saved draft quotes")
assert(editor.includes("Prepare email draft"), "quote editor must label the explicit preparation action")
assert(editor.includes("quotePrefillApplied"), "quote handoff must guard one-time prefill")
assert(!/useEffect\([^)]*quote-email-draft/.test(editor), "quote preparation must not run in an effect")

console.log("Quote email governance audit passed: draft-only, tenant-scoped, idempotent, approval-gated, and no delivery")
