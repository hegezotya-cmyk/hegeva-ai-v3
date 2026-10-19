import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { Miniflare, convertV4MiniflareOptions } from "miniflare"
import { handleAiChatAdmission } from "../../src/ai-chat-admission.js"

const root = new URL("../../", import.meta.url)
const limiterPath = new URL("src/user-rate-limiter-do.js", root)
const admissionPath = new URL("src/ai-chat-admission.js", root)
const entryPath = new URL("v0-app/scripts/durable-rate-limit-rpc-entry.mjs", root)
const rpcEntry = `
import { UserRateLimiter } from "../../src/user-rate-limiter-do.js"
import { handleAiChatAdmission } from "../../src/ai-chat-admission.js"
export { UserRateLimiter }
export default {
  async fetch(request, env) {
    const input = await request.json()
    const distributed = env.RATE_LIMITER.getByName(input.name)
    if (input.action === "admit") return Response.json(await distributed.admit(input.now))
    if (input.action === "release") return Response.json(await distributed.release(input.token))
    if (input.action === "caller") {
      let reservations = 0
      const response = await handleAiChatAdmission({
        request: new Request("https://example.test/api/chat", { method: "POST", body: JSON.stringify({ message: "hello" }) }),
        user: { id: "rpc-test-user" }, planInfo: { plan: "basic", limit: 50 }, period: "2026-08",
        runtime: { inFlight: new Set(), lastRequest: new Map() }, distributed,
        reserve: async () => { reservations += 1; return { reserved: true } }, readUsage: async () => 0,
        now: () => input.now, cooldownMs: 0, execute: async () => Response.json({ response: "ok" }),
      })
      return Response.json({ status: response.status, reservations })
    }
    return new Response("Not Found", { status: 404 })
  },
}
`
const mf = new Miniflare(convertV4MiniflareOptions({
  compatibilityDate: "2026-08-10",
  modulesRoot: root.pathname,
  modules: [
    { type: "ESModule", path: entryPath.pathname, contents: rpcEntry },
    { type: "ESModule", path: limiterPath.pathname, contents: readFileSync(limiterPath, "utf8") },
    { type: "ESModule", path: admissionPath.pathname, contents: readFileSync(admissionPath, "utf8") },
  ],
  durableObjects: { RATE_LIMITER: { className: "UserRateLimiter", useSQLite: true } },
}))

async function rpc(input) {
  const response = await mf.dispatchFetch("https://example.test/rpc", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
  })
  assert.equal(response.status, 200)
  return response.json()
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

for (let i = 0; i < 5; i += 1) { const admission = await rpc({ action: "admit", name: "burst", now: i * 100 }); assert.equal(admission.allowed, true); await rpc({ action: "release", name: "burst", token: admission.token }) }
const burstRejected = await rpc({ action: "admit", name: "burst", now: 900 })
assert.equal(burstRejected.allowed, false, "sixth request in burst must reject")
assert.equal(burstRejected.retryAfterMs, 9_100, "burst Retry-After must use oldest active event")
assert.equal((await rpc({ action: "release", name: "burst" })).released, false)

for (let i = 0; i < 12; i += 1) { const admission = await rpc({ action: "admit", name: "sustained", now: i * 5_000 }); assert.equal(admission.allowed, true); await rpc({ action: "release", name: "sustained", token: admission.token }) }
const sustainedRejected = await rpc({ action: "admit", name: "sustained", now: 55_000 })
assert.equal(sustainedRejected.allowed, false, "thirteenth request in sustained window must reject")
assert.equal(sustainedRejected.retryAfterMs, 5_000, "sustained Retry-After must use oldest active event")

const simultaneousAdmission = await rpc({ action: "admit", name: "simultaneous", now: 1_000 })
assert.equal(simultaneousAdmission.allowed, true)
assert.equal(typeof simultaneousAdmission.token, "string"); assert.ok(simultaneousAdmission.token)
assert.equal(simultaneousAdmission.retryAfterMs, 0)
const concurrent = await rpc({ action: "admit", name: "simultaneous", now: 1_001 })
assert.equal(concurrent.allowed, false, "only one active admission may succeed"); assert.equal(concurrent.reason, "concurrent")
assert.equal((await rpc({ action: "release", name: "simultaneous", token: "wrong-token" })).released, false)
assert.equal((await rpc({ action: "release", name: "simultaneous", token: simultaneousAdmission.token })).released, true)
assert.equal((await rpc({ action: "admit", name: "simultaneous", now: 1_002 })).allowed, true)

const tokenA = (await rpc({ action: "admit", name: "leases", now: 0 })).token
assert.ok(tokenA, "first admission must return a token")
const blocked = await rpc({ action: "admit", name: "leases", now: 1 })
assert.equal(blocked.allowed, false)
assert.equal(blocked.retryAfterMs, 34_999)
assert.equal((await rpc({ action: "release", name: "leases", token: "missing-token" })).released, false)
assert.equal((await rpc({ action: "release", name: "leases", token: tokenA })).released, true)
const tokenB = (await rpc({ action: "admit", name: "leases", now: 2 })).token
assert.ok(tokenB && tokenB !== tokenA)
assert.equal((await rpc({ action: "release", name: "leases", token: tokenA })).released, false, "delayed release must not clear newer lease")
assert.equal((await rpc({ action: "admit", name: "leases", now: 3 })).allowed, false)
assert.equal((await rpc({ action: "release", name: "leases", token: tokenB })).released, true)
const lost = await rpc({ action: "admit", name: "leases", now: 4 })
assert.equal(lost.allowed, true)
assert.equal((await rpc({ action: "admit", name: "leases", now: 35_005 })).allowed, true, "lost lease must expire after 35 seconds")

const caller = await rpc({ action: "caller", name: "caller", now: 100 })
assert.deepEqual(caller, { status: 200, reservations: 1 })

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

await mf.dispose()
console.log("Durable rate-limit audit passed: real namespace/stub RPC, burst, sustained, simultaneous, fail-closed admission and zero-quota rejection")
