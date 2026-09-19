import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { NicheLanding } from "@/components/growth/niche-landing"

export const metadata: Metadata = {
  title: "AI for Cleaning Businesses | HEGEVA AI",
  description: "A HEGEVA workspace for cleaning businesses to organise customers, quotes, invoices and follow-ups, with owner-approved next actions.",
  alternates: { canonical: "/for-cleaners" },
  openGraph: {
    title: "AI for Cleaning Businesses | HEGEVA AI",
    description: "A HEGEVA workspace for cleaning businesses to organise customers, quotes, invoices and follow-ups, with owner-approved next actions.",
    url: "/for-cleaners",
    type: "website",
  },
}

export default function NichePage() {
  return (
    <AppShell>
      <NicheLanding slug="for-cleaners" labels={{"en":"cleaning businesses","hu":"takarító vállalkozásoknak","de":"Reinigungsbetriebe","fr":"entreprises de nettoyage","es":"empresas de limpieza"}} />
    </AppShell>
  )
}
