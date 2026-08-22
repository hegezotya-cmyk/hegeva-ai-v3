import { AppShell } from "@/components/app-shell"
import { Hero } from "@/components/home/hero"
import { Capabilities } from "@/components/home/capabilities"
import { CommandDashboard } from "@/components/home/command-dashboard"
import { ContactCta } from "@/components/home/contact-cta"

export default function HomePage() {
  return (
    <AppShell>
      <Hero />
      <Capabilities />
      <CommandDashboard />
      <ContactCta />
    </AppShell>
  )
}
