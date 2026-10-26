import assert from "node:assert/strict"
import fs from "node:fs"

const root = new URL("../", import.meta.url)
const read = (path) => fs.readFileSync(new URL(path, root), "utf8")
const rail = read("components/desktop-command-rail.tsx")
const mobileDock = read("components/mobile-action-dock.tsx")
const packageJson = read("package.json")

assert.match(rail, /"\/business\/money-today"/)
assert.match(mobileDock, /"\/business\/money-today"/)
assert.equal(JSON.parse(packageJson).scripts["audit:money-today"], "node scripts/money-today-audit.mjs")

console.log("Money Today navigation audit passed.")
