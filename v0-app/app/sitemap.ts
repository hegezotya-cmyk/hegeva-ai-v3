import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://hegevaai.co.uk'
  const routes = ['', '/challenge', '/ai-for-small-business', '/ai-business-assistant', '/quote-and-invoice-software', '/ai-for-trades', '/ai-for-electricians', '/for-electricians', '/for-builders', '/for-plumbers', '/for-cleaners', '/for-property-maintenance', '/for-consultants', '/free-tools', '/pricing', '/enterprise', '/contact', '/privacy', '/terms']
  // Do not stamp every route with the current request time. We do not yet
  // track accurate per-page content modification dates.
  return routes.map((route) => ({ url: `${base}${route}` }))
}
