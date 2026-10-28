const assert=require("node:assert/strict")
const {chromium}=require("playwright")
const base=process.env.TEST_BASE_URL||"http://localhost:3018"
const common={issueDate:"2026-10-01",dueDate:"2026-11-01",currency:"GBP",vatRate:0,businessName:"Test business",businessDetails:"",clientName:"Synthetic client",clientDetails:"",items:[],notes:"",createdAt:"2026-10-01",updatedAt:"2026-10-01"}
const documents=[
 {...common,id:"q",type:"quote",status:"accepted",number:"QUO-1",sourceId:"one-click:run-1:quote"},
 {...common,id:"q2",type:"quote",status:"invoiced",number:"QUO-2"},
 {...common,id:"q3",type:"quote",status:"sent",number:"QUO-3"},
 {...common,id:"invoice",type:"invoice",status:"paid",number:"INV-VERIFIED",sourceQuoteId:"q"},
 {...common,id:"legacy",type:"invoice",status:"paid",number:"INV-LEGACY",notes:"Created from quote QUO-1"},
 {...common,id:"wrong",type:"invoice",status:"paid",number:"INV-PREFIX",notes:"Created from quote QUO-10"},
]
const tasks=[{id:"t",title:"Direct linked task",sourceId:"q",due:"2026-10-28",done:true},{id:"t2",title:"Launch follow-up task",sourceId:"one-click:run-1:task",due:"2026-10-29",done:false},{id:"long",title:"LongUnbrokenTaskTitle".repeat(25),sourceId:"q",done:false},{id:"foreign",title:"UNRELATED TASK",sourceId:"qq"}]
const messages=[{id:"m",sourceId:"q",followUpAt:"2026-10-01",workflowStatus:"completed"},{id:"m2",sourceId:"q",followUpAt:"2026-10-29",workflowStatus:"approved"},...['ready-to-execute','sending','sent','failed','uncertain'].map((workflowStatus,index)=>({id:`state-${index}`,sourceId:"q",followUpAt:"2026-11-01",workflowStatus})),{id:"conflict",sourceId:"q",followUpAt:"2026-10-01",workflowStatus:"draft",approvalState:"uncertain",deliveryStatus:"failed"}]
;(async()=>{
 const browser=await chromium.launch({headless:true})
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:"Europe/London"})
  await context.addInitScript(()=>{localStorage.setItem("hegeva:analytics-consent:v1","denied");if(!localStorage.getItem("hegeva.locale"))localStorage.setItem("hegeva.locale","en")})
  let owner="overview-a",failTasks=false,delayMessages=false,guest=false,writes=0
  let releaseMessages
  const messageGate=new Promise(resolve=>{releaseMessages=resolve})
  const loads={planner:0,messages:0}
  await context.route("**/api/**",async route=>{
   const request=route.request(),path=new URL(request.url()).pathname,requestOwner=owner
   const reply=(data,status=200)=>route.fulfill({status,contentType:"application/json",headers:{"access-control-allow-origin":base,"access-control-allow-credentials":"true"},body:JSON.stringify(data)})
   if(request.method()==="OPTIONS")return reply(null)
   if(path.includes("get-session"))return reply(guest?null:{session:{id:"s",userId:owner,token:"fixture",expiresAt:"2099-01-01"},user:{id:owner,name:"Synthetic",email:"synthetic@example.invalid",emailVerified:true}})
   if(path.includes("/workspace/")){
    if(request.method()!=="GET"){writes++;return reply({ok:true})}
    const type=path.split("/").pop()
    if(type in loads)loads[type]++
    if(type==="planner"&&failTasks)return reply({error:"Fixture unavailable"},503)
    if(type==="messages"&&delayMessages)await messageGate
    const foreign=requestOwner!=="overview-a"
    return reply({data:type==="invoice_documents"?(foreign?[{...documents[0],number:"NEW ACCOUNT QUOTE"}]:documents):type==="planner"?(foreign?[]:tasks):type==="messages"?(foreign?[]:messages):[]})
   }
   if(path.includes("/external-actions/")&&request.method()!=="GET")writes++
   return reply(null)
  })
  const page=await context.newPage();page.setDefaultTimeout(6000);page.setDefaultNavigationTimeout(60000)
  await page.clock.setFixedTime(new Date("2026-10-28T12:00:00Z"))
  await page.goto(`${base}/business/invoices`,{waitUntil:"domcontentloaded"})
  const open=page.getByRole("button",{name:"Next steps: QUO-1",exact:true})
  await open.waitFor({timeout:10000})
  assert.equal(await page.getByRole("button",{name:"Next steps: QUO-3",exact:true}).count(),0)
  assert.equal(await page.getByRole("button",{name:"Next steps: QUO-2",exact:true}).count(),1)
  assert.deepEqual(loads,{planner:0,messages:0},"Related collections should load only after opening")
  await open.focus();await page.keyboard.press("Enter")
  const panel=page.getByRole("region",{name:"Next steps",exact:true})
  await panel.getByText("Direct linked task",{exact:true}).waitFor()
  assert.equal(await panel.getByText("UNRELATED TASK",{exact:true}).count(),0)
  assert.equal(await panel.getByRole("heading",{name:"Next steps",exact:true}).evaluate(el=>el===document.activeElement),true)
  const verified=panel.getByRole("region",{name:"Invoices",exact:true})
  assert.equal(await verified.getByText("INV-VERIFIED",{exact:true}).count(),1)
  assert.equal(await verified.getByText("INV-LEGACY",{exact:true}).count(),0)
  assert.equal(await panel.getByRole("region",{name:"Legacy references — review required",exact:true}).getByText("INV-LEGACY",{exact:true}).count(),1)
  assert.equal(await panel.getByText("INV-PREFIX",{exact:true}).count(),0)
  await panel.getByText("Completed record",{exact:true}).waitFor()
  await panel.getByText("Next recorded follow-up: 2026-10-29",{exact:true}).waitFor()
  for(const status of ["Ready record","Sending record","Recorded as sent","Failed record","Uncertain outcome"])await panel.getByText(status,{exact:true}).first().waitFor()
  await panel.getByText("Approval state: Uncertain outcome",{exact:true}).waitFor()
  await panel.getByText("Sending record status: Failed record",{exact:true}).waitFor()
  assert.equal(writes,0)
  for(const width of [390,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:`../.superpowers/sdd/2026-10-28-postquote-overview/browser-${width}.png`,fullPage:true})}
  await panel.getByRole("button",{name:"Close overview",exact:true}).click()
  assert.equal(await open.evaluate(el=>el===document.activeElement),true)
  await open.click();await panel.getByText("Direct linked task",{exact:true}).waitFor();assert.equal(writes,0)
  await panel.getByRole("link",{name:"Open planner",exact:true}).click();await page.waitForURL("**/business/planner")
  assert.equal(writes,0)
  await page.goto(`${base}/business/invoices`);await open.click();await panel.getByText("Direct linked task",{exact:true}).waitFor()
  owner="overview-b"
  await page.evaluate(()=>window.dispatchEvent(new StorageEvent("storage",{key:"better-auth.message",newValue:JSON.stringify({event:"session",data:{trigger:"updateUser"}})})))
  await panel.waitFor({state:"hidden"})
  await page.getByRole("button",{name:"Next steps: NEW ACCOUNT QUOTE",exact:true}).click()
  await panel.getByRole("heading",{name:"Next steps",exact:true}).waitFor()
  assert.equal(await panel.getByText("Direct linked task",{exact:true}).count(),0)
  await panel.getByRole("button",{name:"Close overview",exact:true}).click()
  owner="overview-a";failTasks=true;delayMessages=true
  await page.reload();await open.click()
  await panel.getByText("Loading related records…",{exact:true}).first().waitFor()
  assert.equal(await panel.getByText("No recorded link",{exact:true}).count(),0,"Loading must not claim final absence")
  releaseMessages();delayMessages=false
  await panel.getByText("Cloud sync unavailable — showing this browser’s copy.",{exact:true}).waitFor()
  await panel.getByText("INV-VERIFIED",{exact:true}).waitFor()
  failTasks=false
  for(const [locale,label,close] of [["hu","Következő lépések","Áttekintés bezárása"],["de","Nächste Schritte","Übersicht schließen"],["fr","Étapes suivantes","Fermer l’aperçu"],["es","Próximos pasos","Cerrar resumen"]]){
   await page.evaluate(locale=>localStorage.setItem("hegeva.locale",locale),locale);await page.reload()
   await page.getByRole("button",{name:`${label}: QUO-1`,exact:true}).click()
   await page.getByRole("region",{name:label,exact:true}).getByRole("button",{name:close,exact:true}).waitFor()
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  }
  // Use a browser with no prior account marker: sign-out intentionally clears fallback copies.
  const guestContext=await browser.newContext({viewport:{width:390,height:844},timezoneId:"Europe/London"})
  await guestContext.addInitScript(({documents,tasks,messages})=>{localStorage.setItem("hegeva.locale","en");localStorage.setItem("hegeva:analytics-consent:v1","denied");for(const [type,data]of Object.entries({invoice_documents:documents,planner:tasks,messages}))localStorage.setItem(`hegeva:v0:guest:${type}`,JSON.stringify(data))},{documents,tasks,messages})
  await guestContext.route("**/api/**",route=>{if(route.request().url().includes("/workspace/")&&route.request().method()!=="GET")writes++;return route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":base,"access-control-allow-credentials":"true"},body:"null"})})
  const guestPage=await guestContext.newPage()
  await guestPage.goto(`${base}/business/invoices`,{waitUntil:"domcontentloaded"})
  await guestPage.getByRole("button",{name:"Next steps: QUO-1",exact:true}).click()
  const guestPanel=guestPage.getByRole("region",{name:"Next steps",exact:true})
  await guestPanel.getByText("Local browser records only.",{exact:true}).first().waitFor()
  await guestPanel.getByText("Direct linked task",{exact:true}).waitFor()
  assert.equal(writes,0)
  console.log("Postquote browser PASS: lazy reads, precise evidence, legacy separation, no writes, status honesty, keyboard/navigation, account isolation, loading/error/local modes, five locales and mobile layout.")
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1})
