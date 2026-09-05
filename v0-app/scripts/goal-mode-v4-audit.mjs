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
 const ui=fs.readFileSync(new URL("../components/command-center/goal-mode.tsx",import.meta.url),"utf8")
 assert(ui.includes('useWorkspaceData<Customer>("customers")')&&ui.includes('useWorkspaceData<Invoice>("invoice_documents")')&&ui.includes('useWorkspaceData<Task>("planner")'),"V4 must use real workspace evidence")
 assert(ui.includes('current.state!=="approved"')&&ui.includes('tasks.some(task=>task.goalId===current.id)'),"Planner mutation must remain approval-gated and idempotent")
 assert(ui.includes("stepCopy")&&ui.includes("metaCopy"),"V4 must remain localized")
console.log("Goal Mode V4 audit passed: classified outcomes, real baselines, measurable targets, 30-day checkpoint, localized plans, owner approval and idempotent Planner execution")
