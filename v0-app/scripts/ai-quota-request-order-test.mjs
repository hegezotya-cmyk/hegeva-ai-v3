import assert from "node:assert/strict"
import { handleAiChatAdmission } from "../../src/ai-chat-admission.js"

const request = (body = { message: "hello" }) => new Request("https://example.test/api/chat", {
  method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" },
})

function harness({ user = { id: "user-1" }, reserveResult = { reserved: true }, provider = async () => ({ response: "ok" }), runtime } = {}) {
  const calls = []
  const state = runtime || { inFlight: new Set(), lastRequest: new Map() }
  let reservations = 0; let providers = 0; let releases = 0
  return {
    calls, state,
    get reservations() { return reservations }, get providers() { return providers }, get releases() { return releases },
    options: {
      request: request(), user, planInfo: { plan: "basic", limit: 50 }, period: "2026-08", runtime: state,
      reserve: async () => { calls.push("quota.reserve"); reservations += 1; return reserveResult },
      readUsage: async () => 50, now: () => 2_000, cooldownMs: 0,
      execute: async () => { calls.push("provider"); providers += 1; return provider() },
    },
    markAcquire() { const original = state.inFlight.add.bind(state.inFlight); state.inFlight.add = (key) => { calls.push("inFlight.acquire"); return original(key) } },
    markRelease() { const original = state.inFlight.delete.bind(state.inFlight); state.inFlight.delete = (key) => { calls.push("inFlight.release"); releases += 1; return original(key) } },
  }
}

async function run(test) { test.markAcquire(); test.markRelease(); return handleAiChatAdmission(test.options) }

const guest = harness({ user: null }); const guestResult = await run(guest)
assert.equal(guestResult.status, 401); assert.equal(guest.reservations, 0); assert.equal(guest.providers, 0)

const invalid = harness(); invalid.options.request = request({ message: "" }); const invalidResult = await run(invalid)
assert.equal(invalidResult.status, 400); assert.equal(invalid.reservations, 0); assert.equal(invalid.providers, 0)

const cooldown = harness(); cooldown.options.cooldownMs = 1_500; cooldown.options.runtime.lastRequest.set("user-1", 2_000); const cooldownResult = await run(cooldown)
assert.equal(cooldownResult.status, 429); assert.equal(cooldown.reservations, 0); assert.equal(cooldown.providers, 0); assert.equal(cooldown.releases, 0)

const inflight = harness(); inflight.options.runtime.inFlight.add("user-1"); const inflightResult = await run(inflight)
assert.equal(inflightResult.status, 429); assert.equal(inflight.reservations, 0); assert.equal(inflight.providers, 0)

const accepted = harness(); const acceptedResult = await run(accepted)
assert.deepEqual(accepted.calls, ["inFlight.acquire", "quota.reserve", "provider", "inFlight.release"])
assert.equal(acceptedResult.response, "ok"); assert.equal(accepted.reservations, 1); assert.equal(accepted.providers, 1); assert.equal(accepted.releases, 1)

const limited = harness({ reserveResult: { reserved: false } }); const limitedResult = await run(limited)
assert.equal(limitedResult.status, 429); assert.equal(limited.providers, 0); assert.equal(limited.releases, 1)

const failed = harness({ provider: async () => { throw new Error("timeout") } })
await assert.rejects(() => run(failed), /timeout/); assert.equal(failed.reservations, 1); assert.equal(failed.providers, 1); assert.equal(failed.releases, 1)

console.log("Production admission behavior test passed: real handler, Request inputs, ordering, rejection paths, provider failure, and guard release")
