const STOP = new Set([
  "about","after","again","also","and","app","application","build","business","create","for","from","have","into","make","must","that","the","their","this","with","where","when","will","your","should","real","user","users","please","professional","small",
  "egy","azt","hogy","kell","legyen","alkalmazas","alkalmazást","keszit","készít","felhasznalo","felhasználó","es","vagy","ami","minden","valodi","valódi",
])

export type StudioSpecMatch = {
  terms: string[]
  matched: string[]
  missing: string[]
  score: number
  severeMismatch: boolean
}

export function extractStudioSpecTerms(value: string, limit = 14) {
  const words = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9][a-z0-9-]{3,}/g) || []
  return Array.from(new Set(words.filter((word) => !STOP.has(word)))).slice(0, limit)
}

export function auditStudioSpecMatch(html: string, request: string): StudioSpecMatch {
  const lower = html.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  const terms = extractStudioSpecTerms(request)
  const matched = terms.filter((term) => lower.includes(term))
  const missing = terms.filter((term) => !matched.includes(term))
  const score = terms.length ? Math.round((matched.length / terms.length) * 100) : 100
  return { terms, matched, missing, score, severeMismatch: terms.length >= 4 && score < 55 }
}

export function buildStudioSpecRepairInstruction(request: string, match: StudioSpecMatch) {
  return [
    "HEGEVA REQUEST / SPEC MATCH REPAIR.",
    "The previous build drifted away from the customer's actual requested domain or workflows.",
    "Do not replace a specific customer request with a generic CRM, Business OS, invoicing dashboard or unrelated template.",
    "Preserve the customer's domain nouns, records, fields and workflows in the visible UI, state model and working interactions.",
    match.missing.length ? `MISSING REQUEST TERMS / CONCEPTS: ${match.missing.slice(0, 8).join(", ")}.` : "",
    "Return one complete self-contained index.html with inline CSS and vanilla JavaScript. Keep already-working useful behavior, but change unrelated modules so the result actually matches the request.",
    `ORIGINAL CUSTOMER REQUEST:\n${request.slice(0, 1400)}`,
  ].filter(Boolean).join("\n\n")
}

export function preferBetterSpecMatch(firstHtml: string, retryHtml: string, request: string) {
  const first = auditStudioSpecMatch(firstHtml, request)
  const retry = auditStudioSpecMatch(retryHtml, request)
  return retry.score > first.score ? { html: retryHtml, match: retry } : { html: firstHtml, match: first }
}
