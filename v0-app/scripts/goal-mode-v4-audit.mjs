import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const source=fs.readFileSync(new URL("../lib/goal-mode-v4.ts",import.meta.url),"utf8")
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const engine=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
 const evidence={customers:8,leads:3,unpaidInvoices:4,unpaidValue:1200,overdueTasks:2,currency:"GBP"}
 const sales=engine.buildGoalPlan("Increase sales by 25%",evidence,new Date("2026-09-05T00:00:00Z"))
 assert.equal(sales.kind,"sales");assert.equal(sales.target,25);assert.equal(sales.deadline,"2026-10-05")
 const unpaid=engine.buildGoalPlan("Reduce unpaid invoices",evidence,new Date("2026-09-05T00:00:00Z"))
 assert.equal(unpaid.kind,"unpaid");assert.equal(unpaid.baseline,4);assert.equal(unpaid.target,0)
 const local=engine.buildGoalPlan("Get more local customers",evidence);assert.equal(local.kind,"local-customers");assert.equal(local.target,13)
 assert.equal(engine.goalProgress(sales,2,4),50)
 const measurableSales=engine.buildGoalPlan("Increase revenue by 20%",{...evidence,paidRevenue:1000},new Date("2026-09-05T00:00:00Z"))
 assert.equal(engine.measureGoalOutcome(measurableSales,{...evidence,paidRevenue:1100}).progress,50,"paid revenue progress must use verified paid invoices")
 assert.equal(engine.measureGoalOutcome(sales,evidence).available,false,"revenue progress must be unavailable without a verified paid baseline")
 assert.equal(engine.measureGoalOutcome(unpaid,{...evidence,unpaidInvoices:2}).progress,50,"unpaid-invoice outcomes must measure real reduction")
 assert.equal(engine.expectedGoalProgress("2026-09-01T00:00:00Z","2026-10-01",new Date("2026-09-16T00:00:00Z")),48)
 assert.equal(engine.adaptGoalPlan(unpaid,{...evidence,unpaidInvoices:2}).target,0,"adaptation must preserve the approved outcome target")
 const ui=fs.readFileSync(new URL("../components/command-center/goal-mode.tsx",import.meta.url),"utf8")
 const adapt=fs.readFileSync(new URL("../components/command-center/goal-adapt-cycle.tsx",import.meta.url),"utf8")
 assert(ui.includes('useWorkspaceData<Customer>("customers")')&&ui.includes('useWorkspaceData<Invoice>("invoice_documents")')&&ui.includes('useWorkspaceData<Task>("planner")'),"V4 must use real workspace evidence")
 assert(ui.includes('current.state!=="approved"')&&ui.includes('tasks.some(task=>task.goalId===current.id)'),"Planner mutation must remain approval-gated and idempotent")
 assert(ui.includes("stepCopy")&&ui.includes("metaCopy"),"V4 must remain localized")
 assert(ui.includes("analyseAutopilotWorkspace")&&ui.includes("radarSignals"),"Goal Mode must reuse the existing Opportunity Radar engine")
 assert(ui.includes('href="/business/autopilot"')&&ui.includes("openAutopilot"),"approved Goal work must hand off to the existing Autopilot")
 for(const stage of ["Goal","Understand","Analyse","Opportunities","Plan","Prepare","Approve","Execute","Measure","Adapt"])assert(ui.includes(`"${stage}"`),`Missing Goal lifecycle stage: ${stage}`)
 for(const locale of ["en:","hu:","de:","fr:","es:"])assert(ui.includes(locale),`Missing Goal Mode locale: ${locale}`)
 assert(adapt.includes("measureGoalOutcome")&&adapt.includes("Activity progress")&&adapt.includes("Business outcome progress"),"Adapt must separate activity from verified business outcomes")
 assert(adapt.includes('current.state!=="added-to-planner"')&&adapt.includes('state:"awaiting-approval"'),"adaptation must return to owner approval and fail closed before execution")
 assert(!/sendMail|sendEmail|method:\s*["']POST["']|env\.AI/.test(adapt),"Adapt V1 must not perform autonomous external or provider actions")
console.log("Goal Mode V1/V4 audit passed: goal lifecycle, reused Core evidence and Opportunity Radar, measurable plan, owner approval, idempotent Planner execution, Autopilot handoff and five locales")
