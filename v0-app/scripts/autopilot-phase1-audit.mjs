import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const source=fs.readFileSync(new URL("../lib/autopilot-v1.ts",import.meta.url),"utf8")
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const engine=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
const today="2026-09-05"
const signals=engine.analyseAutopilotWorkspace({today,customers:[{id:"c1",customerStatus:"lead",followUp:"2026-09-04"}],tasks:[{id:"t1",due:"2026-09-03",done:false}],invoices:[{id:"i1",type:"invoice",status:"sent",dueDate:"2026-09-01",currency:"GBP",vatRate:20,items:[{quantity:1,unitPrice:100}]},{id:"q1",type:"quote",status:"sent",dueDate:"2026-09-02"},{id:"i2",type:"invoice",status:"draft"}]})
assert.deepEqual(signals.map(x=>x.kind),["overdue-invoice","neglected-lead","stale-quote","overdue-task","invoice-draft"])
assert.equal(signals[0].amount,120,"real invoice amount including VAT must be preserved")
const prepared={id:"a1",signalId:"overdue-invoice",kind:"overdue-invoice",status:"prepared",title:"Follow up",sourceIds:["i1"],createdAt:today}
const approved=engine.transitionAutopilotAction(prepared,"approve",`${today}T09:00:00Z`)
assert.equal(approved.status,"approved")
const completed=engine.transitionAutopilotAction(approved,"complete",`${today}T10:00:00Z`)
assert.equal(completed.status,"completed")
assert.equal(engine.transitionAutopilotAction(prepared,"complete",today).status,"prepared","execution must fail closed without approval")
assert.equal(engine.taskForAutopilotAction(completed,today).sourceId,"autopilot:a1")
const component=fs.readFileSync(new URL("../components/command-center/intelligence-autopilot.tsx",import.meta.url),"utf8")
for(const token of ["Suggest","Prepare","Ask & Execute","Opportunity Radar","autopilot_actions","autopilot_audit","Owner approval required","Not connected"])assert(component.includes(token),`Missing Phase 1 contract: ${token}`)
assert(component.includes('log(action.id, "prepared"')&&component.includes('log('),"every Autopilot lifecycle must be auditable")
assert(component.includes('active.status === "prepared"')&&component.includes('active.status === "approved"'),"approval must precede execution")
assert(component.includes('all.some((task) => task.sourceId === `autopilot:${action.id}`)'),"executed local work must be duplicate-safe")
assert(component.includes('fetch("/api/integrations", { cache: "no-store" })'),"integration readiness must use the authenticated live server state")
assert(component.includes('fetch("/api/integrations/signals", { cache: "no-store" })'),"Core must request live aggregate read-only signals")
assert(component.includes("unreadInbox")&&component.includes("upcomingSevenDays")&&component.includes("signalUnavailable"),"live signals must render aggregate counts with an honest unavailable state")
assert(component.includes('item.provider === "google" && item.connected')&&component.includes('item.provider === "microsoft" && item.connected'),"Google and Microsoft connection status must be presented independently")
assert(component.includes("Connected · read-only")&&component.includes("Csatlakoztatva · csak olvasás"),"connected integrations must retain the read-only boundary")
assert(!/sendMail|sendEmail|gmail\.com|graph\.microsoft|googleapis|method:\s*["']POST["']/.test(component),"Phase 1 must not claim or invoke an external integration")
for(const locale of ["en:","hu:","de:","fr:","es:"])assert(component.includes(locale),`Missing locale ${locale}`)
console.log("Intelligence & Autopilot Phase 1 audit passed: real-signal radar, deterministic ranking, owner approval, duplicate-safe local execution, audit trail, live read-only connection status, five locales and honest integration boundaries")
