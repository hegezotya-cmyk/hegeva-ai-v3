import type { Metadata } from 'next'

const description =
  'Compare HEGEVA AI workspace plans, included features and current monthly pricing for freelancers and small businesses.'

export const metadata: Metadata = {
  title: 'Pricing & Plans',
  description,
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'HEGEVA AI Pricing & Plans',
    description,
    url: '/pricing',
  },
  twitter: {
    title: 'HEGEVA AI Pricing & Plans',
    description,
  },
}

export default function PricingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
