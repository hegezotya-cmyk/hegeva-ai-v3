import {
  auditX20Capabilities,
  buildX20CapabilityPrompt,
  getX20CapabilityProfile,
  type X20BuildMode,
} from "./app-studio-capability-engine"

export type X20BuildCandidate = {
  html: string
  quality: number
}

export type X20BuildGateResult = {
  accepted: boolean
  mode: X20BuildMode
  quality: number
  minimumQuality: number
  capabilityScore: number
  missingRequired: string[]
  reason: string
}

export function evaluateX20BuildCandidate(
  candidate: X20BuildCandidate,
  mode: X20BuildMode,
): X20BuildGateResult {
  const profile = getX20CapabilityProfile(mode)
  const audit = auditX20Capabilities(candidate.html, mode)
  const qualityOk = candidate.quality >= profile.minimumQuality
  const accepted = qualityOk && audit.passed

  const reasons: string[] = []
  if (!qualityOk) reasons.push(`quality ${candidate.quality}% < ${profile.minimumQuality}%`)
  if (audit.missingRequired.length) reasons.push(`missing: ${audit.missingRequired.join(", ")}`)

  return {
    accepted,
    mode,
    quality: candidate.quality,
    minimumQuality: profile.minimumQuality,
    capabilityScore: audit.capabilityScore,
    missingRequired: audit.missingRequired,
    reason: accepted ? "capability contract passed" : reasons.join("; "),
  }
}

function targetedRepairRules(missing: string[]) {
  const rules: string[] = []

  if (missing.includes("edit")) {
    rules.push(
      "EDIT REPAIR IS MANDATORY. Add a visible Edit button/control to at least one core saved-record table/list.",
      "The Edit control must identify the exact saved record (for example data-edit=\"record-id\").",
      "Clicking Edit must load the existing record into editable fields or an edit form/modal.",
      "Saving must UPDATE THE SAME EXISTING RECORD by id/index (not append a second record), call localStorage.setItem with the updated state, re-render the list/table, and preserve the edited value after page reload.",
      "Include a real JavaScript edit handler wired to the rendered Edit control. A word such as 'Edit', a comment, or an unused function does not satisfy this requirement.",
    )
  }

  if (missing.includes("filters")) {
    rules.push("FILTER REPAIR: add a working filter control whose change/input event changes the rendered record set, not just a decorative select.")
  }

  if (missing.includes("search")) {
    rules.push("SEARCH REPAIR: add a working search input wired to input/change events that filters rendered records.")
  }

  return rules
}

export function buildX20RetryInstruction(
  mode: X20BuildMode,
  originalRequest: string,
  previousHtml: string,
  previousQuality: number,
) {
  const gate = evaluateX20BuildCandidate({ html: previousHtml, quality: previousQuality }, mode)
  return [
    "HEGEVA CAPABILITY REPAIR PASS.",
    buildX20CapabilityPrompt(mode),
    `Previous build quality: ${previousQuality}%.`,
    gate.missingRequired.length
      ? `The previous build is missing these REQUIRED capabilities: ${gate.missingRequired.join(", ")}.`
      : "The previous build did not meet the build-level quality threshold.",
    ...targetedRepairRules(gate.missingRequired),
    "Return ONLY one complete self-contained index.html document with inline CSS and vanilla JavaScript.",
    "Repair every missing REQUIRED capability while preserving working behaviour. Do not add decorative or dead controls.",
    "Every visible primary button/form must have a real local action. Persist user-created data with localStorage where appropriate.",
    "Before returning the HTML, mentally test create, edit/update, delete, persistence, navigation and any required status/calculation workflow for the selected build level.",
    `ORIGINAL CUSTOMER REQUEST:\n${originalRequest.slice(0, 900)}`,
  ].join("\n\n")
}

export function chooseX20Candidate(
  first: X20BuildCandidate,
  retry: X20BuildCandidate | null,
  mode: X20BuildMode,
) {
  const firstGate = evaluateX20BuildCandidate(first, mode)
  if (!retry) return { candidate: first, gate: firstGate }

  const retryGate = evaluateX20BuildCandidate(retry, mode)
  if (retryGate.accepted && !firstGate.accepted) return { candidate: retry, gate: retryGate }
  if (firstGate.accepted && !retryGate.accepted) return { candidate: first, gate: firstGate }

  const firstRank = firstGate.capabilityScore * 1000 + first.quality
  const retryRank = retryGate.capabilityScore * 1000 + retry.quality
  return retryRank > firstRank
    ? { candidate: retry, gate: retryGate }
    : { candidate: first, gate: firstGate }
}
