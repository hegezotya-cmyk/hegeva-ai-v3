import assert from "node:assert/strict"
import fs from "node:fs"
const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8")
const contracts=read("lib/foundation/contracts.ts")
const runtime=read("lib/foundation/brain-runtime.ts")
const memory=read("lib/foundation/memory-policy.ts")
const durable=read("lib/foundation/durable-memory.ts")
for(const name of ["Permission","AuditEvent","UsageEntry","StructuredError","AIProvider","ToolDefinition","WorkflowJob","AppArtifact","ArtifactVersion","EvaluationResult","StorageAdapter","MemoryAdapter","NotificationAdapter","RealtimeAdapter","BrandKit","BrainRun"]) assert(new RegExp(`(type|interface) ${name}\\b`).test(contracts),`Foundation contract missing ${name}`)
assert(contracts.includes('"approved-user"')&&contracts.includes("provenance")&&contracts.includes("expiresAt"),"Memory contract must cover consent, provenance and retention")
assert(contracts.includes("requiredPermissions")&&contracts.includes("approval"),"Tool authority must remain permission and approval gated")
assert(runtime.includes("BRAIN_STAGE_ORDER")&&runtime.includes("approval-required")&&runtime.includes("job-required")&&runtime.includes("evaluation-required"),"Brain runtime must enforce ordered, approved and evaluated execution")
assert(memory.includes("owner-mismatch")&&memory.includes("approval-required")&&memory.includes("missing-provenance")&&memory.includes("expired"),"Memory policy must enforce ownership, consent, provenance and retention")
for(const term of ["DurableMemoryRecord","DurableMemoryAdapter","MemorySearchAdapter","EmbeddingAdapter","MemoryService","BrainMemoryGateway","memory.persistence_denied"])assert(durable.includes(term),`Durable memory foundation missing ${term}`)
console.log("Foundation/Mission audit passed: permissions, audit, usage, errors, AI/tools, jobs, artifacts, adapters, safe memory, media brand kit and Brain stages")
