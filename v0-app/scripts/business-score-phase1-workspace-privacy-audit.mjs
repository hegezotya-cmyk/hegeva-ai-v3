import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const appRoot = resolve(process.cwd())
const read = (path) => readFileSync(resolve(appRoot, path), "utf8")
const panel = read("components/growth/workspace-business-check.tsx")
const hook = read("lib/use-workspace-data.ts")
const worker = read("../src/index.js")

assert.match(panel, /useWorkspaceData/, "Business Check must reuse the authenticated workspace hook")
for (const expected of [
  /customerSync === "cloud" \? customers : \[\]/,
  /invoiceSync === "cloud" \? invoices : \[\]/,
  /taskSync === "cloud" \? tasks : \[\]/,
]) assert.match(panel, expected, "Business Check must pass only cloud-backed source data to the score")
assert.doesNotMatch(panel, /fetch\s*\(\s*[`\"]\/api\/workspace/, "Business Check must not bypass the workspace hook")
assert.doesNotMatch(panel, /setItems\s*\(/, "Business Check must not mutate workspace records")
assert.match(hook, /fetch\(`\/api\/workspace\/\$\{encodeURIComponent\(type\)\}`/, "workspace hook must use the typed workspace endpoint")
assert.match(hook, /credentials:\s*"include"/, "workspace hook must require the normal authenticated session")
assert.match(worker, /if \(!user\)[\s\S]{0,350}status:\s*401/, "workspace API must reject unauthenticated access")
assert.match(worker, /WHERE userId = \?1\s*AND dataType = \?2/s, "workspace API must bind the authenticated user to the requested type")

console.log("Business Score Phase 1 workspace privacy audit: PASS")
