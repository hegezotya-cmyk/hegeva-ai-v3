const DOMAINS = new Set(["professional-services", "finance", "retail", "hospitality", "health", "education", "technology", "other"])
const CAPABILITIES = new Set(["records", "search", "filter", "create", "edit", "delete", "dashboard", "schedule", "responsive", "local-persistence", "reports", "messages"])
const DIRECTIONS = new Set(["professional", "ledger", "hospitality", "studio", "editorial", "technical"])
const LANGUAGES = new Set(["en", "hu", "de", "fr", "es"])
const SENSITIVITIES = new Set(["public", "internal", "confidential"])
const DEPLOYMENTS = new Set(["preview-only", "future-review"])
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"])
const UNSAFE_TEXT = /<\/?(?:script|style|html|body|head|svg|iframe|xml)\b|javascript:|data:|https?:\/\/|\b(?:eval|new\s+Function|dangerouslySetInnerHTML|dynamic\s+import|tool|provider|deploy|execute\s+code)\b/i

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
const bytes = (value) => new TextEncoder().encode(JSON.stringify(value)).byteLength

export function validateX30ProviderBrief(value) {
  const errors = []
  if (!isRecord(value)) return { ok: false, errors: ["x30.invalid_brief"] }
  const allowed = ["domain", "targetUsers", "primaryGoal", "requiredPages", "requiredCapabilities", "visualDirection", "language", "dataSensitivity", "deploymentIntent"]
  for (const key of Object.keys(value)) if (UNSAFE_KEYS.has(key) || !allowed.includes(key)) errors.push("x30.unexpected_brief_field")
  for (const [key, max] of [["targetUsers", 160], ["primaryGoal", 180]]) if (typeof value[key] !== "string" || value[key].length > max || UNSAFE_TEXT.test(value[key])) errors.push("x30.invalid_brief_text")
  if (!DOMAINS.has(value.domain) || !DIRECTIONS.has(value.visualDirection) || !LANGUAGES.has(value.language) || !SENSITIVITIES.has(value.dataSensitivity) || !DEPLOYMENTS.has(value.deploymentIntent)) errors.push("x30.invalid_brief_enum")
  if (!Array.isArray(value.requiredPages) || value.requiredPages.length > 8 || value.requiredPages.some((item) => typeof item !== "string" || item.length > 48 || UNSAFE_TEXT.test(item))) errors.push("x30.invalid_pages")
  if (!Array.isArray(value.requiredCapabilities) || value.requiredCapabilities.length > 12 || new Set(value.requiredCapabilities).size !== value.requiredCapabilities.length || value.requiredCapabilities.some((item) => !CAPABILITIES.has(item))) errors.push("x30.invalid_capabilities")
  if (bytes(value) > 8 * 1024) errors.push("x30.brief_too_large")
  return errors.length ? { ok: false, errors: [...new Set(errors)] } : { ok: true, brief: { domain: value.domain, targetUsers: "bounded-user-summary", primaryGoal: "bounded-goal-summary", requiredPages: value.requiredPages, requiredCapabilities: value.requiredCapabilities, visualDirection: value.visualDirection, language: value.language, dataSensitivity: value.dataSensitivity, deploymentIntent: value.deploymentIntent } }
}

export function buildX30ProviderInput(value) {
  const result = validateX30ProviderBrief(value)
  if (!result.ok) return result
  return { ok: true, input: JSON.stringify(result.brief) }
}

export function x30ProviderEnabled(env) { return env?.X30_GENERATION_ENABLED === "enabled" }

export function isX30CanaryOwner(user, env) {
  const userEmail = typeof user?.email === "string" ? user.email.trim().toLowerCase() : ""
  const adminEmail = typeof env?.ADMIN_EMAIL === "string" ? env.ADMIN_EMAIL.trim().toLowerCase() : ""
  return Boolean(userEmail && adminEmail && userEmail === adminEmail)
}

export function validateX30ProviderEnvelope(value, validateSpec) {
  if (!isRecord(value)) return { ok: false, reason: "invalid_result" }
  const keys = ["schemaVersion", "kind", "status", "spec", "provenance", "operation", "executionState"]
  if (Object.keys(value).some((key) => !keys.includes(key) || UNSAFE_KEYS.has(key))) return { ok: false, reason: "invalid_result" }
  if (value.schemaVersion !== "0.1" || value.kind !== "x30-generation-result" || value.executionState !== "not-started" || value.status !== "ready-for-review") return { ok: false, reason: "invalid_result" }
  if (!isRecord(value.provenance) || value.provenance.mode !== "preview-only" || value.provenance.source !== "x30-ai") return { ok: false, reason: "invalid_result" }
  if (!isRecord(value.operation) || value.operation.attemptNumber !== 1 || typeof value.operation.operationId !== "string") return { ok: false, reason: "invalid_result" }
  return validateSpec(value.spec) ? { ok: true, result: value } : { ok: false, reason: "invalid_result" }
}
