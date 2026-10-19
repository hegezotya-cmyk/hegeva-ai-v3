import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const css = readFileSync(resolve(appRoot, "app/globals.css"), "utf8")
const logo = readFileSync(resolve(appRoot, "components/hegeva-logo.tsx"), "utf8")
const core = readFileSync(resolve(appRoot, "components/command-center/core-decision-surface.tsx"), "utf8")
const opportunityExecutive = readFileSync(resolve(appRoot, "components/command-center/opportunity-executive-v2.tsx"), "utf8")
const foundationStart = css.indexOf("/* Visual System V4 foundation.")
const foundationEnd = css.indexOf("/* Cinematic black-gold atmosphere", foundationStart)
const foundation = css.slice(foundationStart, foundationEnd)

assert.match(css, /--v4-ink:/, "Visual System V4 must define its shared ink token")
assert.match(css, /\.v4-core-zone\s*\{/, "Core must have a scoped V4 visual surface")
assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/, "V4 must preserve reduced-motion support")
assert.doesNotMatch(css, /\.v4-core-zone\s*\{[^}]*animation:/s, "Core surfaces must not simulate activity")
assert.match(logo, /hegeva-logo-gold-official\.png/, "The official gold logo must remain the authority")
assert.match(css, /\.v4-brand-lockup img\s*\{[^}]*max-width:\s*100%/s, "Logo containment must prevent intrinsic-width overflow")
assert.match(core, /v4-core-zone/, "Core must opt into the V4 visual surface")
assert.match(core, /noSignalsData/, "Core must retain its truthful no-data state")
assert.doesNotMatch(core, /setInterval|\bfake\b|\bsimulated\b/i, "Core must not introduce fake activity")
assert.ok(foundationStart >= 0 && foundationEnd > foundationStart, "V4 foundation must remain a single ordered source section")
assert.doesNotMatch(foundation, /@media\s+print|public-document-view/, "V4 app-shell styling must not enter document print surfaces")
assert.match(opportunityExecutive, /hu:\{[^\n]*good:"Jó"[^\n]*Figyelmet igényel[^\n]*prioritás[^\n]*lehetőség[^\n]*Miért fontos[^\n]*Következő lépés/s, "Hungarian Executive Today copy must retain its accented characters")
assert.match(opportunityExecutive, /de:\{[^\n]*Aufmerksamkeit nötig[^\n]*Prioritäten[^\n]*Nächster Schritt[^\n]*genügend[^\n]*für/s, "German Executive Today copy must retain its accented characters")
assert.match(opportunityExecutive, /fr:\{[^\n]*À surveiller[^\n]*priorités[^\n]*opportunité[^\n]*étape[^\n]*données étayées/s, "French Executive Today copy must retain its accented characters")
assert.match(opportunityExecutive, /es:\{[^\n]*atención[^\n]*Crítico[^\n]*Por qué[^\n]*Aún no/s, "Spanish Executive Today copy must retain its accented characters")

console.log("Visual System V4 source audit: PASS")
