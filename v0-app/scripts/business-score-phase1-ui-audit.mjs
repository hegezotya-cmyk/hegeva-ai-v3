import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const panelPath = join(root, "components/growth/workspace-business-check.tsx")
assert.equal(existsSync(panelPath), true, "authenticated Business Check panel must exist")
const panel = readFileSync(panelPath, "utf8")
const challenge = readFileSync(join(root, "components/growth/sixty-second-challenge.tsx"), "utf8")

assert.match(panel, /calculateBusinessScoreFromWorkspace/, "panel must use the deterministic workspace mapper")
assert.match(panel, /=== "cloud"/, "authenticated score must wait for cloud-scoped workspace data")
assert.doesNotMatch(panel, /customerSync === "cloud" && invoiceSync === "cloud" && taskSync === "cloud"/, "two cloud-backed categories must not wait for a third source")
assert.match(panel, /const canRenderScore = scoreResult\.state === "ready"/, "panel must render once two supported cloud-backed categories are evidenced")
assert.doesNotMatch(panel, /setItems\s*\(/, "Business Check must not mutate workspace records")
assert.doesNotMatch(panel, /fetch\s*\(\s*[`\"]\/api\/workspace/, "Business Check must not bypass the existing authenticated workspace hook")
for (const locale of ["en:", "hu:", "de:", "fr:", "es:"]) assert.ok(panel.includes(locale), `missing visible locale: ${locale}`)
assert.match(panel, /not enough supported workspace data/i, "truthful incomplete-data state must be visible")
assert.match(challenge, /WorkspaceBusinessCheck/, "Challenge must mount the authenticated score panel")
assert.match(challenge, /DEMO BUSINESS — FICTIONAL DATA/, "public Challenge must remain explicitly fictional")

console.log("Business Score Phase 1 UI/privacy audit: PASS")
