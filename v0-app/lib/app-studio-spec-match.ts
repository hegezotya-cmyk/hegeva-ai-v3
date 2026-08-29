const STOP = new Set([
  "about","after","again","also","and","app","application","build","business","called","complete","create","design","friendly","for","from","have","include","includes","into","make","management","modern","must","named","that","the","their","this","use","with","where","when","will","your","should","real","user","users","please","professional","small",
  "egy","azt","hogy","kell","legyen","alkalmazas","alkalmazast","keszit","felhasznalo","es","vagy","ami","minden","valodi",
])

export type StudioSpecMatch = {
  terms: string[]
  matched: string[]
  missing: string[]
  score: number
  severeMismatch: boolean
}

const GENERIC_BUSINESS_ENTITIES = ["invoice", "quote", "expense", "task"] as const

export function extractRequestedAppName(value: string, fallback = "My App") {
  const source = value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim()
  const patterns = [
    /\b(?:app|application)\s+(?:called|named)\s+["“']?([A-Za-z0-9][A-Za-z0-9&._-]*(?:\s+[A-Za-z0-9&._-]+){0,3})/i,
    /\b(?:called|named)\s+["“']?([A-Za-z0-9][A-Za-z0-9&._-]*(?:\s+[A-Za-z0-9&._-]+){0,3})/i,
    /\bbuild\s+(?:it\s+)?["“']?([A-Z][A-Za-z0-9&._-]{2,47})\b/,
  ]
  for (const pattern of patterns) {
    const raw = source.match(pattern)?.[1]?.replace(/["”'.,;:!?].*$/, "").trim()
    if (!raw) continue
    const clean = raw.split(/\s+(?:that|which|for|with|where|to)\b/i)[0].trim()
    const words = clean.split(/\s+/).filter((word) => !/^(?:it|called|named|build|create|make|app|application)$/i.test(word))
    if (words.length) return words.join(" ").slice(0, 48)
  }
  return fallback
}

export function isPawFlowRequest(value: string) {
  const text = normalize(value)
  if (/\b(previous|historical|diagnostic|failed|failure|error|older|prior|generic)\b/.test(text) || /\b(?:do not|dont|without|exclude|no)\s+(?:use\s+)?(?:pawflow|pet|dog|grooming)\b/.test(text)) return false
  return /\b(pawflow|pet grooming|dog grooming|grooming appointment|groomer)\b/.test(text)
}

export function explicitlyRequestsGenericBusinessEntities(value: string) {
  const text = normalize(value)
  return GENERIC_BUSINESS_ENTITIES.some((entity) => new RegExp(`\\b${entity}s?\\b`).test(text))
}

export function requestsGenericBusinessWorkspace(value: string) {
  const text = normalize(value)
  return explicitlyRequestsGenericBusinessEntities(value) || /\b(business os|growth os|generic crm|business management|finance dashboard)\b/.test(text)
}

function hasAll(source: string, patterns: RegExp[]) {
  return patterns.every((pattern) => pattern.test(source))
}

export function auditPawFlowStructure(html: string) {
  const checks = {
    branding: /<title[^>]*>[^<]*pawflow|<h1[^>]*>[^<]*pawflow/i.test(html),
    petFields: hasAll(html, [/\bpet(?:Name)?\b/i, /\bbreed\b/i, /\bage\b/i, /\bowner(?:Name)?\b/i, /\b(?:ownerPhone|phone)\b/i]),
    services: /\bservices?\b/i.test(html) && /\bprice\b/i.test(html) && /<(select|input)\b/i.test(html),
    appointmentFields: hasAll(html, [/\bappointments?\b/i, /type=["']date["']/i, /type=["']time["']/i, /\bservice\b/i, /\bprice\b/i]),
    appointmentActions: hasAll(html, [/data-edit|\beditAppointment\b|editingId/i, /\bsave\b/i, /\bcancel\b/i, /data-delete|\bdeleteAppointment\b/i]),
    search: /type=["']search["']|\bsearch\b/i.test(html) && /addEventListener\s*\(\s*["']input["']|\.oninput\s*=/i.test(html),
    todayDashboard: /today(?:'s)? appointments/i.test(html) && /toISOString|toLocaleDateString|new Date\s*\(/i.test(html),
    groomingRevenue: /grooming revenue/i.test(html) && /\.reduce\s*\(/i.test(html),
    persistence: /localStorage\.getItem\s*\(/i.test(html) && /localStorage\.setItem\s*\(/i.test(html) && /pawflow/i.test(html),
    noGenericDrift: explicitlyRequestsGenericBusinessEntities(html) === false && !/hegeva-growth-os|growth build/i.test(html),
  }
  const passed = Object.values(checks).filter(Boolean).length
  return { checks, score: passed * 10, ok: passed === Object.keys(checks).length }
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
}

export function extractStudioSpecTerms(value: string, limit = 24) {
  const words = normalize(value).match(/[a-z0-9][a-z0-9-]{3,}/g) || []
  return Array.from(new Set(words.filter((word) => !STOP.has(word)))).slice(0, limit)
}

export function auditStudioSpecMatch(html: string, request: string): StudioSpecMatch {
  const lower = normalize(html)
  const excluded = /\b(?:do not|don't|without|exclude|no)\s+(?:use\s+)?(?:pawflow|pet(?:-\s*)?grooming|dog(?:-\s*)?grooming|grooming)\b/i.test(request)
  const terms = extractStudioSpecTerms(request).filter((term) => !(excluded && ["pawflow", "pet", "grooming", "dog"].includes(term)))
  const matched = terms.filter((term) => lower.includes(term))
  const missing = terms.filter((term) => !matched.includes(term))
  const lexicalScore = terms.length ? Math.round((matched.length / terms.length) * 100) : 100
  const pawFlow = isPawFlowRequest(request) ? auditPawFlowStructure(html) : null
  const genericModuleCount = GENERIC_BUSINESS_ENTITIES.filter((entity) => new RegExp(`\\b${entity}s?\\b`).test(lower)).length
  const genericDrift = !requestsGenericBusinessWorkspace(request) && genericModuleCount >= 3
  const pawGenericDrift = Boolean(pawFlow && !pawFlow.checks.noGenericDrift)
  const score = pawFlow ? Math.min(lexicalScore, pawFlow.score) : lexicalScore
  return {
    terms,
    matched,
    missing,
    score,
    severeMismatch: genericDrift || pawGenericDrift || (terms.length >= 4 && (score < 60 || matched.length < Math.min(4, terms.length))),
  }
}

export function buildStudioSpecRepairInstruction(request: string, match: StudioSpecMatch) {
  return [
    "HEGEVA X20 REQUEST / SPEC MATCH REPAIR.",
    "The previous build drifted away from the customer's actual requested domain or workflows.",
    "Do not replace a specific customer request with a generic CRM, Business OS, invoicing dashboard, generic customer list or unrelated template.",
    "Treat the ORIGINAL CUSTOMER REQUEST as the source of truth. The visible navigation, headings, forms, record fields, saved data model and working actions must use that requested domain.",
    match.terms.length ? `REQUEST CONCEPT CHECKLIST: ${match.terms.join(", ")}.` : "",
    match.missing.length ? `MISSING REQUEST CONCEPTS THAT MUST BE IMPLEMENTED: ${match.missing.slice(0, 16).join(", ")}.` : "",
    "Do not merely mention missing words in decorative text. Implement them as meaningful labels, fields, records, controls or workflows where the request requires them.",
    "Every requested Add, Edit, Save, Delete, Search, Filter, booking or calculation action must actually work locally when requested, and useful user-created data must persist with localStorage.",
    "Return ONLY one complete self-contained index.html with inline CSS and vanilla JavaScript. Preserve working requested behavior, but replace unrelated generic modules.",
    `ORIGINAL CUSTOMER REQUEST:\n${request.slice(0, 1800)}`,
  ].filter(Boolean).join("\n\n")
}

export function preferBetterSpecMatch(firstHtml: string, retryHtml: string, request: string) {
  const first = auditStudioSpecMatch(firstHtml, request)
  const retry = auditStudioSpecMatch(retryHtml, request)
  return retry.score > first.score ? { html: retryHtml, match: retry } : { html: firstHtml, match: first }
}
