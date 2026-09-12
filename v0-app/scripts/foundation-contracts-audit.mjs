import assert from "node:assert/strict"
import fs from "node:fs"
const contracts = fs.readFileSync(new URL("../lib/foundation/contracts.ts", import.meta.url), "utf8")
for (const name of ["Permission", "ApprovalState", "AuditEvent", "UsageEntry", "StructuredError", "AIProvider", "ToolDefinition", "WorkflowJob", "AppArtifact", "ArtifactVersion", "EvaluationResult", "StorageAdapter", "MemoryRecord", "MemoryAdapter", "NotificationAdapter", "RealtimeAdapter", "BrandKit", "BrainStage", "BrainRun"]) assert(new RegExp(`(type|interface) ${name}\\b`).test(contracts), `Foundation contract missing ${name}`)
assert(contracts.includes("requiredPermissions") && contracts.includes("approval"), "Tool authority must remain gated")
assert(contracts.includes('"approved-user"') && contracts.includes("provenance") && contracts.includes("expiresAt"), "Memory contracts must cover consent, provenance and retention")
console.log("Foundation contracts audit passed")
