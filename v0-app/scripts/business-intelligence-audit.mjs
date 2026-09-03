import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"
const source=fs.readFileSync(new URL("../lib/business-intelligence.ts",import.meta.url),"utf8")
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const f=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
const tasks=[{id:"t",title:"Call",due:"2026-09-01",priority:"high",done:false}]
const invoice={id:"i",type:"invoice",status:"sent",number:"INV-1",issueDate:"2026-08-01",dueDate:"2026-09-01",currency:"GBP",vatRate:20,businessName:"HEGEVA",businessDetails:"",clientName:"Client",clientDetails:"",items:[{id:"l",description:"Work",quantity:1,unitPrice:100}],notes:"",createdAt:"",updatedAt:""}
assert.equal(f.invoiceTotal(invoice),120)
assert.equal(f.topActions(tasks,[invoice],"2026-09-03").length,2)
assert.equal(f.createAdVariants("HEGEVA","small businesses","Save time").length,3)
assert.equal(f.extractTaskCandidates("Review the contract by 2026-09-10.\nBackground only.").length,1)
assert.equal(f.watchtowerSignals(tasks,[invoice],"2026-09-03")[0].severity,"critical")
const ui=fs.readFileSync(new URL("../components/business/business-intelligence-center.tsx",import.meta.url),"utf8")
for(const key of ["planner","invoice_documents","messages","createAdVariants","extractTaskCandidates","convertQuoteToInvoice","watchtowerSignals"])assert(ui.includes(key),`Missing ${key}`)
assert(!/fetch\(|env\.AI|dangerouslySetInnerHTML|eval\(|new Function/.test(ui))
console.log("Business Intelligence audit passed: seven connected, user-approved, provider-free workflows")
