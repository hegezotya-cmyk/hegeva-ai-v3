import assert from "node:assert/strict"
import fs from "node:fs"

const page = fs.readFileSync(new URL("../app/app-studio/x30-alpha/page.tsx", import.meta.url), "utf8")
const renderer = fs.readFileSync(new URL("../components/x30/safe-renderer.tsx", import.meta.url), "utf8")
const css = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8")
const darkLayer = css.slice(css.lastIndexOf("/* X30 authoritative dark presentation"))
const locales = ["en", "hu", "de", "fr", "es"]

for (const locale of locales) assert(new RegExp(`^ ${locale}:`, "m").test(page), `missing X30 locale: ${locale}`)
for (const field of ["runtime", "eyebrow", "intro", "pipeline", "steps", "preview", "schedule", "readOnly", "structured", "rejected", "demoDirection"]) assert(page.includes(`${field}:`), `missing localized X30 field: ${field}`)
assert(page.includes("planner-item-${index}"), "workspace presentation IDs must not copy record IDs")
assert(!page.includes("item.id||") && !page.includes("item.due") && !page.includes("item.title||"), "raw planner identity/content must not enter the presentation spec")
assert(page.includes("rendererLabels") && renderer.includes("X30RendererLabels"), "renderer labels must be typed separately from X30AppSpec")
assert(!renderer.includes('text(item.name,"P")') && renderer.includes("labels.genericAvatar"), "avatar fallback must be localized and explained")
assert(renderer.includes("validateX30Spec(spec)") && !renderer.includes("dangerouslySetInnerHTML") && !renderer.includes("new Function") && !renderer.includes("eval("), "safe renderer enforcement must remain mandatory")
assert(!page.includes("qualityFindings") && !page.includes("evaluateVisualQuality"), "internal quality counts must not be presented as decorative data")
for (const token of [".x30-app", ".x30-hero", ".x30-metrics", ".x30-schedule", ".x30-action", "min-width:0", "overflow-wrap:anywhere"]) assert(css.includes(token), `X30 presentation safeguard missing: ${token}`)
assert(darkLayer.length > 0 && darkLayer.indexOf(".x30-app") > darkLayer.indexOf("legacy"), "authoritative X30 color layer must follow retained legacy structure")
for (const legacySurface of ["#f4f1e8", "#fbfaf5", "#d9d6c9", "#e3e0d6"]) assert(!darkLayer.includes(legacySurface), `authoritative X30 layer must not use legacy surface ${legacySurface}`)
for (const selector of [".x30-app>nav strong", ".x30-app>nav span", ".x30-hero h2", ".x30-metric strong", ".x30-schedule header h3", ".x30-schedule article strong", ".x30-schedule article span", ".x30-schedule svg", ".x30-list h3", ".x30-list strong", ".x30-list small"]) assert(darkLayer.includes(selector), `explicit X30 contrast rule missing: ${selector}`)
for (const accent of ["var(--gold)", "var(--primary)", "var(--cyan)", "var(--violet)"]) assert(css.includes(accent), `semantic X30 accent missing: ${accent}`)
assert(/prefers-reduced-motion/.test(css), "reduced-motion support must remain present")
assert(page.includes('fetch("/api/x30/generate"') && !page.includes("setItems(") && !page.includes("startX20Action") && !page.includes("reserveAIUsage"), "X30 presentation must use only the explicit preview request")
assert(!page.includes("http://") && !page.includes("https://"), "X30 presentation must not add remote assets")

console.log("X30 Presentation audit passed: five-locale boundary labels, privacy-safe aggregate preview, premium dark surfaces and inert renderer")
