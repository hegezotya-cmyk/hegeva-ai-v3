import assert from "node:assert/strict"
// @ts-expect-error local runner
import { selectOwnerOperatingPicture } from "./owner-operating-picture.ts"

const result = selectOwnerOperatingPicture({ customers:[{createdAt:new Date().toISOString()}], invoices:[{type:"invoice",status:"paid",total:100},{type:"invoice",status:"sent",total:50,dueDate:"2000-01-01"},{type:"quote",status:"sent",dueDate:"2000-01-01"}], tasks:[{done:false}] })
assert.deepEqual(result.metrics,{customers:1,newCustomers:1,paidRevenue:100,outstanding:50,openTasks:1})
assert.deepEqual(result.attention.map(x=>x.id),["overdue-invoices","stale-quotes"])
console.log("Owner operating picture contracts passed.")
