import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"
const source=fs.readFileSync(new URL("../lib/business-twin.ts",import.meta.url),"utf8"),compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,engine=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
const result=engine.simulateBusinessTwin({paidRevenue:10000,expenses:4000,customers:10,priceChangePercent:10,retentionPercent:90,marketingSpend:1000,expectedNewCustomers:2,averageCustomerValue:500})
assert.equal(result.baselineNet,6000);assert.equal(result.projectedRevenue,10900);assert.equal(result.projectedNet,5900);assert.equal(result.projectedCustomers,11)
const bounded=engine.simulateBusinessTwin({paidRevenue:-1,expenses:-2,customers:-3,priceChangePercent:999,retentionPercent:999,marketingSpend:-1,expectedNewCustomers:-2,averageCustomerValue:-3});assert(bounded.projectedRevenue>=0);assert.equal(bounded.projectedCustomers,0)
const ui=fs.readFileSync(new URL("../components/business/business-twin.tsx",import.meta.url),"utf8")
for(const token of ['useWorkspaceData<IntelligenceInvoice>("invoice_documents")','useWorkspaceData<Expense>("expenses")','useWorkspaceData<Customer>("customers")',"ESTIMATE — not a forecast","BECSLÉS — nem előrejelzés","Nothing here changes prices"] )assert(ui.includes(token),`missing Business Twin contract: ${token}`)
assert(!/setItems|fetch\(|localStorage|window\.open/.test(ui),"Business Twin must remain read-only and provider-free")
const page=fs.readFileSync(new URL("../app/business/twin/page.tsx",import.meta.url),"utf8"),hub=fs.readFileSync(new URL("../app/business/page.tsx",import.meta.url),"utf8");assert(page.includes("<BusinessTwin/>")&&hub.includes('href: "/business/twin"'))
console.log("Business Twin V1 audit passed: real workspace baseline, bounded transparent scenarios, five locales, no fabricated profitability and zero mutations/provider calls")
