import type { VisualDirection } from "@/lib/x30/domain-visual-intelligence"

export const X30_SCHEMA_VERSION = "0.1" as const
export type X30ComponentType = "hero" | "metric" | "schedule" | "service-list" | "pet-list" | "action"
export type X30Node = { id: string; type: X30ComponentType; props: Record<string, unknown> }
export type X30AppSpec = { version: typeof X30_SCHEMA_VERSION; id: string; name: string; direction: VisualDirection; nodes: readonly X30Node[] }

const allowed = new Set<X30ComponentType>(["hero", "metric", "schedule", "service-list", "pet-list", "action"])
const propAllowlist: Record<X30ComponentType, readonly string[]> = {
  hero: ["eyebrow", "title", "description"],
  metric: ["label", "value", "detail"],
  schedule: ["title", "items"],
  "service-list": ["title", "items"],
  "pet-list": ["title", "items"],
  action: ["label", "hint"],
}
const directionValues = {
  mood: ["warm", "precise", "energetic", "calm", "elegant", "direct"],
  density: ["relaxed", "balanced", "dense"],
  palette: ["meadow", "ledger", "hospitality", "studio", "editorial", "industrial", "technical"],
  surface: ["soft", "structured", "editorial"],
  typography: ["friendly", "technical", "confident"],
  navigation: ["workflow", "workspace", "catalogue"],
} as const

export function validateX30Spec(value: unknown): { ok: true; spec: X30AppSpec } | { ok: false; errors: string[] } {
  const errors: string[] = []
  if (!isPlainObject(value)) return { ok: false, errors: ["Specification must be a plain object."] }
  const input = value as Partial<X30AppSpec>
  if (input.version !== X30_SCHEMA_VERSION) errors.push("Unsupported specification version.")
  if (typeof input.id !== "string" || !/^[a-z0-9-]{3,48}$/.test(input.id)) errors.push("Invalid application id.")
  if (typeof input.name !== "string" || input.name.trim().length < 2 || input.name.length > 60) errors.push("Invalid application name.")
  validateDirection(input.direction, errors)
  if (!Array.isArray(input.nodes) || input.nodes.length === 0 || input.nodes.length > 24) errors.push("Components must contain 1–24 nodes.")
  else {
    const ids = new Set<string>()
    input.nodes.forEach((node, index) => {
      if (!isPlainObject(node)) { errors.push(`Node ${index} is invalid.`); return }
      if (!allowed.has(node.type)) errors.push(`Unknown component at node ${index}.`)
      if (typeof node.id !== "string" || !/^[a-z0-9-]{2,48}$/.test(node.id)) errors.push(`Invalid id at node ${index}.`)
      else if (ids.has(node.id)) errors.push(`Duplicate id at node ${index}.`)
      else ids.add(node.id)
      if (!isPlainObject(node.props)) errors.push(`Invalid props at node ${index}.`)
      else if (allowed.has(node.type)) {
        const componentType = node.type as X30ComponentType
        Object.keys(node.props).forEach((key) => { if (!propAllowlist[componentType].includes(key)) errors.push(`Unsafe prop ${key} at node ${index}.`) })
        if (!isBoundedJson(node.props)) errors.push(`Props at node ${index} must be bounded JSON data.`)
      }
    })
  }
  return errors.length ? { ok: false, errors } : { ok: true, spec: input as X30AppSpec }
}

function validateDirection(value: unknown, errors: string[]) {
  if (!isPlainObject(value)) { errors.push("Visual direction is required."); return }
  for (const key of ["industry", "primaryWorkflow", "mobilePriority"] as const) if (typeof value[key] !== "string" || !value[key].trim() || value[key].length > 120) errors.push(`Invalid visual direction ${key}.`)
  for (const [key, values] of Object.entries(directionValues)) if (typeof value[key] !== "string" || !(values as readonly string[]).includes(value[key] as string)) errors.push(`Invalid visual direction ${key}.`)
  if (!Array.isArray(value.componentPriorities) || value.componentPriorities.length > 12 || !value.componentPriorities.every((item) => typeof item === "string" && item.length > 0 && item.length <= 80)) errors.push("Invalid visual direction component priorities.")
}

function isPlainObject(value: unknown): value is Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isBoundedJson(value: unknown, depth = 0): boolean {
  if (depth > 5) return false
  if (value === null || typeof value === "boolean" || typeof value === "number") return typeof value !== "number" || Number.isFinite(value)
  if (typeof value === "string") return value.length <= 2_000
  if (Array.isArray(value)) return value.length <= 50 && value.every((item) => isBoundedJson(item, depth + 1))
  if (!isPlainObject(value)) return false
  const entries = Object.entries(value)
  return entries.length <= 30 && entries.every(([key, item]) => !["__proto__", "prototype", "constructor"].includes(key) && key.length <= 80 && isBoundedJson(item, depth + 1))
}
