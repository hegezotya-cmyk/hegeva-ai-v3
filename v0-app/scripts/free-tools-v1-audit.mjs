import fs from "node:fs"

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const hub = read("components/growth/free-tools-hub.tsx")
const helpers = read("lib/free-growth-tools.ts")
const page = read("app/free-tools/page.tsx")
const attribution = read("components/acquisition/acquisition-attribution.tsx")
const consent = read("components/analytics-consent.tsx")
const tracking = read("lib/conversion-tracking.ts")
const sitemap = read("app/sitemap.ts")

const expect = (condition, message) => {
  if (!condition) throw new Error(`Free Tools V1 audit failed: ${message}`)
}

for (const tool of ["Invoice Chaser","Quote Follow-up","Admin Cost Calculator","Business Check","Customer Follow-up Writer"]) {
  expect(hub.includes(tool), `tool missing: ${tool}`)
}
expect(hub.includes("No AI provider call"), "zero-provider disclosure missing")
expect(hub.includes("nothing is sent automatically"), "no-send disclosure missing")
expect(!hub.includes("fetch("), "free tools must not call APIs")
expect(!hub.includes("window.gtag"), "free tools must not call GA4 directly")
expect(helpers.includes("estimateAnnualAdminCost"), "admin calculator helper missing")
expect(helpers.includes("businessCheckScore"), "business check helper missing")
expect(page.includes('canonical: "/free-tools"'), "free tools canonical missing")
expect(attribution.includes('"free_tool_use"') && attribution.includes('"free_tool_cta_click"'), "free tool analytics types missing")
expect(consent.includes('"free_tool_use"') && consent.includes('"free_tool_cta_click"'), "free tool consent allowlist missing")
expect(tracking.includes('"/free-tools"'), "free tools public analytics path missing")
expect(sitemap.includes("'/free-tools'"), "free tools sitemap entry missing")
console.log("HEGEVA Free Tools V1 audit PASS")
