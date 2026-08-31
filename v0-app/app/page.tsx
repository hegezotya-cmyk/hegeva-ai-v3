import { AppShell } from "@/components/app-shell"
import { Hero } from "@/components/home/hero"
import { ContactCta } from "@/components/home/contact-cta"
import { FlagshipSections } from "@/components/home/flagship-sections"

export default function HomePage() {
  return (
    <AppShell>
      <Hero />
      <FlagshipSections />
      <ContactCta />
    </AppShell>
  )
}
