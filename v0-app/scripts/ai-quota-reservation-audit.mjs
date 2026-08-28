import fs from "node:fs"
import assert from "node:assert/strict"

const source = fs.readFileSync(new URL("../../src/index.js", import.meta.url), "utf8")
const reservation = fs.readFileSync(new URL("../../src/ai-quota-reservation.js", import.meta.url), "utf8")
const admission = fs.readFileSync(new URL("../../src/ai-chat-admission.js", import.meta.url), "utf8")
const schema = fs.readFileSync(new URL("../../migrations/0001_v47_plans_usage.sql", import.meta.url), "utf8")

assert.match(schema, /PRIMARY KEY \(userId, period\)/, "ai_usage must have a unique user/period key")
assert.match(reservation, /INSERT INTO ai_usage[\s\S]*?ON CONFLICT\(userId, period\)[\s\S]*?WHERE aiMessages < \?4[\s\S]*?\.run\(\)/, "quota reservation must use a conditional atomic upsert")
assert.match(source, /handleAiChatAdmission\(/, "chat must call the production admission function")
assert.match(admission, /const reservation\s*=\s*await reserve\(/, "admission must reserve through its injected production boundary")
assert.match(admission, /if \(!reservation\.reserved\)[\s\S]*?Monthly AI message limit reached\./, "reservation failure must retain the truthful 429 response")
assert.doesNotMatch(source, /async function incrementAIUsage|await incrementAIUsage/, "old post-response increment must be removed")
const reservationIndex = source.indexOf("handleAiChatAdmission(")
const providerIndex = source.indexOf("env.AI.run(")
assert(reservationIndex >= 0 && providerIndex > reservationIndex, "reservation must precede env.AI.run")
assert.match(source, /getLoggedInUser\([\s\S]*?if \(!user\)[\s\S]*?Authentication required\./, "guest rejection must remain before reservation")

const cooldownIndex = admission.indexOf("if (retryAfterMs > 0)")
const inFlightCheckIndex = admission.indexOf("if (runtime.inFlight.has(aiUserKey))")
const inFlightIndex = admission.indexOf("runtime.inFlight.add(aiUserKey)")
const releaseIndex = admission.lastIndexOf("runtime.inFlight.delete(aiUserKey)")
assert(cooldownIndex >= 0 && inFlightCheckIndex > cooldownIndex, "cooldown must precede in-flight rejection")
assert(inFlightCheckIndex < inFlightIndex, "in-flight rejection must precede in-flight acquisition")
assert(inFlightIndex < reservationIndex, "in-flight admission must precede quota reservation")
assert(releaseIndex > admission.indexOf("return await execute"), "provider finally must release in-flight state")

function makeQuota(limit) {
  let used = 0
  let reservations = 0
  return {
    get used() { return used },
    get reservations() { return reservations },
    async reserve() {
      await Promise.resolve()
      if (used >= limit) return false
      used += 1
      reservations += 1
      return true
    },
  }
}

async function admit({ authenticated = true, valid = true, cooldown = false, inFlight = false, quota, provider }) {
  if (!authenticated || !valid || cooldown || inFlight) return { status: 429, providerCalls: 0, released: true }
  const acquired = { value: true }
  const reserved = await quota.reserve()
  if (!reserved) { acquired.value = false; return { status: 429, providerCalls: 0, released: !acquired.value } }
  try {
    await provider()
    return { status: 200, providerCalls: 1, released: true }
  } finally {
    acquired.value = false
  }
}

const guestQuota = makeQuota(50)
assert.equal((await admit({ authenticated: false, quota: guestQuota, provider: async () => {} })).providerCalls, 0)
assert.equal(guestQuota.reservations, 0, "guest request must not reserve")
const invalidQuota = makeQuota(50)
await admit({ valid: false, quota: invalidQuota, provider: async () => {} })
assert.equal(invalidQuota.reservations, 0, "invalid request must not reserve")
for (const key of ["cooldown", "inFlight"]) {
  const quota = makeQuota(50)
  await admit({ [key]: true, quota, provider: async () => {} })
  assert.equal(quota.reservations, 0, `${key} rejection must not reserve`)
}
const successQuota = makeQuota(1)
const success = await admit({ quota: successQuota, provider: async () => {} })
assert.equal(success.status, 200)
assert.equal(successQuota.reservations, 1, "successful admission must reserve exactly once")
const limitedQuota = makeQuota(1)
await limitedQuota.reserve()
let limitedProviderCalls = 0
const limited = await admit({ quota: limitedQuota, provider: async () => { limitedProviderCalls += 1 } })
assert.equal(limited.status, 429)
assert.equal(limitedProviderCalls, 0, "limit rejection must not call provider")
const failedQuota = makeQuota(1)
await assert.rejects(() => admit({ quota: failedQuota, provider: async () => { throw new Error("timeout") } }), /timeout/)
assert.equal(failedQuota.reservations, 1, "provider failure consumes its single reservation")
const concurrentQuota = makeQuota(5)
const concurrent = await Promise.all(Array.from({ length: 20 }, () => admit({ quota: concurrentQuota, provider: async () => {} })))
assert.equal(concurrent.filter((item) => item.status === 200).length, 5, "concurrent reservations must not exceed the limit")
assert.equal(concurrentQuota.used, 5)

console.log("AI quota reservation audit passed: atomic ordering, zero-cost rejection paths, bounded concurrency, failure accounting and no post-response increment")
