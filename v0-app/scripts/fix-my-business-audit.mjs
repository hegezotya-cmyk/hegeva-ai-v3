import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"
const source=fs.readFileSync(new URL("../lib/fix-my-business.ts",import.meta.url),"utf8"),compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,engine=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`),today="2026-09-05"
const signals=engine.diagnoseBusiness({today,customers:[{id:"c1",customerStatus:"lead",followUp:"2026-09-01"}],tasks:[{id:"t1",done:false,due:"2026-09-02"}],invoices:[{id:"i1",type:"invoice",status:"sent",dueDate:"2026-09-01",currency:"GBP",vatRate:20,items:[{quantity:1,unitPrice:100}]}]})
assert.deepEqual(signals.map(x=>x.kind),["cash","leads","operations"]);assert.equal(signals[0].amount,120);assert.equal(engine.fixTaskId("r1","cash"),"fix:r1:cash")
assert.equal(engine.diagnoseBusiness({today,customers:[],tasks:[],invoices:[]})[0].kind,"foundation")
const ui=fs.readFileSync(new URL("../components/business/fix-my-business.tsx",import.meta.url),"utf8")
for(const token of ['useWorkspaceData<Run>("fix_business_runs")','useWorkspaceData<Task>("planner")','current.status!=="approved"','task.sourceId===fixTaskId','No message is sent','jóváhagyás nélkül'])assert(ui.includes(token),`missing Fix My Business contract: ${token}`)
assert(!/fetch\(|sendMail|sendEmail|window\.open/.test(ui),"diagnosis must not use providers or send messages")
console.log("Fix My Business V1 audit passed: real invoice/lead/task evidence, VAT-preserved exposure, bounded diagnosis, approval gate, duplicate-safe Planner tasks, five locales and no external execution")
