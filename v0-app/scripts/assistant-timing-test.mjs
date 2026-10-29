import assert from "node:assert/strict"
import { test } from "node:test"
import { createRequestHandler } from "../../src/index.js"
import { invokeAssistantWorkersAiText, resolveAssistantModelTier } from "../../src/cloudflare-ai-provider.js"
import { assistantLeaseTimeout, assistantTimeoutResponse } from "../../src/assistant-timing.js"
import { assistantClientTimeout, confirmedAssistantTimeout } from "../lib/assistant-request-policy.mjs"

const tier = name => resolveAssistantModelTier({ tier: name, plan: "premium", env: { AI_ADVANCED_ASSISTANT_CREDIT_COST: "8" } }).tier
const projection = { operation: "assistant", locale: "hu", prompt: "Segíts megtervezni a következő heti ügyfélszerzésemet három konkrét lépéssel." }
const response = { status: "completed", output: [{ type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: "Hétfőn válaszd ki a célcsoportodat. Kedden készíts ajánlatot. Pénteken értékeld a válaszokat." }] }], usage: { input_tokens: 400, output_tokens: 100, total_tokens: 500 } }
const environment = run => ({ AI_PROVIDER_ENABLED: "enabled", AI_GLOBAL_KILL_SWITCH: "disabled", AI_TIMEOUT_MS: "10000", AI: { run } })

test("Chat failure before admission returns a controlled response without out-of-scope identities", async () => {
  const handler = createRequestHandler({ getLoggedInUserFn: async () => { throw new Error("session lookup unavailable") } })
  const response = await handler.fetch(new Request("https://example.test/api/chat", { method: "POST", body: JSON.stringify({ message: "hello" }) }), {}, {})
  assert.equal(response.status, 500)
  assert.equal((await response.json()).assistantOperationId, undefined)
})

test("Browser and concurrency deadlines outlast provider settlement without changing Standard", () => {
  assert.equal(assistantClientTimeout("advanced"), 60000)
  assert.equal(assistantLeaseTimeout("advanced"), 65000)
  assert.equal(assistantClientTimeout("standard"), 30000)
  assert.equal(assistantLeaseTimeout("standard"), 35000)
})
test("Only a confirmed refund exposes a retryable terminal timeout to the browser", async () => {
  assert.equal(assistantTimeoutResponse({ name: "HEGEVA_AI_TIMEOUT" }, "op"), null)
  assert.equal(assistantTimeoutResponse({ name: "OTHER", creditsRefunded: true }, "op"), null)
  const response = assistantTimeoutResponse({ name: "HEGEVA_AI_TIMEOUT", creditsRefunded: true }, "op")
  assert.equal(response.status, 504)
  const body = await response.json()
  assert.equal(body.assistantOperationId, "op")
  assert.equal(confirmedAssistantTimeout(response.status, body), true)
  assert.equal(confirmedAssistantTimeout(500, body), false)
  assert.equal(confirmedAssistantTimeout(504, { ...body, creditsRefunded: false }), false)
})

test("Advanced completes an eleven-second response despite the legacy ten-second Standard timeout", async t => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] })
  const result = invokeAssistantWorkersAiText(environment(() => new Promise(resolve => setTimeout(() => resolve(response), 11000))), projection, { tier: tier("advanced") })
  t.mock.timers.tick(11000)
  assert.equal((await result).ok, true)
})
test("Advanced waits for its deadline, aborts once and never retries", async t => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] })
  let calls = 0, aborted = false
  const result = invokeAssistantWorkersAiText(environment((model, input, options) => { calls++; options.signal.addEventListener("abort", () => { aborted = true }); return new Promise(() => {}) }), projection, { tier: tier("advanced") })
  t.mock.timers.tick(11000)
  assert.equal(aborted, false)
  t.mock.timers.tick(34000)
  const timedOut = await result
  assert.equal(timedOut.reason, "timeout")
  assert.equal(timedOut.metrics.durationMs, 45000)
  assert.equal(aborted, true)
  assert.equal(calls, 1)
})
test("Standard preserves the configured ten-second timeout", async t => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] })
  const result = invokeAssistantWorkersAiText(environment(() => new Promise(() => {})), projection, { tier: tier("standard") })
  t.mock.timers.tick(10000)
  assert.equal((await result).reason, "timeout")
})
