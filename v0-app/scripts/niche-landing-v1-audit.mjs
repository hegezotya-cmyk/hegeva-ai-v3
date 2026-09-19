import fs from "node:fs"

const routes = [
  "for-electricians",
  "for-builders",
  "for-plumbers",
  "for-cleaners",
  "for-property-maintenance",
  "for-consultants",
]

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const component = read("components/growth/niche-landing.tsx")
const tracking = read("lib/conversion-tracking.ts")
const consent = read("components/analytics-consent.tsx")
const sitemap = read("app/sitemap.ts")

const expect = (condition, message) => {
  if (!condition) throw new Error(`Niche Landing V1 audit failed: ${message}`)
}

for (const route of routes) {
  const page = read(`app/${route}/page.tsx`)
  expect(page.includes("NicheLanding"), `${route} component missing`)
  expect(page.includes(`canonical: "/${route}"`), `${route} canonical missing`)
  expect(tracking.includes(`"/${route}"`), `${route} public analytics path missing`)
  expect(consent.includes(`"/${route}"`), `${route} landing analytics path missing`)
  expect(sitemap.includes(`'/${route}'`), `${route} sitemap entry missing`)
}
expect(component.includes('href="/challenge"'), "challenge CTA missing")
expect(component.includes('source: "niche_landing"'), "niche CTA analytics missing")
expect(component.includes("Nothing is sent automatically."), "approval-first copy missing")
expect(!component.includes("guarantee") && !component.includes("save hours"), "unsupported marketing claim detected")
console.log("HEGEVA Niche Landing V1 audit PASS")
