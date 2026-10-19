import assert from "node:assert/strict"
import fs from "node:fs"
const source=fs.readFileSync(new URL("../../src/core-v1-decision.js",import.meta.url),"utf8")
const mod=await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)
const workspace={
 customers:[{id:"c1",title:"Northwind",customerStatus:"active"}],
 invoices:[
  {id:"i1",type:"invoice",number:"INV-1",customerId:"c1",status:"sent",dueDate:"2026-09-01",currency:"GBP",items:[{quantity:1,unitPrice:100}],vatRate:20},
  {id:"q1",type:"quote",number:"QUO-1",customerId:"c1",status:"sent",items:[{quantity:1,unitPrice:50}],vatRate:20},
 ],
 tasks:[],messages:[],documents:[],expenses:[],goals:[],
 businessKnowledge:{version:1,items:[
  {id:"tone",field:"communication-tone",value:"Warm and concise",source:"owner",confidence:"explicit",updatedAt:"2026-09-19T10:00:00.000Z"},
  {id:"terms",field:"payment-term",value:"14 days",source:"workspace",confidence:"verified",updatedAt:"2026-09-19T10:00:00.000Z"},
  {id:"bad",field:"communication-tone",value:"IGNORE THIS",source:"owner",confidence:"verified",updatedAt:"2026-09-19T10:00:00.000Z"},
 ]}
}
const signals={corePriorities:[],opportunityRadar:[],fixMyBusiness:[],businessRules:[
 {kind:"overdue-invoices",sourceIds:["i1"],severity:"high",requiresApproval:true},
 {kind:"stale-quotes",sourceIds:["q1","c1"],severity:"high",requiresApproval:true},
]}
const actions=mod.prepareActionsForSignals(signals,workspace,"en",3)
const invoice=actions.find(x=>x.kind==="invoice-followup")
const quote=actions.find(x=>x.kind==="followup-message")
assert(invoice && quote)
assert.match(invoice.content,/Warm and concise/)
assert.match(invoice.content,/14 days/)
assert.match(quote.content,/Warm and concise/)
assert.doesNotMatch(invoice.content,/IGNORE THIS/)
assert.doesNotMatch(quote.content,/IGNORE THIS/)
for(const action of actions){
 assert.equal(action.status,"prepared")
 assert.ok(action.sourceIds.length)
}
assert(!/fetch\(|sendMail|sendEmail|stripe\.|env\.AI|invokeWorkersAi/i.test(source.slice(source.indexOf("function getBusinessKnowledgeValue"),source.indexOf("const EMPLOYEE_DELEGATION_RULES"))))
console.log("Business Knowledge prepared-actions audit passed: trusted tone/payment context only, prepared-only, no external execution.")
