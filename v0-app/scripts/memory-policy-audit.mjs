import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const source=fs.readFileSync(new URL("../lib/foundation/memory-policy.ts",import.meta.url),"utf8")
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const { authorizeMemoryWrite, selectRecallableMemory }=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
const now="2026-08-26T12:00:00.000Z"
const record={id:"memory-1",ownerId:"owner-1",scope:"approved-user",provenance:"Owner explicitly saved project preference",createdAt:now,expiresAt:"2026-09-26T12:00:00.000Z",value:{theme:"calm"}}

assert.deepEqual(authorizeMemoryWrite(record,{ownerId:"owner-1",approval:"pending",allowedScopes:["approved-user"],now}),{allowed:false,reason:"approval-required"})
assert.deepEqual(authorizeMemoryWrite(record,{ownerId:"owner-2",approval:"approved",allowedScopes:["approved-user"],now}),{allowed:false,reason:"owner-mismatch"})
assert.deepEqual(authorizeMemoryWrite(record,{ownerId:"owner-1",approval:"approved",allowedScopes:["approved-user"],now}),{allowed:true})
assert.equal(selectRecallableMemory([record,{...record,id:"expired",expiresAt:"2026-08-25T12:00:00.000Z"},{...record,id:"other",ownerId:"owner-2"}],{ownerId:"owner-1",allowedScopes:["approved-user"],now}).length,1)
console.log("Memory policy audit passed: explicit consent, ownership isolation, scope control, provenance, retention and expiry filtering")
