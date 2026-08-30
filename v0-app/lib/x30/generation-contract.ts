import { mapX30BriefToSpec, validateX30Brief, type X30Brief } from "@/lib/x30/structured-brief"
import { validateX30Spec, type X30AppSpec } from "@/lib/x30/schema"

export const X30_GENERATION_SCHEMA_VERSION = "0.1" as const
export const X30_GENERATION_REQUEST_KIND = "x30-generation-request" as const
export const X30_GENERATION_RESULT_KIND = "x30-generation-result" as const
export const X30_GENERATION_BRIEF_MAX_BYTES = 8 * 1024
export const X30_GENERATION_REQUEST_MAX_BYTES = 10 * 1024
const MAX_DEPTH = 8
const MAX_STRING = 180
const MAX_ARRAY = 24
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"])
const FORBIDDEN_TEXT = /<\/?(?:!doctype|html|head|body|script|style|svg|xml|iframe)\b|\b(?:javascript:|data:|https?:\/\/|eval\s*\(|new\s+Function\s*\(|dangerouslySetInnerHTML|dynamic\s+import\s*\(|provider|deploy(?:ment)?|tool call|execute code)\b/i

export type X30GenerationScope = "authenticated" | "local-simulation"
export type X30GenerationBriefProjection = {
  domain: X30Brief["domain"]
  targetUsers: string
  primaryGoal: string
  requiredPages: string[]
  requiredCapabilities: X30Brief["requiredCapabilities"]
  visualDirection: X30Brief["visualDirection"]
  language: X30Brief["language"]
  dataSensitivity: X30Brief["dataSensitivity"]
  deploymentIntent: X30Brief["deploymentIntent"]
}

export type X30GenerationRequest = {
  schemaVersion: typeof X30_GENERATION_SCHEMA_VERSION
  kind: typeof X30_GENERATION_REQUEST_KIND
  brief: X30GenerationBriefProjection
  provenance: { source: "x30-brief"; mode: "preview-only"; scope: X30GenerationScope }
  operation: { operationId: string; attemptNumber: 1 }
  executionState: "not-started"
}

export type X30GenerationResult = {
  schemaVersion: typeof X30_GENERATION_SCHEMA_VERSION
  kind: typeof X30_GENERATION_RESULT_KIND
  status: "ready-for-review" | "rejected"
  spec?: X30AppSpec
  provenance: { source: "x30-ai" | "local-simulation"; mode: "preview-only"; scope: X30GenerationScope }
  operation: { operationId: string; attemptNumber: 1 }
  executionState: "not-started"
}

type Validation = { ok: true } | { ok: false; errors: string[] }
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
const text = (value: unknown) => typeof value === "string" ? value.normalize("NFKC").trim() : ""
const utf8Bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).byteLength
const safeOpaqueId = (value: unknown) => typeof value === "string" && /^[A-Za-z0-9_-]{1,96}$/.test(value)

function scan(value: unknown, errors: string[], depth = 0): void {
  if (depth > MAX_DEPTH) { errors.push("x30.generation.max_depth"); return }
  if (typeof value === "string") { if (value.length > MAX_STRING) errors.push("x30.generation.string_too_long"); if (FORBIDDEN_TEXT.test(value)) errors.push("x30.generation.unsafe_text"); return }
  if (value === null || typeof value === "boolean" || typeof value === "number") { if (typeof value === "number" && !Number.isFinite(value)) errors.push("x30.generation.invalid_number"); return }
  if (Array.isArray(value)) { if (value.length > MAX_ARRAY) errors.push("x30.generation.array_too_large"); value.forEach((item) => scan(item, errors, depth + 1)); return }
  if (!isRecord(value)) { errors.push("x30.generation.invalid_object"); return }
  for (const key of Object.keys(value)) { if (UNSAFE_KEYS.has(key)) errors.push("x30.generation.unsafe_key"); scan(value[key], errors, depth + 1) }
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], errors: string[]): void {
  const set = new Set(allowed)
  for (const key of Object.keys(value)) if (!set.has(key)) errors.push("x30.generation.unexpected_field")
}

export function validateX30GenerationRequest(value: unknown): Validation & { request?: X30GenerationRequest } {
  const errors: string[] = []
  if (!isRecord(value)) return { ok: false, errors: ["x30.generation.invalid_type"] }
  exactKeys(value, ["schemaVersion", "kind", "brief", "provenance", "operation", "executionState"], errors)
  scan(value, errors)
  if (value.schemaVersion !== X30_GENERATION_SCHEMA_VERSION || value.kind !== X30_GENERATION_REQUEST_KIND) errors.push("x30.generation.invalid_header")
  if (value.executionState !== "not-started") errors.push("x30.generation.invalid_execution_state")
  if (!isRecord(value.operation)) errors.push("x30.generation.invalid_operation")
  else { exactKeys(value.operation, ["operationId", "attemptNumber"], errors); if (!safeOpaqueId(value.operation.operationId)) errors.push("x30.generation.invalid_operation_id"); if (value.operation.attemptNumber !== 1) errors.push("x30.generation.invalid_attempt") }
  if (!isRecord(value.provenance)) errors.push("x30.generation.invalid_provenance")
  else { exactKeys(value.provenance, ["source", "mode", "scope"], errors); if (value.provenance.source !== "x30-brief" || value.provenance.mode !== "preview-only" || !["authenticated", "local-simulation"].includes(String(value.provenance.scope))) errors.push("x30.generation.invalid_provenance") }
  if (!isRecord(value.brief)) errors.push("x30.generation.invalid_brief")
  else { exactKeys(value.brief, ["domain", "targetUsers", "primaryGoal", "requiredPages", "requiredCapabilities", "visualDirection", "language", "dataSensitivity", "deploymentIntent"], errors); const brief = value.brief; if (typeof brief.targetUsers !== "string" || brief.targetUsers.length > 160 || typeof brief.primaryGoal !== "string" || brief.primaryGoal.length > 180) errors.push("x30.generation.invalid_brief_text"); if (!Array.isArray(brief.requiredPages) || brief.requiredPages.length > 8 || brief.requiredPages.some((item) => typeof item !== "string" || item.length > 48)) errors.push("x30.generation.invalid_pages"); if (!Array.isArray(brief.requiredCapabilities) || brief.requiredCapabilities.length > 12 || new Set(brief.requiredCapabilities).size !== brief.requiredCapabilities.length) errors.push("x30.generation.invalid_capabilities") }
  if (errors.length === 0 && utf8Bytes(value.brief) > X30_GENERATION_BRIEF_MAX_BYTES) errors.push("x30.generation.brief_too_large")
  if (errors.length === 0 && utf8Bytes(value) > X30_GENERATION_REQUEST_MAX_BYTES) errors.push("x30.generation.request_too_large")
  return errors.length ? { ok: false, errors: [...new Set(errors)] } : { ok: true, request: value as X30GenerationRequest }
}

export function createX30GenerationRequest(brief: X30Brief, operationId: string, scope: X30GenerationScope): X30GenerationRequest {
  const valid = validateX30Brief(brief)
  if (!valid.ok || !safeOpaqueId(operationId)) throw new Error("x30.generation.invalid_request")
  const request: X30GenerationRequest = { schemaVersion: X30_GENERATION_SCHEMA_VERSION, kind: X30_GENERATION_REQUEST_KIND, brief: { domain: valid.brief.domain, targetUsers: valid.brief.targetUsers, primaryGoal: valid.brief.primaryGoal, requiredPages: valid.brief.requiredPages || [], requiredCapabilities: valid.brief.requiredCapabilities, visualDirection: valid.brief.visualDirection, language: valid.brief.language, dataSensitivity: valid.brief.dataSensitivity, deploymentIntent: valid.brief.deploymentIntent }, provenance: { source: "x30-brief", mode: "preview-only", scope }, operation: { operationId, attemptNumber: 1 }, executionState: "not-started" }
  const checked = validateX30GenerationRequest(request)
  if (!checked.ok) throw new Error("x30.generation.invalid_request")
  return request
}

export function validateX30GenerationResult(value: unknown): Validation & { result?: X30GenerationResult } {
  const errors: string[] = []
  if (!isRecord(value)) return { ok: false, errors: ["x30.generation.invalid_type"] }
  exactKeys(value, ["schemaVersion", "kind", "status", "spec", "provenance", "operation", "executionState"], errors)
  scan(value, errors)
  if (value.schemaVersion !== X30_GENERATION_SCHEMA_VERSION || value.kind !== X30_GENERATION_RESULT_KIND) errors.push("x30.generation.invalid_header")
  if (value.status !== "ready-for-review" && value.status !== "rejected") errors.push("x30.generation.invalid_status")
  if (value.status === "ready-for-review") { if (!Object.prototype.hasOwnProperty.call(value, "spec")) errors.push("x30.generation.missing_spec"); else if (!validateX30Spec(value.spec).ok) errors.push("x30.generation.invalid_spec") }
  else if (Object.prototype.hasOwnProperty.call(value, "spec")) errors.push("x30.generation.rejected_contains_spec")
  if (!isRecord(value.operation)) errors.push("x30.generation.invalid_operation")
  else { exactKeys(value.operation, ["operationId", "attemptNumber"], errors); if (!safeOpaqueId(value.operation.operationId)) errors.push("x30.generation.invalid_operation_id"); if (value.operation.attemptNumber !== 1) errors.push("x30.generation.invalid_attempt") }
  if (!isRecord(value.provenance)) errors.push("x30.generation.invalid_provenance")
  else { exactKeys(value.provenance, ["source", "mode", "scope"], errors); if (!["x30-ai", "local-simulation"].includes(String(value.provenance.source)) || value.provenance.mode !== "preview-only" || !["authenticated", "local-simulation"].includes(String(value.provenance.scope))) errors.push("x30.generation.invalid_provenance") }
  if (value.executionState !== "not-started") errors.push("x30.generation.invalid_execution_state")
  if (errors.length === 0 && utf8Bytes(value) > X30_GENERATION_REQUEST_MAX_BYTES) errors.push("x30.generation.result_too_large")
  return errors.length ? { ok: false, errors: [...new Set(errors)] } : { ok: true, result: value as X30GenerationResult }
}

const LABELS = { en: { eyebrow: "Preview only", title: "Structured workspace preview", description: "A safe local simulation.", customers: "Customers", documents: "Documents", expenses: "Expenses", invoices: "Invoices", records: "Workspace records", schedule: "Schedule", noValue: "—", plannerItem: "Open planner item" }, hu: { eyebrow: "Csak előnézet", title: "Strukturált munkaterületi előnézet", description: "Biztonságos helyi szimuláció.", customers: "Ügyfelek", documents: "Dokumentumok", expenses: "Kiadások", invoices: "Számlák", records: "Munkaterületi rekordok", schedule: "Ütemezés", noValue: "—", plannerItem: "Nyitott tervezési elem" }, de: { eyebrow: "Nur Vorschau", title: "Strukturierte Workspace-Vorschau", description: "Eine sichere lokale Simulation.", customers: "Kunden", documents: "Dokumente", expenses: "Ausgaben", invoices: "Rechnungen", records: "Workspace-Datensätze", schedule: "Planung", noValue: "—", plannerItem: "Offenes Planungselement" }, fr: { eyebrow: "Aperçu uniquement", title: "Aperçu structuré de l’espace", description: "Une simulation locale sûre.", customers: "Clients", documents: "Documents", expenses: "Dépenses", invoices: "Factures", records: "Enregistrements de l’espace", schedule: "Planning", noValue: "—", plannerItem: "Élément de planning ouvert" }, es: { eyebrow: "Solo vista previa", title: "Vista previa estructurada del espacio", description: "Una simulación local segura.", customers: "Clientes", documents: "Documentos", expenses: "Gastos", invoices: "Facturas", records: "Registros del espacio", schedule: "Planificación", noValue: "—", plannerItem: "Elemento de planificación abierto" } } as const

export function simulateX30Generation(request: X30GenerationRequest): X30GenerationResult {
  const checked = validateX30GenerationRequest(request)
  if (!checked.ok) throw new Error("x30.generation.invalid_request")
  const labels = LABELS[request.brief.language]
  const spec = mapX30BriefToSpec({ schemaVersion: "0.1", projectName: "Preview", domain: request.brief.domain, targetUsers: "bounded", primaryGoal: "bounded", requiredPages: request.brief.requiredPages, requiredCapabilities: request.brief.requiredCapabilities, visualDirection: request.brief.visualDirection, language: request.brief.language, dataSensitivity: request.brief.dataSensitivity, deploymentIntent: request.brief.deploymentIntent, reviewState: "preview-only", approvalState: "owner-approved-preview", executionState: "not-started" }, labels, { customers: 0, documents: 0, expenses: 0, invoices: 0, planner: 0 })
  const result: X30GenerationResult = { schemaVersion: X30_GENERATION_SCHEMA_VERSION, kind: X30_GENERATION_RESULT_KIND, status: "ready-for-review", spec, provenance: { source: "local-simulation", mode: "preview-only", scope: request.provenance.scope }, operation: request.operation, executionState: "not-started" }
  if (!validateX30GenerationResult(result).ok) throw new Error("x30.generation.invalid_simulation")
  return result
}
