const assert = require("node:assert/strict")
const { test } = require("node:test")
const { chromium } = require("playwright")
const base = process.env.TEST_BASE_URL || "http://localhost:3018"

async function fixture(run) {
  const browser = await chromium.launch({headless:true})
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},timezoneId:"Europe/London"})
    await context.addInitScript(()=>{localStorage.setItem("hegeva.locale","en");localStorage.setItem("hegeva:analytics-consent:v1","denied")})
    await context.route("**/api/**",route=>{
      const path=new URL(route.request().url()).pathname
      const data=path.includes("get-session") ? {session:{id:"s",userId:"review",token:"fixture",expiresAt:"2099-01-01"},user:{id:"review",name:"Review",email:"review@example.invalid",emailVerified:true}} : {data:path.endsWith("/customers")?Array.from({length:12},(_,i)=>({id:String(i).padStart(2,"0"),title:`Customer ${i}`,customerStatus:"active",followUp:"2026-06-05",createdAt:"2025-01-01"})):[]}
      return route.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":base,"access-control-allow-credentials":"true"},body:JSON.stringify(data)})
    })
    const page=await context.newPage()
    await page.clock.setFixedTime(new Date("2026-06-05T00:30:00+01:00"))
    await page.goto(`${base}/business/customers`,{waitUntil:"domcontentloaded"})
    await page.getByText("Cloud synced",{exact:true}).waitFor()
    await page.getByRole("button",{name:"Re-engage customers",exact:true}).click()
    await page.locator("article").first().waitFor()
    await run(page)
  } finally {await browser.close()}
}

test("London midnight eligibility, badge and completion use the same calendar day",()=>fixture(async page=>{
  await page.getByText("Follow-up today",{exact:true}).first().waitFor({timeout:2000})
  assert.equal(await page.getByRole("button",{name:"Complete follow-up",exact:true}).count(),12)
}))
test("keyboard preparation reveals editor and close restores the originating control",()=>fixture(async page=>{
  const trigger=page.getByRole("button",{name:"Prepare message",exact:true}).last()
  await trigger.focus(); await page.keyboard.press("Enter")
  const editor=page.getByRole("textbox",{name:"Message text",exact:true})
  await editor.waitFor()
  assert.equal(await editor.evaluate(el=>el===document.activeElement),true)
  const bounds=await editor.boundingBox()
  assert.ok(bounds.y>=0 && bounds.y<844,"Editor must be scrolled into view")
  await page.getByRole("button",{name:"Close preview",exact:true}).click()
  assert.equal(await trigger.evaluate(el=>el===document.activeElement),true)
}))
test("editing during pending copy never claims the newer text was copied",()=>fixture(async page=>{
  await page.getByRole("button",{name:"Prepare message",exact:true}).first().click()
  const editor=page.getByRole("textbox",{name:"Message text",exact:true})
  await page.evaluate(()=>Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:()=>new Promise(resolve=>{window.finishCopy=resolve})}}))
  await page.getByRole("button",{name:"Copy text",exact:true}).click()
  await editor.fill("New uncopied text")
  await page.evaluate(()=>window.finishCopy())
  await page.waitForTimeout(100)
  assert.equal(await page.getByText("Copied",{exact:true}).count(),0)
  assert.equal(await page.getByRole("button",{name:"Copy text",exact:true}).isEnabled(),true)
}))
