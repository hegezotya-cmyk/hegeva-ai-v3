import fs from "node:fs"
import assert from "node:assert/strict"

const workspace = fs.readFileSync(new URL("../components/business/local-workspace.tsx", import.meta.url), "utf8")
const reports = fs.readFileSync(new URL("../components/business/reports.tsx", import.meta.url), "utf8")
const invoices = fs.readFileSync(new URL("../app/business/invoices/page.tsx", import.meta.url), "utf8")
const planner = fs.readFileSync(new URL("../components/business/planner.tsx", import.meta.url), "utf8")
const messages = fs.readFileSync(new URL("../components/business/message-studio.tsx", import.meta.url), "utf8")

assert(/editingId/.test(workspace), "Workspace records must track the record being edited")
assert(/function editItem/.test(workspace), "Workspace records must expose an edit workflow")
assert(/current\.map\(\(item\) => item\.id === existing\.id \? next : item\)/.test(workspace), "Workspace edits must update the matching persisted record")
assert(/existing\?\.createdAt/.test(workspace), "Workspace edits must preserve the original creation timestamp")
assert(/if \(editingId === item\.id\) resetForm\(\)/.test(workspace), "Deleting the active record must clear edit state")

assert(/useWorkspaceData<Invoice>\("invoice_documents"\)/.test(reports), "Reports must use real saved invoice data")
assert(/invoice\.status === "paid"/.test(reports), "Reports must distinguish paid invoice value")
assert(/invoice\.status !== "paid" && invoice\.status !== "sent"/.test(reports), "Reports must exclude drafts and quotes from financial totals")
assert(/new Intl\.NumberFormat/.test(reports), "Report money values must be currency-aware")
assert(/invoiceSync/.test(reports), "Report integrity must include invoice cloud state")

assert(/setDocs\(\(current\)=>\[stored,\.\.\.current\.filter/.test(invoices), "Invoices must support persisted updates")
assert(/done: !t\.done/.test(planner), "Planner tasks must support completion updates")
assert(/function editTask/.test(planner) && /current\.map\(\(task\) => task\.id === existing\.id \? next : task\)/.test(planner), "Planner tasks must support persisted edits")
assert(/setDrafts/.test(messages) && /navigator\.clipboard/.test(messages), "Message drafts must persist and support copying")
assert(/function editDraft/.test(messages) && /current\.map\(\(draft\) => draft\.id === existing\.id \? next : draft\)/.test(messages), "Message drafts must support persisted edits")

console.log("Product readiness audit passed: editable business records, real invoice reporting, invoice updates, planner completion, and message persistence")
