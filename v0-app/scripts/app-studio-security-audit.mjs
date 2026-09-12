import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"
const source = fs.readFileSync(new URL("../lib/app-studio-security-scan.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { scanGeneratedProject } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
assert.equal(scanGeneratedProject("<script>const ok = 1</script>").ok, true)
const risky = scanGeneratedProject("<script src=\"https://evil.test/a.js\"></script>\n<script>eval(input)</script>")
assert.equal(risky.ok, false)
assert.ok(risky.findings.some((finding) => finding.code === "remote-script"))
assert.ok(risky.findings.some((finding) => finding.code === "dynamic-code"))
console.log("App Studio security audit passed")
