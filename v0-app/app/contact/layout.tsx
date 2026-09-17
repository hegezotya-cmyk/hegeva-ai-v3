import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact HEGEVA AI',
  description: 'Contact HEGEVA AI for workspace and customer support.',
  alternates: { canonical: '/contact' },
}

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
