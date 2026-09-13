import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://hegevaai.co.uk'
  const routes = ['', '/ai-for-small-business', '/ai-business-assistant', '/quote-and-invoice-software', '/ai-for-trades', '/ai-for-electricians', '/pricing', '/contact', '/privacy', '/terms']
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route === '/pricing' || route === '/contact' ? 0.8 : route === '/privacy' || route === '/terms' ? 0.5 : 0.7,
  }))
}
