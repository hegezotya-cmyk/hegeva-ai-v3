// Local fixtures only: every external request and all API calls are intercepted.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { chromium } = require('playwright')
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3017'
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname))
const output = process.env.GROWTH_SCREENSHOT_DIR || '../output/growth-browser'
fs.mkdirSync(output, { recursive: true })

;(async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'en-GB' })
      await context.addInitScript(() => localStorage.setItem('hegeva.locale', 'en'))
      await context.route('**/*', async route => {
        const u = new URL(route.request().url())
        if (u.pathname.startsWith('/api/')) return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' })
        if (u.hostname.includes('googletagmanager') || u.hostname.includes('clarity.ms')) return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
        if (u.origin !== new URL(base).origin) return route.abort()
        return route.continue()
      })
      const page = await context.newPage()
      const events = () => page.evaluate(() => (window.dataLayer || []).filter(x => x[0] === 'event').map(x => Array.from(x)))
      await page.goto(base + '/tt')
      await page.waitForURL(url => url.pathname === '/challenge' && url.searchParams.get('utm_source') === 'tiktok', { timeout: 15000 })
      assert.ok(page.url().includes('/challenge?utm_source=tiktok'), `short link opens attributed challenge: ${page.url()}`)
      await page.getByRole('button', { name: 'Allow analytics', exact: true }).waitFor()
      assert.equal((await events()).length, 0, 'no pre-consent events')
      await page.getByRole('button', { name: 'Allow analytics', exact: true }).click()
      await page.getByRole('button', { name: 'Privacy choices', exact: true }).waitFor()
      await page.getByRole('button', { name: 'START FREE DEMO', exact: true }).click()
      await page.getByRole('button', { name: 'Plumber', exact: true }).click()
      await page.getByRole('button', { name: 'PREPARE ACTION', exact: true }).first().click()
      await page.getByText('Prepared only. Nothing has been sent.', { exact: true }).waitFor()
      for (const event of ['page_view', 'challenge_start', 'challenge_complete']) {
        assert.equal((await events()).filter(x => x[1] === event).length, 1, event + ' once')
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'no horizontal overflow')
      await page.screenshot({ path: `${output}/challenge-${width}.png`, fullPage: true })
      await page.getByRole('link', { name: 'TRY WITH MY BUSINESS', exact: true }).click()
      await page.locator('input[autocomplete="name"]').waitFor()
      await page.waitForFunction(() => (window.dataLayer || []).some(x => x[1] === 'registration_start'))
      for (const event of ['primary_cta_click', 'registration_start']) {
        const rows = (await events()).filter(x => x[1] === event)
        assert.equal(rows.length, 1, event + ' once after navigation')
        assert.equal(rows[0][2].campaign_name, 'uk_trades_nov26')
        assert.equal(rows[0][2].campaign_content, 'bio')
      }
      assert.equal(JSON.stringify(await events()).includes('private@example.invalid'), false)
      assert.equal(await page.getByText('Cloudflare D1 account data', { exact: true }).count(), 0)
      assert.ok(await page.locator('input[autocomplete="name"]').evaluate(el => el.getBoundingClientRect().top < innerHeight), 'first registration field above fold')
      await page.screenshot({ path: `${output}/register-${width}.png`, fullPage: true })
      for (const path of ['/', '/pricing', '/get-started']) {
        await page.goto(base + path)
        await page.locator('main').first().waitFor()
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, path + ' overflow')
        await page.screenshot({ path: `${output}/${path === '/' ? 'home' : path.slice(1)}-${width}.png`, fullPage: true })
        if (path === '/pricing') {
          assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://hegevaai.co.uk/pricing')
          assert.ok((await page.title()).includes('Pricing'))
        }
      }
      await page.goto(base + '/challenge')
      await page.getByRole('button', { name: 'Privacy choices', exact: true }).click()
      await page.getByRole('button', { name: 'Essential only', exact: true }).click()
      const before = (await events()).length
      await page.getByRole('button', { name: 'START FREE DEMO', exact: true }).click()
      assert.equal((await events()).length, before, 'revocation prevents further events')
      assert.equal(await page.evaluate(() => sessionStorage.getItem('hegeva:campaign:v1')), null)
      await context.close()
      console.log(`Growth journey PASS ${width}px: consent, demo, CTA, registration, UTM, privacy, metadata, overflow, revoke`)
    }
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
