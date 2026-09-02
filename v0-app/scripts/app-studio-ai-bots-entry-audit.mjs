import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const source = readFileSync(join(root, "app/app-studio/page.tsx"), "utf8")
const assert = (ok, message) => { if (!ok) throw new Error(message) }
assert((source.match(/href="\/app-studio\/ai-bots"/g) || []).length === 1, "expected exactly one AI Bots App Studio entry")
for (const locale of ["en", "hu", "de", "fr", "es"]) assert(source.includes(`${locale}: ["`), `missing ${locale} localized entry`)
assert(source.includes("aiBotsCopy[locale]") && source.includes("CONTROLLED BETA"), "localized controlled beta registry entry missing")
assert(source.includes("<Link href=\"/app-studio/ai-bots\""), "AI Bots entry is not a keyboard-accessible Link")
console.log("App Studio AI Bots entry audit passed")
