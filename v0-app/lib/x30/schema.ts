import type { VisualDirection } from "@/lib/x30/domain-visual-intelligence"

export const X30_SCHEMA_VERSION = "0.1" as const
export const X30_SPEC_MAX_BYTES = 256 * 1024
const MAX_STRING_LENGTH = 180
const MAX_ARRAY_LENGTH = 24
const MAX_NODE_COUNT = 24
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"])
const ALIGNMENTS = new Set(["left", "center", "right", "split"])
const VARIANTS = new Set(["default", "soft", "accent", "compact", "primary", "secondary"])
const MOODS = new Set(["warm", "precise", "energetic", "calm", "elegant", "direct"])
const DENSITIES = new Set(["relaxed", "balanced", "dense"])
const PALETTES = new Set(["meadow", "ledger", "hospitality", "studio", "editorial", "industrial", "technical"])
const SURFACES = new Set(["soft", "structured", "editorial"])
const TYPOGRAPHIES = new Set(["friendly", "technical", "confident"])
const NAVIGATIONS = new Set(["workflow", "workspace", "catalogue"])

export type X30ComponentType = "hero" | "metric" | "schedule" | "service-list" | "pet-list" | "action"
export type X30Node = { id:string; type:X30ComponentType; props:Record<string, unknown> }
export type X30AppSpec = { version:typeof X30_SCHEMA_VERSION; id:string; name:string; direction:VisualDirection & { alignment?: string; variant?: string }; nodes:readonly X30Node[] }

const allowed = new Set<X30ComponentType>(["hero","metric","schedule","service-list","pet-list","action"])
const propAllowlist: Record<X30ComponentType, readonly string[]> = {
  hero:["eyebrow","title","description","alignment","variant"], metric:["label","value","detail","alignment","variant"], schedule:["title","items","alignment","variant"],
  "service-list":["title","items","alignment","variant"], "pet-list":["title","items","alignment","variant"], action:["label","hint","alignment","variant"],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function addValueErrors(value: unknown, errors: string[], nestedIds: Set<string>, depth = 0): void {
  if (depth > 8) { errors.push("x30.max_depth"); return }
  if (value === null || value === undefined || typeof value === "boolean") return
  if (typeof value === "string") { if (value.length > MAX_STRING_LENGTH) errors.push("x30.string_too_long"); return }
  if (typeof value === "number") { if (!Number.isFinite(value)) errors.push("x30.invalid_number"); return }
  if (typeof value !== "object") { errors.push("x30.invalid_type"); return }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LENGTH) errors.push("x30.array_too_large")
    value.forEach((item) => addValueErrors(item, errors, nestedIds, depth + 1))
    return
  }
  if (!isRecord(value)) { errors.push("x30.invalid_object"); return }
  const keys = Object.keys(value)
  if (keys.length > MAX_ARRAY_LENGTH) errors.push("x30.object_too_large")
  for (const key of keys) {
    if (UNSAFE_KEYS.has(key)) errors.push("x30.unsafe_key")
    if (key === "id") {
      if (typeof value[key] !== "string" || !/^[a-z0-9-]{2,48}$/.test(value[key])) errors.push("x30.invalid_nested_id")
      else if (nestedIds.has(value[key])) errors.push("x30.duplicate_nested_id")
      else nestedIds.add(value[key])
    }
    addValueErrors(value[key], errors, nestedIds, depth + 1)
  }
}

function validateDirection(value: unknown, errors: string[]) {
  if (!isRecord(value)) { errors.push("x30.invalid_direction"); return }
  const allowedFields = new Set(["industry", "mood", "density", "primaryWorkflow", "palette", "surface", "typography", "navigation", "mobilePriority", "componentPriorities", "alignment", "variant"])
  for (const key of Object.keys(value)) if (UNSAFE_KEYS.has(key) || !allowedFields.has(key)) errors.push("x30.unsafe_direction_field")
  for (const field of ["industry", "mood", "density", "primaryWorkflow", "palette", "surface", "typography", "navigation", "mobilePriority"]) {
    if (typeof value[field] !== "string" || !value[field]) errors.push("x30.invalid_direction_field")
  }
  const enumFields: Record<string, Set<string>> = { mood: MOODS, density: DENSITIES, palette: PALETTES, surface: SURFACES, typography: TYPOGRAPHIES, navigation: NAVIGATIONS, alignment: ALIGNMENTS, variant: VARIANTS }
  for (const [field, values] of Object.entries(enumFields)) {
    if (value[field] !== undefined && (typeof value[field] !== "string" || !values.has(value[field]))) errors.push("x30.invalid_direction_field")
  }
  addValueErrors(value, errors, new Set())
}

export function validateX30Spec(value: unknown): { ok:true; spec:X30AppSpec } | { ok:false; errors:string[] } {
  const errors:string[]=[]
  if (!isRecord(value)) return {ok:false,errors:["x30.invalid_type"]}
  if (value.version !== X30_SCHEMA_VERSION) errors.push("x30.unsupported_version")
  if (typeof value.id !== "string" || !/^[a-z0-9-]{3,48}$/.test(value.id)) errors.push("x30.invalid_application_id")
  if (typeof value.name !== "string" || value.name.length < 2 || value.name.length > 60) errors.push("x30.invalid_application_name")
  validateDirection(value.direction, errors)
  if (!Array.isArray(value.nodes) || value.nodes.length === 0 || value.nodes.length > MAX_NODE_COUNT) errors.push("x30.invalid_node_count")
  else {
    const nodeIds = new Set<string>(), nestedIds = new Set<string>()
    value.nodes.forEach((node)=>{
      if (!isRecord(node)) { errors.push("x30.invalid_node"); return }
      if (typeof node.type !== "string" || !allowed.has(node.type as X30ComponentType)) errors.push("x30.unknown_component")
      if (typeof node.id !== "string" || !/^[a-z0-9-]{2,48}$/.test(node.id)) errors.push("x30.invalid_node_id")
      else if (nodeIds.has(node.id)) errors.push("x30.duplicate_node_id")
      else nodeIds.add(node.id)
      if (!isRecord(node.props)) errors.push("x30.invalid_props")
      else if (allowed.has(node.type as X30ComponentType)) {
        const componentType=node.type as X30ComponentType
        const props = node.props as Record<string, unknown>
        Object.keys(props).forEach((key)=>{
          if (UNSAFE_KEYS.has(key) || !propAllowlist[componentType].includes(key)) errors.push("x30.unsafe_prop")
          if ((key === "alignment" && (typeof props[key] !== "string" || !ALIGNMENTS.has(props[key]))) || (key === "variant" && (typeof props[key] !== "string" || !VARIANTS.has(props[key])))) errors.push("x30.invalid_variant_or_alignment")
          if (key !== "items" && key !== "alignment" && key !== "variant" && (typeof props[key] !== "string" || props[key].length > MAX_STRING_LENGTH)) errors.push("x30.invalid_prop_value")
        })
        if (Array.isArray(props.items) && props.items.length > 8) errors.push("x30.item_count_exceeded")
      }
      addValueErrors(node.props, errors, nestedIds)
    })
  }
  try {
    const serialized = JSON.stringify(value)
    if (!serialized || new TextEncoder().encode(serialized).byteLength > X30_SPEC_MAX_BYTES) errors.push("x30.spec_too_large")
  } catch { errors.push("x30.unserializable") }
  return errors.length ? {ok:false,errors:[...new Set(errors)]} : {ok:true,spec:value as X30AppSpec}
}
