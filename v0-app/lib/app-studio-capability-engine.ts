export type X20BuildMode = "starter" | "premium" | "growth"

export type X20Capability =
  | "core-workflow"
  | "navigation"
  | "local-persistence"
  | "responsive"
  | "accessible-controls"
  | "dashboard"
  | "search"
  | "filters"
  | "create"
  | "edit"
  | "delete"
  | "status-workflow"
  | "calculations"
  | "connected-modules"
  | "activity-history"
  | "advanced-empty-states"
  | "cross-module-actions"

export type X20CapabilityProfile = {
  mode: X20BuildMode
  minProductAreas: number
  maxProductAreas: number
  minimumQuality: number
  required: readonly X20Capability[]
  preferred: readonly X20Capability[]
  prompt: readonly string[]
}

export const X20_CAPABILITY_PROFILES: Record<X20BuildMode, X20CapabilityProfile> = {
  starter: {
    mode: "starter",
    minProductAreas: 2,
    maxProductAreas: 3,
    minimumQuality: 48,
    required: [
      "core-workflow",
      "local-persistence",
      "responsive",
      "accessible-controls",
      "create",
      "delete",
    ],
    preferred: ["navigation", "advanced-empty-states"],
    prompt: [
      "Build a focused paid-quality application with 2-3 product areas.",
      "Make one primary workflow excellent and complete rather than adding many shallow modules.",
      "User-created data must persist locally and primary create/delete actions must visibly update the UI.",
    ],
  },
  premium: {
    mode: "premium",
    minProductAreas: 4,
    maxProductAreas: 5,
    minimumQuality: 66,
    required: [
      "core-workflow",
      "navigation",
      "local-persistence",
      "responsive",
      "accessible-controls",
      "dashboard",
      "search",
      "create",
      "edit",
      "delete",
      "status-workflow",
      "advanced-empty-states",
    ],
    preferred: ["filters", "calculations", "activity-history"],
    prompt: [
      "Build a premium SaaS-quality application with 4-5 meaningful product areas.",
      "Include a useful dashboard, polished navigation, create/edit/delete flows and search where it adds value.",
      "At least one primary saved-record module MUST implement a real persisted Edit/Update workflow: an Edit control on an existing record, loading current values into editable controls, saving changes back to that same record, writing the updated state to localStorage, and re-rendering the UI.",
      "Use explicit status transitions and strong empty states; do not ship decorative controls that do nothing.",
    ],
  },
  growth: {
    mode: "growth",
    minProductAreas: 5,
    maxProductAreas: 7,
    minimumQuality: 78,
    required: [
      "core-workflow",
      "navigation",
      "local-persistence",
      "responsive",
      "accessible-controls",
      "dashboard",
      "search",
      "filters",
      "create",
      "edit",
      "delete",
      "status-workflow",
      "calculations",
      "connected-modules",
      "activity-history",
      "advanced-empty-states",
      "cross-module-actions",
    ],
    preferred: [],
    prompt: [
      "Build the strongest practical single-file browser product with 5-7 connected product areas.",
      "Modules must share meaningful data or actions instead of behaving like isolated demo screens.",
      "Include dashboard calculations, search/filter tools, create/edit/delete flows, status workflows, activity history and at least one cross-module action.",
      "MANDATORY EDIT CONTRACT: at least one core module such as Customers, Invoices, Quotes, Expenses or Tasks must render a real Edit control for saved records. Clicking Edit must load the selected record's existing values, let the user change them, update the SAME record rather than creating a duplicate, persist the updated state with localStorage, re-render immediately, and still show the changed values after reload.",
      "Growth must be materially more capable than Premium, not merely more visually decorated.",
    ],
  },
}

export function getX20CapabilityProfile(mode: X20BuildMode) {
  return X20_CAPABILITY_PROFILES[mode]
}

export function buildX20CapabilityPrompt(mode: X20BuildMode) {
  const p = getX20CapabilityProfile(mode)
  return [
    `HEGEVA BUILD LEVEL: ${mode.toUpperCase()}`,
    `Target product areas: ${p.minProductAreas}-${p.maxProductAreas}.`,
    ...p.prompt,
    `Required capability contract: ${p.required.join(", ")}.`,
    "Every capability listed in the REQUIRED capability contract must be implemented as real working behaviour before returning the HTML. Do not omit a required capability and do not satisfy it with labels, comments, dead buttons, placeholder text or decorative controls.",
    "If a non-required requested feature cannot be made genuinely functional in a single-file app, prefer a smaller honest implementation rather than faking it.",
  ].join("\n")
}

function has(html: string, pattern: RegExp) {
  return pattern.test(html)
}

function hasRealEditWorkflow(html: string) {
  const visibleEditControl = has(html, /data-edit\s*=|data-action\s*=\s*["']edit["']|>\s*edit\s*</i)
  const editHandler = has(html, /dataset\.edit|data-edit|closest\([^)]*data-edit|editing(Id|Index|Record)|edit(Id|Index|Record)\s*=/i)
  const updatesExistingRecord = has(html, /findIndex\s*\(|\.find\s*\([^)]*=>[^)]*\.id|\[[^\]]+\]\s*=|Object\.assign\s*\(/i)
  const persists = has(html, /localStorage\.setItem/i)
  return visibleEditControl && editHandler && updatesExistingRecord && persists
}

export function inspectX20Capabilities(html: string): Record<X20Capability, boolean> {
  const form = has(html, /<form\b/i)
  const buttons = (html.match(/<button\b/gi) || []).length
  const inputs = (html.match(/<(input|select|textarea)\b/gi) || []).length
  const sections = (html.match(/<(section|article)\b/gi) || []).length

  return {
    "core-workflow": form && buttons > 0 && inputs > 0,
    navigation: has(html, /<(nav|aside)\b/i) || has(html, /data-view=|data-tab=/i),
    "local-persistence": has(html, /localStorage\.(getItem|setItem)/i),
    responsive: has(html, /<meta[^>]+viewport/i) && has(html, /@media/i),
    "accessible-controls": has(html, /aria-label|aria-labelledby|<label\b/i),
    dashboard: has(html, /dashboard|overview|kpi|metric|stats/i),
    search: has(html, /search/i) && has(html, /addEventListener\(['"]input|oninput/i),
    filters: has(html, /filter/i) && (has(html, /<select\b/i) || has(html, /data-filter/i)),
    create: form && has(html, /addEventListener\(['"]submit|onsubmit/i),
    edit: hasRealEditWorkflow(html),
    delete: has(html, /\bdelete\b|data-del|remove/i),
    "status-workflow": has(html, /status/i) && has(html, /paid|unpaid|draft|sent|accepted|complete|reopen|active|done/i),
    calculations: has(html, /reduce\s*\(|total|revenue|profit|margin|sum/i),
    "connected-modules": sections >= 4 && has(html, /customer|client/i) && has(html, /invoice|quote|order|task|project/i),
    "activity-history": has(html, /activity|history|timeline|log\s*=/i),
    "advanced-empty-states": has(html, /empty|nothing here|no data|no .* yet/i),
    "cross-module-actions": has(html, /convert to|data-convert|create invoice|quote.*invoice|customer.*invoice|project.*task/i),
  }
}

export type X20CapabilityAudit = {
  mode: X20BuildMode
  passed: boolean
  missingRequired: X20Capability[]
  presentRequired: X20Capability[]
  capabilityScore: number
  minimumQuality: number
}

export function auditX20Capabilities(html: string, mode: X20BuildMode): X20CapabilityAudit {
  const profile = getX20CapabilityProfile(mode)
  const report = inspectX20Capabilities(html)
  const presentRequired = profile.required.filter((cap) => report[cap])
  const missingRequired = profile.required.filter((cap) => !report[cap])
  const capabilityScore = Math.round((presentRequired.length / profile.required.length) * 100)

  return {
    mode,
    passed: missingRequired.length === 0,
    missingRequired,
    presentRequired,
    capabilityScore,
    minimumQuality: profile.minimumQuality,
  }
}
