import type { X30AppSpec } from "@/lib/x30/schema"
import type { VisualDirection } from "@/lib/x30/domain-visual-intelligence"

export const X30_BRIEF_SCHEMA_VERSION = "0.1" as const
export const X30_BRIEF_MAX_BYTES = 16 * 1024
export const X30_BRIEF_MAX_PAGES = 8
export const X30_BRIEF_MAX_CAPABILITIES = 12

export const X30_BRIEF_DOMAINS = ["professional-services", "finance", "retail", "hospitality", "health", "education", "technology", "other"] as const
export const X30_BRIEF_CAPABILITIES = ["records", "search", "filter", "create", "edit", "delete", "dashboard", "schedule", "responsive", "local-persistence", "reports", "messages"] as const
export const X30_BRIEF_VISUAL_DIRECTIONS = ["professional", "ledger", "hospitality", "studio", "editorial", "technical"] as const
export const X30_BRIEF_LANGUAGES = ["en", "hu", "de", "fr", "es"] as const
export const X30_BRIEF_SENSITIVITIES = ["public", "internal", "confidential"] as const
export const X30_BRIEF_DEPLOYMENTS = ["preview-only", "future-review"] as const
export const X30_BRIEF_REVIEW_STATES = ["draft", "ready-for-review", "preview-only"] as const
export const X30_BRIEF_APPROVAL_STATES = ["not-requested", "owner-approved-preview"] as const

export type X30Brief = {
  schemaVersion: typeof X30_BRIEF_SCHEMA_VERSION
  projectName: string
  domain: typeof X30_BRIEF_DOMAINS[number]
  targetUsers: string
  primaryGoal: string
  requiredPages?: string[]
  requiredCapabilities: typeof X30_BRIEF_CAPABILITIES[number][]
  visualDirection: typeof X30_BRIEF_VISUAL_DIRECTIONS[number]
  language: typeof X30_BRIEF_LANGUAGES[number]
  dataSensitivity: typeof X30_BRIEF_SENSITIVITIES[number]
  deploymentIntent: typeof X30_BRIEF_DEPLOYMENTS[number]
  reviewState: typeof X30_BRIEF_REVIEW_STATES[number]
  approvalState: typeof X30_BRIEF_APPROVAL_STATES[number]
  executionState: "not-started"
}

export type X30BriefValidation = { ok: true; brief: X30Brief } | { ok: false; errors: string[] }
export const DEFAULT_X30_BRIEF: X30Brief = { schemaVersion: X30_BRIEF_SCHEMA_VERSION, projectName: "", domain: "professional-services", targetUsers: "", primaryGoal: "", requiredPages: [], requiredCapabilities: ["records"], visualDirection: "professional", language: "en", dataSensitivity: "internal", deploymentIntent: "preview-only", reviewState: "draft", approvalState: "not-requested", executionState: "not-started" }

const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"])
const enumSets = { domain: new Set(X30_BRIEF_DOMAINS), visualDirection: new Set(X30_BRIEF_VISUAL_DIRECTIONS), language: new Set(X30_BRIEF_LANGUAGES), dataSensitivity: new Set(X30_BRIEF_SENSITIVITIES), deploymentIntent: new Set(X30_BRIEF_DEPLOYMENTS), reviewState: new Set(X30_BRIEF_REVIEW_STATES), approvalState: new Set(X30_BRIEF_APPROVAL_STATES), capability: new Set(X30_BRIEF_CAPABILITIES) }
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
const normalize = (value: unknown): string => typeof value === "string" ? value.normalize("NFKC").trim() : ""
const bytes = (value: string): number => new TextEncoder().encode(value).byteLength

export function validateX30Brief(value: unknown): X30BriefValidation {
  const errors: string[] = []
  if (!isRecord(value)) return { ok: false, errors: ["x30.brief.invalid_type"] }
  const fields = ["schemaVersion", "projectName", "domain", "targetUsers", "primaryGoal", "requiredPages", "requiredCapabilities", "visualDirection", "language", "dataSensitivity", "deploymentIntent", "reviewState", "approvalState", "executionState"]
  for (const key of Object.keys(value)) { if (UNSAFE_KEYS.has(key)) errors.push("x30.brief.unsafe_key"); if (!fields.includes(key)) errors.push("x30.brief.unexpected_field") }
  if (value.schemaVersion !== X30_BRIEF_SCHEMA_VERSION) errors.push("x30.brief.unsupported_version")
  const strings: Array<[string, number, boolean]> = [["projectName", 80, true], ["targetUsers", 160, true], ["primaryGoal", 180, true]]
  for (const [key, max, required] of strings) { if (typeof value[key] !== "string") errors.push("x30.brief.invalid_string"); else { const text = normalize(value[key]); if (required && !text) errors.push("x30.brief.required_field"); if (text.length > max) errors.push("x30.brief.string_too_long"); if (bytes(text) > max * 4) errors.push("x30.brief.string_too_large") } }
  if (value.requiredPages !== undefined) { if (!Array.isArray(value.requiredPages)) errors.push("x30.brief.invalid_pages"); else { if (value.requiredPages.length > X30_BRIEF_MAX_PAGES) errors.push("x30.brief.pages_too_many"); const seen = new Set<string>(); for (const page of value.requiredPages) { const text = normalize(page); if (typeof page !== "string" || !text) errors.push("x30.brief.invalid_page"); else { if (text.length > 48 || bytes(text) > 192) errors.push("x30.brief.page_too_long"); if (seen.has(text.toLowerCase())) errors.push("x30.brief.duplicate_page"); seen.add(text.toLowerCase()) } } } }
  if (!Array.isArray(value.requiredCapabilities) || value.requiredCapabilities.length === 0) errors.push("x30.brief.invalid_capabilities"); else { if (value.requiredCapabilities.length > X30_BRIEF_MAX_CAPABILITIES) errors.push("x30.brief.capabilities_too_many"); const seen = new Set<string>(); for (const capability of value.requiredCapabilities) { if (typeof capability !== "string" || !(enumSets.capability as Set<string>).has(capability)) errors.push("x30.brief.invalid_capability"); else if (seen.has(capability)) errors.push("x30.brief.duplicate_capability"); else seen.add(capability) } }
  for (const [key, set] of Object.entries(enumSets).filter(([key]) => key !== "capability")) if (typeof value[key] !== "string" || (set as Set<string>).has(value[key] as string) === false) errors.push("x30.brief.invalid_enum")
  if (value.executionState !== "not-started") errors.push("x30.brief.invalid_execution_state")
  if (value.approvalState === "owner-approved-preview" && value.reviewState !== "preview-only") errors.push("x30.brief.invalid_review_state")
  try { const serialized = JSON.stringify(value); if (!serialized || bytes(serialized) > X30_BRIEF_MAX_BYTES) errors.push("x30.brief.too_large") } catch { errors.push("x30.brief.unserializable") }
  if (errors.length) return { ok: false, errors: [...new Set(errors)] }
  const brief: X30Brief = { schemaVersion: X30_BRIEF_SCHEMA_VERSION, projectName: normalize(value.projectName), domain: value.domain as X30Brief["domain"], targetUsers: normalize(value.targetUsers), primaryGoal: normalize(value.primaryGoal), requiredPages: (value.requiredPages as string[] | undefined)?.map(normalize), requiredCapabilities: [...(value.requiredCapabilities as X30Brief["requiredCapabilities"])], visualDirection: value.visualDirection as X30Brief["visualDirection"], language: value.language as X30Brief["language"], dataSensitivity: value.dataSensitivity as X30Brief["dataSensitivity"], deploymentIntent: value.deploymentIntent as X30Brief["deploymentIntent"], reviewState: value.reviewState as X30Brief["reviewState"], approvalState: value.approvalState as X30Brief["approvalState"], executionState: "not-started" }
  return { ok: true, brief }
}

const professionalDirection: VisualDirection = { industry: "Professional services", mood: "calm", density: "balanced", primaryWorkflow: "Plan and complete work", palette: "studio", surface: "structured", typography: "confident", navigation: "workspace", mobilePriority: "Current work and next action", componentPriorities: ["workflow", "activity", "result"] }
const directions: Record<X30Brief["domain"], VisualDirection> = { "professional-services": professionalDirection, other: professionalDirection, finance: { ...professionalDirection, industry: "Financial services", palette: "ledger", density: "dense", mood: "precise" }, retail: { ...professionalDirection, industry: "Retail", navigation: "catalogue" }, hospitality: { ...professionalDirection, industry: "Hospitality", palette: "hospitality", mood: "warm", navigation: "catalogue" }, health: { ...professionalDirection, industry: "Health services", mood: "calm" }, education: { ...professionalDirection, industry: "Education", palette: "editorial" }, technology: { ...professionalDirection, industry: "Technology", palette: "technical", mood: "precise", typography: "technical" } }

export type X30BriefSpecLabels = { eyebrow: string; title: string; description: string; customers: string; documents: string; expenses: string; invoices: string; records: string; schedule: string; noValue: string; plannerItem: string }
export function mapX30BriefToSpec(brief: X30Brief, labels: X30BriefSpecLabels, workspaceCounts: { customers: number; documents: number; expenses: number; invoices: number; planner: number } = { customers: 0, documents: 0, expenses: 0, invoices: 0, planner: 0 }): X30AppSpec {
  const direction = directions[brief.domain] || professionalDirection
  const count = (value: number) => Number.isInteger(value) && value >= 0 && value <= 10000 ? String(value) : "0"
  const nodes: X30AppSpec["nodes"][number][] = [
    { id: "brief-hero", type: "hero", props: { eyebrow: labels.eyebrow, title: labels.title, description: labels.description } },
    { id: "brief-customers", type: "metric", props: { label: labels.customers, value: count(workspaceCounts.customers), detail: labels.records } },
    { id: "brief-documents", type: "metric", props: { label: labels.documents, value: count(workspaceCounts.documents), detail: labels.records } },
    { id: "brief-expenses", type: "metric", props: { label: labels.expenses, value: count(workspaceCounts.expenses), detail: labels.records } },
    { id: "brief-invoices", type: "metric", props: { label: labels.invoices, value: count(workspaceCounts.invoices), detail: labels.records } },
  ]
  if (brief.requiredCapabilities.includes("schedule")) nodes.push({ id: "brief-schedule", type: "schedule", props: { title: labels.schedule, items: Array.from({ length: Math.min(workspaceCounts.planner, 8) }, (_, index) => ({ id: `brief-item-${index}`, time: labels.noValue, title: labels.plannerItem, detail: "", value: "" })) } })
  return { version: "0.1", id: "brief-preview", name: "HEGEVA X30 Preview", direction, nodes }
}
