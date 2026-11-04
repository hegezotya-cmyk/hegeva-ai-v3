// Closed vocabulary only. Never forward arbitrary CustomEvent payloads to GA4.
const labels = {
  business_type: ['electrician', 'builder', 'plumber', 'cleaner', 'property_maintenance', 'consultant', 'show_me'],
  challenge_version: ['v1'],
  action_type: ['invoice_followup', 'quote_followup'],
  destination: ['/login', '/challenge', '/get-started', '/pricing', '/command-center'],
  cta: ['homepage_challenge', 'homepage_workspace', 'challenge_signup', 'unspecified'],
  source: ['homepage', 'demo', 'niche_landing'],
  niche: ['for-electricians', 'for-builders', 'for-plumbers', 'for-cleaners', 'for-property-maintenance', 'for-consultants'],
  share_type: ['challenge', 'business_score'],
  score_band: ['0-49', '50-74', '75-100'],
  input_type: ['customer_message', 'one_click_workflow', 'structured_opportunity'],
  entry_mode: ['preset', 'manual'],
  customer_mode: ['new', 'existing'],
  tool: ['quote', 'invoice', 'followup', 'check'],
  action: ['open', 'generate', 'copy', 'signal'],
}

export function safeAnalyticsParams(params) {
  const result = {}
  if (!params || typeof params !== 'object') return result
  for (const [key, values] of Object.entries(labels)) {
    if (typeof params[key] === 'string' && values.includes(params[key])) result[key] = params[key]
  }
  for (const [key, max] of [['score', 100], ['priority', 3], ['priorities', 3], ['observed_categories', 4]]) {
    const value = params[key]
    if (Number.isInteger(value) && value >= 0 && value <= max) result[key] = value
  }
  if (params.sent === false) result.sent = false
  return result
}
