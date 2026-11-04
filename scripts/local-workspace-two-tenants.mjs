import assert from "node:assert/strict"

const baseUrl = String(process.env.HEGEVA_TEST_BASE_URL || "").replace(/\\/$/, "")
assert(/^http:\/\/(127\.0\.0\.1|localhost):[0-9]{2,5}$/.test(baseUrl),
  "This test must be run against a LOCAL loopback Worker only")

const sessions = {
  alpha: "__Secure-better-auth.session_token=fixture-alpha-session-only",
  beta: "__Secure-better-auth.session_token=fixture-beta-session-only",
}
const types = ["customers", "invoice_documents", "tasks", "messages"]

async function api(path, { method = "GET", session = null, body = undefined, origin = null } = {}) {
  const headers = { Accept: "application/json" }
  if (session) headers.Cookie = sessions[session]
  if (origin) headers.Origin = origin
  if (body !== undefined) headers["Content-Type"] = "application/json"
  const r = await fetch(baseUrl + path, {
    method,
    redirect: "manual",
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(10000),
  })
  const data = await r.json().catch(() => null)
  return { status: r.status, data }
}

const a = await api("/api/auth/get-session", { session: "alpha" })
const b = await api("/api/auth/get-session", { session: "beta" })
assert.equal(a.status, 200, "Alpha session endpoint not available")
assert.equal(b.status, 200, "Beta session endpoint not available")
assert.equal(a.data?.user?.id, "fixture-tenant-alpha", "Alpha session could not be loaded from local D1")
assert.equal(b.data?.user?.id, "fixture-tenant-beta", "Beta session could not be loaded from local D1")
assert.notEqual(a.data.user.id, b.data.user.id)
console.log("PASS two synthetic Better Auth sessions resolve to distinct local users")

const unauthenticated = await api("/api/workspace/customers")
assert.equal(unauthenticated.status, 401, "Anonymous workspace GET must be blocked")
const unauthenticatedWrite = await api("/api/workspace/customers", {
  method: "PUT", body: { data: [{ id: "unauth" }] }
})
assert.equal(unauthenticatedWrite.status, 401, "Anonymous workspace writes must be blocked")
console.log("PASS anonymous workspace read/write protection")

const fixtures = {
  customers: [{ id: "test-customer-A", name: "Synthetic Alpha Client", source: "fixture" }],
  invoice_documents: [
    { id: "test-quote-A", type: "quote", customerId: "test-customer-A", status: "draft", number: "TEST-Q-01" },
    { id: "test-invoice-A", type: "invoice", sourceQuoteId: "test-quote-A", customerId: "test-customer-A", status: "draft", number: "TEST-I-01" },
  ],
  tasks: [{ id: "test-task-A", sourceId: "test-quote-A", title: "Synthetic job", done: false }],
  messages: [{ id: "test-followup-A", sourceId: "test-quote-A", workflowStatus: "draft", sent: false }],
}
for (const type of types) {
  const path = "/api/workspace/" + type
  const before = await api(path, { session: "beta" })
  assert.equal(before.status, 200, "Beta must be able to fetch " + type)
  assert.notEqual(before.data?.found, true, "Fixture must start with no Beta " + type)

  const save = await api(path, { method: "PUT", session: "alpha", body: { data: fixtures[type] } })
  assert.equal(save.status, 200, "Alpha save failed for " + type)
  assert.equal(save.data?.ok, true, "Alpha write not confirmed for " + type)

  const freshRead = await api(path, { session: "alpha" })
  assert.equal(freshRead.status, 200, "Alpha reload failed for " + type)
  assert.equal(freshRead.data?.found, true, "Alpha record not persisted for " + type)
  assert.deepEqual(freshRead.data?.data, fixtures[type], "Alpha content mismatch after request refresh " + type)

  const isolated = await api(path, { session: "beta" })
  assert.equal(isolated.status, 200, "Beta read failed for " + type)
  assert.notEqual(isolated.data?.found, true, "Beta can see Alpha records for " + type)

  console.log("PASS local D1 persistent " + type + " and cross-tenant isolation")
}
const betaData = [{ id: "test-customer-B", name: "Synthetic Beta Client" }]
const betaWrite = await api("/api/workspace/customers", { method:"PUT", session:"beta", body:{data:betaData} })
assert.equal(betaWrite.status, 200)
assert.deepEqual((await api("/api/workspace/customers", { session:"beta" })).data?.data, betaData)
assert.deepEqual((await api("/api/workspace/customers", { session:"alpha" })).data?.data, fixtures.customers)
console.log("PASS parallel users cannot overwrite or cross-read each other's customers")

const forbiddenOrigin = await api("/api/workspace/customers", {
  method: "PUT", session: "alpha", origin: "https://attacker.example", body: { data: [] }
})
assert.equal(forbiddenOrigin.status, 403, "Cross-origin mutation must be blocked")
assert.deepEqual((await api("/api/workspace/customers", { session:"alpha" })).data?.data,
  fixtures.customers, "Cross-origin attempted overwrite unexpectedly changed stored data")
console.log("PASS cross-origin mutation fails closed and preserves tenant data")
console.log("PASS complete local session-to-workspace D1 integration; never contacted remote DB, email, or Stripe")
