import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

const source = fs.readFileSync(new URL("../lib/video-advertisement.ts", import.meta.url), "utf8")
assert.match(source, /VIDEO_BRIEF_VERSION = ["']0\.1["']/)
assert.match(source, /executionState: "not-started"/)
assert.match(source, /providerEvidence: "none" \| "verified"/)
assert.match(source, /provider-approval-required/)
assert.match(source, /new TextEncoder\(\)/)
assert.match(source, /__proto__|prototype|constructor/)
assert.match(source, /No rendering, persistence|no rendering, persistence/i)
assert.doesNotMatch(source, /fetch\s*\(|Workers AI|wrangler|setTimeout\s*\(|setInterval\s*\(|new\s+Function/i)

const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const moduleUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
const contract = await import(moduleUrl)
const brief = {
  schemaVersion: "0.1", kind: "video-advertisement-brief", campaignBrief: "Introduce a trusted service", durationSeconds: 15,
  aspectRatio: "16:9", targetPlatform: "youtube", audience: "Small business owners", voiceTone: "Confident",
  scenes: ["Opening product view", "Benefit demonstration"], productBenefits: ["Clearer operations", "More time"], callToAction: "Learn more", brandColors: ["#d9a441"],
}
const validated = contract.validateVideoBrief(brief)
const first = contract.createVideoStoryboard(validated)
const second = contract.createVideoStoryboard(validated)
assert.deepEqual(first, second)
assert.equal(first.state, "provider-approval-required")
assert.equal(first.executionState, "not-started")
assert.equal(first.providerEvidence, "none")
assert.equal(first.scenes.length, 2)
assert.throws(() => contract.validateVideoBrief({ ...brief, scenes: ["same", "SAME"] }), /duplicate/)
assert.throws(() => contract.validateVideoBrief({ ...brief, campaignBrief: "<script>alert(1)</script>" }), /invalid/)
assert.throws(() => contract.validateVideoBrief({ ...brief, unknown: true }), /unexpected-key/)
assert.throws(() => contract.validateVideoBrief({ ...brief, aspectRatio: "2:1" }), /ratio/)
assert.throws(() => contract.validateVideoBrief({ ...brief, sourceAdvertisement: "https://private.example" }), /invalid/)
console.log("Video advertisement audit passed: bounded brief, deterministic storyboard, honest provider gate, no execution/persistence/provider path")
