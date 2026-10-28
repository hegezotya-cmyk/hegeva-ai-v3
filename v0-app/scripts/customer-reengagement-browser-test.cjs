const assert = require("node:assert/strict")
const { chromium } = require("playwright")
const base = process.env.TEST_BASE_URL || "http://localhost:3018"

;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId:"Europe/London" })
    await context.addInitScript(() => {
      localStorage.setItem("hegeva:analytics-consent:v1", "denied")
      if (!localStorage.getItem("hegeva.locale")) localStorage.setItem("hegeva.locale", "en")
    })
    let owner = "reengagement-test"
    let writes = 0
    let sends = 0
    const posts = []
    let checking = false
    let releaseLoad
    const loadGate = new Promise(resolve => { releaseLoad=resolve })
    const today = new Date()
    const day = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
    const current = day(today)
    const old = new Date(today); old.setDate(old.getDate()-91)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1)
    let records = [
      { id:"due",title:"Due customer",customerStatus:"active",followUp:current,createdAt:"2025-01-01",customField:"preserve me" },
      { id:"old",title:"Long customer name ".repeat(7),customerStatus:"active",lastContactAt:day(old),createdAt:"2025-01-01" },
      { id:"future",title:"Future customer",customerStatus:"active",followUp:day(tomorrow),lastContactAt:day(old),createdAt:"2025-01-01" },
      { id:"lead",title:"Lead customer",customerStatus:"lead",followUp:current,createdAt:"2025-01-01" },
      { id:"paused",title:"Paused customer",customerStatus:"paused",followUp:current,createdAt:"2025-01-01" },
    ]
    await context.route("**/api/**", async route => {
      const request = route.request(), path = new URL(request.url()).pathname
      const headers = { "access-control-allow-origin":base,"access-control-allow-credentials":"true" }
      const reply = data => route.fulfill({status:200,contentType:"application/json",headers,body:JSON.stringify(data)})
      if(request.method()==="OPTIONS") return reply(null)
      if(path.includes("get-session")) return reply({session:{id:"session",userId:owner,token:"fixture",expiresAt:"2099-01-01T00:00:00Z"},user:{id:owner,name:"Test",email:"test@example.invalid",emailVerified:true,createdAt:"2025-01-01",updatedAt:"2025-01-01"}})
      if(path.includes("/workspace/")) {
        if(request.method()==="PUT") { writes++; if(path.endsWith("/customers")) records=request.postDataJSON().data; return reply({ok:true}) }
        if(path.endsWith("/customers") && checking) await loadGate
        return reply({data:path.endsWith("/customers") ? (owner==="reengagement-test"?records:[]) : []})
      }
      if(request.method()==="POST") { sends++; posts.push(path) }
      return reply(null)
    })
    const page = await context.newPage()
    await page.goto(`${base}/business/customers`,{waitUntil:"domcontentloaded"})
    await page.getByText("Cloud synced",{exact:true}).waitFor()
    await page.getByRole("button",{name:"Re-engage customers",exact:true}).click()
    const articles=page.locator("article")
    await page.getByRole("heading",{name:"Due customer",exact:true}).waitFor()
    assert.equal(await articles.count(),2)
    assert.match(await articles.first().innerText(),/Due customer/)
    assert.equal(await page.getByText("Last contact date: Not recorded",{exact:true}).count(),1)
    const search=page.getByRole("textbox",{name:/Search:/})
    await search.fill("Long customer")
    assert.equal(await articles.count(),1)
    await search.fill("not a customer")
    await page.getByText("No customers match this view",{exact:true}).waitFor()
    await search.fill("")
    const before=writes, beforeSends=sends
    await articles.first().getByRole("button",{name:"Prepare message",exact:true}).click()
    const preview=page.getByRole("region",{name:"Message preview"})
    await preview.waitFor()
    assert.equal(await preview.getByRole("textbox",{name:"Message text"}).evaluate(el=>el===document.activeElement),true,"Preparing a message must move focus to the editor")
    await preview.getByRole("textbox",{name:"Message text"}).fill("Edited preview only")
    await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async text=>{window.copiedText=text}}}))
    await preview.getByRole("button",{name:"Copy text",exact:true}).click()
    await preview.getByText("Copied",{exact:true}).waitFor()
    assert.equal(await page.evaluate(()=>window.copiedText),"Edited preview only")
    await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async()=>{throw new Error("denied")}}}))
    await preview.getByRole("button",{name:"Copy text",exact:true}).click()
    await preview.getByText("Could not copy. Select the text and copy it manually.",{exact:true}).waitFor()
    assert.equal(writes,before); assert.equal(sends,beforeSends)
    await preview.getByRole("button",{name:"Close preview",exact:true}).click()
    await page.getByRole("button",{name:"Edit Due customer",exact:true}).click()
    const contact=page.getByLabel("Last contact date",{exact:true})
    await contact.fill(day(tomorrow))
    await page.getByRole("button",{name:"Update",exact:true}).click()
    assert.equal(writes,before)
    await contact.fill(current)
    await page.getByRole("button",{name:"Update",exact:true}).click()
    await page.waitForFunction(()=>document.body.textContent.includes("Cloud synced"))
    await page.waitForTimeout(900)
    assert.equal(records.find(x=>x.id==="due").lastContactAt,current)
    assert.equal(records.find(x=>x.id==="due").customField,"preserve me")
    await page.reload({waitUntil:"domcontentloaded"})
    await page.getByText("Cloud synced",{exact:true}).waitFor()
    await page.getByRole("button",{name:"Edit Due customer",exact:true}).click()
    assert.equal(await contact.inputValue(),current)
    await page.getByRole("textbox",{name:"Notes",exact:true}).fill("Unrelated note")
    await page.getByRole("button",{name:"Update",exact:true}).click()
    await page.waitForTimeout(900)
    assert.equal(records.find(x=>x.id==="due").lastContactAt,current)
    await page.getByRole("button",{name:"Needs follow-up",exact:true}).click()
    assert.equal(await articles.count(),3)
    await page.getByRole("button",{name:"Re-engage customers",exact:true}).click()
    await articles.first().getByRole("button",{name:"Prepare message",exact:true}).click()
    await preview.getByRole("textbox",{name:"Message text"}).focus()
    await page.keyboard.press("Tab")
    assert.equal(await preview.getByRole("button",{name:"Copy text",exact:true}).evaluate(el=>el===document.activeElement),true)
    for(const width of [390,1440]) {
      await page.setViewportSize({width,height:900})
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
      await page.screenshot({path:`../.superpowers/sdd/2026-10-28-customer-reengagement/preview-${width}.png`,fullPage:true})
    }
    // Deleting the selected customer closes the preview rather than retaining its text.
    await articles.first().getByRole("button",{name:"Delete Due customer",exact:true}).click()
    await preview.waitFor({state:"hidden"})
    await articles.first().getByRole("button",{name:"Prepare message",exact:true}).click()
    // A pending clipboard operation must not update a later account's view.
    await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:()=>new Promise(resolve=>{window.resolveCopy=resolve})}}))
    await preview.getByRole("button",{name:"Copy text",exact:true}).click()
    // Use Better Auth's actual cross-tab session notification contract.
    owner="other-account"
    await page.evaluate(()=>window.dispatchEvent(new StorageEvent("storage",{key:"better-auth.message",newValue:JSON.stringify({event:"session",data:{trigger:"updateUser"}})})))
    await preview.waitFor({state:"hidden",timeout:15000})
    await page.evaluate(()=>window.resolveCopy())
    assert.equal(await page.getByText("Copied",{exact:true}).count(),0)
    assert.deepEqual(posts.filter(path=>/external-actions|send-email|deliver|\/messages\//.test(path)),[])
    // A delayed authenticated load must show checking, not a final empty result.
    checking=true
    const navigation=page.reload({waitUntil:"domcontentloaded"})
    await navigation
    await page.getByText("Checking cloud…",{exact:true}).first().waitFor()
    assert.equal(await page.getByText("No customers match this view",{exact:true}).count(),0)
    checking=false; if(releaseLoad)releaseLoad()
    await page.getByText("Cloud synced",{exact:true}).waitFor()
    for(const [locale,label] of [["hu","Újra megkeresendő"],["de","Kunden erneut kontaktieren"],["fr","Recontacter les clients"],["es","Volver a contactar"]]) {
      await page.evaluate(locale=>localStorage.setItem("hegeva.locale",locale),locale)
      await page.reload({waitUntil:"domcontentloaded"})
      await page.getByRole("button",{name:label,exact:true}).waitFor()
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    }
    // BST midnight is still yesterday in UTC: filtering, badge and completion must agree.
    await page.evaluate(()=>localStorage.setItem("hegeva.locale","en"))
    owner="reengagement-test"
    records=[{id:"midnight",title:"Midnight customer",customerStatus:"active",followUp:"2026-06-05",createdAt:"2025-01-01"}]
    const midnight=await context.newPage()
    await midnight.clock.setFixedTime(new Date("2026-06-05T00:30:00+01:00"))
    await midnight.goto(`${base}/business/customers`,{waitUntil:"domcontentloaded"})
    await midnight.getByText("Cloud synced",{exact:true}).waitFor()
    await midnight.getByRole("button",{name:"Re-engage customers",exact:true}).click()
    await midnight.getByRole("heading",{name:"Midnight customer",exact:true}).waitFor()
    await midnight.getByText("Follow-up today",{exact:true}).waitFor({timeout:3000})
    await midnight.getByRole("button",{name:"Complete follow-up",exact:true}).waitFor({timeout:3000})
    await midnight.close()
    console.log("Customer reengagement browser tests passed: filtering, ranking, search, preview isolation, copy/error, form validation, persistence, account switch, loading and mobile fit.")
  } finally { await browser.close() }
})().catch(error=>{console.error(error);process.exitCode=1})
