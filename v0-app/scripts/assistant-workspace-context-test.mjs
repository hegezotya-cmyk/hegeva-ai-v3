import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { hasAssistantWorkspaceData } from "../lib/assistant-workspace-state.mjs"

const component = await readFile(new URL("../components/assistant/assistant-chat.tsx", import.meta.url), "utf8")

assert.match(component, /hasAssistantWorkspaceData/, "Assistant workspace availability must use the complete set of supported record collections")
assert.equal(hasAssistantWorkspaceData({ customers: [], tasks: [], documents: [], invoices: [], drafts: [] }), false, "empty workspace must remain marked empty")
assert.equal(hasAssistantWorkspaceData({ customers: [], tasks: [], documents: [], invoices: [{}], drafts: [] }), true, "invoice-only workspace must be marked available")
assert.equal(hasAssistantWorkspaceData({ customers: [], tasks: [], documents: [], invoices: [], drafts: [{}] }), true, "message-only workspace must be marked available")
assert.equal(hasAssistantWorkspaceData({ customers: [{}], tasks: [], documents: [], invoices: [], drafts: [] }), true, "customer records must remain recognized")
console.log("Assistant workspace context test passed")
