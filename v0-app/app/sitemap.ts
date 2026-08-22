import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://hegeva-ai-v3-v0.hegezotya.workers.dev'
  const routes = ['', '/app-studio', '/app-studio/prompt-my-app', '/app-studio/build-my-app', '/app-studio/fix-my-app', '/assistant', '/business', '/business/customers', '/business/documents', '/business/expenses', '/business/planner', '/business/reports', '/business/messages', '/command-center', '/get-started', '/pricing', '/contact']
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route === '/pricing' || route === '/contact' ? 0.8 : 0.7,
  }))
}
