import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { NicheLanding } from "@/components/growth/niche-landing"

export const metadata: Metadata = {
  title: "AI for Electricians | HEGEVA AI",
  description: "A HEGEVA workspace for electricians to organise customers, quotes, invoices and follow-ups, with owner-approved next actions.",
  alternates: { canonical: "/for-electricians" },
  openGraph: {
    title: "AI for Electricians | HEGEVA AI",
    description: "A HEGEVA workspace for electricians to organise customers, quotes, invoices and follow-ups, with owner-approved next actions.",
    url: "/for-electricians",
    type: "website",
  },
}

export default function NichePage() {
  return (
    <AppShell>
      <NicheLanding slug="for-electricians" labels={{"en":"electricians","hu":"villanyszerelőknek","de":"Elektriker","fr":"électriciens","es":"electricistas"}} />
    </AppShell>
  )
}
