import assert from "node:assert/strict"
import fs from "node:fs"
const source=fs.readFileSync(new URL("../../src/core-v1-decision.js",import.meta.url),"utf8")
const mod=await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)
const workspace={
 customers:[{id:"c1",title:"Acme",customerStatus:"active"}],
 invoices:[{id:"q1",type:"quote",number:"QUO-1",customerId:"c1",status:"sent",items:[],vatRate:20}],
 tasks:[],messages:[],documents:[],expenses:[],goals:[],
 businessKnowledge:{version:1,items:[{id:"tone",field:"communication-tone",value:"Warm and concise",source:"owner",confidence:"explicit"}]}
}
const result=mod.runCoreV1Decision(workspace,false,"en")
const gap=result.leadToMoney.find(x=>x.stage==="follow-up"&&x.status==="needs-attention")
assert(gap,"quote without follow-up must surface as Lead-to-Money attention")
const action=result.preparedActions.find(x=>x.kind==="followup-message"&&x.sourceIds.includes("q1"))
assert(action,"Lead-to-Money follow-up gap must prepare a quote follow-up")
assert.equal(action.status,"prepared")
assert.equal(action.reason,"quote-followup-approval-pending")
assert.match(action.content,/Warm and concise/)
const delegation=result.employeeDelegations.find(x=>x.role==="Sales"&&x.sourceIds.includes("q1"))
assert(delegation)
assert.equal(delegation.status,"awaiting-approval")
assert.equal(delegation.deliveryStatus,"not-sent")
assert.equal(delegation.executionStatus,"not-executed")
assert(!result.preparedActions.some(x=>x.kind==="invoice-create"||x.kind==="payment"))

const leadWorkspace={
 customers:[{id:"lead1",title:"New Prospect",customerStatus:"lead"}],
 invoices:[],tasks:[],messages:[],documents:[],expenses:[],goals:[],
 businessKnowledge:{version:1,items:[{id:"tone2",field:"communication-tone",value:"Professional and friendly",source:"owner",confidence:"explicit"}]}
}
const leadResult=mod.runCoreV1Decision(leadWorkspace,false,"en")
const qualificationGap=leadResult.leadToMoney.find(x=>x.stage==="qualified"&&x.status==="needs-attention")
assert(qualificationGap,"lead without quote must surface qualification attention")
const qualification=leadResult.preparedActions.find(x=>x.kind==="lead-qualification"&&x.sourceIds.includes("lead1"))
assert(qualification,"qualification gap must prepare owner-reviewed lead qualification")
assert.equal(qualification.status,"prepared")
assert.equal(qualification.reason,"lead-qualification-approval-pending")
assert.match(qualification.content,/Professional and friendly/)
assert.match(qualification.content,/do not send or create a quote yet/i)
const salesQualification=leadResult.employeeDelegations.find(x=>x.role==="Sales"&&x.sourceIds.includes("lead1"))
assert(salesQualification)
assert.equal(salesQualification.status,"awaiting-approval")
assert.equal(salesQualification.deliveryStatus,"not-sent")
assert.equal(salesQualification.executionStatus,"not-executed")
assert(!leadResult.preparedActions.some(x=>x.kind==="quote-create"||x.kind==="invoice-create"||x.kind==="payment"))

const segment=source.slice(source.indexOf("// Lead-to-Money only prepares"),source.indexOf("// Deduplicate by kind"))
assert(!/fetch\(|sendMail|sendEmail|stripe\.|env\.AI|invokeWorkersAi/i.test(segment))
console.log("Lead-to-Money prepared-work audit passed: quote gap -> prepared Sales follow-up, approval required, not sent/executed.")
