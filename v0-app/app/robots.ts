import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = 'https://hegevaai.co.uk'
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        // Keep reset links out of crawler requests because their tokens are
        // supplied in the query string. Other private pages expose noindex
        // metadata and must remain crawlable so Google can remove old URLs.
        '/reset-password',
        '/admin',
        '/bots',
      ],
    }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
