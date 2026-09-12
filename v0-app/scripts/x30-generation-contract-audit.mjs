import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const root = new URL("../", import.meta.url)
const source = fs.readFileSync(new URL("lib/x30/generation-contract.ts", root), "utf8")
const brief = fs.readFileSync(new URL("lib/x30/structured-brief.ts", root), "utf8")
const schema = fs.readFileSync(new URL("lib/x30/schema.ts", root), "utf8")
const renderer = fs.readFileSync(new URL("components/x30/safe-renderer.tsx", root), "utf8")

assert(source.includes('X30_GENERATION_SCHEMA_VERSION = "0.1"'), "request/result version must be explicit")
for (const marker of ["X30GenerationRequest", "X30GenerationResult", "x30-generation-request", "x30-generation-result", "preview-only", "not-started", "attemptNumber: 1"]) assert(source.includes(marker), `missing generation contract marker: ${marker}`)
for (const marker of ["targetUsers", "primaryGoal", "requiredPages", "requiredCapabilities", "visualDirection", "dataSensitivity", "deploymentIntent"]) assert(source.includes(marker), `missing bounded brief projection field: ${marker}`)
assert(!source.includes("projectName: valid.brief.projectName"), "project name must not enter the AI-safe projection")
for (const marker of ["8 * 1024", "10 * 1024", "TextEncoder", "MAX_DEPTH", "MAX_STRING", "MAX_ARRAY"]) assert(source.includes(marker), `missing size/depth bound: ${marker}`)
for (const marker of ["__proto__", "prototype", "constructor", "unsafe_key", "unexpected_field", "invalid_type"]) assert(source.includes(marker), `missing strict validation marker: ${marker}`)
for (const marker of ["<\\/?(?:!doctype", "javascript:", "dangerouslySetInnerHTML", "new\\s+Function", "dynamic\\s+import"]) assert(source.includes(marker), `missing unsafe output rejection: ${marker}`)
assert(source.includes("validateX30Spec(value.spec)"), "ready results must pass the existing X30 schema validator")
assert(source.includes("mapX30BriefToSpec"), "simulator must use the existing deterministic mapper")
assert(source.includes("simulateX30Generation"), "deterministic simulator must exist")
assert(!source.includes("fetch(") && !source.includes("AI.run") && !source.includes("localStorage") && !source.includes("sessionStorage"), "Phase A must have no provider or persistence path")
assert(!source.includes("setTimeout") && !source.includes("setInterval") && !source.includes("queue") && !source.includes("cron"), "Phase A must have no background execution")
assert(brief.includes("validateX30Brief") && schema.includes("validateX30Spec") && renderer.includes("SafeX30Renderer"), "existing validation and renderer boundaries must remain present")
assert(!source.includes("targetUsers: request.brief.targetUsers") && !source.includes("primaryGoal: request.brief.primaryGoal"), "raw freeform brief text must not enter the generated spec")
assert(brief.includes("brief-item-") && brief.includes('id: "brief-hero"'), "simulator output must use deterministic presentation IDs")
console.log("X30 generation contract audit passed: strict v0.1 contracts, deterministic no-provider simulation and fail-closed safety boundaries")
