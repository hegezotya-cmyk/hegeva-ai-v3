import type { VisualDirection } from "@/lib/x30/domain-visual-intelligence"

export const X30_SCHEMA_VERSION = "0.1" as const
export type X30ComponentType = "hero" | "metric" | "schedule" | "service-list" | "pet-list" | "action"
export type X30Node = { id:string; type:X30ComponentType; props:Record<string, unknown> }
export type X30AppSpec = { version:typeof X30_SCHEMA_VERSION; id:string; name:string; direction:VisualDirection; nodes:readonly X30Node[] }

const allowed = new Set<X30ComponentType>(["hero","metric","schedule","service-list","pet-list","action"])
const propAllowlist: Record<X30ComponentType, readonly string[]> = {
  hero:["eyebrow","title","description"], metric:["label","value","detail"], schedule:["title","items"],
  "service-list":["title","items"], "pet-list":["title","items"], action:["label","hint"],
}

export function validateX30Spec(value: unknown): { ok:true; spec:X30AppSpec } | { ok:false; errors:string[] } {
  const errors:string[]=[]
  if (!value || typeof value!=="object") return {ok:false,errors:["Specification must be an object."]}
  const input=value as Partial<X30AppSpec>
  if (input.version!==X30_SCHEMA_VERSION) errors.push("Unsupported specification version.")
  if (typeof input.id!=="string" || !/^[a-z0-9-]{3,48}$/.test(input.id)) errors.push("Invalid application id.")
  if (typeof input.name!=="string" || input.name.length<2 || input.name.length>60) errors.push("Invalid application name.")
  if (!input.direction || typeof input.direction!=="object") errors.push("Visual direction is required.")
  if (!Array.isArray(input.nodes) || input.nodes.length===0 || input.nodes.length>24) errors.push("Components must contain 1–24 nodes.")
  else input.nodes.forEach((node,index)=>{
    if (!node || typeof node!=="object") { errors.push(`Node ${index} is invalid.`); return }
    if (!allowed.has(node.type)) errors.push(`Unknown component at node ${index}.`)
    if (typeof node.id!=="string" || !/^[a-z0-9-]{2,48}$/.test(node.id)) errors.push(`Invalid id at node ${index}.`)
    if (!node.props || typeof node.props!=="object" || Array.isArray(node.props)) errors.push(`Invalid props at node ${index}.`)
    else if (allowed.has(node.type)) {
      const componentType=node.type as X30ComponentType
      Object.keys(node.props).forEach((key)=>{ if(!propAllowlist[componentType].includes(key)) errors.push(`Unsafe prop ${key} at node ${index}.`) })
    }
  })
  return errors.length ? {ok:false,errors} : {ok:true,spec:input as X30AppSpec}
}
