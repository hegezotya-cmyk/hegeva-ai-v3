import type { Metadata } from "next"
import Link from "next/link"
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
      logo: "https://hegevaai.co.uk/hegeva-logo-gold-official.png",
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
      <main>
        <Hero />
        <OutcomeLauncher />
        <section className="mx-auto max-w-[94rem] px-4 pb-16 sm:px-6 lg:px-10" aria-labelledby="uk-business-links-title">
          <div className="rounded-2xl border border-border bg-card/50 px-5 py-5 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div>
              <p className="section-kicker">Built for UK small businesses</p>
              <h2 id="uk-business-links-title" className="mt-1 font-display text-xl font-semibold text-foreground">Explore HEGEVA workflows for your business</h2>
            </div>
            <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm sm:mt-0" aria-label="UK small business workflows">
              <Link href="/ai-for-small-business" className="text-primary hover:underline">AI for small businesses</Link>
              <Link href="/ai-for-trades" className="text-primary hover:underline">AI for trades</Link>
              <Link href="/ai-for-electricians" className="text-primary hover:underline">AI for electricians</Link>
              <Link href="/quote-and-invoice-software" className="text-primary hover:underline">Quote &amp; invoice software</Link>
              <Link href="/ai-business-assistant" className="text-primary hover:underline">Business AI assistant</Link>
            </nav>
          </div>
        </section>
        <FlagshipSections />
        <ContactCta />
      </main>
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
