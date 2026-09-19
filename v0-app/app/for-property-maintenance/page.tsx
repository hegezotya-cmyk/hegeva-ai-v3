import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { NicheLanding } from "@/components/growth/niche-landing"

export const metadata: Metadata = {
  title: "AI for Property Maintenance | HEGEVA AI",
  description: "A HEGEVA workspace for property maintenance businesses to organise customers, quotes, invoices and follow-ups, with owner-approved next actions.",
  alternates: { canonical: "/for-property-maintenance" },
  openGraph: {
    title: "AI for Property Maintenance | HEGEVA AI",
    description: "A HEGEVA workspace for property maintenance businesses to organise customers, quotes, invoices and follow-ups, with owner-approved next actions.",
    url: "/for-property-maintenance",
    type: "website",
  },
}

export default function NichePage() {
  return (
    <AppShell>
      <NicheLanding slug="for-property-maintenance" labels={{"en":"property maintenance businesses","hu":"ingatlan-karbantartóknak","de":"Objektbetreuung","fr":"maintenance immobilière","es":"mantenimiento de propiedades"}} />
    </AppShell>
  )
}
