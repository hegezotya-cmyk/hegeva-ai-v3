import assert from "node:assert/strict"
import fs from "node:fs"
import { createPortalShare, previewPortalShare, readPortalShare } from "../../src/client-portal.js"

const root = new URL("../../", import.meta.url)
const read = (path) => fs.readFileSync(new URL(path, root), "utf8")
const api = read("src/client-portal.js")
const worker = read("src/index.js")
const ui = read("v0-app/components/business/client-portal-manager.tsx")
const page = read("v0-app/app/portal/[token]/page.tsx")
const renderer = read("v0-app/components/business/public-document-view.tsx")

for (const [ok, name] of [
  [api.includes('digest("SHA-256"') && !api.includes("tokenHash:raw"), "hashed tokens"],
  [api.includes("expiresAt") && api.includes("revokedAt"), "expiry/revocation"],
  [api.includes('text(item?.clientName)===text(customer.title)'), "customer ownership filter"],
  [worker.includes("X-Robots-Tag") && page.includes("index: false"), "noindex"],
  [worker.includes('"/api/client-portal/preview"') && ui.includes('"/api/client-portal/preview"'), "owner preview endpoint"],
  [renderer.includes("hegeva-logo-gold-official.png") && !renderer.includes("button"), "read-only official renderer"],
  [ui.includes("PREVIEW_COPY") && ui.includes("useSession"), "authenticated preview control"],
]) assert.ok(ok, `Client Portal audit failed: ${name}`)

const customer = { id: "customer-1", title: "Visible Customer", meta: "private meta", notes: "private notes" }
const selected = { id: "document-1", type: "invoice", number: "INV-001", issueDate: "2026-09-15", dueDate: "2026-09-29", currency: "GBP", vatRate: 20, businessName: "Visible Business", businessDetails: "private business details", clientName: "Visible Customer", clientDetails: "private customer details", notes: "private note", status: "paid", paymentMetadata: "private payment metadata", items: [{ description: "Visible item", quantity: 1, unitPrice: 100 }] }
const otherCustomer = { ...selected, id: "document-2", clientName: "Other Customer", number: "INV-002" }
const rows = { results: [{ dataType: "customers", data: JSON.stringify([customer]) }, { dataType: "invoice_documents", data: JSON.stringify([selected, otherCustomer]) }] }
let inserted = null
const db = { prepare(sql) { return { bind(...values) { return { all: async () => rows, run: async () => { inserted = values } } } } } }
const body = { customerId: customer.id, invoiceIds: [selected.id, otherCustomer.id], expiresInDays: 7 }
const preview = await previewPortalShare(db, "user-1", body)
assert.equal(preview.status, 200)
assert.deepEqual(preview.data, { schemaVersion: 2, customer: { name: "Visible Customer" }, documents: [{ documentType: "invoice", reference: "INV-001", issueDate: "2026-09-15", dueDate: "2026-09-29", currency: "GBP", business: { name: "Visible Business" }, customer: { name: "Visible Customer" }, items: [{ description: "Visible item", quantity: 1, unitPrice: 100, lineTotal: 100 }], subtotal: 100, vatRate: 20, vatAmount: 20, total: 120 }] })
const created = await createPortalShare(db, "user-1", body)
assert.equal(created.status, 201)
assert.ok(inserted)
assert.notEqual(inserted[2], created.data.token)
assert.match(inserted[2], /^[a-f0-9]{64}$/)
assert.deepEqual(JSON.parse(inserted[3]), preview.data)
assert.equal(await readPortalShare(db, "INV-VISUAL-TEST").then((result) => result.status), 404)
const legacy = { customer: { title: "Legacy Customer", meta: "private meta" }, invoices: [{ id: "private-id", type: "quote", number: "QUO-001", status: "paid", issueDate: "2026-09-15", dueDate: "2026-09-29" }] }
const readDb = { prepare() { return { bind() { return { first: async () => ({ snapshot: JSON.stringify(legacy), expiresAt: "2099-01-01T00:00:00.000Z", revokedAt: null }) } } } } }
const legacyResult = await readPortalShare(readDb, "a".repeat(43))
assert.deepEqual(legacyResult.data, { schemaVersion: 1, customer: { name: "Legacy Customer" }, documents: [{ documentType: "quote", reference: "QUO-001", issueDate: "2026-09-15", dueDate: "2026-09-29" }] })
const publicSnapshot = JSON.parse(inserted[3])
const poisonedSnapshot = { ...publicSnapshot, internal: "private", customer: { ...publicSnapshot.customer, meta: "private meta" }, documents: [{ ...publicSnapshot.documents[0], id: "private-id", status: "paid", paymentMetadata: "private", business: { ...publicSnapshot.documents[0].business, details: "private" } }] }
const v2Db = { prepare() { return { bind() { return { first: async () => ({ snapshot: JSON.stringify(poisonedSnapshot), expiresAt: "2099-01-01T00:00:00.000Z", revokedAt: null }) } } } } }
const v2Result = await readPortalShare(v2Db, "b".repeat(43))
assert.deepEqual(v2Result.data, preview.data)
for (const row of [
  { snapshot: JSON.stringify(publicSnapshot), expiresAt: "2000-01-01T00:00:00.000Z", revokedAt: null },
  { snapshot: JSON.stringify(publicSnapshot), expiresAt: "2099-01-01T00:00:00.000Z", revokedAt: "2026-09-15T00:00:00.000Z" },
]) {
  const unavailableDb = { prepare() { return { bind() { return { first: async () => row } } } } }
  assert.equal((await readPortalShare(unavailableDb, "c".repeat(43))).status, 404)
}

console.log("Client Portal security audit passed: filtered immutable snapshots, secure tokens, safe legacy rendering, read-only public renderer and zero-write owner preview")
