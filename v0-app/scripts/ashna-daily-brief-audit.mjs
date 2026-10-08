import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import ts from "typescript"

const [source, coreSource] = await Promise.all([
  readFile(new URL("../lib/ashna-daily-brief.ts", import.meta.url), "utf8"),
  readFile(new URL("../lib/hegeva-core.ts", import.meta.url), "utf8"),
])
const coreCompiled = ts.transpileModule(coreSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const coreUrl = `data:text/javascript;base64,${Buffer.from(coreCompiled).toString("base64")}`
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText.replace(/from ["']@\/lib\/hegeva-core["']/, `from "${coreUrl}"`)
const briefModule = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`)

const empty = {
  approvedFollowUps: 0,
  followUpsAwaitingApproval: 0,
  overdueInvoices: 0,
  customerFollowUpsDue: 0,
  staleQuotes: 0,
  overdueTasks: 0,
  tasksToday: 0,
  draftInvoices: 0,
  hasRecords: true,
}

const brief = briefModule.buildAshnaDailyBrief({
  ...empty,
  overdueInvoices: 2,
  followUpsAwaitingApproval: 1,
  approvedFollowUps: 1,
})
assert.equal(brief.primary.kind, "complete-followups")
assert.deepEqual(brief.approvals.map((item) => item.kind), ["complete-followups", "review-followups"])
assert.equal(brief.risks.some((item) => item.kind === "overdue-invoices"), true)
assert.equal(brief.preparedActions.every((item) => !["clear", "start"].includes(item.kind)), true)

const component = await readFile(new URL("../components/command-center/ashna-daily-brief.tsx", import.meta.url), "utf8")
for (const token of [
  "Ashna · HEGEVA Core",
  "buildAshnaDailyBrief",
  "Prepared next actions",
  "approval",
  "en:",
  "hu:",
  "de:",
  "fr:",
  "es:",
]) {
  assert.ok(component.includes(token), `Ashna Daily Brief is missing ${token}`)
}
assert.doesNotMatch(component, /fetch\(|method:\s*"(?:POST|PUT|PATCH|DELETE)"|env\.AI|dangerouslySetInnerHTML|eval\(|new Function/)

console.log("Ashna Daily Brief audit passed: deterministic Core priorities, five-language copy, and no automatic actions")
