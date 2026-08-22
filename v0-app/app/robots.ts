import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = 'https://hegeva-ai-v3-v0.hegezotya.workers.dev'
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/reset-password'] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
