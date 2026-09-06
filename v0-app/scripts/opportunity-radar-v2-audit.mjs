import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import ts from "typescript"

const root = process.cwd()
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "hegeva-radar-v2-"))
const compile = (source) => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText

try {
  const goalSource = fs.readFileSync(path.join(root, "lib", "goal-mode-v4.ts"), "utf8")
  const radarSource = fs.readFileSync(path.join(root, "lib", "opportunity-radar-v2.ts"), "utf8")
  fs.writeFileSync(path.join(temporary, "goal-mode-v4.js"), compile(goalSource))
  fs.writeFileSync(path.join(temporary, "opportunity-radar-v2.js"), compile(radarSource).replace('"./goal-mode-v4"', '"./goal-mode-v4.js"'))
  const { analyseOpportunityRadarV2 } = await import(`${pathToFileURL(path.join(temporary, "opportunity-radar-v2.js")).href}?audit=${Date.now()}`)
  const findings = analyseOpportunityRadarV2({today:"2026-09-06",customers:[{id:"customer-1",customerStatus:"active",updatedAt:"2026-01-01"}],invoices:[{id:"invoice-1",type:"invoice",status:"sent",dueDate:"2026-08-01",currency:"GBP",vatRate:20,items:[{quantity:1,unitPrice:100}]},{id:"quote-1",type:"quote",status:"sent",dueDate:"2026-08-01",currency:"GBP",items:[{quantity:1,unitPrice:200}]}],tasks:[{id:"task-1",done:false,due:"2026-09-01"}],messages:[],goals:[],evidence:{customers:1,leads:0,unpaidInvoices:1,unpaidValue:120,overdueTasks:1,currency:"GBP",paidRevenue:0}})
  assert.deepEqual(findings.map((finding) => finding.kind), ["quote-leakage", "payment-risk", "workload-bottleneck", "dormant-customers"])
  assert.equal(findings.find((finding) => finding.kind === "payment-risk")?.amount, 120)
  assert.ok(findings.every((finding) => finding.confidence === "high" && finding.evidence.length > 0))
  const ui = fs.readFileSync(path.join(root, "components", "command-center", "opportunity-executive-v2.tsx"), "utf8")
  for (const locale of ["en", "hu", "de", "fr", "es"]) assert.ok(ui.includes(`${locale}:{`), `Missing ${locale} copy`)
  for (const label of ["Evidence", "Business impact", "Confidence", "Recommended action", "Expected outcome"]) assert.ok(ui.includes(label), `Missing ${label}`)
  assert.ok(ui.includes("owner approval"))
  assert.ok(!/sendMail|sendEmail|env\.AI/i.test(`${ui}\n${radarSource}`), "Radar must remain read-only")
  console.log("Opportunity Radar V2 + Executive Mode V2 audit passed")
} finally {
  fs.rmSync(temporary, { recursive: true, force: true })
}
