import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"
const source = fs.readFileSync(new URL("../lib/preview-sandbox.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { sandboxPreviewDocument } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)
const result = sandboxPreviewDocument("<!doctype html><html><head></head><body><script>document.body</script></body></html>")
assert.match(result, /Content-Security-Policy/)
assert.match(result, /connect-src 'none'/)
assert.match(result, /form-action 'none'/)
assert.equal(sandboxPreviewDocument(result), result)
console.log("Preview sandbox audit passed")
