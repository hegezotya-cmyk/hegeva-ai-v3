import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const source=fs.readFileSync(new URL("../lib/business-knowledge-v1.ts",import.meta.url),"utf8")
const stripped=source.replace(/^import type .*$/gm,"")
const compiled=ts.transpileModule(stripped,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const mod=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
const now="2026-09-19T10:00:00.000Z"
const profile=mod.buildBusinessKnowledgeProfile({workspaceId:"ws-1",items:[
 {id:"tone-1",field:"communication-tone",value:"Professional and concise",source:"owner",confidence:"explicit",updatedAt:now},
 {id:"tone-dup",field:"communication-tone",value:"Professional and concise",source:"owner",confidence:"explicit",updatedAt:now},
 {id:"term-1",field:"payment-term",value:"Payment due within 14 days",source:"owner",confidence:"explicit",updatedAt:now},
 {id:"bad",field:"service",value:"",source:"workspace",confidence:"verified",updatedAt:now},
]})
assert.equal(profile.items.length,2)
assert.equal(mod.selectBusinessKnowledge(profile,["payment-term"]).length,1)
const context={userId:"u-1",workspaceId:"ws-1",projectIds:[],permissions:["memory.read","memory.write"],persistentMemoryEnabled:false,now}
const record=mod.businessKnowledgeToMemory(profile,context,"corr-1")
assert.equal(record.type,"workspace")
assert.equal(record.retention,"workspace-lifetime")
assert.equal(record.sensitivity,"internal")
assert.throws(()=>mod.businessKnowledgeToMemory(profile,{...context,workspaceId:"ws-2"},"corr-2"),/workspace-scope-mismatch/)
assert(!/fetch\(|stripe|sendMail|sendEmail|env\.AI/i.test(source))
console.log("Business Knowledge V1 audit passed: explicit/verified facts only, workspace-scoped, no external execution.")
