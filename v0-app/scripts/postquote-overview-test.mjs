import assert from "node:assert/strict"
import { selectPostQuoteOverview } from "../lib/postquote-overview.ts"
const quote = { id: "q", type: "quote", status: "accepted", number: "QUO-1", sourceId: "one-click:run-1:quote" }
const base = { quoteId:"q", today:"2026-10-28", documents:[quote], tasks:[], messages:[] }
const select = patch => selectPostQuoteOverview({...base,...patch})
for (const status of ["draft","sent","paid",undefined]) assert.equal(select({documents:[{...quote,status}]}),null)
assert.equal(select({documents:[]}),null)
assert.equal(select({documents:[quote,{...quote}]}),null,"Ambiguous quote IDs must not select evidence")
assert.ok(select({documents:[{...quote,status:"invoiced"}]}))
const input = {
  ...base,
  tasks:[
    {id:"direct",title:"Work",sourceId:"q",due:"2026-10-28",done:true},
    {id:"launch",title:"Launch follow-up",sourceId:"one-click:run-1:task",due:"2026-10-29",done:false},
    {id:"other",title:"Work",sourceId:"one-click:run-10:task"},
    {id:"name",title:"QUO-1"},
  ],
  messages:[
    {id:"future",sourceId:"q",followUpAt:"2026-10-29",workflowStatus:"approved"},
    {id:"overdue-b",sourceId:"q",followUpAt:"2026-10-01",workflowStatus:"completed"},
    {id:"overdue-a",sourceId:"q",followUpAt:"2026-10-01",workflowStatus:"draft"},
    {id:"invalid",sourceId:"q",followUpAt:"2026-02-30"},
    {id:"undated",sourceId:"q"},
    {id:"foreign",sourceId:"q-other",followUpAt:"2020-01-01"},
  ],
  documents:[quote,
    {id:"explicit",type:"invoice",sourceQuoteId:"q",status:"paid",number:"INV-1"},
    {id:"inherited",type:"invoice",sourceId:"one-click:run-1:quote",status:"draft",number:"INV-2"},
    {id:"conflict",type:"invoice",sourceQuoteId:"another",sourceId:quote.sourceId,notes:"Created from quote QUO-1"},
    {id:"legacy",type:"invoice",notes:"Created from quote QUO-1\nOriginal note"},
    {id:"prefix",type:"invoice",notes:"Created from quote QUO-10"},
    {id:"later-line",type:"invoice",notes:"A note\nCreated from quote QUO-1"},
    {id:"foreign-origin",type:"invoice",sourceId:"one-click:other:quote",notes:"Created from quote QUO-1"},
  ],
}
const before=structuredClone(input)
const result=selectPostQuoteOverview(input)
assert.deepEqual(result.tasks.map(x=>x.id),["direct","launch"])
assert.equal(result.tasks[0].done,true,"Retain task evidence without inventing a work-completion flag")
assert.deepEqual(result.invoices.map(x=>x.id),["explicit","inherited"])
assert.deepEqual(result.legacyInvoices.map(x=>x.id),["legacy"])
assert.equal(result.nextFollowup.id,"overdue-a")
assert.equal(result.followups.find(x=>x.id==="overdue-b").workflowStatus,"completed")
assert.equal(result.followups.some(x=>"delivered" in x || "sent" in x),false)
assert.equal(result.followups.length,5,"Invalid/undated linked messages remain visible as records")
assert.deepEqual(input,before)
assert.equal(select({messages:[{id:"future",sourceId:"q",followUpAt:"2026-12-01",workflowStatus:"draft"},{id:"near",sourceId:"q",followUpAt:"2026-10-29",workflowStatus:"draft"}]}).nextFollowup.id,"near")
assert.equal(select({messages:[{id:"today",sourceId:"q",followUpAt:base.today,workflowStatus:"draft"}]}).nextFollowup.id,"today")
assert.equal(select({messages:[{id:"leap",sourceId:"q",followUpAt:"2024-02-29",workflowStatus:"draft"}]}).nextFollowup.id,"leap")
assert.equal(select({messages:[{id:"bad",sourceId:"q",followUpAt:"2025-02-29",workflowStatus:"draft"},{id:"missing",sourceId:"q",workflowStatus:"draft"}]}).nextFollowup,null)
assert.equal(select({today:"2026-02-30"}).nextFollowup,null)
assert.equal(select({documents:[...input.documents,{id:"q2",type:"quote",number:"QUO-1"}]}).legacyInvoices.length,0)
assert.equal(select({documents:[{...quote,number:""},{id:"legacy",type:"invoice",notes:"Created from quote "}]}).legacyInvoices.length,0)
for(const sourceId of ["one-click::quote","one-click:run-1:quote:extra","one-click:run-1:quote ","one-click:run:part:quote"]) {
  assert.equal(select({documents:[{...quote,sourceId}],tasks:[{id:"x",sourceId:"one-click:run-1:task"}]}).tasks.length,0)
}
assert.equal(select({documents:[{...quote,sourceId:undefined}],tasks:[{id:"x",sourceId:"q"}]}).tasks.length,1)
assert.deepEqual(select({documents:[quote,null,{id:"bad",type:"invoice",notes:12}],tasks:[null,{id:"bad",sourceId:3}],messages:[null,{id:"m",sourceId:"q",followUpAt:12}]}).invoices,[])
assert.equal(select({documents:[quote,{id:"bad",type:"invoice",sourceQuoteId:12,notes:"Created from quote QUO-1"}]}).legacyInvoices.length,0)
const futurePending={id:"next",sourceId:"q",followUpAt:"2026-10-29",workflowStatus:"approved"}
for(const workflowStatus of ["completed","sent","sending","failed","uncertain",undefined,"unknown"]) {
  assert.equal(select({messages:[{id:"past",sourceId:"q",followUpAt:"2026-10-01",workflowStatus},futurePending]}).nextFollowup.id,"next",`${workflowStatus} must not outrank a pending follow-up`)
}
for(const approvalState of ["sent","sending","failed","uncertain"]) {
  assert.equal(select({messages:[{id:"blocked",sourceId:"q",followUpAt:"2026-10-01",workflowStatus:"draft",approvalState},futurePending]}).nextFollowup.id,"next")
}
for(const deliveryStatus of ["sent","failed"]) {
  assert.equal(select({messages:[{id:"delivered",sourceId:"q",followUpAt:"2026-10-01",workflowStatus:"approved",deliveryStatus},futurePending]}).nextFollowup.id,"next")
}
assert.equal(select({messages:[{id:"ready",sourceId:"q",followUpAt:"2026-10-28",workflowStatus:"ready-to-execute"},futurePending]}).nextFollowup.id,"ready")
assert.equal(select({messages:[{id:"approval",sourceId:"q",followUpAt:"2026-10-28",approvalState:"awaiting-approval"},futurePending]}).nextFollowup.id,"approval")
assert.equal(select({messages:[{id:"only-completed",sourceId:"q",followUpAt:"2026-10-01",workflowStatus:"completed"}]}).nextFollowup,null)
console.log("Postquote overview logic PASS: exact evidence, one-click origins, explicit conflicts, legacy isolation, calendar dates, deterministic ordering, malformed data and immutability.")
