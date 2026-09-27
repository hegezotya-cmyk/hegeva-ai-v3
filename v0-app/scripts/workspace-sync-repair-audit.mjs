import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"

const source = fs.readFileSync(new URL("../../public/modules/v3543-cloud-sync-repair.js", import.meta.url), "utf8")
const local = new Map([
  ["hegeva_v3540_workspace_notes", "newer local notes"],
  ["hegeva_v3540_workspace_updated", "2026-09-28T12:00:00.000Z"],
])
const notes = { value: "" }
const listeners = new Map()
const apiCalls = []

const context = {
  console,
  setTimeout,
  setInterval,
  clearInterval,
  window: {},
  document: {
    readyState: "complete",
    body: { dataset: { authenticated: "true" } },
    getElementById(id) {
      if (id === "v3540WorkspaceNotes") return notes
      return null
    },
    addEventListener(name, fn) {
      listeners.set(name, fn)
    },
  },
  localStorage: {
    getItem(key) { return local.has(key) ? local.get(key) : null },
    setItem(key, value) { local.set(key, String(value)) },
    removeItem(key) { local.delete(key) },
  },
  fetch: async (url, options) => {
    apiCalls.push({ url, options })
    return {
      status: 200,
      ok: true,
      async json() {
        return {
          found: true,
          data: {
            hegeva_v3540_workspace_notes: "stale cloud notes",
            hegeva_v3540_workspace_updated: "2026-09-27T12:00:00.000Z",
          },
        }
      },
    }
  },
}

vm.runInNewContext(source, context, { filename: "v3543-cloud-sync-repair.js" })
assert.ok(context.window.hegevaV3543CloudSyncRepair, "sync repair module should expose its API")
await context.window.hegevaV3543CloudSyncRepair.restoreWorkspace()

assert.equal(local.get("hegeva_v3540_workspace_notes"), "newer local notes", "older cloud data must not overwrite newer local notes")
assert.equal(local.get("hegeva_v3540_workspace_updated"), "2026-09-28T12:00:00.000Z", "newer local timestamp must remain authoritative")
assert.equal(notes.value, "", "stale cloud restore must not update the visible notes field")
assert.equal(apiCalls.length, 1, "restore should use the existing authenticated read path once")
console.log("Workspace sync repair audit passed: newer local cache wins over stale cloud data")