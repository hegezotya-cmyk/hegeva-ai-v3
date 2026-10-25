type Phase = 'origin' | 'fetch' | 'json' | 'validation'
type Details = { host: string | null; status?: number; correlationId?: string }

/** Staging-only diagnostics: never record URL, token, customer data or arbitrary hostnames. */
export function portalDiagnostic(environment: string | undefined, phase: Phase, details: Details, log: (entry: object) => void = console.info) {
  if (environment !== 'staging') return
  const host = details.host?.toLowerCase() === 'staging.hegevaai.co.uk' ? 'staging' : details.host ? 'other' : 'missing'
  const entry: {event: string; phase: Phase; host: string; status?: number; correlationId?: string} = { event: 'portal_diagnostic', phase, host }
  if (Number.isInteger(details.status) && details.status! >= 100 && details.status! <= 599) entry.status = details.status
  if (details.correlationId && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(details.correlationId)) entry.correlationId = details.correlationId
  log(entry)
}
