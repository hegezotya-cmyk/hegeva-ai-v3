import assert from "node:assert/strict"
import fs from "node:fs"

const source=fs.readFileSync(new URL("../../src/business-knowledge-memory.js",import.meta.url),"utf8")
const mod=await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)

const store=new Map()
const adapter={
 async read(id){return store.get(id)||null},
 async create(record){if(store.has(record.memoryId))throw new Error("memory-exists");store.set(record.memoryId,{...record});return {...record}},
 async update(record){if(!store.has(record.memoryId))throw new Error("memory-not-found");const next={...record,version:record.version+1};store.set(record.memoryId,next);return {...next}},
}
const now="2026-09-19T10:00:00.000Z"
const base={userId:"user-1",workspaceId:"workspace-1",now,correlationId:"corr-1",items:[
 {id:"name",field:"business-name",value:"HEGEVA AI",source:"owner",confidence:"explicit",updatedAt:now},
 {id:"tone",field:"communication-tone",value:"Professional and concise",source:"owner",confidence:"explicit",updatedAt:now},
 {id:"invalid",field:"service",value:"",source:"workspace",confidence:"verified",updatedAt:now},
]}
const created=await mod.saveBusinessKnowledgeMemory(adapter,base)
assert.equal(created.payload.items.length,2)
const trustPairs=mod.buildBusinessKnowledgeMemoryRecord({...base,items:[
 {id:"ok-owner",field:"service",value:"Owner explicit",source:"owner",confidence:"explicit",updatedAt:now},
 {id:"bad-owner",field:"service",value:"Owner verified",source:"owner",confidence:"verified",updatedAt:now},
 {id:"ok-workspace",field:"price",value:"Workspace verified",source:"workspace",confidence:"verified",updatedAt:now},
 {id:"bad-workspace",field:"price",value:"Workspace explicit",source:"workspace",confidence:"explicit",updatedAt:now},
]})
assert.deepEqual(trustPairs.payload.items.map(x=>x.id),["ok-owner","ok-workspace"])
assert.throws(()=>mod.buildBusinessKnowledgeMemoryRecord({...base,items:[
 {id:"secret",field:"business-rule",value:"API key: abc123",source:"owner",confidence:"explicit",updatedAt:now},
]}),/prohibited-data/)
assert.equal(created.type,"workspace")
assert.equal(created.retention,"workspace-lifetime")
assert.equal(created.sensitivity,"internal")
assert.equal((await mod.readBusinessKnowledgeMemory(adapter,{userId:"user-1",workspaceId:"workspace-1"})).payload.items[0].value,"HEGEVA AI")
await assert.rejects(()=>mod.readBusinessKnowledgeMemory(adapter,{userId:"user-2",workspaceId:"workspace-1"}),/scope-mismatch/)
const updated=await mod.saveBusinessKnowledgeMemory(adapter,{...base,correlationId:"corr-2",items:[...base.items,{id:"term",field:"payment-term",value:"14 days",source:"owner",confidence:"explicit",updatedAt:now}]})
assert.equal(updated.payload.items.length,3)
assert.equal(updated.createdAt,created.createdAt)
assert.equal(updated.version,2)
for(const token of ["fetch(", "sendMail", "sendEmail", "stripe.", "env.AI"]) assert.equal(source.includes(token),false)
console.log("Business Knowledge durable-memory runtime gateway audit passed.")
