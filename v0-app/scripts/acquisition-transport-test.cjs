// Uses the real Google tag, but intercepts collection and all API writes.
// No accounts, quota operations or analytics records are created remotely.
const assert = require('node:assert/strict')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3096'
;(async () => {
  const browser = await chromium.launch({channel: 'chrome', headless: true})
  try {
    for (const mode of ['real-tag', 'blocked-tag', 'no-consent']) {
      const context = await browser.newContext({viewport: {width: 390, height: 844}})
      const hits = [], commands = [], errors = []
      await context.exposeBinding('recordAcquisition', (_, item) => commands.push(item))
      await context.addInitScript(() => {
        window.dataLayer = []
        window.dataLayer.push = function (...items) {
          for (const item of items) if (item?.[0] === 'event') window.recordAcquisition({event:item[1],shape:Object.prototype.toString.call(item)})
          return Array.prototype.push.apply(this, items)
        }
      })
      await context.route('**/api/**', r => r.fulfill({status:r.request().url().includes('/core/decide') ? 401 : 200,contentType:'application/json',body:'null'}))
      await context.route(/https:\/\/([^/]*google-analytics\.com|analytics\.google\.com)\//, r => {
        const request = r.request(), query = new URL(request.url()).searchParams
        for (const line of (request.postData() || '').split('\n')) {
          const body = new URLSearchParams(line)
          const name = body.get('en') || query.get('en')
          if (name) hits.push(name)
        }
        return r.fulfill({status:204,body:''})
      })
      if (mode === 'blocked-tag') await context.route('**/*googletagmanager.com/**', r => r.abort())
      const page = await context.newPage()
      page.on('pageerror', error => errors.push(error.message))
      const response = await page.goto(base)
      assert.equal(response.status(),200)
      await page.getByRole('button',{name:'Allow analytics',exact:true}).waitFor()
      assert.equal(hits.length,0)
      assert.equal(commands.length,0)
      assert.equal(await page.locator('#hegeva-google-analytics').count(),0)
      await page.getByRole('button',{name:mode === 'no-consent' ? 'Essential only' : 'Allow analytics',exact:true}).click()
      if (mode === 'real-tag') {
        await page.waitForFunction(() => Boolean(window.google_tag_manager), {timeout:15000})
      }
      const cta = page.locator('[data-acquisition-event="primary_cta_click"]:visible')
      const box = await cta.boundingBox()
      assert(box.height >= 44 && box.y + box.height <= 844)
      const started = Date.now()
      await cta.click()
      await page.waitForURL('**/login?mode=register')
      await page.locator('input[autocomplete="name"]').waitFor()
      const duration = Date.now() - started
      if (mode === 'real-tag') {
        const deadline = Date.now() + 15000
        while (!hits.includes('registration_start') && Date.now() < deadline) await page.waitForTimeout(200)
        for (const name of ['landing_page_view','primary_cta_click','registration_start']) {
          assert.equal(commands.filter(x => x.event === name).length,1,`command ${name}`)
          assert.equal(hits.filter(x => x === name).length,1,`network ${name}`)
        }
        assert(commands.every(x=>x.shape === '[object Arguments]'))
      } else if (mode === 'no-consent') {
        assert.equal(commands.length,0)
        assert.equal(hits.length,0)
      } else {
        assert(duration < 7000, 'blocked analytics must not strand the customer')
        assert.equal(hits.length,0)
      }
      assert.deepEqual(errors,[])
      console.log(JSON.stringify({mode,result:'PASS',networkEvents:hits,ctaNavigationMs:duration}))
      await context.close()
    }
  } finally { await browser.close() }
})().catch(error=>{console.error(error);process.exitCode=1})
