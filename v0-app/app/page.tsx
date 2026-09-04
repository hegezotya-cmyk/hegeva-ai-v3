import { AppShell } from "@/components/app-shell"
import { Hero } from "@/components/home/hero"
import { ContactCta } from "@/components/home/contact-cta"
import { FlagshipSections } from "@/components/home/flagship-sections"
import { OutcomeLauncher } from "@/components/outcome-launcher"

export default function HomePage() {
  return (
    <AppShell>
      <Hero />
      <OutcomeLauncher />
      <FlagshipSections />
      <ContactCta />
    </AppShell>
  )
}
