import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { Hero } from "@/components/home/hero"
import { ContactCta } from "@/components/home/contact-cta"
import { FlagshipSections } from "@/components/home/flagship-sections"
import { OutcomeLauncher } from "@/components/outcome-launcher"

export default function HomePage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "HEGEVA AI",
      url: "https://hegevaai.co.uk",
      logo: "https://hegevaai.co.uk/hegeva-logo.png",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "HEGEVA AI",
      url: "https://hegevaai.co.uk",
      description: "AI-powered business workspace for small businesses and growing teams.",
    },
  ]
  return (
    <AppShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero />
      <OutcomeLauncher />
      <FlagshipSections />
      <ContactCta />
    </AppShell>
  )
}

export const metadata: Metadata = {
  title: { absolute: "HEGEVA AI — Less admin. More business." },
  description: "Customers, quotes, invoices and planning in one workspace for UK small businesses. HEGEVA Core helps you see what needs attention next.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "HEGEVA AI — Less admin. More business.",
    description: "One workspace for customers, invoices and today's priorities. Stay in control with HEGEVA Core.",
    url: "/", type: "website", siteName: "HEGEVA AI",
    images: [{ url: "/hegeva-social-card.webp", width: 1200, height: 630, alt: "HEGEVA AI business workspace" }],
  },
  twitter: { card: "summary_large_image", title: "HEGEVA AI — Less admin. More business.", description: "Customers, invoices and today's priorities in one workspace.", images: ["/hegeva-social-card.webp"] },
}
