import type { DurableMemoryRecord, MemoryAccessContext } from "@/lib/foundation/durable-memory"

export const BUSINESS_KNOWLEDGE_VERSION = 1 as const
export type BusinessKnowledgeField = "business-name"|"service"|"price"|"payment-term"|"communication-tone"|"business-rule"
export type BusinessKnowledgeItem = { id:string; field:BusinessKnowledgeField; value:string; source:"owner"|"workspace"; sourceId?:string; confidence:"explicit"|"verified"; updatedAt:string }
export type BusinessKnowledgeProfile = { version:typeof BUSINESS_KNOWLEDGE_VERSION; workspaceId:string; items:BusinessKnowledgeItem[] }

const clean=(value:unknown,max=500)=>typeof value==="string"?value.trim().slice(0,max):""
const allowed=new Set<BusinessKnowledgeField>(["business-name","service","price","payment-term","communication-tone","business-rule"])

export function buildBusinessKnowledgeProfile(input:{workspaceId:string;items:BusinessKnowledgeItem[]}):BusinessKnowledgeProfile{
 const workspaceId=clean(input.workspaceId,128)
 if(!workspaceId) throw new Error("workspace-required")
 const seen=new Set<string>(); const items:BusinessKnowledgeItem[]=[]
 for(const raw of input.items||[]){
  const field=raw?.field; const value=clean(raw?.value); const id=clean(raw?.id,160)
  if(!id||!allowed.has(field)||!value||!((raw.source==="owner"&&raw.confidence==="explicit")||(raw.source==="workspace"&&raw.confidence==="verified"))||!Number.isFinite(Date.parse(raw.updatedAt))) continue
  const key=`${field}:${value.toLowerCase()}`; if(seen.has(key)) continue; seen.add(key)
  items.push({...raw,id,value,sourceId:clean(raw.sourceId,160)||undefined})
 }
 return {version:BUSINESS_KNOWLEDGE_VERSION,workspaceId,items}
}

export function businessKnowledgeToMemory(profile:BusinessKnowledgeProfile,context:MemoryAccessContext,correlationId:string):DurableMemoryRecord{
 if(profile.workspaceId!==context.workspaceId) throw new Error("workspace-scope-mismatch")
 if(!context.permissions.includes("memory.write")) throw new Error("memory-write-forbidden")
 const now=context.now
 return {schemaVersion:1,memoryId:`business-knowledge:${profile.workspaceId}`,ownerUserId:context.userId,workspaceId:profile.workspaceId,type:"workspace",payload:profile,provenance:{source:"workspace",summary:"Explicit or verified HEGEVA business knowledge profile."},createdAt:now,updatedAt:now,retention:"workspace-lifetime",sensitivity:"internal",status:"active",version:1,correlationId}
}

export function selectBusinessKnowledge(profile:BusinessKnowledgeProfile,fields?:BusinessKnowledgeField[]){
 const filter=fields?.length?new Set(fields):null
 return profile.items.filter(item=>!filter||filter.has(item.field))
}
