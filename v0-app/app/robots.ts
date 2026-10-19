import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = 'https://hegevaai.co.uk'
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/reset-password',
        '/login',
        '/get-started',
        '/account',
        '/assistant',
        '/command-center',
        '/business',
        '/app-studio',
        '/admin',
        '/bots',
        '/enterprise',
      ],
    }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
