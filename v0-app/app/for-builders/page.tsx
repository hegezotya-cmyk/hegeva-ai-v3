import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { NicheLanding } from "@/components/growth/niche-landing"

export const metadata: Metadata = {
  title: "AI for Builders | HEGEVA AI",
  description: "A HEGEVA workspace for builders to organise customers, quotes, invoices and follow-ups, with owner-approved next actions.",
  alternates: { canonical: "/for-builders" },
  openGraph: {
    title: "AI for Builders | HEGEVA AI",
    description: "A HEGEVA workspace for builders to organise customers, quotes, invoices and follow-ups, with owner-approved next actions.",
    url: "/for-builders",
    type: "website",
  },
}

export default function NichePage() {
  return (
    <AppShell>
      <NicheLanding slug="for-builders" labels={{"en":"builders","hu":"építőknek","de":"Bauunternehmen","fr":"entreprises du bâtiment","es":"constructores"}} />
    </AppShell>
  )
}
