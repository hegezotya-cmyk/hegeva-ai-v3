const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.TEST_BASE_URL || 'http://localhost:3021'
;(async () => {
  const browser = await chromium.launch({headless:true})
  try {
    const context = await browser.newContext()
    await context.addInitScript(() => { localStorage.setItem('hegeva.locale','hu'); localStorage.setItem('hegeva:analytics-consent:v1','denied') })
    let used = 0, responseMode = 'delayed', finishAnswer
    const requests = []
    const answerGate = new Promise(resolve => { finishAnswer = resolve })
    await context.route('**/api/**', async route => {
      const req = route.request(), path = new URL(req.url()).pathname
      const reply = (data,status=200) => route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
      if(path.includes('get-session')) return reply({session:{id:'s',userId:'fixture',token:'fixture',expiresAt:'2099-01-01'},user:{id:'fixture',email:'synthetic@example.invalid',name:'Synthetic',emailVerified:true}})
      if(path==='/api/plan/status') return reply({plan:'premium',aiMessages:used,aiLimit:300,aiRemaining:300-used,assistantTopUpCredits:0})
      if(path==='/api/ai/status') return reply({providerEnabled:true,globalKillSwitch:false,assistantEnabled:true,advancedAssistantEnabled:true})
      if(path.includes('/workspace/')) return reply({data:[]})
      if(path==='/api/chat') {
        const body=req.postDataJSON(); requests.push(body)
        if(responseMode==='timeout') return reply({code:'ASSISTANT_TIMEOUT',creditsRefunded:true,assistantOperationId:body.assistantOperationId},504)
        if(responseMode==='delayed') await answerGate
        used+=8
        return reply({response:'Hétfőn válassz célcsoportot. Kedden készíts ajánlatot. Pénteken értékeld a válaszokat.'})
      }
      return reply({ok:true})
    })
    const page=await context.newPage()
    await page.clock.install()
    await page.goto(base+'/assistant')
    const advanced=page.getByRole('radio',{name:/Advanced/})
    await advanced.waitFor({timeout:15000}); await advanced.check()
    const message=page.getByRole('textbox')
    await message.fill('Tervezd meg az ügyfélszerzésemet.')
    await page.getByRole('button',{name:'Küldés',exact:true}).click()
    await page.waitForFunction(()=>document.body.innerText.includes('gondolkodik'))
    await page.clock.fastForward(35000)
    assert.equal(requests.length,1)
    assert.equal(await page.getByText(/A kapcsolat megszakadt/).count(),0,'Advanced browser must wait beyond the old 30-second cutoff')
    finishAnswer()
    await page.getByText(/Hétfőn válassz célcsoportot/).waitFor()
    assert.match(await page.locator('.partner-state').innerText(),/8\/300/)
    responseMode='timeout'
    await message.fill('Ugyanaz a próbálkozás.')
    await page.getByRole('button',{name:'Küldés',exact:true}).click()
    await page.getByText('A válasz túl sokáig tartott. A lefoglalt kreditjeidet visszakaptad. Újra próbálkozhatsz.',{exact:true}).waitFor()
    assert.match(await page.locator('.partner-state').innerText(),/8\/300/)
    assert.equal(requests.length,2,'no automatic retry after timeout')
    const timedOutId=requests[1].assistantOperationId
    responseMode='success'
    await message.fill('Ugyanaz a próbálkozás.')
    await page.getByRole('button',{name:'Küldés',exact:true}).click()
    await page.waitForFunction(()=>document.querySelector('.partner-state')?.innerText.includes('16/300'))
    assert.equal(requests.length,3)
    assert.notEqual(requests[2].assistantOperationId,timedOutId,'explicit retry after confirmed refund needs a new operation identity')
    console.log('Assistant browser reliability PASS: Advanced waits beyond30s, localized confirmed refund, refreshed credits, manual retry fresh identity, no automatic retry')
  } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1})
