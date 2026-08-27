import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"
const source=fs.readFileSync(new URL("../lib/foundation/durable-memory.ts",import.meta.url),"utf8")
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const {BrainMemoryGateway,InMemoryDurableMemoryAdapter,MemoryService,classifyMemoryCandidate}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
const now="2026-08-26T12:00:00.000Z", events=[]
const adapter=new InMemoryDurableMemoryAdapter(), service=new MemoryService(adapter,{record:async event=>events.push(event)}), brain=new BrainMemoryGateway(service)
const context={userId:"user-a",workspaceId:"workspace-a",projectIds:["project-a"],permissions:["memory.read","memory.write","memory.delete","memory.manage"],persistentMemoryEnabled:true,now}
const record={schemaVersion:1,memoryId:"memory-a",ownerUserId:"user-a",workspaceId:"workspace-a",projectId:"project-a",type:"project-artifact",payload:{decision:"Use the booking-led layout"},provenance:{source:"user",summary:"Owner chose the project layout"},createdAt:now,updatedAt:now,retention:"project-lifetime",sensitivity:"internal",status:"active",version:1,correlationId:"corr-a"}
await assert.rejects(()=>service.create(record,context),/memory-persistence-denied/,"project approval")
await service.create(record,context,"approved")
assert.equal((await service.query({workspaceId:"workspace-a",projectId:"project-a"},context)).length,1,"project retrieval")
await assert.rejects(()=>service.read("memory-a",{...context,userId:"user-b"}),/memory-owner-denied/,"user isolation")
await assert.rejects(()=>service.query({workspaceId:"workspace-b"},context),/memory-workspace-denied/,"workspace isolation")
await assert.rejects(()=>service.read("memory-a",{...context,projectIds:[]}),/memory-permission-denied/,"project isolation")
await assert.rejects(()=>service.create({...record,memoryId:"secret",payload:{apiKey:"sk_test_hidden"}},context,"approved"),/memory-persistence-denied/,"prohibited secrets")
await assert.rejects(()=>service.create({...record,memoryId:"sensitive",payload:{health:"inferred"},sensitivity:"sensitive"},context,"approved"),/memory-persistence-denied/,"sensitive inference")
const persistent={...record,memoryId:"persistent",projectId:undefined,type:"approved-persistent",retention:"until-deleted",payload:{preference:"Concise summaries"},sensitivity:"personal"}
assert.throws(()=>brain.persistApproved(persistent,context,"pending"),/memory-persistence-denied/,"durable approval")
await brain.persistApproved(persistent,context,"approved")
assert.equal((await brain.readAllowed({workspaceId:"workspace-a",types:["approved-persistent"]},context)).length,1,"Brain scoped read")
assert.equal(classifyMemoryCandidate({payload:{note:"temporary"},sensitivity:"internal",provenance:record.provenance},false).classification,"SESSION_ONLY")
assert.equal(classifyMemoryCandidate({...record,requestedType:"project-artifact"},false).classification,"SESSION_ONLY")
await assert.rejects(()=>service.update({...record,payload:{decision:"Changed without approval"}},context),/memory-persistence-denied/,"update approval")
const updated=await service.update({...record,payload:{decision:"Owner-approved change"}},context,"approved")
assert.equal(updated.version,2,"versioned update")
assert.equal(await service.delete("memory-a",context),true,"explicit deletion")
assert.equal(await service.read("memory-a",context),null,"deleted memory unavailable")
await adapter.create({...record,memoryId:"expired",expiresAt:"2026-08-25T12:00:00.000Z"})
await adapter.create({...record,memoryId:"other-workspace-expired",workspaceId:"workspace-b",expiresAt:"2026-08-25T12:00:00.000Z"})
assert.equal((await service.query({workspaceId:"workspace-a",projectId:"project-a"},context)).length,0,"expired memory excluded before purge")
assert.equal(await service.purgeExpired(context),1,"expiry purge")
assert(await adapter.read("other-workspace-expired"),"purge remains workspace scoped")
assert(events.some(event=>event.action==="memory.persistence_approved")&&events.some(event=>event.action==="memory.updated")&&events.some(event=>event.action==="memory.deleted")&&events.some(event=>event.action==="memory.persistence_denied"),"auditable operations")
console.log("Durable memory audit passed: explicit approval, sensitive-data rejection, ownership and scope isolation, bounded Brain access, versioned updates, deletion, expiry and auditable writes")
