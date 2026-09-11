// Local UI certification only. API and GA network are stubbed; no production writes.
const assert = require('node:assert/strict')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
;(async () => {
  const browser = await chromium.launch({channel: 'chrome', headless: true})
  try {
    const context = await browser.newContext({viewport: {width: 390, height: 844}})
    // Keep evidence outside the document: production static navigation creates a new dataLayer.
    const recordedEvents = []
    await context.exposeBinding('recordConversionEvent', (_, event) => recordedEvents.push(event))
    await context.addInitScript(() => {
      window.dataLayer = []
      window.dataLayer.push = function (...items) {
        for (const item of items) if (item?.[0] === 'event') window.recordConversionEvent([item[0], item[1], JSON.parse(JSON.stringify(item[2] || {}))])
        return Array.prototype.push.apply(this, items)
      }
    })
    await context.route('**/api/**', route => route.fulfill({status: route.request().url().includes('/core/decide') ? 401 : 200, contentType: 'application/json', body: 'null'}))
    await context.route('**/*googletagmanager.com/**', route => route.fulfill({status: 200, contentType: 'application/javascript', body: ''}))
    await context.route('**/*google-analytics.com/**', route => route.abort())
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push({path: new URL(page.url()).pathname, message: error.message}))
    const base = process.env.TEST_BASE_URL || 'http://localhost:3092'
    const events = async () => [...recordedEvents]
    await page.goto(base + '/?utm_source=facebook&utm_medium=social&utm_campaign=less_admin&utm_content=video_1&email=do-not-collect@example.com')
    await page.getByRole('button', {name: 'Allow analytics', exact: true}).waitFor()
    assert.equal((await events()).length, 0)
    assert.equal(await page.locator('#hegeva-google-analytics').count(), 0)
    await page.getByRole('button', {name: 'Allow analytics', exact: true}).click()
    await page.waitForFunction(() => window.dataLayer?.some(x => x[0] === 'event' && x[1] === 'landing_page_view'))
    assert.equal((await events()).filter(x => x[1] === 'landing_page_view').length, 1)
    assert.equal(await page.locator('#hegeva-google-analytics').count(), 1)
    assert.equal((await events())[0][2].campaign_content, 'video_1')
    assert.equal(JSON.stringify(await page.evaluate(() => window.dataLayer)).includes('do-not-collect'), false)
    await page.getByRole('button', {name: 'Privacy choices', exact: true}).click()
    await page.getByRole('button', {name: 'Allow analytics', exact: true}).click()
    assert.equal((await events()).filter(x => x[1] === 'landing_page_view').length, 1)
    assert.equal(await page.locator('#hegeva-google-analytics').count(), 1)
    assert.match(await page.locator('h1').innerText(), /Less admin/)
    assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).href, 'https://hegevaai.co.uk/')
    const cta = page.locator('[data-acquisition-event="primary_cta_click"]')
    const box = await cta.boundingBox()
    console.log('Mobile CTA bounds:', JSON.stringify(box))
    assert(box && box.height >= 44)
    await page.screenshot({path: 'conversion-v2-mobile.png', fullPage: true})
    await cta.click()
    await page.waitForURL('**/login?mode=register')
    await page.locator('input[autocomplete="name"]').waitFor()
    assert.equal((await events()).filter(x => x[1] === 'primary_cta_click').length, 1)
    assert.equal((await events()).filter(x => x[1] === 'registration_start').length, 1)
    assert.equal((await events()).filter(x => x[1] === 'registration_completed').length, 0)
    await page.goto(base + '/pricing')
    await page.waitForFunction(() => window.dataLayer?.some(x => x[1] === 'pricing_view'))
    assert.equal((await events()).filter(x => x[1] === 'pricing_view').length, 1)
    assert.equal((await events()).find(x => x[1] === 'pricing_view')[2].campaign_source, 'facebook')
    await page.getByRole('button', {name: 'Privacy choices', exact: true}).click()
    await page.getByRole('button', {name: 'Essential only', exact: true}).click()
    const count = (await events()).length
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('hegeva:analytics-event', {detail: {event:'registration_completed',path:'/login'}})))
    assert.equal((await events()).length, count)
    assert.equal(await page.evaluate(() => sessionStorage.getItem('hegeva:campaign:v1')), null)
    await page.goto(base)
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({width, height: 900})
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `overflow at ${width}`)
    }
    await page.screenshot({path: 'conversion-v2-desktop.png', fullPage: true})
    for (const [locale, headline] of [['en','Less admin.'],['hu','Kevesebb admin.'],['de','Weniger Verwaltung.'],['fr','Moins d’administratif.'],['es','Menos papeleo.']]) {
      await page.evaluate(locale => localStorage.setItem('hegeva.locale', locale), locale)
      await page.setViewportSize({width: 390, height: 844})
      await page.reload()
      await page.getByRole('heading', {level: 1}).filter({hasText: headline}).waitFor()
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `locale overflow: ${locale}`)
      assert.equal(await page.locator('[data-acquisition-event="primary_cta_click"]:visible').getAttribute('href'), '/login?mode=register')
    }
    assert.deepEqual(errors, [])
    await context.close()
    // Exercise the actual form with isolated auth responses, not synthetic success events.
    for (const outcome of ['rejected', 'missing-session', 'mismatched-session', 'success', 'success-without-consent']) {
      const testContext = await browser.newContext()
      await testContext.addInitScript(consent => localStorage.setItem('hegeva:analytics-consent:v1', consent), outcome === 'success-without-consent' ? 'denied' : 'granted')
      let submitted = false
      const user = {id: 'conversion-fixture', name: 'Test', email: 'conversion@example.invalid', emailVerified: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()}
      await testContext.route('**/api/**', async route => {
        const url = new URL(route.request().url())
        if (url.pathname.endsWith('/sign-up/email')) {
          submitted = true
          return route.fulfill({status: outcome === 'rejected' ? 400 : 200, contentType: 'application/json', body: JSON.stringify(outcome === 'rejected' ? {code:'USER_ALREADY_EXISTS', message:'Test rejection'} : {token:'fixture-token',user})})
        }
        const hasSession = submitted && !['rejected','missing-session'].includes(outcome)
        const body = url.pathname.endsWith('/get-session') && hasSession ? {user:{...user,id: outcome === 'mismatched-session' ? 'other-fixture' : user.id},session:{id:'fixture-session',userId:user.id,token:'fixture-token',expiresAt:'2099-01-01T00:00:00.000Z'}} : null
        return route.fulfill({status: url.pathname.includes('/core/decide') ? 401 : 200, contentType:'application/json',body:JSON.stringify(body)})
      })
      await testContext.route('**/*googletagmanager.com/**', route => route.fulfill({status:200,contentType:'application/javascript',body:''}))
      await testContext.route('**/*google-analytics.com/**', route => route.abort())
      const testPage = await testContext.newPage()
      await testPage.goto(base + '/login?mode=register&callbackURL=%2Fpricing')
      await testPage.locator('input[autocomplete="name"]').fill('Test')
      await testPage.locator('input[type="email"]').fill(user.email)
      await testPage.locator('input[type="password"]').fill('Local-fixture-only-123')
      await testPage.locator('button[type="submit"]').click()
      if (['rejected','missing-session'].includes(outcome)) {
        await testPage.getByText('Authentication failed.', {exact:false}).waitFor()
      } else { await testPage.waitForURL('**/pricing') }
      const emitted = await testPage.evaluate(() => (window.dataLayer || []).filter(x => x[0] === 'event' && x[1] === 'registration_completed'))
      assert.equal(emitted.length, outcome === 'success' ? 1 : 0, outcome)
      assert.equal(JSON.stringify(await testPage.evaluate(() => window.dataLayer || [])).includes(user.email), false)
      await testContext.close()
    }
    console.log('PASS: consent, event deduplication, campaign persistence, PII exclusion, registration entry, pricing, revocation, mobile overflow, metadata, runtime.')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
