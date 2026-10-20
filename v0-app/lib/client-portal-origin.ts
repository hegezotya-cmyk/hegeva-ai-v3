/** Resolve only explicitly supported deployment hosts; never fetch an arbitrary Host. */
export function portalOrigin(host: string | null): string | null {
  switch (host?.toLowerCase()) {
    case 'staging.hegevaai.co.uk': return 'https://staging.hegevaai.co.uk'
    case 'hegevaai.co.uk':
    case 'www.hegevaai.co.uk': return 'https://hegevaai.co.uk'
    default: return null
  }
}
