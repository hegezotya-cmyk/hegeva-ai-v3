import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { FreeToolsHub } from "@/components/growth/free-tools-hub"

export const metadata: Metadata = {
  title: "Free Small Business Tools | HEGEVA AI",
  description: "Free browser-based tools for invoice reminders, quote follow-ups, admin cost estimates, business checks and customer follow-ups. No signup required.",
  alternates: { canonical: "/free-tools" },
  openGraph: {
    title: "Free Small Business Tools | HEGEVA AI",
    description: "Five free tools for common small-business admin, with no signup required.",
    url: "/free-tools",
    type: "website",
  },
}

export default function FreeToolsPage() {
  return (
    <AppShell>
      <FreeToolsHub />
    </AppShell>
  )
}
