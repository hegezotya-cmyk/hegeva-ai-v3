import { readFileSync } from "node:fs"

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const hero = read("components/home/hero.tsx")
const rail = read("components/desktop-command-rail.tsx")
const dock = read("components/mobile-action-dock.tsx")
const css = read("app/globals.css")
const dashboard = read("components/home/command-dashboard.tsx")

const assert = (condition, message) => { if (!condition) throw new Error(`Homepage visual contract failed: ${message}`) }
assert(hero.includes("hero-artwork-layer") && hero.includes("hegeva-hero-owner-final.png"), "hero artwork must be isolated from live copy")
assert(!hero.includes("hegeva-home-cinematic-v2.png"), "full screenshot artwork must never sit behind live content")
assert(hero.includes("t.hero.titleLine1") && hero.includes("t.hero.titleLine2") && hero.includes("t.hero.titleLine3"), "live headline must remain semantic and unique")
assert(hero.includes('href="/command-center"') && hero.includes('href="/assistant"'), "both live hero CTAs must retain working routes")
assert(css.includes(".hero-artwork-layer") && css.includes("overflow:hidden") && css.includes("@media (max-width:900px){.hero-artwork-layer{display:none}}"), "artwork crop and mobile fallback must be explicit")
assert(css.includes("command-rail-core") && css.includes("mobile-action-dock") && css.includes("prefers-reduced-motion"), "core visual and motion safeguards must remain")
assert(rail.includes("AICore") && rail.includes("/pricing"), "rail core and pricing navigation must remain present")
assert(dock.includes("/business") && /repeat\(5,minmax\(0,1fr\)\)/.test(css), "mobile dock must expose five bounded navigation slots")
assert(dashboard.includes("Nothing is invented") || dashboard.includes("Never a fake number"), "homepage dashboard must retain honest data semantics")
assert(!/video|<iframe|dangerouslySetInnerHTML|eval\(/i.test(hero + dashboard), "homepage must not add heavy or executable presentation paths")
assert(hero.includes("FlagshipSections") || read("components/home/flagship-sections.tsx").includes("home-operating-picture"), "flagship operating picture and workflow must remain live HTML")
console.log("Homepage visual contract audit passed: live semantic hero, isolated artwork, five-slot mobile navigation, honest data and reduced-motion-safe presentation")
