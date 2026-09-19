import fs from "node:fs"

const BASE = "https://hegevaai.co.uk"
const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const failures = []
const pass = (name, detail = "") => console.log("PASS", name, detail)
const fail = (name, detail = "") => { failures.push(`${name}: ${detail}`); console.error("FAIL", name, detail) }

const publicRoutes = [
  "/challenge",
  "/for-electricians",
  "/for-builders",
  "/for-plumbers",
  "/for-cleaners",
  "/for-property-maintenance",
  "/for-consultants",
  "/free-tools",
]

const privateRoutes = [
  "/login",
  "/get-started",
  "/account",
  "/assistant",
  "/command-center",
  "/business",
  "/app-studio",
  "/admin",
]

const sitemapSource = read("app/sitemap.ts")
const robotsSource = read("app/robots.ts")

for (const route of publicRoutes) {
  if (sitemapSource.includes(`'${route}'`)) pass("Sitemap source", route)
  else fail("Sitemap source", `missing ${route}`)
}

for (const route of privateRoutes) {
  if (!sitemapSource.includes(`'${route}'`)) pass("Private excluded from sitemap", route)
  else fail("Private excluded from sitemap", `unexpected ${route}`)
  if (robotsSource.includes(`'${route}'`) || route === "/business") pass("Robots private protection", route)
  else fail("Robots private protection", `missing ${route}`)
}

for (const route of publicRoutes.filter(route => route !== "/challenge")) {
  const file = route === "/free-tools"
    ? "app/free-tools/page.tsx"
    : `app${route}/page.tsx`
  const content = read(file)
  if (content.includes(`canonical: "${route}"`)) pass("Canonical source", route)
  else fail("Canonical source", `missing ${route}`)
}

async function fetchText(url, redirect = "follow") {
  const response = await fetch(url, {
    redirect,
    headers: { "user-agent": "HEGEVA-SEO-Audit/1.0" },
  })
  return { response, text: await response.text() }
}

const robots = await fetchText(BASE + "/robots.txt")
if (robots.response.ok) {
  pass("Live robots.txt", String(robots.response.status))
  robots.text.includes("Sitemap: https://hegevaai.co.uk/sitemap.xml")
    ? pass("Live robots sitemap declaration")
    : fail("Live robots sitemap declaration", "missing")
} else fail("Live robots.txt", String(robots.response.status))

const sitemap = await fetchText(BASE + "/sitemap.xml")
if (sitemap.response.ok) {
  pass("Live sitemap.xml", String(sitemap.response.status))
  for (const route of publicRoutes) {
    sitemap.text.includes(`<loc>${BASE}${route}</loc>`)
      ? pass("Live sitemap entry", route)
      : fail("Live sitemap entry", `missing ${route}`)
  }
  for (const route of privateRoutes) {
    !sitemap.text.includes(`<loc>${BASE}${route}</loc>`)
      ? pass("Live sitemap private exclusion", route)
      : fail("Live sitemap private exclusion", `unexpected ${route}`)
  }
} else fail("Live sitemap.xml", String(sitemap.response.status))

for (const route of publicRoutes) {
  const live = await fetchText(BASE + route)
  if (!live.response.ok) {
    fail("Live public page", `${route} HTTP ${live.response.status}`)
    continue
  }
  pass("Live public page", `${route} HTTP ${live.response.status}`)
  const lower = live.text.toLowerCase()
  if (!lower.includes('name="robots" content="noindex') && !lower.includes("noindex,nofollow") && !lower.includes("noindex, nofollow")) {
    pass("No accidental noindex", route)
  } else {
    fail("No accidental noindex", route)
  }
  if (route !== "/challenge") {
    const canonical = `${BASE}${route}`
    lower.includes("canonical") && live.text.includes(canonical)
      ? pass("Live canonical", route)
      : fail("Live canonical", `missing ${canonical}`)
  }
}

if (failures.length) {
  console.error("\nSEO audit failures:")
  for (const item of failures) console.error("-", item)
  process.exit(1)
}
console.log("\nHEGEVA SEO Distribution V1 audit PASS")
