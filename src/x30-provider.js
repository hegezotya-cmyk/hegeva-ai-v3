import { validateX30ProviderEnvelope, buildX30ProviderInput } from "./x30-generation.js"

export const X30_PROVIDER_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast"
export const X30_PROVIDER_MAX_TOKENS = 1200
export const X30_PROVIDER_TIMEOUT_MS = 20_000

const SYSTEM_INSTRUCTIONS = [
  "You are the HEGEVA X30 structured preview generator.",
  "Return exactly one JSON object and nothing else.",
  "The object must be an X30GenerationResult v0.1 with a validated X30AppSpec.",
  "Use only the existing allowlisted X30 component types and properties.",
  "Never return HTML, CSS, JavaScript, JSX, URLs, imports, tools, execution or deployment instructions.",
  "The result is preview-only and executionState must remain not-started.",
].join(" ")

function parseProviderJson(value) {
  if (typeof value !== "string" || value.length === 0) return null
  try { return JSON.parse(value) } catch { return null }
}

const COMPONENTS = new Set(["hero", "metric", "schedule", "service-list", "pet-list", "action"])
const PROPS = {
  hero: new Set(["eyebrow", "title", "description", "alignment", "variant"]),
  metric: new Set(["label", "value", "detail", "alignment", "variant"]),
  schedule: new Set(["title", "items", "alignment", "variant"]),
  "service-list": new Set(["title", "items", "alignment", "variant"]),
  "pet-list": new Set(["title", "items", "alignment", "variant"]),
  action: new Set(["label", "hint", "alignment", "variant"]),
}
function validateX30Spec(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.version !== "0.1" || typeof value.id !== "string" || !/^[a-z0-9-]{3,48}$/.test(value.id) || typeof value.name !== "string" || value.name.length < 2 || value.name.length > 60 || !value.direction || !Array.isArray(value.nodes) || value.nodes.length < 1 || value.nodes.length > 24) return false
  const ids = new Set()
  for (const node of value.nodes) {
    if (!node || typeof node !== "object" || !COMPONENTS.has(node.type) || typeof node.id !== "string" || !/^[a-z0-9-]{2,48}$/.test(node.id) || ids.has(node.id) || !node.props || typeof node.props !== "object" || Array.isArray(node.props)) return false
    ids.add(node.id)
    for (const [key, property] of Object.entries(node.props)) {
      if (!PROPS[node.type].has(key) || (key !== "items" && typeof property !== "string") || (typeof property === "string" && property.length > 180) || (key === "items" && (!Array.isArray(property) || property.length > 8))) return false
    }
  }
  return true
}

export async function invokeX30Provider(env, { brief, operationId, scope = "authenticated" }) {
  const input = buildX30ProviderInput(brief)
  if (!input.ok || !env?.AI || typeof env.AI.run !== "function") return { ok: false, reason: "invalid_request" }
  const requestBody = JSON.parse(input.input)
  const aiPromise = env.AI.run(X30_PROVIDER_MODEL, {
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTIONS },
      { role: "user", content: JSON.stringify(requestBody) },
    ],
    temperature: 0.1,
    max_tokens: X30_PROVIDER_MAX_TOKENS,
    stream: false,
  })
  let timeoutId
  const timeout = new Promise((_, reject) => { timeoutId = setTimeout(() => reject(new Error("x30_provider_timeout")), X30_PROVIDER_TIMEOUT_MS) })
  try {
    const response = await Promise.race([aiPromise, timeout])
    const parsed = parseProviderJson(response?.response)
    if (!parsed) return { ok: false, reason: "malformed_result" }
    const checked = validateX30ProviderEnvelope(parsed, validateX30Spec)
    if (!checked.ok || checked.result.operation.operationId !== operationId || checked.result.provenance.scope !== scope) return { ok: false, reason: "invalid_result" }
    if (!validateX30Spec(checked.result.spec)) return { ok: false, reason: "invalid_spec" }
    return { ok: true, result: checked.result }
  } catch (error) {
    return { ok: false, reason: error?.message === "x30_provider_timeout" ? "timeout" : "provider_failure" }
  } finally {
    clearTimeout(timeoutId)
  }
}
