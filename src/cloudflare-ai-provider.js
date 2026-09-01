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

const exactEnabled = (value) => value === "enabled"
const boundedInt = (value, fallback, max) => {
  const n = Number(value)
  return Number.isSafeInteger(n) && n > 0 && n <= max ? n : fallback
}

export function getWorkersAiConfig(env = {}) {
  const freeAllocation = boundedInt(env.AI_DOCUMENTED_DAILY_NEURON_ALLOCATION, 0, 10_000_000)
  const appCeiling = Math.min(
    boundedInt(env.AI_DAILY_NEURON_CEILING, Math.floor(freeAllocation * 0.7), 10_000_000),
    Math.floor(freeAllocation * 0.7),
  )
  return Object.freeze({
    enabled: exactEnabled(env.AI_PROVIDER_ENABLED),
    model: typeof env.AI_PROVIDER_MODEL === "string" && env.AI_PROVIDER_MODEL === WORKERS_AI_MODEL ? env.AI_PROVIDER_MODEL : WORKERS_AI_MODEL,
    maxInputTokens: boundedInt(env.AI_MAX_INPUT_TOKENS, WORKERS_AI_DEFAULTS.maxInputTokens, 4_000),
    maxOutputTokens: boundedInt(env.AI_MAX_OUTPUT_TOKENS, WORKERS_AI_DEFAULTS.maxOutputTokens, 1_200),
    timeoutMs: boundedInt(env.AI_TIMEOUT_MS, WORKERS_AI_DEFAULTS.timeoutMs, 20_000),
    dailyRequestCeiling: boundedInt(env.AI_DAILY_REQUEST_CEILING, WORKERS_AI_DEFAULTS.dailyRequestCeiling, 1_000),
    dailyNeuronCeiling: appCeiling,
    perUserCeiling: boundedInt(env.AI_PER_USER_CEILING, WORKERS_AI_DEFAULTS.perUserCeiling, 100),
    perWorkspaceCeiling: boundedInt(env.AI_PER_WORKSPACE_CEILING, WORKERS_AI_DEFAULTS.perWorkspaceCeiling, 100),
    concurrencyCeiling: boundedInt(env.AI_CONCURRENCY_CEILING, WORKERS_AI_DEFAULTS.concurrencyCeiling, 10),
    globalKillSwitch: env.AI_GLOBAL_KILL_SWITCH !== "enabled",
    freeAllocationSource: typeof env.AI_DOCUMENTED_DAILY_NEURON_ALLOCATION === "string" ? "configured" : "unavailable",
  })
}

export function buildWorkersAiProjection({ operation, locale, prompt }) {
  if (!(operation === "assistant" || operation === "ai-bot") || !["en", "hu", "de", "fr", "es"].includes(locale) || typeof prompt !== "string") return null
  const boundedPrompt = prompt.trim().slice(0, 8_000)
  if (!boundedPrompt || /(?:https?:\/\/|javascript:|<\/?[a-z]|\b(?:tool|deploy|execute)\b)/i.test(boundedPrompt)) return null
  return { schemaVersion: "0.1", operation, locale, prompt: boundedPrompt }
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
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs)
  try {
    const response = await env.AI.run(config.model, {
      messages: [{ role: "system", content: "Return a concise answer. Do not call tools." }, { role: "user", content: projection.prompt }],
      max_tokens: config.maxOutputTokens,
      temperature: 0.2,
      stream: false,
    }, { signal: signal || controller.signal })
    return response && typeof response.response === "string" ? { ok: true, response: response.response.slice(0, 12_000) } : { ok: false, reason: "missing-response" }
  } catch (error) {
    return { ok: false, reason: error?.name === "AbortError" ? "timeout" : "provider-failure" }
  } finally { clearTimeout(timeout) }
}
