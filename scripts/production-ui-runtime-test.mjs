import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const workflow = readFileSync(new URL("../.github/workflows/v0-ui-auto-deploy.yml", import.meta.url), "utf8")

assert.match(workflow, /uses: actions\/checkout@v5/, "Production UI deployment must use checkout v5")
assert.match(workflow, /uses: actions\/setup-node@v5/, "Production UI deployment must use setup-node v5")
assert.doesNotMatch(workflow, /actions\/(?:checkout|setup-node)@v4/, "Production UI deployment must not rely on deprecated Node 20 actions")

console.log("Production UI workflow runtime: PASS")
