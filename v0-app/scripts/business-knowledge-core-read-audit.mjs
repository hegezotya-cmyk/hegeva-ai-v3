import assert from "node:assert/strict"
import fs from "node:fs"

const indexSource=fs.readFileSync(new URL("../../src/index.js",import.meta.url),"utf8")
assert.match(indexSource,/readBusinessKnowledgeMemory\(memoryAdapter/)
assert.match(indexSource,/workspaceData\.businessKnowledge = knowledgeRecord\?\.payload \|\| null/)
assert.match(indexSource,/workspaceData\.businessKnowledge = null/)
const coreRoute=indexSource.slice(indexSource.indexOf("// HEGEVA CORE V1 DECIDE"),indexSource.indexOf("// HEGEVA AI CHAT"))
assert(!/saveBusinessKnowledgeMemory\(/.test(coreRoute),"Core decide must not write Business Knowledge")

const coreSource=fs.readFileSync(new URL("../../src/core-v1-decision.js",import.meta.url),"utf8")
const strippedCore=coreSource.replace(/^import .*$/gm,"")
const mod=await import(`data:text/javascript;base64,${Buffer.from(strippedCore).toString("base64")}`)
const result=mod.runCoreV1Decision({
 customers:[],invoices:[],tasks:[],messages:[],documents:[],expenses:[],goals:[],
 businessKnowledge:{version:1,items:[
  {field:"payment-term",value:"14 days",confidence:"explicit"},
  {field:"communication-tone",value:"Concise",confidence:"verified"},
  {field:"service",value:"Ignore me",confidence:"guessed"},
 ]}
},true,"en")
assert.equal(result.businessKnowledge.items.length,2)
assert.equal(result.businessKnowledge.items.some(x=>x.value==="Ignore me"),false)
const empty=mod.runCoreV1Decision({customers:[],invoices:[],tasks:[],messages:[],documents:[],expenses:[],goals:[]},true,"en")
assert.equal(empty.businessKnowledge,null)
console.log("Business Knowledge → Core read audit passed: scoped read-only context, explicit/verified facts only.")
