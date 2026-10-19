import fs from "node:fs"

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const route = read("app/go/[slug]/page.tsx")
const tracking = read("lib/conversion-tracking.ts")
const playbook = read("docs/growth-distribution-v2.md")

const expect = (condition, message) => {
  if (!condition) throw new Error(`Distribution V2 audit failed: ${message}`)
}

const requiredRoutes = {
  "li-challenge": ["/challenge", "linkedin", "v2_challenge"],
  "li-consultants": ["/for-consultants", "linkedin", "v2_consultants"],
  "fb-small-business": ["/free-tools", "facebook", "v2_free_tools"],
  "fb-electricians": ["/for-electricians", "facebook", "v2_electricians"],
  "fb-builders": ["/for-builders", "facebook", "v2_builders"],
  "fb-plumbers": ["/for-plumbers", "facebook", "v2_plumbers"],
  "fb-cleaners": ["/for-cleaners", "facebook", "v2_cleaners"],
  "fb-property": ["/for-property-maintenance", "facebook", "v2_property"],
  "reddit-free-tools": ["/free-tools", "reddit", "v2_free_tools"],
  "ig-challenge": ["/challenge", "instagram", "v2_challenge"],
  "tt-challenge": ["/challenge", "tiktok", "v2_challenge"],
  "yt-challenge": ["/challenge", "youtube", "v2_challenge"],
  "sc-challenge": ["/challenge", "snapchat", "v2_challenge"],
}

for (const [slug, [destination, source, content]] of Object.entries(requiredRoutes)) {
  expect(route.includes(`"${slug}"`), `missing route ${slug}`)
  expect(route.includes(`${destination}?utm_source=${source}&utm_medium=organic&utm_campaign=hegeva_growth_2026&utm_content=${content}`), `route mismatch ${slug}`)
}

for (const platform of ["li","fb","ig","tt","yt","sc"]) {
  for (const video of ["v1","v2","v3"]) {
    expect(route.includes(`"${platform}-${video}"`), `missing per-video route ${platform}-${video}`)
  }
}

for (const content of ["v2_challenge","v2_consultants","v2_free_tools","v2_electricians","v2_builders","v2_plumbers","v2_cleaners","v2_property"]) {
  expect(tracking.includes(`"${content}"`), `tracking allowlist missing ${content}`)
}

expect(route.includes('redirect(routes[slug] || "/challenge")'), "safe fallback missing")
expect(playbook.includes("Organic only. No paid promotion."), "organic-only publishing rule missing")
expect(playbook.includes("Do not claim guaranteed savings"), "truthful marketing boundary missing")
expect(playbook.includes("https://hegevaai.co.uk/go/fb-electricians"), "electrician publishing link missing")
expect(playbook.includes("https://hegevaai.co.uk/go/reddit-free-tools"), "Reddit publishing link missing")

console.log("HEGEVA Distribution V2 audit PASS")
