import assert from "node:assert/strict"
import fs from "node:fs"
import { createRequestHandler } from "../../src/index.js"

const invoice = {
  id: "invoice-governed-action",
  type: "invoice",
  status: "sent",
  number: "INV-GOVERNED-ACTION",
  dueDate: "2026-01-01",
  currency: "GBP",
  vatRate: 20,
  businessName: "HEGEVA Ltd",
  clientName: "Governed Action Test Customer",
  clientDetails: "governed-action@example.test",
  items: [{ quantity: 1, unitPrice: 100 }],
}
const customer = { id: "customer-governed-action", title: "Governed Action Test Customer" }

function workspaceDatabase(initial) {
  const records = new Map(Object.entries(initial).map(([key, data]) => [key, { data: JSON.stringify(data), updatedAt: "2026-02-01T12:00:00.000Z" }]))
  return {
    records,
    db: {
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
                  records.set(`${args[1]}:messages`, { data: args[2], updatedAt: args[3] })
                  return { meta: { changes: 1 } }
                }
                if (sql.includes("UPDATE workspace_data")) {
                  const key = `${args[2]}:messages`
                  const current = records.get(key)
                  if (!current || current.updatedAt !== args[3]) return { meta: { changes: 0 } }
                  records.set(key, { data: args[0], updatedAt: args[1] })
                  return { meta: { changes: 1 } }
                }
                return { meta: { changes: 0 } }
              },
            }
          },
        }
      },
    },
  }
}

const workspace = workspaceDatabase({
  "owner:invoice_documents": [invoice],
  "owner:customers": [customer],
  "owner:messages": [],
  "other:invoice_documents": [{ ...invoice, id: "other-tenant-invoice" }],
  "other:customers": [customer],
  "other:messages": [],
})
const ownerHandler = createRequestHandler({ getLoggedInUserFn: async () => ({ id: "owner" }) })
const otherHandler = createRequestHandler({ getLoggedInUserFn: async () => ({ id: "other" }) })
const anonymousHandler = createRequestHandler({ getLoggedInUserFn: async () => null })
const post = (path, body) => new Request(`https://hegevaai.co.uk${path}`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "https://hegevaai.co.uk" },
  body: JSON.stringify(body),
})

const originalFetch = globalThis.fetch
let externalProviderCalls = 0
globalThis.fetch = async () => {
  externalProviderCalls += 1
  throw new Error("External execution is forbidden during approval testing.")
}

try {
  const prepared = await ownerHandler.fetch(post("/api/external-actions/email-draft", { invoiceId: invoice.id, locale: "en" }), { DB: workspace.db }, {})
  assert.equal(prepared.status, 200, "the eligible owner must be able to prepare a draft")
  const preparedBody = await prepared.json()
  assert.equal(preparedBody.state, "awaiting-approval", "a prepared external action must enter awaiting approval")
  assert.equal(preparedBody.draft.deliveryStatus, "not-sent")
  assert.equal(preparedBody.draft.executionStatus, "not-executed")
  assert.equal(preparedBody.draft.approvalState, "awaiting-approval")

  const actionId = preparedBody.draft.id
  const originalEvidence = structuredClone(preparedBody.draft.evidence)
  const approval = await ownerHandler.fetch(post("/api/external-actions/approve", { actionId }), { DB: workspace.db }, {})
  assert.equal(approval.status, 200, "the authenticated owner must be able to approve its prepared action")
  const approvedBody = await approval.json()
  assert.equal(approvedBody.state, "approved")
  assert.equal(approvedBody.action.approvalState, "approved")
  assert.equal(approvedBody.action.deliveryStatus, "not-sent")
  assert.equal(approvedBody.action.executionStatus, "not-executed")
  assert.deepEqual(approvedBody.action.evidence, originalEvidence, "approval must not mutate evidence")
  assert.equal(typeof approvedBody.action.approvedAt, "string")
  assert.equal(typeof approvedBody.action.approvedByActorHash, "string")
  assert.equal(approvedBody.action.approvedByActorHash.includes("owner"), false, "audit actor identity must remain hashed")
  assert.equal(approvedBody.action.audit.at(-1).previousState, "awaiting-approval")
  assert.equal(approvedBody.action.audit.at(-1).newState, "approved")

  const ready = await ownerHandler.fetch(post("/api/external-actions/ready", { actionId }), { DB: workspace.db }, {})
  assert.equal(ready.status, 200, "the authenticated owner must be able to mark an approved action ready to execute")
  const readyBody = await ready.json()
  assert.equal(readyBody.state, "ready-to-execute")
  assert.equal(readyBody.action.approvalState, "ready-to-execute")
  assert.equal(readyBody.action.deliveryStatus, "not-sent")
  assert.equal(readyBody.action.executionStatus, "not-executed")
  assert.deepEqual(readyBody.action.evidence, originalEvidence, "ready transition must not mutate evidence")
  assert.equal(readyBody.action.audit.at(-1).previousState, "approved")
  assert.equal(readyBody.action.audit.at(-1).newState, "ready-to-execute")

  const readyRepeated = await ownerHandler.fetch(post("/api/external-actions/ready", { actionId }), { DB: workspace.db }, {})
  assert.equal(readyRepeated.status, 200, "repeated ready transition must be idempotent")
  assert.equal((await readyRepeated.json()).idempotent, true)

  const repeated = await ownerHandler.fetch(post("/api/external-actions/approve", { actionId }), { DB: workspace.db }, {})
  assert.equal(repeated.status, 200, "repeated owner approval must be idempotent")
  const repeatedBody = await repeated.json()
  assert.equal(repeatedBody.idempotent, true)
  assert.equal(repeatedBody.state, "ready-to-execute")
  assert.equal(repeatedBody.action.approvalState, "ready-to-execute")
  assert.equal(repeatedBody.action.approvedAt, approvedBody.action.approvedAt)

  assert.equal((await anonymousHandler.fetch(post("/api/external-actions/approve", { actionId }), { DB: workspace.db }, {})).status, 401, "anonymous approval must be rejected")
  assert.equal((await anonymousHandler.fetch(post("/api/external-actions/ready", { actionId }), { DB: workspace.db }, {})).status, 401, "anonymous ready transition must be rejected")
  assert.equal((await otherHandler.fetch(post("/api/external-actions/approve", { actionId }), { DB: workspace.db }, {})).status, 404, "cross-tenant approval must not reveal or approve another tenant's action")
  assert.equal((await otherHandler.fetch(post("/api/external-actions/ready", { actionId }), { DB: workspace.db }, {})).status, 404, "cross-tenant ready transition must not reveal or alter another tenant's action")
  assert.equal((await ownerHandler.fetch(post("/api/external-actions/approve", { actionId: "missing-action" }), { DB: workspace.db }, {})).status, 404, "a missing action must be rejected")

  const stored = JSON.parse(workspace.records.get("owner:messages").data)
  stored.push({ id: "invalid-state", actionType: "email-draft", approvalState: "prepared", deliveryStatus: "not-sent", executionStatus: "not-executed" })
  workspace.records.set("owner:messages", { data: JSON.stringify(stored), updatedAt: workspace.records.get("owner:messages").updatedAt })
  assert.equal((await ownerHandler.fetch(post("/api/external-actions/approve", { actionId: "invalid-state" }), { DB: workspace.db }, {})).status, 409, "only awaiting approval actions may transition to approved")
} finally {
  globalThis.fetch = originalFetch
}

assert.equal(externalProviderCalls, 0, "approval must make zero external provider calls")
const studio = fs.readFileSync(new URL("../components/business/message-studio.tsx", import.meta.url), "utf8")
assert(studio.includes('"/api/external-actions/approve"') && studio.includes('"/api/external-actions/ready"') && studio.includes("approvalState === \"awaiting-approval\"") && studio.includes("approvalState === \"approved\""), "Message Studio must use the server-side governed approval and readiness boundaries")
assert(studio.includes("notSent") && studio.includes("notExecuted"), "Message Studio must distinguish approval from delivery and execution")
console.log("External Actions approval audit passed: server-side owner approval, tenant isolation, idempotency, auditability, and no execution.")
