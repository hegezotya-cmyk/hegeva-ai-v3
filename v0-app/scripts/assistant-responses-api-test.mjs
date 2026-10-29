import assert from "node:assert/strict"
import { test } from "node:test"
import { createRequestHandler } from "../../src/index.js"
import { DatabaseSync } from "node:sqlite"
import { readFileSync } from "node:fs"
import { invokeAssistantWorkersAiText, resolveAssistantModelTier, boundAssistantProviderPayload } from "../../src/cloudflare-ai-provider.js"
import { startAssistantOperation, finishAssistantOperation, readAssistantUsage } from "../../src/assistant-quota.js"
import { grantAssistantTopUpPurchase, reserveAssistantTopUpCredit, finishAssistantTopUpCredit, readAssistantTopUpBalance } from "../../src/assistant-topup.js"

const advanced = resolveAssistantModelTier({ tier: "advanced", plan: "premium", env: { AI_ADVANCED_ASSISTANT_CREDIT_COST: "8" } }).tier
const standard = resolveAssistantModelTier({ tier: "standard", plan: "basic" }).tier
const projection = { operation: "assistant", locale: "hu", prompt: "Adj két rövid tanácsot a napi munkámhoz." }
const answer = "Először ellenőrizd a mai határidőket.\nEzután készíts rövid feladatlistát."
const completed = () => ({
  id: "resp_test", object: "response", status: "completed", error: null, incomplete_details: null,
  output: [
    { type: "reasoning", id: "rs_test", summary: [{ type: "summary_text", text: "Private reasoning." }] },
    { type: "message", id: "msg_test", role: "assistant", status: "completed", content: [
      { type: "output_text", text: "Először ellenőrizd a mai határidőket.\n", annotations: [] },
      { type: "output_text", text: "Ezután készíts rövid feladatlistát.", annotations: [] },
    ] },
  ],
  usage: { input_tokens: 40, output_tokens: 60, total_tokens: 100, output_tokens_details: { reasoning_tokens: 20 } },
})
function envFor(value, check = () => {}) {
  return { AI_PROVIDER_ENABLED: "enabled", AI_GLOBAL_KILL_SWITCH: "disabled", AI: { async run(model, input) { check(model, input); if (value instanceof Error) throw value; return value } } }
}

test("Advanced accepts completed Responses output and preserves every Hungarian text part, excluding reasoning", async () => {
  const result = await invokeAssistantWorkersAiText(envFor(completed()), projection, { tier: advanced })
  assert.equal(result.ok, true, `documented response rejected: ${result.reason}`)
  assert.equal(result.response, answer)
  assert.deepEqual([result.metrics.inputTokens, result.metrics.outputTokens, result.metrics.totalTokens], [40, 60, 100])
})
test("Advanced sends Responses input with bounded output and Hungarian system policy", async () => {
  let observed
  await invokeAssistantWorkersAiText(envFor(completed(), (model, input) => { observed = { model, input } }), projection, { tier: advanced })
  assert.equal(observed.model, "@cf/openai/gpt-oss-120b")
  assert.equal(observed.input.max_output_tokens, 2048, "Advanced must allow reasoning plus a complete developed business answer")
  assert.equal(observed.input.stream, false)
  assert.equal(observed.input.reasoning.effort, "low")
  assert.equal(observed.input.temperature, 1, "Advanced must use GPT-OSS publisher-recommended sampling, independently of Standard")
  assert.equal(observed.input.top_p, 1)
  assert.match(observed.input.input[0].content, /Respond in Hungarian\./)
  assert.equal(observed.input.input[1].content, projection.prompt)
  assert.equal("messages" in observed.input, false)
  assert.equal("max_tokens" in observed.input, false)
  const bounded = boundAssistantProviderPayload(advanced, projection)
  assert.ok(bounded.reservation.inputTokens >= new TextEncoder().encode(JSON.stringify(observed.input)).length)
})
for (const [name, mutate] of [
  ["incomplete", r => { r.status = "incomplete"; r.incomplete_details = { reason: "max_output_tokens" } }],
  ["failed", r => { r.status = "failed"; r.error = { code: "server_error" } }],
  ["in-progress", r => { r.status = "in_progress" }],
  ["reasoning-only", r => { r.output = r.output.slice(0, 1) }],
  ["unfinished message", r => { r.output[1].status = "incomplete" }],
  ["refusal", r => { r.output[1].content = [{ type: "refusal", refusal: "No." }] }],
  ["tool-only", r => { r.output = [{ type: "function_call", name: "send", arguments: "{}" }] }],
  ["empty", r => { r.output[1].content = [{ type: "output_text", text: "   " }] }],
  ["legacy field", r => { r.output = []; r.response = "Not a Responses answer." }],
]) test(`Advanced rejects ${name} rather than charging it as a successful answer`, async () => {
  const response = completed(); mutate(response)
  const result = await invokeAssistantWorkersAiText(envFor(response), projection, { tier: advanced })
  assert.equal(result.ok, false)
  assert.equal(result.response, undefined)
})
test("Advanced provider exception remains a failure", async () => {
  assert.equal((await invokeAssistantWorkersAiText(envFor(new Error("upstream unavailable")), projection, { tier: advanced })).ok, false)
})
test("Standard preserves its chat payload, response and token accounting", async () => {
  const result = await invokeAssistantWorkersAiText(envFor({ response: answer, usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 } }, (model, input) => {
    assert.equal(model, "@cf/qwen/qwen3-30b-a3b-fp8")
    assert.equal(input.max_tokens, 512)
    assert.equal(input.messages[1].content, projection.prompt)
    assert.equal(input.temperature, 0.2)
    assert.equal(input.stream, false)
    assert.equal("input" in input, false)
  }), projection, { tier: standard })
  assert.equal(result.ok, true)
  assert.equal(result.response, answer)
  assert.equal(result.metrics.totalTokens, 30)
})
test("Standard retains the previously admitted input boundary", () => {
  assert.equal(boundAssistantProviderPayload(standard, { ...projection, prompt: "a".repeat(365) }).ok, true)
})
test("Staging Advanced resolves the configured eight-credit mode", () => {
  const staging = JSON.parse(readFileSync(new URL("../../wrangler.staging.jsonc", import.meta.url), "utf8"))
  const resolved = resolveAssistantModelTier({ tier: "advanced", plan: "premium", env: staging.vars })
  assert.equal(resolved.ok, true)
  assert.equal(resolved.tier.customerCreditCost, 8)
})
function accounting() {
  const db = new DatabaseSync(":memory:")
  for (const name of ["0009_assistant_ai_usage.sql", "0022_assistant_usage_settlement.sql", "0026_assistant_topup_credits.sql", "0028_assistant_topup_purchase_lots.sql", "0030_assistant_weighted_credits.sql"]) {
    db.exec(readFileSync(new URL(`../../migrations/${name}`, import.meta.url), "utf8"))
  }
  const DB = {
    prepare(sql) { return { bind(...values) { return {
      async first() { return db.prepare(sql).get(...values) },
      async all() { return { results: db.prepare(sql).all(...values) } },
      async run() { const r = db.prepare(sql).run(...values); return { meta: { changes: Number(r.changes) } } },
    } } } },
    async batch(statements) {
      db.exec("BEGIN IMMEDIATE")
      try { const results = []; for (const statement of statements) results.push(await statement.run()); db.exec("COMMIT"); return results }
      catch (error) { db.exec("ROLLBACK"); throw error }
    },
  }
  return { db, env: { DB } }
}
test("Real chat HTTP route returns a confirmed timeout only after refunding all eight credits and releasing concurrency", async () => {
  const { db, env } = accounting()
  let released = false
  try {
    for (const name of ["0027_assistant_cost_guard.sql", "0029_assistant_daily_model_admission.sql"]) db.exec(readFileSync(new URL(`../../migrations/${name}`, import.meta.url), "utf8"))
    db.exec("CREATE TABLE user_plans(userId TEXT PRIMARY KEY,plan TEXT,createdAt TEXT,updatedAt TEXT); INSERT INTO user_plans VALUES('route-timeout','premium','2026-10-29','2026-10-29')")
    Object.assign(env, { AI_PROVIDER_ENABLED: "enabled", AI_GLOBAL_KILL_SWITCH: "disabled", AI_PUBLIC_ASSISTANT_ENABLED: "enabled", AI_ADVANCED_ASSISTANT_CREDIT_COST: "8", AI_DAILY_REQUEST_CEILING: "6", AI_DAILY_NEURON_CEILING: "1000", AI_GLOBAL_INCLUDED_BUDGET_UNITS: "1000", AI_GLOBAL_PREPAID_BUDGET_UNITS: "1000", AI_GLOBAL_EMERGENCY_CAP_UNITS: "1000", AI_GLOBAL_REQUEST_RESERVATION_UNITS: "201", AI: { async run() { throw new DOMException("Timed out", "AbortError") } }, RATE_LIMITER: { getByName() { return { async admit(now, leaseMs) { assert.equal(leaseMs, 65000); return { allowed: true, token: "test-lease" } }, async release(token) { assert.equal(token, "test-lease"); released = true } } } } })
    const operationId = crypto.randomUUID()
    const handler = createRequestHandler({ getLoggedInUserFn: async () => ({ id: "route-timeout", email: "synthetic@example.invalid" }) })
    const response = await handler.fetch(new Request("https://example.test/api/chat", { method: "POST", headers: { cookie: "fixture=session", "content-type": "application/json" }, body: JSON.stringify({ message: projection.prompt, language: "hu", tier: "advanced", assistantOperationId: operationId }) }), env, {})
    assert.equal(response.status, 504)
    const body = await response.json()
    assert.equal(body.code, "ASSISTANT_TIMEOUT")
    assert.equal(body.creditsRefunded, true)
    assert.equal(body.assistantOperationId, operationId)
    assert.equal(released, true)
    assert.equal(db.prepare("SELECT aiMessages FROM assistant_ai_usage WHERE userId='route-timeout'").get().aiMessages, 0)
    assert.equal(db.prepare("SELECT quotaSettlementState FROM assistant_usage_settlements WHERE operationId=?").get(operationId).quotaSettlementState, "refunded")
  } finally { db.close() }
})
test("Top-up timeout confirms spendable refund only for a still-paid purchase lot", async () => {
  const { db, env } = accounting()
  try {
    for (const paymentState of ["paid", "refunded"]) {
      const userId = `timeout-${paymentState}`, operationId = crypto.randomUUID()
      await grantAssistantTopUpPurchase(env, { purchaseId: userId, userId, stripeCheckoutSessionId: `cs-${userId}`, stripeEventId: `evt-${userId}`, packCode: "small", credits: 100, amountTotal: 199, currency: "gbp" })
      const reserved = await reserveAssistantTopUpCredit(env, { operationId, userId, credits: 8 })
      assert.equal(reserved.reserved, true)
      if (paymentState !== "paid") db.prepare("UPDATE assistant_topup_credit_lots SET paymentState=? WHERE lotId=?").run(paymentState, reserved.lotId)
      const settled = await finishAssistantTopUpCredit(env, { operationId, status: "timed_out" })
      assert.equal(settled.creditsRefunded, paymentState === "paid")
    }
  } finally { db.close() }
})
for (const funding of ["monthly", "topup"]) test(`Responses outcomes settle ${funding} credits exactly once: success 8, failure 0, Standard 1`, async () => {
  const { db, env } = accounting()
  const userId = "responses-test-user", period = "2026-10"
  try {
    if (funding === "topup") await grantAssistantTopUpPurchase(env, { purchaseId: "test-purchase", userId, stripeCheckoutSessionId: "cs-test", stripePaymentIntentId: "pi-test", stripeEventId: "evt-test", packCode: "small", credits: 100, amountTotal: 199, currency: "gbp" })
    const used = async () => funding === "monthly" ? readAssistantUsage(env, userId, period) : 100 - await readAssistantTopUpBalance(env, userId)
    const cases = [
      [advanced, completed(), true, 8],
      [advanced, { ...completed(), status: "incomplete", incomplete_details: { reason: "max_output_tokens" } }, false, 8],
      [advanced, new Error("provider failed"), false, 8],
      [advanced, { ...completed(), output: [] }, false, 8],
      [standard, { response: answer, usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12 } }, true, 9],
    ]
    for (const [tier, value, ok, expectedUsed] of cases) {
      const operationId = crypto.randomUUID()
      const before = await used()
      const reservation = funding === "monthly"
        ? await startAssistantOperation(env, { operationId, userId, workspaceId: userId, period, planLimit: 100, plan: "premium", provider: "workers-ai", model: tier.model, creditCost: tier.customerCreditCost })
        : await reserveAssistantTopUpCredit(env, { operationId, userId, credits: tier.customerCreditCost })
      assert.equal(reservation.reserved, true)
      assert.equal(await used(), before + tier.customerCreditCost)
      const result = await invokeAssistantWorkersAiText({ ...env, ...envFor(value) }, projection, { tier })
      assert.equal(result.ok, ok)
      const settle = () => funding === "monthly"
        ? finishAssistantOperation(env, { operationId, status: result.ok ? "succeeded" : "failed", metrics: result.metrics })
        : finishAssistantTopUpCredit(env, { operationId, status: result.ok ? "succeeded" : "failed" })
      assert.equal((await settle()).settled, true)
      assert.equal(await used(), expectedUsed)
      assert.equal((await settle()).duplicate, true)
      assert.equal(await used(), expectedUsed, "duplicate settlement must neither charge nor refund again")
      if (funding === "monthly") {
        const row = db.prepare("SELECT quotaSettlementState,inputTokens,outputTokens FROM assistant_usage_settlements WHERE operationId=?").get(operationId)
        assert.equal(row.quotaSettlementState, ok ? "finalized" : "refunded")
        if (tier.id === "advanced" && ok) assert.deepEqual([row.inputTokens, row.outputTokens], [40, 60])
      }
    }
  } finally { db.close() }
})
