// Provider-neutral Workers AI boundary. Disabled unless every gate is
// explicitly configured; this module never falls back to another provider.
export const WORKERS_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast"
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
  if (!requestCeiling || requestCeiling !== 1) return { ok: false, reason: "request-ceiling-invalid" }
  if (!userCeiling || userCeiling !== 1) return { ok: false, reason: "user-ceiling-invalid" }
  if (!workspaceCeiling || workspaceCeiling !== 1) return { ok: false, reason: "workspace-ceiling-invalid" }
  if (!neuronCeiling || neuronCeiling > Math.floor(allocation * 0.7)) return { ok: false, reason: "neuron-ceiling-invalid" }
  if (!concurrency || concurrency !== 1) return { ok: false, reason: "concurrency-invalid" }
  if (!maxInput || maxInput > CANARY_BOUNDS.maxInputTokens) return { ok: false, reason: "internal-unavailable" }
  if (!maxOutput || maxOutput > CANARY_BOUNDS.maxOutputTokens) return { ok: false, reason: "internal-unavailable" }
  if (!timeout || timeout > CANARY_BOUNDS.timeoutMs) return { ok: false, reason: "internal-unavailable" }
  return { ok: true, allocation, neuronCeiling, requestCeiling, userCeiling, workspaceCeiling, concurrency, maxInput, maxOutput, timeout }
}

export function getWorkersAiConfig(env = {}) {
  const canaryMode = env.AI_BOT_CANARY_ENABLED === "enabled"
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
  return Object.freeze({ providerEnabled: env.AI_PROVIDER_ENABLED === "enabled", killSwitchActive: env.AI_GLOBAL_KILL_SWITCH !== "disabled", canaryEnabled: env.AI_BOT_CANARY_ENABLED === "enabled" })
}

export function classifyAllocation(usedNeurons, ceiling) {
  if (!Number.isSafeInteger(usedNeurons) || !Number.isSafeInteger(ceiling) || usedNeurons < 0 || ceiling <= 0) return "unavailable"
  const ratio = usedNeurons / ceiling
  if (ratio >= 1) return "hard-stop"
  if (ratio >= 0.9) return "reject"
  if (ratio >= 0.7) return "warning"
  return "ok"
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
    return response && typeof response.response === "string" ? { ok: true, response: response.response.slice(0, 12_000) } : { ok: false, reason: "missing-response" }
  } catch (error) {
    return { ok: false, reason: error?.name === "AbortError" ? "timeout" : "provider-failure" }
  } finally { clearTimeout(timeoutId) }
}
