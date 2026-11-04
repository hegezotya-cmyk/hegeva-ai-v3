import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing for UK small businesses",
  description: "Start with Free Basic. Compare HEGEVA AI Premium at £14.99/month and Pro at £29.99/month for your business workspace and included AI capacity.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "HEGEVA AI pricing — Free Basic, Premium and Pro",
    description: "Compare monthly plans for UK small businesses. Start free and choose a paid plan when you need more capacity.",
    url: "/pricing",
    images: [{ url: "/hegeva-social-card.webp", width: 1200, height: 630 }],
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
