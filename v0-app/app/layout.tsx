import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Sora } from 'next/font/google'
import { I18nProvider } from '@/lib/i18n/provider'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' })

export const metadata: Metadata = {
  metadataBase: new URL('https://hegevaai.co.uk'),
  title: {
    default: 'HEGEVA AI — AI Business Workspace',
    template: '%s | HEGEVA AI',
  },
  description:
    'HEGEVA AI brings practical AI assistance, customer management, documents, expenses, planning, reports and app planning into one connected workspace for freelancers and small businesses.',
  applicationName: 'HEGEVA AI',
  authors: [{ name: 'HEGEVA AI' }],
  creator: 'HEGEVA AI',
  publisher: 'HEGEVA AI',
  keywords: ['AI business assistant', 'small business workspace', 'CRM', 'business documents', 'expense tracking', 'app planning'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'HEGEVA AI',
    title: 'HEGEVA AI — AI Business Workspace',
    description: 'Practical AI and connected tools for freelancers and small businesses.',
    images: [{ url: '/hegeva-social-card.webp', width: 1200, height: 630, alt: 'HEGEVA AI business workspace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HEGEVA AI — AI Business Workspace',
    description: 'Practical AI and connected tools for freelancers and small businesses.',
    images: ['/hegeva-social-card.webp'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: '/hegeva-logo.png', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b1310',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark bg-background ${geistSans.variable} ${geistMono.variable} ${sora.variable}`}
    >
      <body className="antialiased font-sans">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  )
}
