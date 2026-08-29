import assert from "node:assert/strict"
import { buildSync } from "esbuild"
import { mkdtempSync, rmSync } from "node:fs"
import { readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const dir = mkdtempSync(join(tmpdir(), "hegeva-app-studio-"))
const bundle = join(dir, "app-studio-ai.mjs")
try {
  const x10Source = readFileSync(new URL("../components/app-studio/build-my-app-x10-tuned.tsx", import.meta.url), "utf8")
  assert(!/for\s*\(\s*let\s+attempt/.test(x10Source), "X10 must not loop over provider attempts")
  assert.equal((x10Source.match(/runStudioAI\(/g) || []).length, 1, "X10 must have one provider helper call")
  assert(/assistantOperationId:\s*crypto\.randomUUID\(\)/.test(x10Source), "X10 must create its operation before the request")
  buildSync({ entryPoints: ["lib/app-studio-ai.ts"], bundle: true, format: "esm", platform: "browser", outfile: bundle, logLevel: "silent" })
  globalThis.window = { setTimeout, clearTimeout }
  const requests = []
  let mode = "success"
  globalThis.fetch = async (url, init = {}) => {
    assert.equal(url, "/api/chat", "App Studio must use the same internal chat route")
    requests.push(JSON.parse(init.body))
    if (mode === "network") throw new TypeError("network")
    if (mode === "409") return new Response(JSON.stringify({ error: "duplicate" }), { status: 409 })
    if (mode === "429") return new Response(JSON.stringify({ error: "rate limited" }), { status: 429 })
    if (mode === "503") return new Response(JSON.stringify({ error: "unavailable" }), { status: 503 })
    return new Response(JSON.stringify({ response: "safe assistant response" }), { status: 200 })
  }

  const { runStudioAI } = await import(`${pathToFileURL(bundle).href}?v=${Date.now()}`)
  const flows = ["X10 Customer Build", "Prompt enhancement", "Fix repair"]
  for (const flow of flows) {
    const context = { assistantOperationId: crypto.randomUUID() }
    assert.match(context.assistantOperationId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    const before = requests.length
    mode = "network"
    await assert.rejects(() => runStudioAI(`${flow} request`, "en", undefined, context))
    assert.equal(requests.length, before + 1, `${flow}: no automatic retry after network failure`)
    const first = requests.at(-1)
    assert.equal(first.assistantOperationId, context.assistantOperationId)
    assert.equal(first.actionKind, undefined)
    assert.equal(first.startRequestId, undefined)
    assert.equal(first.attemptRequestId, undefined)

    for (const failure of ["429", "503"]) {
      const failureBefore = requests.length
      mode = failure
      await assert.rejects(() => runStudioAI(`${flow} request`, "en", undefined, context))
      assert.equal(requests.length, failureBefore + 1, `${flow}: ${failure} must not auto-retry`)
      assert.equal(requests.at(-1).assistantOperationId, context.assistantOperationId, `${flow}: ${failure} must preserve operation identity`)
    }

    mode = "success"
    await runStudioAI(`${flow} request`, "en", undefined, context)
    assert.equal(requests.at(-1).assistantOperationId, context.assistantOperationId, `${flow}: success must use the pending operation`)
    const nextContext = { assistantOperationId: crypto.randomUUID() }
    await runStudioAI(`${flow} new request`, "en", undefined, nextContext)
    assert.notEqual(requests.at(-1).assistantOperationId, context.assistantOperationId, `${flow}: a new authorized operation must not reuse the retired ID`)
  }
  for (const modeUnderTest of ["success", "409", "429", "503", "network"]) {
    requests.length = 0
    mode = modeUnderTest
    const context = { assistantOperationId: crypto.randomUUID() }
    await assert.rejects(() => runStudioAI("Return only one complete index.html document for a customer app.", "en", undefined, context))
    assert.equal(requests.length, 1, `X10 lifecycle ${modeUnderTest} must issue exactly one intercepted request`)
    const payload = requests[0]
    assert.equal(payload.assistantOperationId, context.assistantOperationId, `X10 lifecycle ${modeUnderTest} must preserve operation identity`)
    assert.equal(payload.actionKind, undefined)
    assert.equal(payload.startRequestId, undefined)
    assert.equal(payload.attemptRequestId, undefined)
  }
  assert(requests.length > 0)
  console.log("Frontend Assistant operation contract audit passed: X10, Prompt enhancement and Fix repair payloads are intercepted with safe operation identity and no X20 metadata")
} finally {
  rmSync(dir, { recursive: true, force: true })
}
