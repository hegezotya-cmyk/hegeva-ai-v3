import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { Hero } from "@/components/home/hero"
import { ContactCta } from "@/components/home/contact-cta"
import { FlagshipSections } from "@/components/home/flagship-sections"
import { OutcomeLauncher } from "@/components/outcome-launcher"
import { AcquisitionAttribution } from "@/components/acquisition/acquisition-attribution"
import { GrowthLoopPromo } from "@/components/home/growth-loop-promo"

const HOMEPAGE_CHALLENGE_HREF = "/challenge"
const HOMEPAGE_CHALLENGE_ENTRY = {
  en: { href: HOMEPAGE_CHALLENGE_HREF, kicker: "GIVE HEGEVA 60 SECONDS", title: "See what your business could be missing.", body: "Start with clearly labelled fictional sample data. No signup, no card, and nothing is sent without your approval.", start: "Start 60-second challenge" },
  hu: { href: HOMEPAGE_CHALLENGE_HREF, kicker: "ADJ A HEGEVA-NAK 60 MÁSODPERCET", title: "Nézd meg, mi hiányozhat a vállalkozásodból.", body: "Kezdj egyértelműen jelölt, fiktív mintaadatokkal. Nincs regisztráció, nincs bankkártya, és jóváhagyásod nélkül semmi nem kerül elküldésre.", start: "60 másodperces kihívás indítása" },
  de: { href: HOMEPAGE_CHALLENGE_HREF, kicker: "GIB HEGEVA 60 SEKUNDEN", title: "Sieh, was Ihrem Unternehmen fehlen könnte.", body: "Starten Sie mit klar gekennzeichneten fiktiven Beispieldaten. Keine Anmeldung, keine Karte und nichts wird ohne Ihre Freigabe versendet.", start: "60-Sekunden-Challenge starten" },
  fr: { href: HOMEPAGE_CHALLENGE_HREF, kicker: "DONNEZ 60 SECONDES À HEGEVA", title: "Voyez ce qui pourrait manquer à votre entreprise.", body: "Commencez avec des exemples fictifs clairement indiqués. Aucune inscription, aucune carte et rien n’est envoyé sans votre accord.", start: "Lancer le défi de 60 secondes" },
  es: { href: HOMEPAGE_CHALLENGE_HREF, kicker: "DA A HEGEVA 60 SEGUNDOS", title: "Descubre qué podría faltarle a tu negocio.", body: "Empieza con datos de ejemplo ficticios y claramente indicados. Sin registro, sin tarjeta y nada se envía sin tu aprobación.", start: "Iniciar reto de 60 segundos" },
} as const

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
      <AcquisitionAttribution path="/" />
      <main>
        <Hero />
        <OutcomeLauncher />
        <GrowthLoopPromo challengeEntry={HOMEPAGE_CHALLENGE_ENTRY} />
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
