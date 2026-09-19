import assert from "node:assert/strict";import fs from "node:fs";import ts from "typescript"
const source=fs.readFileSync(new URL("../lib/lead-to-money-v1.ts",import.meta.url),"utf8"),compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const {projectLeadToMoney}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
const result=projectLeadToMoney({today:"2026-09-19",customers:[{id:"lead",customerStatus:"lead"},{id:"active",customerStatus:"active"}],documents:[{id:"q1",type:"quote",status:"sent",customerId:"lead"},{id:"i1",type:"invoice",status:"paid",customerId:"active"}],messages:[]})
assert.ok(result.some(x=>x.stage==="follow-up"&&x.status==="needs-attention"&&x.sourceIds.includes("q1")))
assert.ok(result.some(x=>x.stage==="payment"&&x.status==="complete"&&x.sourceIds.includes("i1")))
assert.ok(result.some(x=>x.stage==="repeat-business"&&x.sourceIds.includes("active")))
assert.ok(result.every(x=>x.sourceIds.length>0))
assert(!/fetch\(|sendMail|sendEmail|stripe|env\.AI/i.test(source))
console.log("Lead-to-Money V1 audit passed: evidence-based projection, no fake transitions, no external execution.")
