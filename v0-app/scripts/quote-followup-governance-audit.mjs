import assert from "node:assert/strict"
import fs from "node:fs"
import { createRequestHandler } from "../../src/index.js"
import { prepareQuoteFollowUpEmailDraft } from "../../src/quote-followup-email-draft-action.js"
import { isGovernedExternalAction } from "../../src/external-action-governance.js"

const quote={id:"quote-followup-test",type:"quote",status:"sent",number:"QUO-TEST",dueDate:"2026-10-01",businessName:"HEGEVA Test",clientName:"Test Customer",clientDetails:"customer@example.test",currency:"GBP",vatRate:20,items:[{quantity:1,unitPrice:100}]}
const customer={id:"customer-followup-test",title:quote.clientName}

for(const locale of ["en","hu","de","fr","es"]){
 const result=prepareQuoteFollowUpEmailDraft({quote,customers:[customer],messages:[],locale,now:"2026-10-18T12:00:00.000Z"})
 assert.equal(result.ok,true,`${locale} must produce a quote follow-up draft`)
 assert.equal(result.draft.actionKey,`email-draft:quote-followup:${quote.id}`)
 assert.equal(result.draft.sourceId,quote.id)
 assert.equal(result.draft.approvalState,"awaiting-approval")
 assert.equal(result.draft.deliveryStatus,"not-sent")
 assert.equal(result.draft.executionStatus,"not-executed")
 assert.equal(result.draft.sent,false)
 assert.equal(isGovernedExternalAction(result.draft),true)
}

assert.equal(prepareQuoteFollowUpEmailDraft({quote:{...quote,type:"invoice"},customers:[customer],messages:[],now:"2026-10-18T12:00:00.000Z"}).reason,"insufficient-evidence")
assert.equal(prepareQuoteFollowUpEmailDraft({quote:{...quote,status:"draft"},customers:[customer],messages:[],now:"2026-10-18T12:00:00.000Z"}).reason,"insufficient-evidence")
assert.equal(prepareQuoteFollowUpEmailDraft({quote:{...quote,dueDate:"2026-10-18"},customers:[customer],messages:[],now:"2026-10-18T12:00:00.000Z"}).reason,"insufficient-evidence")
assert.equal(prepareQuoteFollowUpEmailDraft({quote,customers:[],messages:[],now:"2026-10-18T12:00:00.000Z"}).reason,"customer-not-authorized")
const first=prepareQuoteFollowUpEmailDraft({quote,customers:[customer],messages:[],now:"2026-10-18T12:00:00.000Z"})
const repeated=prepareQuoteFollowUpEmailDraft({quote,customers:[customer],messages:[first.draft],now:"2026-10-18T12:00:00.000Z"})
assert.equal(repeated.created,false)
assert.equal(repeated.draft.id,first.draft.id)

function database(records){return{prepare(sql){return{bind(...args){return{async first(){return sql.includes("SELECT data")?records.get(`${args[0]}:${args[1]}`)||null:null},async run(){if(sql.includes("INSERT INTO workspace_data"))records.set(`${args[1]}:messages`,{data:args[2]});return{meta:{changes:1}}}}}}}}}
const records=new Map([["u1:invoice_documents",{data:JSON.stringify([quote])}],["u1:customers",{data:JSON.stringify([customer])}],["u1:messages",{data:"[]"}]])
const handler=createRequestHandler({getLoggedInUserFn:async()=>({id:"u1"})})
const response=await handler.fetch(new Request("https://hegevaai.co.uk/api/external-actions/quote-followup-email-draft",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({quoteId:quote.id,locale:"hu"})}),{DB:database(records),ASSETS:{fetch:async()=>new Response("not found",{status:404})}}, {})
assert.equal(response.status,200)
const payload=await response.json()
assert.equal(payload.state,"awaiting-approval")
assert.equal(payload.sent,false)
assert.equal(JSON.parse(records.get("u1:messages").data).length,1)
const messageStudio=fs.readFileSync(new URL("../components/business/message-studio.tsx",import.meta.url),"utf8")
assert(messageStudio.includes("quoteNumber"),"Message Studio must show the quote reference in the evidence row")

console.log("Quote follow-up governance audit passed: expired sent quotes only, five locales, idempotent, approval-gated, and not sent.")

