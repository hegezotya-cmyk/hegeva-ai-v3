export type QuickStartIntent = "payment" | "quote" | "schedule" | "support" | "general"

export type QuickStartResult = {
  intent: QuickStartIntent
  confidence: "signal"
}

const patterns: Record<QuickStartIntent, RegExp[]> = {
  payment: [
    /invoice|payment|overdue|paid|due|balance|számla|fizet|lejárt|rechnung|zahlung|überfällig|facture|paiement|retard|factura|pago|vencid/i,
  ],
  quote: [
    /quote|estimate|proposal|price|quotation|ajánlat|árajánlat|angebot|kostenvoranschlag|devis|proposition|presupuesto|cotización/i,
  ],
  schedule: [
    /appointment|book|schedule|available|tomorrow|monday|tuesday|wednesday|thursday|friday|időpont|holnap|termin|verfügbar|rendez-vous|disponible|cita|disponible/i,
  ],
  support: [
    /problem|issue|complaint|broken|not working|hiba|panasz|nem működik|problem|beschwerde|kaputt|problème|plainte|cassé|problema|queja|roto/i,
  ],
  general: [],
}

export function analyseCustomerMessage(text: string): QuickStartResult {
  const clean = text.trim()
  if (!clean) return { intent: "general", confidence: "signal" }
  for (const intent of ["payment", "quote", "schedule", "support"] as const) {
    if (patterns[intent].some((pattern) => pattern.test(clean))) return { intent, confidence: "signal" }
  }
  return { intent: "general", confidence: "signal" }
}
