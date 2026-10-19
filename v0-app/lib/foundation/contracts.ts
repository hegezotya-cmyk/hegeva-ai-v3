export type EntityId = string
export type CorrelationId = string

export type Permission = "read" | "write" | "execute" | "approve" | "publish"
export type ApprovalState = "not-required" | "pending" | "approved" | "rejected"
export type JobState = "queued" | "planning" | "working" | "checking" | "completed" | "failed" | "cancelled"

export interface ActorRef { id: EntityId; kind: "user" | "system" | "agent"; label?: string }
export interface ResourceRef { id: EntityId; kind: string; version?: number }
export interface AuditEvent {
  id: EntityId
  correlationId: CorrelationId
  at: string
  actor: ActorRef
  action: string
  resource?: ResourceRef
  outcome: "accepted" | "completed" | "denied" | "failed"
  summary: string
}

export interface UsageEntry {
  id: EntityId
  correlationId: CorrelationId
  at: string
  ownerId: EntityId
  meter: "model-input" | "model-output" | "tool" | "storage" | "media"
  quantity: number
  unit: string
  source: ResourceRef
}

export interface StructuredError {
  code: string
  message: string
  retryable: boolean
  correlationId: CorrelationId
  safeDetails?: Record<string, string | number | boolean>
}

export interface ModelDescriptor {
  provider: string
  model: string
  capabilities: readonly ("text" | "vision" | "tools" | "structured-output" | "image" | "audio" | "video")[]
  contextWindow?: number
}
export interface AIRequest { correlationId: CorrelationId; task: string; model?: ModelDescriptor; input: unknown }
export interface AIResult<T = unknown> { correlationId: CorrelationId; model: ModelDescriptor; output: T; usage?: UsageEntry[] }
export interface AIProvider { complete<T>(request: AIRequest): Promise<AIResult<T>> }

export interface ToolContext { correlationId: CorrelationId; actor: ActorRef; permissions: readonly Permission[] }
export interface ToolDefinition<I = unknown, O = unknown> {
  name: string
  description: string
  requiredPermissions: readonly Permission[]
  approval: ApprovalState
  execute(input: I, context: ToolContext): Promise<O>
}

export interface JobStep { id: string; label: string; state: JobState; safeSummary?: string }
export interface WorkflowJob {
  id: EntityId
  correlationId: CorrelationId
  goal: string
  state: JobState
  approval: ApprovalState
  steps: readonly JobStep[]
  artifactIds: readonly EntityId[]
}

export interface AppArtifact { id: EntityId; kind: "app" | "document" | "image" | "video" | "audio"; ownerId: EntityId; currentVersion: number }
export interface ArtifactVersion<T = unknown> { artifactId: EntityId; version: number; createdAt: string; createdBy: ActorRef; payload: T; parentVersion?: number }
export interface RollbackRequest { artifactId: EntityId; fromVersion: number; toVersion: number; approval: ApprovalState }
export interface EvaluationResult { evaluator: string; version: string; passed: boolean; checks: readonly { id: string; passed: boolean; message: string }[] }

export interface StorageAdapter { put(key: string, value: Uint8Array, metadata?: Record<string, string>): Promise<void>; get(key: string): Promise<Uint8Array | null>; delete(key: string): Promise<void> }
export interface MemoryRecord { id: EntityId; ownerId: EntityId; scope: "session" | "workspace" | "project" | "approved-user"; provenance: string; createdAt: string; expiresAt?: string; value: unknown }
export interface MemoryAdapter { remember(record: MemoryRecord): Promise<void>; recall(ownerId: EntityId, scope: MemoryRecord["scope"]): Promise<readonly MemoryRecord[]>; forget(id: EntityId): Promise<void> }
export interface NotificationAdapter { send(input: { ownerId: EntityId; channel: "in-app" | "email" | "push"; title: string; body: string; approval: ApprovalState }): Promise<{ id: EntityId }> }
export interface RealtimeAdapter { publish(channel: string, event: { type: string; correlationId: CorrelationId; payload: unknown }): Promise<void> }

export interface BrandKit {
  brandName: string
  palette: readonly string[]
  typography: { display: string; body: string }
  visualDirection: string
  assetRefs: readonly ResourceRef[]
  productSummary: string
  targetAudience: string
  keyMessages: readonly string[]
  marketingTone: string
}

export type BrainStage = "request" | "understand" | "spec" | "plan" | "permission" | "model" | "tool-or-job" | "evaluate" | "result"
export interface BrainRun { id: EntityId; correlationId: CorrelationId; stage: BrainStage; request: string; permission: ApprovalState; model?: ModelDescriptor; job?: WorkflowJob; evaluation?: EvaluationResult }
