import { validateX30ProviderEnvelope, buildX30ProviderInput } from "./x30-generation.js"

export const X30_PROVIDER_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast"
export const X30_PROVIDER_MAX_TOKENS = 1200
export const X30_PROVIDER_TIMEOUT_MS = 20_000
export const X30_PROVIDER_DECISION_SCHEMA = Object.freeze({
  type: "object", additionalProperties: false,
  properties: {
    visualDirection: { type: "string", enum: ["professional", "ledger", "hospitality", "studio", "editorial", "technical"] },
    density: { type: "string", enum: ["relaxed", "balanced", "dense"] },
    accent: { type: "string", enum: ["gold", "emerald", "cyan", "violet"] },
    emphasis: { type: "array", maxItems: 3, items: { type: "string", enum: ["records", "search", "schedule", "reports", "messages"] } },
  },
  required: ["visualDirection", "density", "accent", "emphasis"],
})

const SYSTEM_INSTRUCTIONS = "You are the HEGEVA X30 bounded visual-direction selector. Return exactly one JSON object matching the supplied schema and nothing else. Never return HTML, CSS, JavaScript, JSX, URLs, imports, tools, execution or deployment instructions."
const COMPONENTS = new Set(["hero", "metric", "schedule", "service-list", "pet-list", "action"])
const PROPS = { hero: new Set(["eyebrow", "title", "description", "alignment", "variant"]), metric: new Set(["label", "value", "detail", "alignment", "variant"]), schedule: new Set(["title", "items", "alignment", "variant"]), "service-list": new Set(["title", "items", "alignment", "variant"]), "pet-list": new Set(["title", "items", "alignment", "variant"]), action: new Set(["label", "hint", "alignment", "variant"]) }
const DIRECTIONS = new Set(["professional", "ledger", "hospitality", "studio", "editorial", "technical"])
const DENSITIES = new Set(["relaxed", "balanced", "dense"])
const ACCENTS = new Set(["gold", "emerald", "cyan", "violet"])
const EMPHASIS = new Set(["records", "search", "schedule", "reports", "messages"])
const LABELS = {
  en: { eyebrow: "X30 preview", title: "Structured workspace preview", description: "A safe preview assembled from bounded project direction.", metrics: "Workspace signals", schedule: "Next steps", services: "Capabilities", action: "Review preview", hint: "Preview only · execution not started" },
  hu: { eyebrow: "X30 előnézet", title: "Strukturált munkaterületi előnézet", description: "Biztonságos előnézet korlátozott projektirányból.", metrics: "Munkaterületi jelek", schedule: "Következő lépések", services: "Képességek", action: "Előnézet áttekintése", hint: "Csak előnézet · a végrehajtás nem indult el" },
  de: { eyebrow: "X30-Vorschau", title: "Strukturierte Workspace-Vorschau", description: "Sichere Vorschau aus begrenzter Projektrichtung.", metrics: "Workspace-Signale", schedule: "Nächste Schritte", services: "Funktionen", action: "Vorschau prüfen", hint: "Nur Vorschau · Ausführung nicht gestartet" },
  fr: { eyebrow: "Aperçu X30", title: "Aperçu structuré de l’espace", description: "Aperçu sûr fondé sur une direction de projet limitée.", metrics: "Signaux de l’espace", schedule: "Prochaines étapes", services: "Fonctions", action: "Vérifier l’aperçu", hint: "Aperçu uniquement · exécution non démarrée" },
  es: { eyebrow: "Vista previa X30", title: "Vista previa estructurada del espacio", description: "Vista previa segura basada en una dirección de proyecto limitada.", metrics: "Señales del espacio", schedule: "Próximos pasos", services: "Capacidades", action: "Revisar vista previa", hint: "Solo vista previa · ejecución no iniciada" },
}

function isRecord(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value) }
function validateProviderDecision(value) {
  return isRecord(value) && Object.keys(value).every((key) => ["visualDirection", "density", "accent", "emphasis"].includes(key)) && DIRECTIONS.has(value.visualDirection) && DENSITIES.has(value.density) && ACCENTS.has(value.accent) && Array.isArray(value.emphasis) && value.emphasis.length <= 3 && new Set(value.emphasis).size === value.emphasis.length && value.emphasis.every((item) => EMPHASIS.has(item))
}
function validateX30Spec(value) {
  if (!isRecord(value) || value.version !== "0.1" || typeof value.id !== "string" || !/^[a-z0-9-]{3,48}$/.test(value.id) || typeof value.name !== "string" || value.name.length < 2 || value.name.length > 60 || !isRecord(value.direction) || !Array.isArray(value.nodes) || value.nodes.length < 1 || value.nodes.length > 24) return false
  const ids = new Set()
  return value.nodes.every((node) => isRecord(node) && COMPONENTS.has(node.type) && typeof node.id === "string" && /^[a-z0-9-]{2,48}$/.test(node.id) && !ids.has(node.id) && ids.add(node.id) && isRecord(node.props) && Object.entries(node.props).every(([key, property]) => PROPS[node.type].has(key) && (key === "items" ? Array.isArray(property) && property.length <= 8 : typeof property === "string" && property.length <= 180)))
}
function buildDeterministicSpec(brief, decision) {
  const labels = LABELS[brief.language] || LABELS.en
  const palette = decision.accent === "gold" ? "ledger" : decision.accent === "violet" ? "studio" : decision.visualDirection === "technical" ? "technical" : decision.visualDirection === "editorial" ? "editorial" : decision.visualDirection === "hospitality" ? "hospitality" : "meadow"
  return { version: "0.1", id: "x30-provider-preview", name: "HEGEVA X30 Preview", direction: { industry: "Professional services", mood: "direct", density: decision.density, primaryWorkflow: "workflow", palette, surface: "structured", typography: "confident", navigation: "workspace", mobilePriority: "responsive", alignment: "left", variant: "primary" }, nodes: [
    { id: "x30-hero", type: "hero", props: { eyebrow: labels.eyebrow, title: labels.title, description: labels.description, alignment: "left", variant: "primary" } },
    { id: "x30-metrics", type: "metric", props: { label: labels.metrics, value: "0", detail: "Aggregate only", alignment: "left", variant: "accent" } },
    { id: "x30-schedule", type: "schedule", props: { title: labels.schedule, items: ["Review project direction", "Confirm preview scope"], alignment: "left", variant: "soft" } },
    { id: "x30-services", type: "service-list", props: { title: labels.services, items: decision.emphasis.length ? decision.emphasis : ["records"], alignment: "left", variant: "default" } },
    { id: "x30-action", type: "action", props: { label: labels.action, hint: labels.hint, alignment: "left", variant: "primary" } },
  ] }
}

export async function invokeX30Provider(env, { brief, operationId, scope = "authenticated" }) {
  const input = buildX30ProviderInput(brief)
  if (!input.ok || !env?.AI || typeof env.AI.run !== "function") return { ok: false, reason: "invalid_request" }
  const requestBody = JSON.parse(input.input)
  const aiPromise = env.AI.run(X30_PROVIDER_MODEL, { messages: [{ role: "system", content: SYSTEM_INSTRUCTIONS }, { role: "user", content: JSON.stringify(requestBody) }], temperature: 0.1, max_tokens: X30_PROVIDER_MAX_TOKENS, stream: false, response_format: { type: "json_schema", json_schema: X30_PROVIDER_DECISION_SCHEMA } })
  let timeoutId
  const timeout = new Promise((_, reject) => { timeoutId = setTimeout(() => reject(new Error("x30_provider_timeout")), X30_PROVIDER_TIMEOUT_MS) })
  try {
    const response = await Promise.race([aiPromise, timeout])
    if (!response || typeof response !== "object" || !Object.prototype.hasOwnProperty.call(response, "response") || response.response === null || response.response === undefined) return { ok: false, reason: "missing_response" }
    if (typeof response.response === "string") return { ok: false, reason: "malformed_response" }
    const decision = response.response
    if (!validateProviderDecision(decision)) return { ok: false, reason: "invalid_provider_decision" }
    const spec = buildDeterministicSpec(requestBody, decision)
    if (!validateX30Spec(spec)) return { ok: false, reason: "invalid_spec" }
    const result = { schemaVersion: "0.1", kind: "x30-generation-result", status: "ready-for-review", spec, provenance: { source: "x30-ai", mode: "preview-only", scope }, operation: { operationId, attemptNumber: 1 }, executionState: "not-started" }
    const checked = validateX30ProviderEnvelope(result, validateX30Spec)
    return checked.ok && checked.result.operation.operationId === operationId ? { ok: true, result: checked.result } : { ok: false, reason: "invalid_result" }
  } catch (error) {
    return { ok: false, reason: error?.message === "x30_provider_timeout" ? "provider_timeout" : "provider_failure" }
  } finally { clearTimeout(timeoutId) }
}
