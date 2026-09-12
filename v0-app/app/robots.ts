import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = 'https://hegevaai.co.uk'
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/reset-password'] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
