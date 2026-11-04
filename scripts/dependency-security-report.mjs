// Read-only dependency advisory inventory for root Worker and UI lockfiles.
// Does not change dependencies, lockfiles, settings, or deploy anything.
import { spawnSync } from "node:child_process"
import { appendFileSync } from "node:fs"
import { resolve } from "node:path"
const root = resolve(import.meta.dirname, "..")
const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 }
const targets = [
  ["Worker", root],
  ["UI", resolve(root, "v0-app")],
]
const output = [
  "## HEGEVA dependency security inventory",
  "",
  "Snapshot from npm registry advisories. This is diagnosis, not a security PASS or approval to deploy.",
  "",
]
let errors = 0
for (const [label, cwd] of targets) {
  for (const [mode, extra] of [["all", []], ["production-only", ["--omit=dev"]]]) {
    const result = spawnSync("npm", ["audit", "--json", "--package-lock-only", ...extra], {
      cwd, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 120000,
    })
    let data
    try { data = JSON.parse(result.stdout || "") } catch { data = null }
    if (!data || data.error || !data.vulnerabilities || typeof data.vulnerabilities !== "object") {
      output.push(`### ${label} / ${mode}: audit unavailable`, "Unable to retrieve valid npm advisory JSON (fail-closed).", "")
      errors++
      continue
    }
    const counts = data.metadata?.vulnerabilities || {}
    const vulns = Object.entries(data.vulnerabilities).sort((a, b) =>
      (severityOrder[a[1].severity] ?? 9) - (severityOrder[b[1].severity] ?? 9) || a[0].localeCompare(b[0])
    )
    output.push(`### ${label} / ${mode}`)
    output.push(`- Totals: critical ${counts.critical || 0}, high ${counts.high || 0}, moderate ${counts.moderate || 0}, low ${counts.low || 0}`)
    if (!vulns.length) output.push("- No advisories reported by npm.")
    else {
      output.push("| Package | Severity | Direct | Fix availability | Advisory |", "|---|---|---|---|---|")
      for (const [name, v] of vulns.slice(0, 100)) {
        const fix = typeof v.fixAvailable === "object" && v.fixAvailable
          ? `${v.fixAvailable.name || name}@${v.fixAvailable.version || "?"}${v.fixAvailable.isSemVerMajor ? " (major)" : ""}`
          : v.fixAvailable === true ? "yes" : "no"
        const advisories = (v.via || []).filter(x => x && typeof x === "object")
        const cv = advisories[0]
        const ref = cv && typeof cv.url === "string" && /^https:\/\//.test(cv.url)
          ? `[advisory](${cv.url.replace(/[|)]/g, "")})` : "transitive / see audit"
        output.push(`| ${name.replace(/[|]/g, "")} | ${v.severity} | ${v.isDirect ? "yes" : "no"} | ${fix} | ${ref} |`)
      }
      if (vulns.length > 100) output.push(`- Additional packages omitted: ${vulns.length - 100}`)
    }
    output.push("")
  }
}
const markdown = output.join("\n")
console.log(markdown)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + "\n")
if (errors) process.exitCode = 1
