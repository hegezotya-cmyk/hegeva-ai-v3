/** Bounded advertising workflow contracts. Provider output is intentionally absent until separately enabled. */
export const ADVERTISING_VERSION = "0.1" as const
export const ADVERTISING_CHANNELS = ["website", "email", "instagram", "facebook", "linkedin", "tiktok", "search"] as const
export const ADVERTISING_LANGUAGES = ["en", "hu", "de", "fr", "es"] as const
export const ADVERTISING_STATES = ["draft", "ready-for-review", "provider-approval-required", "provider-unavailable", "rejected"] as const
type Value<T extends readonly string[]> = T[number]
export type AdvertisingChannel = Value<typeof ADVERTISING_CHANNELS>
export type AdvertisingLanguage = Value<typeof ADVERTISING_LANGUAGES>
export type AdvertisingState = Value<typeof ADVERTISING_STATES>

export interface AdvertisingBrief {
  schemaVersion: typeof ADVERTISING_VERSION
  kind: "advertisement-improver-brief" | "advertisement-creator-brief"
  advertisementText?: string
  productOrService: string
  targetAudience: string
  campaignObjective: string
  channel: AdvertisingChannel
  sourceUrl?: string
  offer?: string
  callToAction?: string
  mediaDescription?: string
  tone?: string
  keyBenefits?: readonly string[]
  restrictions?: readonly string[]
  language: AdvertisingLanguage
}

export interface AdvertisingWorkflowResult {
  schemaVersion: typeof ADVERTISING_VERSION
  kind: "advertisement-workflow-result"
  state: AdvertisingState
  executionState: "not-started"
  providerEvidence: "none"
  brief: AdvertisingBrief
}

const unsafe = /<\/?[a-z][^>]*>|javascript:|data:|\b(?:eval|new\s+Function|import\s*\(|dangerouslySetInnerHTML|script|iframe|style|jsx)\b/i
const forbidden = new Set(["__proto__", "prototype", "constructor"])
const bytes = (value: string) => new TextEncoder().encode(value).byteLength
function text(value: unknown, max: number, field: string, optional = false) {
  if (value === undefined && optional) return undefined
  if (typeof value !== "string") throw new Error(`advertising-${field}-type`)
  const clean = value.trim()
  if (!clean && optional) return undefined
  if (!clean || clean.length > max || bytes(clean) > max * 4 || unsafe.test(clean)) throw new Error(`advertising-${field}-invalid`)
  return clean
}
function list(value: unknown, maxItems: number, maxItem: number, field: string) {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.length > maxItems) throw new Error(`advertising-${field}-invalid`)
  const result = value.map((entry) => text(entry, maxItem, field) as string)
  if (new Set(result.map((entry) => entry.toLocaleLowerCase())).size !== result.length) throw new Error(`advertising-${field}-duplicate`)
  return result
}
function keys(value: Record<string, unknown>, allowed: readonly string[]) {
  for (const key of Object.keys(value)) if (forbidden.has(key) || !allowed.includes(key)) throw new Error("advertising-unexpected-key")
}
function sourceUrl(value: unknown) {
  if (value === undefined) return undefined
  if (typeof value !== "string" || value.length > 300 || bytes(value.trim()) > 1200) throw new Error("advertising-source-url-invalid")
  const clean = value.trim()
  try {
    const url = new URL(clean)
    if (url.protocol !== "https:" || unsafe.test(clean)) throw new Error("invalid")
  } catch { throw new Error("advertising-source-url-invalid") }
  return clean
}

export function validateAdvertisingBrief(input: unknown): AdvertisingBrief {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("advertising-brief-object")
  const value = input as Record<string, unknown>
  keys(value, ["schemaVersion", "kind", "advertisementText", "productOrService", "targetAudience", "campaignObjective", "channel", "sourceUrl", "offer", "callToAction", "mediaDescription", "tone", "keyBenefits", "restrictions", "language"])
  if (value.schemaVersion !== ADVERTISING_VERSION || value.kind !== "advertisement-improver-brief" && value.kind !== "advertisement-creator-brief") throw new Error("advertising-version-invalid")
  if (!(ADVERTISING_CHANNELS as readonly unknown[]).includes(value.channel)) throw new Error("advertising-channel-invalid")
  if (!(ADVERTISING_LANGUAGES as readonly unknown[]).includes(value.language)) throw new Error("advertising-language-invalid")
  const advertisementText = text(value.advertisementText, 1200, "advertisement-text", true)
  if (value.kind === "advertisement-improver-brief" && !advertisementText) throw new Error("advertising-advertisement-text-required")
  const brief: AdvertisingBrief = {
    schemaVersion: ADVERTISING_VERSION,
    kind: value.kind,
    productOrService: text(value.productOrService, 160, "product") as string,
    targetAudience: text(value.targetAudience, 160, "audience") as string,
    campaignObjective: text(value.campaignObjective, 160, "objective") as string,
    channel: value.channel as AdvertisingChannel,
    language: value.language as AdvertisingLanguage,
    ...(advertisementText ? { advertisementText } : {}),
    ...(sourceUrl(value.sourceUrl) ? { sourceUrl: sourceUrl(value.sourceUrl) } : {}),
  }
  for (const [key, max] of [["advertisementText", 1200], ["offer", 240], ["callToAction", 120], ["mediaDescription", 300], ["tone", 80]] as const) {
    const result = text(value[key], max, key, true)
    if (result) (brief as unknown as Record<string, unknown>)[key] = result
  }
  for (const [key, max] of [["keyBenefits", 100], ["restrictions", 100]] as const) {
    const result = list(value[key], 8, max, key)
    if (result) (brief as unknown as Record<string, unknown>)[key] = result
  }
  return brief
}

/** Validated brief only; never claims an improvement or campaign was generated. */
export function prepareAdvertisingWorkflow(brief: AdvertisingBrief): AdvertisingWorkflowResult {
  return { schemaVersion: ADVERTISING_VERSION, kind: "advertisement-workflow-result", state: "provider-approval-required", executionState: "not-started", providerEvidence: "none", brief }
}
