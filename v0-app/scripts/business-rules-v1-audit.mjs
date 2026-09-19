import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const source=fs.readFileSync(new URL("../lib/business-rules-v1.ts",import.meta.url),"utf8")
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const {evaluateBusinessRules}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)

const signals=evaluateBusinessRules({
 today:"2026-09-19",
 customers:[
  {id:"lead-1",customerStatus:"lead",followUp:"2026-09-19"},
  {id:"customer-1",customerStatus:"active",updatedAt:"2026-01-01"},
 ],
 invoices:[
  {id:"invoice-1",type:"invoice",status:"sent",dueDate:"2026-09-01"},
  {id:"quote-1",type:"quote",status:"sent",dueDate:"2026-09-10"},
 ],
 tasks:[{id:"task-1",done:false,due:"2026-09-18"}],
})
assert.deepEqual(signals.map(x=>x.kind),["overdue-invoice","stale-quote","lead-follow-up","dormant-customer","overdue-task"])
assert.ok(signals.every(x=>x.requiresApproval===true&&x.sourceIds.length>0))
assert.equal(signals.find(x=>x.kind==="overdue-invoice").role,"Finance")
assert.equal(signals.find(x=>x.kind==="lead-follow-up").role,"Sales")
assert.equal(signals.find(x=>x.kind==="overdue-task").role,"Support")
assert.deepEqual(evaluateBusinessRules({today:"invalid",customers:[],invoices:[],tasks:[]}),[])
assert.deepEqual(evaluateBusinessRules({today:"2026-09-19",customers:[],invoices:[],tasks:[]}),[])
const executableSideEffects=/fetch\\(|sendMail|sendEmail|stripe\\.|paymentIntent|createPayment|capturePayment|env\\.AI/i
assert(!executableSideEffects.test(source),"Business Rules must be deterministic and side-effect free")
console.log("Business Rules V1 audit passed: deterministic evidence-based signals, owner approval required, and zero external execution.")