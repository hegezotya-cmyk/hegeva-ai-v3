import assert from "node:assert/strict"
import fs from "node:fs"

const root = new URL("../", import.meta.url)
const read = (path) => fs.readFileSync(new URL(path, root), "utf8")
const boundary = read("lib/app-studio-boundary.ts")
assert.match(boundary, /scanGeneratedProject/)
assert.match(boundary, /sandboxPreviewDocument/)
assert.match(boundary, /severity === "high"/)

for (const file of [
  "components/app-studio/build-my-app-x10-tuned.tsx",
  "components/app-studio/build-my-app-x20-studio-wow.tsx",
  "components/app-studio/fix-my-app.tsx",
]) {
  const source = read(file)
  assert.match(source, /verifyGeneratedHtml/)
  assert.match(source, /preparePreviewHtml/)
}

const exportSource = read("components/app-studio/project-export.tsx")
assert.match(exportSource, /blockingFindings/)
assert.match(exportSource, /verifyGeneratedHtml/)
console.log("App Studio boundary wiring audit: PASS")
