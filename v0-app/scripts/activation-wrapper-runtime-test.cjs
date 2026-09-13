const assert = require("node:assert/strict")
const path = require("node:path")
class Storage { constructor(){this.map=new Map()} getItem(k){return this.map.get(k)??null} setItem(k,v){this.map.set(k,v)} }
class TestEvent extends Event { constructor(type, init){super(type);this.detail=init.detail} }
const localStorage=new Storage(), sessionStorage=new Storage(), window=new EventTarget(), events=[]
Object.assign(global,{window,localStorage,sessionStorage,CustomEvent:TestEvent})
window.addEventListener("hegeva:analytics-event",event=>events.push(event.detail))
const {trackActivationEvent}=require(path.join(process.argv[2],"conversion-tracking.js"))
localStorage.setItem("hegeva:analytics-consent:v1","granted")
trackActivationEvent("first_customer_created","/business/customers","user:opaque-a")
trackActivationEvent("first_customer_created","/business/customers","user:opaque-a")
trackActivationEvent("first_customer_created","/business/customers","user:opaque-b")
trackActivationEvent("first_customer_created","/business/customers","user:opaque-a")
assert.deepEqual(events,[{event:"first_customer_created",path:"/business/customers"},{event:"first_customer_created",path:"/business/customers"}])
assert.equal(JSON.stringify(events).includes("opaque"),false)
localStorage.setItem("hegeva:analytics-consent:v1","denied")
trackActivationEvent("first_invoice_created","/business/invoices","user:opaque-b")
assert.equal(events.length,2)
window.dispatchEvent=()=>{throw new Error("transport unavailable")}
localStorage.setItem("hegeva:analytics-consent:v1","granted")
assert.doesNotThrow(()=>trackActivationEvent("first_quote_created","/business/invoices","user:opaque-b"))
console.log("Real trackActivationEvent wrapper test passed")
