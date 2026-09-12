import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { FixMyApp } from "@/components/app-studio/fix-my-app"

export const metadata: Metadata = {
  title: "Fix My App X10 — HEGEVA App Studio",
  description:
    "A structured HEGEVA workflow for diagnosing app issues across UI, UX, performance, APIs, data, authentication, security, mobile and accessibility.",
}

export default function FixMyAppPage() {
  return (
    <AppShell>
      <FixMyApp />
    </AppShell>
  )
}
