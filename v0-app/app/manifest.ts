import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HEGEVA AI',
    short_name: 'HEGEVA',
    description: 'AI business workspace for freelancers and small businesses.',
    start_url: '/',
    display: 'standalone',
    background_color: '#06100c',
    theme_color: '#0b1310',
    icons: [{ src: '/hegeva-logo-gold-official.png', sizes: '2172x724', type: 'image/png' }],
  }
}
