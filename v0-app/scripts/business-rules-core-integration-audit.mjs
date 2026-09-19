import assert from "node:assert/strict"
import { evaluateBusinessRules, prepareActionsForSignals, prepareEmployeeDelegations } from "../../src/core-v1-decision.js"

const workspaceData={
 customers:[{id:"lead-1",title:"New Lead",customerStatus:"lead",followUp:"2026-01-01"},{id:"customer-1",title:"Dormant Customer",customerStatus:"active",updatedAt:"2025-01-01"}],
 invoices:[{id:"invoice-1",type:"invoice",status:"sent",number:"INV-1",dueDate:"2026-01-01",currency:"GBP",vatRate:20,items:[{quantity:1,unitPrice:100}]},{id:"quote-1",type:"quote",status:"sent",number:"QUO-1",dueDate:"2026-01-02",currency:"GBP",items:[{quantity:1,unitPrice:200}]}],
 tasks:[{id:"task-1",title:"Call customer",done:false,due:"2026-01-03"}],
 messages:[],documents:[],goals:[]
}
const businessRules=evaluateBusinessRules(workspaceData,"2026-09-19")
assert.deepEqual(businessRules.map(x=>x.ruleId),["overdue-invoice","stale-quote","lead-follow-up","dormant-customer","overdue-task"])
assert.ok(businessRules.every(x=>x.requiresApproval&&x.sourceIds.length>0))

const emptyDecision={corePriorities:[],opportunityRadar:[],fixMyBusiness:[],businessRules}
const actions=prepareActionsForSignals(emptyDecision,workspaceData,"en",5)
assert.ok(actions.length>=3)
assert.ok(actions.some(x=>x.kind==="invoice-followup"&&x.sourceIds.includes("invoice-1")))
assert.ok(actions.some(x=>x.kind==="followup-message"&&x.sourceIds.includes("lead-1")))
assert.ok(actions.some(x=>x.kind==="task"&&x.sourceIds.includes("task-1")))
assert.ok(actions.every(x=>x.status==="prepared"))

const employees=prepareEmployeeDelegations(actions,"en")
assert.ok(employees.some(x=>x.role==="Finance"))
assert.ok(employees.some(x=>x.role==="Sales"))
assert.ok(employees.some(x=>x.role==="Support"))
assert.ok(employees.every(x=>x.status==="awaiting-approval"&&x.deliveryStatus==="not-sent"&&x.executionStatus==="not-executed"))
console.log("Business Rules → Core → Prepared Work integration audit passed.")
