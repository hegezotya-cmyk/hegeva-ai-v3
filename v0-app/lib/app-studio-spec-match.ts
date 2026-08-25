const STOP = new Set([
  "about","after","again","also","and","app","application","build","business","called","complete","create","design","friendly","for","from","have","include","includes","into","make","management","modern","must","that","the","their","this","use","with","where","when","will","your","should","real","user","users","please","professional","small",
  "egy","azt","hogy","kell","legyen","alkalmazas","alkalmazast","keszit","felhasznalo","es","vagy","ami","minden","valodi",
])

export type StudioSpecMatch = {
  terms: string[]
  matched: string[]
  missing: string[]
  score: number
  severeMismatch: boolean
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
  const terms = extractStudioSpecTerms(request)
  const matched = terms.filter((term) => lower.includes(term))
  const missing = terms.filter((term) => !matched.includes(term))
  const score = terms.length ? Math.round((matched.length / terms.length) * 100) : 100
  return {
    terms,
    matched,
    missing,
    score,
    severeMismatch: terms.length >= 4 && (score < 60 || matched.length < Math.min(4, terms.length)),
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
