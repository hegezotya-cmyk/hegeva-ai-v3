// Provider-neutral Workers AI boundary. Disabled unless every gate is
// explicitly configured; this module never falls back to another provider.
export const WORKERS_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast"
const encoder = new TextEncoder()
const ASSISTANT_SYSTEM_PROMPT = "Return a concise, practical business answer. Do not call tools or execute actions."
const positiveConfigInt = (value, max = 10_000) => {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= max ? parsed : null
}

// These are the only models the public Assistant may invoke. The browser
// supplies a tier, never a provider model identifier.
export const ASSISTANT_MODEL_TIERS = Object.freeze({
  standard: Object.freeze({
    id: "standard",
    model: "@cf/qwen/qwen3-30b-a3b-fp8",
    maxInputTokens: 2_048,
    maxOutputTokens: 512,
    inputNeuronsPerMillion: 4_625,
    outputNeuronsPerMillion: 30_475,
    // Conservative operational bound used for request admission (not a live
    // billing estimate). It deliberately rounds above the documented rate.
    inputUsdPerMillion: 0.05125,
    outputUsdPerMillion: 0.335,
    customerCreditCost: 1,
    maxRequestNeurons: 26,
  }),
  advanced: Object.freeze({
    id: "advanced",
    model: "@cf/openai/gpt-oss-120b",
    maxInputTokens: 4_096,
    maxOutputTokens: 1_024,
    inputNeuronsPerMillion: 31_818,
    outputNeuronsPerMillion: 68_182,
    inputUsdPerMillion: 0.35,
    outputUsdPerMillion: 0.75,
    customerCreditCost: null,
    maxRequestNeurons: 201,
  }),
})

function tierReservation(tier) {
  const inputNeurons = Math.ceil((tier.maxInputTokens * tier.inputNeuronsPerMillion) / 1_000_000)
  const outputNeurons = Math.ceil((tier.maxOutputTokens * tier.outputNeuronsPerMillion) / 1_000_000)
  return Object.freeze({
    inputNeurons,
    outputNeurons,
    neurons: inputNeurons + outputNeurons,
    inputUsd: (tier.maxInputTokens * tier.inputUsdPerMillion) / 1_000_000,
    outputUsd: (tier.maxOutputTokens * tier.outputUsdPerMillion) / 1_000_000,
    usd: ((tier.maxInputTokens * tier.inputUsdPerMillion) + (tier.maxOutputTokens * tier.outputUsdPerMillion)) / 1_000_000,
  })
}

export function resolveAssistantModelTier({ tier, plan, env = {} }) {
  const requested = tier == null || tier === "" ? "standard" : tier
  if (!(requested === "standard" || requested === "advanced")) return { ok: false, reason: "invalid-tier" }
  const selected = ASSISTANT_MODEL_TIERS[requested]
  if (requested === "advanced") {
    if (!(plan === "premium" || plan === "pro")) return { ok: false, reason: "advanced-plan-required" }
    const creditCost = positiveConfigInt(env.AI_ADVANCED_ASSISTANT_CREDIT_COST)
    if (!creditCost) return { ok: false, reason: "advanced-credit-cost-unconfigured" }
    return { ok: true, tier: Object.freeze({ ...selected, customerCreditCost: creditCost, reservation: tierReservation(selected) }) }
  }
  return { ok: true, tier: Object.freeze({ ...selected, reservation: tierReservation(selected) }) }
}

export function boundAssistantProviderPayload(tier, projection) {
  if (!tier || !projection || projection.operation !== "assistant" || typeof projection.prompt !== "string") return { ok: false, reason: "invalid-projection" }
  const messages = [
    { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
    { role: "user", content: projection.prompt.trim() },
  ]
  if (!messages[1].content) return { ok: false, reason: "invalid-projection" }
  // UTF-8 byte length is a conservative token upper bound for this plain-text,
  // JSON-serialized request. It covers system text and every transmitted field.
  const inputTokens = encoder.encode(JSON.stringify({ messages, max_tokens: tier.maxOutputTokens })).byteLength
  if (inputTokens > tier.maxInputTokens) return { ok: false, reason: "provider-input-too-large" }
  return {
    ok: true,
    request: Object.freeze({ model: tier.model, messages, max_tokens: tier.maxOutputTokens, temperature: 0.2, stream: false }),
    reservation: Object.freeze({ ...tier.reservation, inputTokens, outputTokens: tier.maxOutputTokens }),
  }
}
export const WORKERS_AI_DEFAULTS = Object.freeze({
  enabled: false,
  maxInputTokens: 1200,
  maxOutputTokens: 700,
  timeoutMs: 20_000,
  dailyRequestCeiling: 20,
  dailyNeuronCeiling: 70_000,
  perUserCeiling: 5,
  perWorkspaceCeiling: 10,
  concurrencyCeiling: 1,
  warningRatio: 0.70,
  rejectRatio: 0.90,
  hardStopRatio: 1,
  globalKillSwitch: true,
})

export const CANARY_BOUNDS = Object.freeze({ maxRequests: 1, maxInputTokens: 200, maxOutputTokens: 100, concurrency: 1, timeoutMs: 10_000 })

const exactEnabled = (value) => value === "enabled"
const boundedInt = (value, fallback, max) => {
  const n = Number(value)
  return Number.isSafeInteger(n) && n > 0 && n <= max ? n : fallback
}

const strictPositiveInt = (value, max) => typeof value === "string" && /^(?:[1-9][0-9]*)$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) <= max ? Number(value) : null

export function getWorkersAiCanaryConfig(env = {}) {
  const allocation = strictPositiveInt(env.AI_DOCUMENTED_DAILY_NEURON_ALLOCATION, 10_000_000)
  const neuronCeiling = strictPositiveInt(env.AI_DAILY_NEURON_CEILING, 10_000_000)
  const requestCeiling = strictPositiveInt(env.AI_DAILY_REQUEST_CEILING, 1_000)
  const userCeiling = strictPositiveInt(env.AI_PER_USER_CEILING, 100)
  const workspaceCeiling = strictPositiveInt(env.AI_PER_WORKSPACE_CEILING, 100)
  const concurrency = strictPositiveInt(env.AI_CONCURRENCY_CEILING, 10)
  const maxInput = strictPositiveInt(env.AI_MAX_INPUT_TOKENS, 4_000)
  const maxOutput = strictPositiveInt(env.AI_MAX_OUTPUT_TOKENS, 1_200)
  const timeout = strictPositiveInt(env.AI_TIMEOUT_MS, 20_000)
  if (env.AI_PROVIDER_MODEL !== WORKERS_AI_MODEL) return { ok: false, reason: "model-invalid" }
  if (!allocation) return { ok: false, reason: "allocation-invalid" }
  if (!requestCeiling || requestCeiling > CANARY_BOUNDS.maxRequests) return { ok: false, reason: "request-ceiling-invalid" }
  if (!userCeiling || userCeiling > CANARY_BOUNDS.maxRequests) return { ok: false, reason: "user-ceiling-invalid" }
  if (!workspaceCeiling || workspaceCeiling > CANARY_BOUNDS.maxRequests) return { ok: false, reason: "workspace-ceiling-invalid" }
  if (!neuronCeiling || neuronCeiling > Math.floor(allocation * 0.7)) return { ok: false, reason: "neuron-ceiling-invalid" }
  if (!concurrency || concurrency !== 1) return { ok: false, reason: "concurrency-invalid" }
  if (!maxInput || maxInput > CANARY_BOUNDS.maxInputTokens) return { ok: false, reason: "internal-unavailable" }
  if (!maxOutput || maxOutput > CANARY_BOUNDS.maxOutputTokens) return { ok: false, reason: "internal-unavailable" }
  if (!timeout || timeout > CANARY_BOUNDS.timeoutMs) return { ok: false, reason: "internal-unavailable" }
  return { ok: true, allocation, neuronCeiling, requestCeiling, userCeiling, workspaceCeiling, concurrency, maxInput, maxOutput, timeout }
}

export function getWorkersAiConfig(env = {}) {
  const canaryMode = env.AI_OWNER_CANARY_ENABLED === "enabled"
  const freeAllocation = boundedInt(env.AI_DOCUMENTED_DAILY_NEURON_ALLOCATION, 0, 10_000_000)
  const appCeiling = Math.min(
    boundedInt(env.AI_DAILY_NEURON_CEILING, Math.floor(freeAllocation * 0.7), 10_000_000),
    Math.floor(freeAllocation * 0.7),
  )
  return Object.freeze({
    enabled: exactEnabled(env.AI_PROVIDER_ENABLED),
    model: typeof env.AI_PROVIDER_MODEL === "string" && env.AI_PROVIDER_MODEL === WORKERS_AI_MODEL ? env.AI_PROVIDER_MODEL : WORKERS_AI_MODEL,
    maxInputTokens: canaryMode ? CANARY_BOUNDS.maxInputTokens : boundedInt(env.AI_MAX_INPUT_TOKENS, WORKERS_AI_DEFAULTS.maxInputTokens, 4_000),
    maxOutputTokens: canaryMode ? CANARY_BOUNDS.maxOutputTokens : boundedInt(env.AI_MAX_OUTPUT_TOKENS, WORKERS_AI_DEFAULTS.maxOutputTokens, 1_200),
    timeoutMs: canaryMode ? CANARY_BOUNDS.timeoutMs : boundedInt(env.AI_TIMEOUT_MS, WORKERS_AI_DEFAULTS.timeoutMs, 20_000),
    dailyRequestCeiling: boundedInt(env.AI_DAILY_REQUEST_CEILING, WORKERS_AI_DEFAULTS.dailyRequestCeiling, 1_000),
    dailyNeuronCeiling: appCeiling,
    perUserCeiling: boundedInt(env.AI_PER_USER_CEILING, WORKERS_AI_DEFAULTS.perUserCeiling, 100),
    perWorkspaceCeiling: boundedInt(env.AI_PER_WORKSPACE_CEILING, WORKERS_AI_DEFAULTS.perWorkspaceCeiling, 100),
    concurrencyCeiling: boundedInt(env.AI_CONCURRENCY_CEILING, WORKERS_AI_DEFAULTS.concurrencyCeiling, 10),
    globalKillSwitch: env.AI_GLOBAL_KILL_SWITCH !== "disabled",
    freeAllocationSource: typeof env.AI_DOCUMENTED_DAILY_NEURON_ALLOCATION === "string" ? "configured" : "unavailable",
  })
}

export function buildWorkersAiProjection({ operation, locale, prompt }) {
  if (!(operation === "assistant" || operation === "ai-bot") || !["en", "hu", "de", "fr", "es"].includes(locale) || typeof prompt !== "string") return null
  const boundedPrompt = prompt.trim().slice(0, 8_000)
  if (!boundedPrompt || /(?:https?:\/\/|javascript:|<\/?[a-z]|\b(?:tool|deploy|execute)\b)/i.test(boundedPrompt)) return null
  return { schemaVersion: "0.1", operation, locale, prompt: boundedPrompt }
}

export function parseProviderFlags(env = {}) {
  return Object.freeze({
    providerEnabled: env.AI_PROVIDER_ENABLED === "enabled",
    killSwitchActive: env.AI_GLOBAL_KILL_SWITCH !== "disabled",
    publicAssistantEnabled: env.AI_PUBLIC_ASSISTANT_ENABLED === "enabled",
    x10Enabled: env.AI_X10_ENABLED === "enabled",
    ownerProfileSetupEnabled: env.AI_OWNER_PROFILE_SETUP_ENABLED === "enabled",
    ownerCanaryEnabled: env.AI_OWNER_CANARY_ENABLED === "enabled",
  })
}

export function classifyAllocation(usedNeurons, ceiling) {
  if (!Number.isSafeInteger(usedNeurons) || !Number.isSafeInteger(ceiling) || usedNeurons < 0 || ceiling <= 0) return "unavailable"
  const ratio = usedNeurons / ceiling
  if (ratio >= 1) return "hard-stop"
  if (ratio >= 0.9) return "reject"
  if (ratio >= 0.7) return "warning"
  return "ok"
}

function providerCount(value) {
  if (Number.isSafeInteger(value) && value >= 0) return value
  if (typeof value === "string" && /^(?:0|[1-9][0-9]*)$/.test(value)) {
    const parsed = Number(value)
    return Number.isSafeInteger(parsed) ? parsed : null
  }
  return null
}

function providerMetric(usage, primary, alternate) {
  if (!usage || typeof usage !== "object") return null
  // Canonical provider fields take precedence even when explicitly null.
  const key = Object.prototype.hasOwnProperty.call(usage, primary) ? primary : alternate
  return providerCount(usage[key])
}

export function normalizeWorkersAiUsage(usage) {
  return {
    inputTokens: providerMetric(usage, "prompt_tokens", "input_tokens"),
    outputTokens: providerMetric(usage, "completion_tokens", "output_tokens"),
    totalTokens: providerMetric(usage, "total_tokens", "totalTokens"),
    neuronUsage: providerMetric(usage, "neurons", "neuron_usage"),
  }
}

/**
 * Shared ordering contract. Callers provide existing auth/quota/ledger
 * functions; no provider call is possible until every reservation succeeds.
 */
export async function runWorkersAiOperation({ context, gates, reserveUsage, reserveFinancial, releaseUsage, releaseFinancial, finalizeUsage, finalizeFinancial, invoke }) {
  if (!context?.authenticated || !context.workspaceId) return { ok: false, reason: "authentication-required" }
  if (!gates?.featureEnabled || !gates.providerAvailable || gates.globalKillSwitch) return { ok: false, reason: "provider-disabled" }
  if (!gates.rateAllowed) return { ok: false, reason: "rate-limited" }
  if (!gates.quotaAllowed || !gates.prepaidAllowed) return { ok: false, reason: "quota-exhausted" }
  const usage = await reserveUsage()
  if (!usage?.reserved) return { ok: false, reason: "usage-reservation-failed" }
  const financial = await reserveFinancial()
  if (!financial?.reserved) {
    await releaseUsage?.()
    return { ok: false, reason: "financial-reservation-failed" }
  }
  try {
    const result = await invoke()
    await finalizeUsage?.("completed")
    await finalizeFinancial?.("completed")
    return { ok: true, result }
  } catch (error) {
    await releaseUsage?.()
    await releaseFinancial?.()
    return { ok: false, reason: error?.name === "AbortError" ? "timeout" : "provider-failure" }
  }
}

export async function invokeWorkersAiText(env, projection, { signal } = {}) {
  const config = getWorkersAiConfig(env)
  if (!config.enabled || config.globalKillSwitch || !env?.AI || typeof env.AI.run !== "function") return { ok: false, reason: "provider-disabled" }
  if (!projection) return { ok: false, reason: "invalid-projection" }
  const controller = new AbortController()
  const startedAt = Date.now()
  let timeoutId
  const timeoutError = new DOMException("Workers AI request timed out", "AbortError")
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort()
      reject(timeoutError)
    }, config.timeoutMs)
  })
  try {
    const providerPromise = env.AI.run(config.model, {
      messages: [{ role: "system", content: "Return a concise answer. Do not call tools." }, { role: "user", content: projection.prompt }],
      max_tokens: config.maxOutputTokens,
      temperature: 0.2,
      stream: false,
    }, { signal: signal || controller.signal })
    const response = await Promise.race([providerPromise, timeoutPromise])
    const providerUsage = normalizeWorkersAiUsage(response?.usage)
    const metrics = { ...providerUsage, durationMs: Math.max(0, Date.now() - startedAt) }
    if (!response || typeof response.response !== "string") return { ok: false, reason: "missing-response", metrics }
    return { ok: true, response: response.response.slice(0, 12_000), metrics }
  } catch (error) {
    return {
      ok: false,
      reason: error?.name === "AbortError" ? "timeout" : "provider-failure",
      metrics: { inputTokens: null, outputTokens: null, totalTokens: null, neuronUsage: null, durationMs: Math.max(0, Date.now() - startedAt) },
    }
  } finally { clearTimeout(timeoutId) }
}

export async function invokeAssistantWorkersAiText(env, projection, { tier, signal } = {}) {
  const config = getWorkersAiConfig(env)
  if (!config.enabled || config.globalKillSwitch || !env?.AI || typeof env.AI.run !== "function") return { ok: false, reason: "provider-disabled" }
  const bounded = boundAssistantProviderPayload(tier, projection)
  if (!bounded.ok) return { ok: false, reason: bounded.reason }
  const controller = new AbortController()
  const startedAt = Date.now()
  let timeoutId
  const timeoutError = new DOMException("Workers AI request timed out", "AbortError")
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort()
      reject(timeoutError)
    }, config.timeoutMs)
  })
  try {
    const response = await Promise.race([
      env.AI.run(bounded.request.model, {
        messages: bounded.request.messages,
        max_tokens: bounded.request.max_tokens,
        temperature: bounded.request.temperature,
        stream: false,
      }, { signal: signal || controller.signal }),
      timeoutPromise,
    ])
    const providerUsage = normalizeWorkersAiUsage(response?.usage)
    const metrics = { ...providerUsage, durationMs: Math.max(0, Date.now() - startedAt), reservation: bounded.reservation }
    if (!response || typeof response.response !== "string") return { ok: false, reason: "missing-response", metrics }
    return { ok: true, response: response.response.slice(0, 12_000), metrics }
  } catch (error) {
    return {
      ok: false,
      reason: error?.name === "AbortError" ? "timeout" : "provider-failure",
      metrics: { inputTokens: null, outputTokens: null, totalTokens: null, neuronUsage: null, durationMs: Math.max(0, Date.now() - startedAt), reservation: bounded.reservation },
    }
  } finally { clearTimeout(timeoutId) }
}
