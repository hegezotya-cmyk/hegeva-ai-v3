import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { NicheLanding } from "@/components/growth/niche-landing"

export const metadata: Metadata = {
  title: "AI for Consultants | HEGEVA AI",
  description: "A HEGEVA workspace for consultants to organise customers, quotes, invoices and follow-ups, with owner-approved next actions.",
  alternates: { canonical: "/for-consultants" },
  openGraph: {
    title: "AI for Consultants | HEGEVA AI",
    description: "A HEGEVA workspace for consultants to organise customers, quotes, invoices and follow-ups, with owner-approved next actions.",
    url: "/for-consultants",
    type: "website",
  },
}

export default function NichePage() {
  return (
    <AppShell>
      <NicheLanding slug="for-consultants" labels={{"en":"consultants","hu":"tanácsadóknak","de":"Berater","fr":"consultants","es":"consultores"}} />
    </AppShell>
  )
}
