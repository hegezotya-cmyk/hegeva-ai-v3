import type { ApprovalState, AuditEvent, CorrelationId } from "@/lib/foundation/contracts"

export const MEMORY_MODEL_VERSION = 1 as const
export type DurableMemoryType = "session" | "workspace" | "project-artifact" | "approved-persistent"
export type MemorySensitivity = "public" | "internal" | "personal" | "sensitive" | "prohibited"
export type MemoryStatus = "active" | "superseded" | "deleted" | "expired"
export type RetentionPolicy = "session" | "30-days" | "project-lifetime" | "workspace-lifetime" | "until-deleted"
export type MemoryWriteClass = "DO_NOT_STORE" | "SESSION_ONLY" | "PROJECT_MEMORY" | "WORKSPACE_MEMORY" | "PERSIST_IF_APPROVED"

export interface DurableMemoryRecord {
  schemaVersion: typeof MEMORY_MODEL_VERSION
  memoryId: string
  ownerUserId: string
  workspaceId: string
  projectId?: string
  artifactId?: string
  type: DurableMemoryType
  payload: unknown
  provenance: { source: "user" | "workspace" | "project" | "brain-proposal"; summary: string }
  createdAt: string
  updatedAt: string
  expiresAt?: string
  retention: RetentionPolicy
  sensitivity: MemorySensitivity
  status: MemoryStatus
  version: number
  correlationId: CorrelationId
}

export interface MemoryAccessContext {
  userId: string
  workspaceId: string
  projectIds: readonly string[]
  permissions: readonly ("memory.read" | "memory.write" | "memory.delete" | "memory.manage")[]
  persistentMemoryEnabled: boolean
  now: string
}

export interface MemoryQuery { workspaceId: string; projectId?: string; artifactId?: string; types?: readonly DurableMemoryType[]; limit?: number }
export interface DurableMemoryAdapter {
  create(record: DurableMemoryRecord): Promise<DurableMemoryRecord>
  read(memoryId: string): Promise<DurableMemoryRecord | null>
  query(query: MemoryQuery): Promise<readonly DurableMemoryRecord[]>
  update(record: DurableMemoryRecord): Promise<DurableMemoryRecord>
  delete(memoryId: string): Promise<boolean>
  purgeExpired(now: string): Promise<number>
  listByScope(workspaceId: string, projectId?: string): Promise<readonly DurableMemoryRecord[]>
}
export interface MemorySearchAdapter { search(query: string, scope: MemoryQuery): Promise<readonly { memoryId: string; relevance: number }[]> }
export interface EmbeddingAdapter { embed(text: string): Promise<readonly number[]> }
export interface MemoryAuditSink { record(event: Omit<AuditEvent,"id"|"at">): Promise<void> }

export type MemoryCandidate = Pick<DurableMemoryRecord,"payload"|"sensitivity"|"provenance"> & { requestedType?: DurableMemoryType; projectId?: string }
export function classifyMemoryCandidate(candidate: MemoryCandidate, approved: boolean): { classification: MemoryWriteClass; reason: string } {
  if (["sensitive", "prohibited"].includes(candidate.sensitivity) || containsProhibitedData(candidate.payload)) return { classification:"DO_NOT_STORE", reason:"Sensitive, credential, or payment data is ineligible for memory." }
  if (candidate.requestedType === "approved-persistent") return approved ? { classification:"PERSIST_IF_APPROVED", reason:"The owner explicitly approved durable persistence." } : { classification:"SESSION_ONLY", reason:"Persistent memory requires explicit approval." }
  if (candidate.projectId || candidate.requestedType === "project-artifact") return { classification:"PROJECT_MEMORY", reason:"The candidate belongs to a specific project or artifact." }
  if (candidate.requestedType === "workspace") return { classification:"WORKSPACE_MEMORY", reason:"The candidate is scoped to the owner workspace." }
  return { classification:"SESSION_ONLY", reason:"Conversation context is temporary by default." }
}

export class InMemoryDurableMemoryAdapter implements DurableMemoryAdapter {
  #records = new Map<string,DurableMemoryRecord>()
  async create(record: DurableMemoryRecord) { if(this.#records.has(record.memoryId)) throw new Error("memory-exists"); this.#records.set(record.memoryId,clone(record)); return clone(record) }
  async read(id:string){ const item=this.#records.get(id); return item?clone(item):null }
  async query(query:MemoryQuery){ return [...this.#records.values()].filter(item=>item.status==="active"&&item.workspaceId===query.workspaceId&&(!query.projectId||item.projectId===query.projectId)&&(!query.artifactId||item.artifactId===query.artifactId)&&(!query.types||query.types.includes(item.type))).slice(0,Math.min(Math.max(query.limit??50,0),100)).map(clone) }
  async update(record:DurableMemoryRecord){ if(!this.#records.has(record.memoryId)) throw new Error("memory-not-found"); this.#records.set(record.memoryId,clone(record)); return clone(record) }
  async delete(id:string){ return this.#records.delete(id) }
  async purgeExpired(now:string){ let count=0;for(const [id,item] of this.#records)if(item.expiresAt&&Date.parse(item.expiresAt)<=Date.parse(now)){this.#records.delete(id);count++}return count }
  async listByScope(workspaceId:string,projectId?:string){ return this.query({workspaceId,projectId}) }
}

export class MemoryService {
  constructor(private readonly adapter:DurableMemoryAdapter,private readonly audit?:MemoryAuditSink){}
  async create(record:DurableMemoryRecord,context:MemoryAccessContext,approval:ApprovalState="not-required"){
    assertAccess(record,context,"memory.write")
    validateRecord(record)
    const decision=classifyMemoryCandidate({...record,requestedType:record.type},approval==="approved")
    if(decision.classification==="DO_NOT_STORE"||!isEligible(record,decision.classification,context)){await this.emit("memory.persistence_denied",record,context);throw new Error("memory-persistence-denied")}
    if(!record.provenance.summary.trim())throw new Error("memory-provenance-required")
    const created=await this.adapter.create(record);await this.emit(record.type==="approved-persistent"?"memory.persistence_requested":"memory.created",record,context);return created
  }
  async read(id:string,context:MemoryAccessContext){const record=await this.adapter.read(id);if(!record)return null;assertAccess(record,context,"memory.read");return isExpired(record,context.now)?null:record}
  async query(query:MemoryQuery,context:MemoryAccessContext){if(query.workspaceId!==context.workspaceId)throw new Error("memory-workspace-denied");const records=await this.adapter.query(query);return records.filter(record=>canAccess(record,context,"memory.read")&&!isExpired(record,context.now))}
  async update(record:DurableMemoryRecord,context:MemoryAccessContext,approval:ApprovalState="not-required"){assertAccess(record,context,"memory.write");validateRecord(record);const existing=await this.read(record.memoryId,context);if(!existing)throw new Error("memory-not-found");if(record.ownerUserId!==existing.ownerUserId||record.workspaceId!==existing.workspaceId||record.projectId!==existing.projectId||record.createdAt!==existing.createdAt)throw new Error("memory-scope-immutable");const decision=classifyMemoryCandidate({...record,requestedType:record.type},approval==="approved");if(decision.classification==="DO_NOT_STORE"||!isEligible(record,decision.classification,context)){await this.emit("memory.persistence_denied",record,context);throw new Error("memory-persistence-denied")}const updated={...record,version:existing.version+1,updatedAt:context.now};await this.adapter.update(updated);await this.emit("memory.updated",updated,context);return updated}
  async delete(id:string,context:MemoryAccessContext){const record=await this.read(id,context);if(!record)return false;if(!context.permissions.includes("memory.delete"))throw new Error("memory-permission-denied");const deleted=await this.adapter.delete(id);if(deleted)await this.emit("memory.deleted",record,context);return deleted}
  async purgeExpired(context:MemoryAccessContext){if(!context.permissions.includes("memory.manage"))throw new Error("memory-permission-denied");return this.adapter.purgeExpired(context.now)}
  private async emit(action:string,record:DurableMemoryRecord,context:MemoryAccessContext){await this.audit?.record({correlationId:record.correlationId,actor:{id:context.userId,kind:"user"},action,resource:{id:record.memoryId,kind:"memory",version:record.version},outcome:action.endsWith("denied")?"denied":"completed",summary:`${record.type} memory operation`})}
}

export class BrainMemoryGateway {
  constructor(private readonly memory:MemoryService){}
  readAllowed(query:MemoryQuery,context:MemoryAccessContext){return this.memory.query(query,context)}
  propose(candidate:MemoryCandidate,approved=false){return classifyMemoryCandidate({...candidate,provenance:{...candidate.provenance,source:"brain-proposal"}},approved)}
  persistApproved(record:DurableMemoryRecord,context:MemoryAccessContext,approval:ApprovalState){if(approval!=="approved")throw new Error("memory-persistence-denied");return this.memory.create({...record,provenance:{...record.provenance,source:"brain-proposal"}},context,approval)}
}

function assertAccess(record:DurableMemoryRecord,context:MemoryAccessContext,permission:MemoryAccessContext["permissions"][number]){if(!canAccess(record,context,permission))throw new Error(record.ownerUserId!==context.userId?"memory-owner-denied":record.workspaceId!==context.workspaceId?"memory-workspace-denied":"memory-permission-denied")}
function canAccess(record:DurableMemoryRecord,context:MemoryAccessContext,permission:MemoryAccessContext["permissions"][number]){return record.ownerUserId===context.userId&&record.workspaceId===context.workspaceId&&(!record.projectId||context.projectIds.includes(record.projectId))&&context.permissions.includes(permission)}
function isEligible(record:DurableMemoryRecord,classification:MemoryWriteClass,context:MemoryAccessContext){if(record.type==="session")return classification==="SESSION_ONLY"&&record.retention==="session";if(record.type==="project-artifact")return classification==="PROJECT_MEMORY"&&Boolean(record.projectId);if(record.type==="workspace")return classification==="WORKSPACE_MEMORY";return classification==="PERSIST_IF_APPROVED"&&context.persistentMemoryEnabled&&record.retention==="until-deleted"}
function validateRecord(record:DurableMemoryRecord){if(!record.memoryId.trim()||!record.ownerUserId.trim()||!record.workspaceId.trim()||!record.correlationId.trim())throw new Error("memory-identity-required");if(!record.provenance.summary.trim())throw new Error("memory-provenance-required");if(record.schemaVersion!==MEMORY_MODEL_VERSION||record.status!=="active"||!Number.isInteger(record.version)||record.version<1)throw new Error("memory-record-invalid");for(const value of [record.createdAt,record.updatedAt,record.expiresAt].filter(Boolean) as string[])if(!Number.isFinite(Date.parse(value)))throw new Error("memory-timestamp-invalid")}
function isExpired(record:DurableMemoryRecord,now:string){return Boolean(record.expiresAt&&Date.parse(record.expiresAt)<=Date.parse(now))}
function containsProhibitedData(value:unknown){try{const text=JSON.stringify(value).toLowerCase();return /(?:password|api[_ -]?key|secret|bearer token|access[_ -]?token|refresh[_ -]?token|card number|cvv|cvc)/.test(text)}catch{return true}}
function clone<T>(value:T):T{return structuredClone(value)}
