import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { BuildMyApp } from "@/components/app-studio/build-my-app"

export const metadata: Metadata = {
  title: "Build My App X10 — HEGEVA App Studio",
  description:
    "A guided AI app-building environment that takes you from idea to build: requirements, architecture, UI, database, authentication, AI, payments and security.",
}

export default function BuildMyAppPage() {
  return (
    <AppShell>
      <BuildMyApp />
    </AppShell>
  )
}
