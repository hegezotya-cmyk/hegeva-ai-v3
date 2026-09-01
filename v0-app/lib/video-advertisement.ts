/** Bounded, provider-independent video advertisement planning contract. */
export const VIDEO_BRIEF_VERSION = "0.1" as const
export const VIDEO_RESULT_VERSION = "0.1" as const

export const VIDEO_DURATIONS = [6, 15, 30, 60] as const
export const VIDEO_RATIOS = ["1:1", "4:5", "9:16", "16:9"] as const
export const VIDEO_PLATFORMS = ["instagram", "tiktok", "youtube", "linkedin", "web"] as const
export const VIDEO_STATES = ["brief-ready", "script-ready", "storyboard-ready", "provider-approval-required", "generation-disabled", "generation-queued", "provider-failure", "completed"] as const

type Literal<T extends readonly (string | number)[]> = T[number]
export type VideoDuration = Literal<typeof VIDEO_DURATIONS>
export type VideoRatio = Literal<typeof VIDEO_RATIOS>
export type VideoPlatform = Literal<typeof VIDEO_PLATFORMS>
export type VideoState = Literal<typeof VIDEO_STATES>

export interface X30VideoBrief {
  schemaVersion: typeof VIDEO_BRIEF_VERSION
  kind: "video-advertisement-brief"
  campaignBrief: string
  durationSeconds: VideoDuration
  aspectRatio: VideoRatio
  targetPlatform: VideoPlatform
  audience: string
  voiceTone: string
  scenes: readonly string[]
  productBenefits: readonly string[]
  callToAction: string
  brandColors: readonly string[]
  sourceAdvertisement?: string
}

export interface X30VideoScene {
  index: number
  startSecond: number
  endSecond: number
  shotDescription: string
  onScreenText: string
  voiceOver: string
  captions: string
  transition: string
}

export interface X30VideoResult {
  schemaVersion: typeof VIDEO_RESULT_VERSION
  kind: "video-advertisement-result"
  state: VideoState
  concept: string
  timedScript: string
  scenes: readonly X30VideoScene[]
  musicMood: string
  thumbnailConcept: string
  exportSpecification: { durationSeconds: VideoDuration; aspectRatio: VideoRatio; platform: VideoPlatform }
  executionState: "not-started"
  providerEvidence: "none" | "verified"
}

const unsafe = /<\/?[a-z][^>]*>|javascript:|data:|https?:\/\/|\b(?:eval|new\s+Function|import\s*\(|dangerouslySetInnerHTML|script|iframe|css|jsx)\b/i
const forbiddenKeys = new Set(["__proto__", "prototype", "constructor"])
const bytes = (value: string) => new TextEncoder().encode(value).byteLength
const text = (value: unknown, max: number, field: string) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max || bytes(value.trim()) > max * 4 || unsafe.test(value)) throw new Error(`video-${field}-invalid`)
  return value.trim()
}
const list = (value: unknown, maxItems: number, maxItem: number, field: string) => {
  if (!Array.isArray(value) || value.length > maxItems) throw new Error(`video-${field}-invalid`)
  const out = value.map((entry) => text(entry, maxItem, field))
  if (new Set(out.map((entry) => entry.toLowerCase())).size !== out.length) throw new Error(`video-${field}-duplicate`)
  return out
}
const ownKeysOnly = (value: Record<string, unknown>, keys: readonly string[]) => {
  for (const key of Object.keys(value)) if (forbiddenKeys.has(key) || !keys.includes(key)) throw new Error("video-unexpected-key")
}

export function validateVideoBrief(input: unknown): X30VideoBrief {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("video-brief-object-required")
  const value = input as Record<string, unknown>
  ownKeysOnly(value, ["schemaVersion", "kind", "campaignBrief", "durationSeconds", "aspectRatio", "targetPlatform", "audience", "voiceTone", "scenes", "productBenefits", "callToAction", "brandColors", "sourceAdvertisement"])
  if (value.schemaVersion !== VIDEO_BRIEF_VERSION || value.kind !== "video-advertisement-brief") throw new Error("video-brief-version-invalid")
  if (!(VIDEO_DURATIONS as readonly unknown[]).includes(value.durationSeconds)) throw new Error("video-duration-invalid")
  if (!(VIDEO_RATIOS as readonly unknown[]).includes(value.aspectRatio)) throw new Error("video-ratio-invalid")
  if (!(VIDEO_PLATFORMS as readonly unknown[]).includes(value.targetPlatform)) throw new Error("video-platform-invalid")
  return {
    schemaVersion: VIDEO_BRIEF_VERSION,
    kind: "video-advertisement-brief",
    campaignBrief: text(value.campaignBrief, 240, "campaign-brief"),
    durationSeconds: value.durationSeconds as VideoDuration,
    aspectRatio: value.aspectRatio as VideoRatio,
    targetPlatform: value.targetPlatform as VideoPlatform,
    audience: text(value.audience, 160, "audience"),
    voiceTone: text(value.voiceTone, 80, "voice-tone"),
    scenes: list(value.scenes, 8, 120, "scenes"),
    productBenefits: list(value.productBenefits, 8, 100, "benefits"),
    callToAction: text(value.callToAction, 80, "cta"),
    brandColors: list(value.brandColors, 6, 32, "colors"),
    ...(value.sourceAdvertisement === undefined ? {} : { sourceAdvertisement: text(value.sourceAdvertisement, 400, "source-advertisement") }),
  }
}

/** Deterministic storyboard only; no rendering, persistence, queue, timer, or provider call. */
export function createVideoStoryboard(brief: X30VideoBrief): X30VideoResult {
  const segment = brief.durationSeconds / Math.max(1, brief.scenes.length)
  const scenes = brief.scenes.map((description, index) => {
    const startSecond = Math.round(index * segment * 10) / 10
    const endSecond = Math.round((index + 1) * segment * 10) / 10
    const benefit = brief.productBenefits[index % brief.productBenefits.length] ?? "The core benefit"
    return { index: index + 1, startSecond, endSecond, shotDescription: description, onScreenText: benefit, voiceOver: benefit, captions: benefit, transition: index === 0 ? "fade-in" : "clean-cut" }
  })
  return {
    schemaVersion: VIDEO_RESULT_VERSION,
    kind: "video-advertisement-result",
    state: "provider-approval-required",
    concept: brief.campaignBrief,
    timedScript: scenes.map((scene) => `${scene.startSecond}-${scene.endSecond}: ${scene.voiceOver}`).join(" | "),
    scenes,
    musicMood: `${brief.voiceTone} · restrained instrumental direction`,
    thumbnailConcept: `${brief.productBenefits[0] ?? "Product"} · ${brief.targetPlatform} frame`,
    exportSpecification: { durationSeconds: brief.durationSeconds, aspectRatio: brief.aspectRatio, platform: brief.targetPlatform },
    executionState: "not-started",
    providerEvidence: "none",
  }
}
