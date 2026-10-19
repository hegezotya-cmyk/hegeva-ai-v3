export const BOT_SCHEMA_VERSION = "0.1" as const
export const BOT_TOOLS = ["none", "workspace-summary", "assistant-handoff"] as const
export type BotTool = (typeof BOT_TOOLS)[number]
export const BOT_EXECUTION_STATES = ["not-started", "awaiting-approval", "running", "completed", "failed", "cancelled"] as const
export type BotExecutionState = (typeof BOT_EXECUTION_STATES)[number]
export const BOT_FAILURE_CODES = ["provider-disabled", "approval-required", "quota-exceeded", "timeout", "rejected", "cancelled"] as const
export type BotFailureCode = (typeof BOT_FAILURE_CODES)[number]
export type AIBotProvider = "disabled" | "workers-ai" | "external"
// Provider-neutral adapter boundary: production adapters must implement this shape without changing the UI contract.
export type AIBotAdapterRequest = { schemaVersion: typeof BOT_SCHEMA_VERSION; operationId: string; profileId: string; input: string; locale: "en" | "hu" | "de" | "fr" | "es"; tools: BotTool[] }
export type AIBotAdapterResult = { schemaVersion: typeof BOT_SCHEMA_VERSION; status: "ready-for-review" | "rejected"; output?: string; failureCode?: BotFailureCode; provider: AIBotProvider; executionState: "not-started" }
export type AIBotToolDefinition = { id: BotTool; labelKey: string; requiresApproval: boolean; enabled: boolean }
export const AI_BOT_TOOL_REGISTRY: readonly AIBotToolDefinition[] = [
  { id: "none", labelKey: "tools.none", requiresApproval: false, enabled: true },
  { id: "workspace-summary", labelKey: "tools.workspaceSummary", requiresApproval: true, enabled: false },
  { id: "assistant-handoff", labelKey: "tools.assistantHandoff", requiresApproval: true, enabled: false },
]
export type AIBotExecutionRecord = { id: string; profileId: string; operationId: string; state: BotExecutionState; failureCode?: BotFailureCode; attemptNumber: 0 | 1; createdAt: string; finishedAt?: string }
export type AIBotPromptVersion = { id: string; version: number; instructions: string; createdAt: string; active: boolean }
export type AIBotKnowledgeSource = { id: string; kind: "workspace-summary" | "user-note"; label: string; enabled: boolean }
export type AIBotQuotaSnapshot = { dailyUsed: number; dailyLimit: number; periodUsed: number; periodLimit: number; remainingDaily: number; remainingPeriod: number }
export type AIBotProfile = { id: string; schemaVersion: typeof BOT_SCHEMA_VERSION; name: string; purpose: string; instructions: string; knowledgeScope: string; permittedTools: BotTool[]; enabled: boolean; approvalState: "not-requested" | "owner-approved"; executionState: "not-started"; approvedAt: string | null; approvalExpiresAt: string | null; approvedByActorHash: string | null; approvalVersion: number; approvalRevision: string | null; createdAt: string; updatedAt: string }
const LIMITS = { name: 80, purpose: 240, instructions: 1200, knowledgeScope: 240 } as const
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"])
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/
const MAX_INPUT = 4000
const MAX_OUTPUT = 12000
const BOT_LOCALES = ["en", "hu", "de", "fr", "es"] as const
const unsafeContent = /<\/?[a-z][^>]*>|(?:javascript|data|https?):\/\/|\b(?:eval|new\s+Function|import\s*\(|dangerouslySetInnerHTML|tool\s*call|deploy|execute\s+code)\b/i
export function redactAIBotDiagnostics(value: unknown): string { return typeof value === "string" ? value.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted]").replace(/Bearer\s+\S+/gi, "Bearer [redacted]").slice(0, 160) : "[redacted]" }
export function validateAIBotAdapterRequest(value: unknown): { ok: true; value: AIBotAdapterRequest } | { ok: false; code: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, code: "REQUEST_NOT_OBJECT" }
  const record = value as Record<string, unknown>; const required = ["schemaVersion", "operationId", "profileId", "input", "locale", "tools"]
  if (Object.keys(record).some((key) => UNSAFE_KEYS.has(key) || !required.includes(key)) || required.some((key) => !(key in record))) return { ok: false, code: "REQUEST_KEYS_INVALID" }
  if (record.schemaVersion !== BOT_SCHEMA_VERSION || typeof record.operationId !== "string" || !SAFE_ID.test(record.operationId) || typeof record.profileId !== "string" || !SAFE_ID.test(record.profileId)) return { ok: false, code: "REQUEST_ID_INVALID" }
  if (typeof record.input !== "string" || !record.input.trim() || record.input.length > MAX_INPUT || unsafeContent.test(record.input)) return { ok: false, code: "REQUEST_INPUT_INVALID" }
  if (!BOT_LOCALES.includes(record.locale as (typeof BOT_LOCALES)[number]) || !Array.isArray(record.tools) || record.tools.some((tool) => !BOT_TOOLS.includes(tool as BotTool))) return { ok: false, code: "REQUEST_SCOPE_INVALID" }
  return { ok: true, value: record as AIBotAdapterRequest }
}
export function validateAIBotAdapterResult(value: unknown): { ok: true; value: AIBotAdapterResult } | { ok: false; code: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, code: "RESULT_NOT_OBJECT" }
  const record = value as Record<string, unknown>; const required = ["schemaVersion", "status", "provider", "executionState"]
  if (Object.keys(record).some((key) => UNSAFE_KEYS.has(key) || ![...required, "output", "failureCode"].includes(key)) || required.some((key) => !(key in record))) return { ok: false, code: "RESULT_KEYS_INVALID" }
  if (record.schemaVersion !== BOT_SCHEMA_VERSION || !["ready-for-review", "rejected"].includes(record.status as string) || !["disabled", "workers-ai", "external"].includes(record.provider as string) || record.executionState !== "not-started") return { ok: false, code: "RESULT_STATE_INVALID" }
  if (record.status === "ready-for-review" && (typeof record.output !== "string" || !record.output || record.output.length > MAX_OUTPUT || unsafeContent.test(record.output))) return { ok: false, code: "RESULT_OUTPUT_INVALID" }
  if (record.status === "rejected" && !BOT_FAILURE_CODES.includes(record.failureCode as BotFailureCode)) return { ok: false, code: "RESULT_FAILURE_INVALID" }
  return { ok: true, value: record as AIBotAdapterResult }
}
export function createDisabledAIBotAdapter(): { generate: (request: AIBotAdapterRequest) => AIBotAdapterResult } { return { generate: () => ({ schemaVersion: BOT_SCHEMA_VERSION, status: "rejected", failureCode: "provider-disabled", provider: "disabled", executionState: "not-started" }) } }
export function validateAIBotProfile(value: unknown): { ok: true; value: AIBotProfile } | { ok: false; code: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, code: "PROFILE_NOT_OBJECT" }
  const record = value as Record<string, unknown>; const keys = Object.keys(record); const required = ["id", "schemaVersion", "name", "purpose", "instructions", "knowledgeScope", "permittedTools", "enabled", "approvalState", "executionState", "approvedAt", "approvalExpiresAt", "approvedByActorHash", "approvalVersion", "approvalRevision", "createdAt", "updatedAt"]
  if (keys.some((key) => UNSAFE_KEYS.has(key)) || keys.some((key) => !required.includes(key)) || required.some((key) => !(key in record))) return { ok: false, code: "UNKNOWN_OR_MISSING_FIELD" }
  if (record.schemaVersion !== BOT_SCHEMA_VERSION || record.executionState !== "not-started") return { ok: false, code: "VERSION_OR_EXECUTION_INVALID" }
  for (const key of ["id", "name", "purpose", "instructions", "knowledgeScope", "createdAt", "updatedAt"]) if (typeof record[key] !== "string" || !record[key].trim()) return { ok: false, code: "STRING_REQUIRED" }
  for (const [key, limit] of Object.entries(LIMITS)) if ((record[key] as string).trim().length > limit) return { ok: false, code: "TEXT_LIMIT" }
  if (typeof record.enabled !== "boolean" || !["not-requested", "owner-approved"].includes(record.approvalState as string)) return { ok: false, code: "STATE_INVALID" }
  if (!Number.isSafeInteger(record.approvalVersion) || Number(record.approvalVersion) < 1) return { ok: false, code: "APPROVAL_VERSION_INVALID" }
  for (const key of ["approvedAt", "approvalExpiresAt"]) if (record[key] !== null && (typeof record[key] !== "string" || !Number.isFinite(Date.parse(record[key] as string)))) return { ok: false, code: "APPROVAL_TIMESTAMP_INVALID" }
  if (record.approvalState === "owner-approved" && (typeof record.approvedAt !== "string" || typeof record.approvalExpiresAt !== "string" || typeof record.approvedByActorHash !== "string" || Date.parse(record.approvalExpiresAt) <= Date.parse(record.approvedAt))) return { ok: false, code: "APPROVAL_EXPIRED_OR_MISSING" }
  if (record.approvedByActorHash !== null && (typeof record.approvedByActorHash !== "string" || record.approvedByActorHash.length > 128)) return { ok: false, code: "APPROVAL_ACTOR_INVALID" }
  if (record.approvalRevision !== null && (typeof record.approvalRevision !== "string" || !record.approvalRevision.trim() || record.approvalRevision.length > 128)) return { ok: false, code: "APPROVAL_REVISION_INVALID" }
  if (!Array.isArray(record.permittedTools) || record.permittedTools.length > BOT_TOOLS.length || new Set(record.permittedTools).size !== record.permittedTools.length || record.permittedTools.some((tool) => !BOT_TOOLS.includes(tool as BotTool))) return { ok: false, code: "TOOLS_INVALID" }
  return { ok: true, value: record as AIBotProfile }
}
export function createAIBotProfile(input: Pick<AIBotProfile, "name" | "purpose" | "instructions" | "knowledgeScope" | "permittedTools">): AIBotProfile { const now = new Date().toISOString(); return { ...input, id: `bot-${crypto.randomUUID()}`, schemaVersion: BOT_SCHEMA_VERSION, enabled: false, approvalState: "not-requested", executionState: "not-started", approvedAt: null, approvalExpiresAt: null, approvedByActorHash: null, approvalVersion: 1, approvalRevision: null, createdAt: now, updatedAt: now } }
