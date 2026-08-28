import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"
import { UserRateLimiter } from "../../src/user-rate-limiter-do.js"
import { handleAiChatAdmission } from "../../src/ai-chat-admission.js"

function state() {
  const db = new DatabaseSync(":memory:")
  const sql = {
    exec(query, ...args) {
      const statement = db.prepare(query)
      if (/^\s*SELECT/i.test(query)) {
        return { one: () => statement.get(...args), toArray: () => statement.all(...args) }
      }
      statement.run(...args)
      return { one: () => statement.get(...args), toArray: () => statement.all(...args) }
    },
  }
  return {
    storage: { sql },
    blockConcurrencyWhile: (fn) => fn(),
  }
}
function stub(dbState) {
  const object = new UserRateLimiter(dbState)
  return object
}

async function captureConsoleErrors(run) {
  const original = console.error
  const calls = []
  console.error = (...args) => calls.push(args)
  try {
    return { result: await run(), calls }
  } finally {
    console.error = original
  }
}

const s = state()
const limiter = stub(s)
for (let i = 0; i < 5; i += 1) { const admission = limiter.admit(i * 100); assert.equal(admission.allowed, true); limiter.release(admission.token) }
const burstRejected = limiter.admit(900)
assert.equal(burstRejected.allowed, false, "sixth request in burst must reject")
assert.equal(burstRejected.retryAfterMs, 9_100, "burst Retry-After must use oldest active event")
assert.equal(limiter.release().released, false)

const sustained = state(); const sustainedLimiter = stub(sustained)
for (let i = 0; i < 12; i += 1) { const admission = sustainedLimiter.admit(i * 5_000); assert.equal(admission.allowed, true); sustainedLimiter.release(admission.token) }
const sustainedRejected = sustainedLimiter.admit(55_000)
assert.equal(sustainedRejected.allowed, false, "thirteenth request in sustained window must reject")
assert.equal(sustainedRejected.retryAfterMs, 5_000, "sustained Retry-After must use oldest active event")

const simultaneous = state(); const simultaneousLimiter = stub(simultaneous)
const simultaneousAdmission = simultaneousLimiter.admit(1_000)
assert.equal(simultaneousAdmission.allowed, true)
assert.equal(simultaneousLimiter.admit(1_001).allowed, false, "only one active admission may succeed")
assert.equal(simultaneousLimiter.release("wrong-token").released, false)
assert.equal(simultaneousLimiter.release(simultaneousAdmission.token).released, true)
assert.equal(simultaneousLimiter.admit(1_002).allowed, true)

const persisted = state(); const first = stub(persisted)
const firstAdmission = first.admit(10); assert.equal(firstAdmission.allowed, true); first.release(firstAdmission.token)
const second = stub(persisted)
assert.equal(second.admit(11).allowed, true, "new class instance must reuse the same storage")

const leases = state(); const leaseLimiter = stub(leases)
const tokenA = leaseLimiter.admit(0).token
assert.ok(tokenA, "first admission must return a token")
const blocked = leaseLimiter.admit(1)
assert.equal(blocked.allowed, false)
assert.equal(blocked.retryAfterMs, 34_999)
assert.equal(leaseLimiter.release("missing-token").released, false)
assert.equal(leaseLimiter.release(tokenA).released, true)
const tokenB = leaseLimiter.admit(2).token
assert.ok(tokenB && tokenB !== tokenA)
assert.equal(leaseLimiter.release(tokenA).released, false, "delayed release must not clear newer lease")
assert.equal(leaseLimiter.admit(3).allowed, false)
assert.equal(leaseLimiter.release(tokenB).released, true)
const lost = leaseLimiter.admit(4)
assert.equal(lost.allowed, true)
assert.equal(leaseLimiter.admit(35_005).allowed, true, "lost lease must expire after 35 seconds")

const calls = []
const distributed = { admit: async () => { calls.push("distributed.admit"); return { allowed: false, retryAfterMs: 2_000 } }, release: async () => calls.push("distributed.release") }
let reservations = 0; let providers = 0
const rejected = await handleAiChatAdmission({
  request: new Request("https://example.test/api/chat", { method: "POST", body: JSON.stringify({ message: "hello" }) }),
  user: { id: "server-user" }, planInfo: { plan: "basic", limit: 50 }, period: "2026-08",
  runtime: { inFlight: new Set(), lastRequest: new Map() }, distributed,
  reserve: async () => { reservations += 1; return { reserved: true } }, readUsage: async () => 0,
  now: () => 100, cooldownMs: 0, execute: async () => { providers += 1; return Response.json({ response: "ok" }) },
})
assert.equal(rejected.status, 429); assert.equal(reservations, 0); assert.equal(providers, 0); assert.deepEqual(calls, ["distributed.admit"])

async function admissionCase({ distributed, runtime = { inFlight: new Set(), lastRequest: new Map() }, reserve = async () => ({ reserved: true }), execute = async () => Response.json({ response: "ok" }), body = { message: "hello" } }) {
  return handleAiChatAdmission({ request: new Request("https://example.test/api/chat", { method: "POST", body: JSON.stringify(body) }), user: { id: "server-user" }, planInfo: { plan: "basic", limit: 50 }, period: "2026-08", runtime, distributed, reserve, readUsage: async () => 50, now: () => 1_000, cooldownMs: 0, execute })
}

let diagnosticReservations = 0
const diagnosticReserve = async () => { diagnosticReservations += 1; return { reserved: true } }
const missing = await captureConsoleErrors(() => admissionCase({ distributed: undefined, reserve: diagnosticReserve }))
assert.equal(missing.result.status, 503); assert.equal(diagnosticReservations, 0)
assert.deepEqual(missing.calls, [["HEGEVA_AI_ADMISSION_FAILURE", { reason: "distributed_binding_missing" }]])
const thrown = await captureConsoleErrors(() => admissionCase({ distributed: { admit: async () => { throw new TypeError("unavailable") } }, reserve: diagnosticReserve }))
assert.equal(thrown.result.status, 503); assert.equal(diagnosticReservations, 0)
assert.deepEqual(thrown.calls, [["HEGEVA_AI_ADMISSION_FAILURE", { reason: "distributed_admit_threw", errorName: "TypeError" }]])
for (const token of [undefined, "", 42, {}]) {
  const invalidToken = await captureConsoleErrors(() => admissionCase({ distributed: { admit: async () => ({ allowed: true, token, retryAfterMs: 0 }) }, reserve: diagnosticReserve }))
  assert.equal(invalidToken.result.status, 503); assert.equal(diagnosticReservations, 0)
  assert.deepEqual(invalidToken.calls, [["HEGEVA_AI_ADMISSION_FAILURE", {
    reason: "invalid_distributed_admission_token", resultType: "object", allowedType: "boolean", allowed: true,
    tokenType: typeof token, tokenPresent: Boolean(token), retryAfterMsType: "number",
  }]])
}
const normalDenial = await captureConsoleErrors(() => admissionCase({ distributed: { admit: async () => ({ allowed: false, reason: "burst", retryAfterMs: 2_000 }) }, reserve: diagnosticReserve }))
assert.equal(normalDenial.result.status, 429); assert.equal(diagnosticReservations, 0); assert.deepEqual(normalDenial.calls, [])
const validAdmission = await captureConsoleErrors(() => admissionCase({ distributed: { admit: async () => ({ allowed: true, token: "valid-token", retryAfterMs: 0 }), release: async () => ({ released: true }) }, reserve: diagnosticReserve }))
assert.equal(validAdmission.result.status, 200); assert.equal(diagnosticReservations, 1); assert.deepEqual(validAdmission.calls, [])
const quotaCalls = []; const quotaRejected = await admissionCase({ distributed: { admit: async () => ({ allowed: true, token: "quota-token" }), release: async (token) => quotaCalls.push(token) }, reserve: async () => ({ reserved: false }) })
assert.equal(quotaRejected.status, 429); assert.deepEqual(quotaCalls, ["quota-token"])

console.log("Durable rate-limit audit passed: burst, sustained, simultaneous, persistence, fail-closed admission and zero-quota rejection")
