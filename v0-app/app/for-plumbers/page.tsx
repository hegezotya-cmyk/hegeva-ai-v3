import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { NicheLanding } from "@/components/growth/niche-landing"

export const metadata: Metadata = {
  title: "AI for Plumbers | HEGEVA AI",
  description: "A HEGEVA workspace for plumbers to organise customers, quotes, invoices and follow-ups, with owner-approved next actions.",
  alternates: { canonical: "/for-plumbers" },
  openGraph: {
    title: "AI for Plumbers | HEGEVA AI",
    description: "A HEGEVA workspace for plumbers to organise customers, quotes, invoices and follow-ups, with owner-approved next actions.",
    url: "/for-plumbers",
    type: "website",
  },
}

export default function NichePage() {
  return (
    <AppShell>
      <NicheLanding slug="for-plumbers" labels={{"en":"plumbers","hu":"vízvezeték-szerelőknek","de":"Installateure","fr":"plombiers","es":"fontaneros"}} />
    </AppShell>
  )
}
