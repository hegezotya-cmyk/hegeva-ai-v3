import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { BuildMyAppX20StudioWow } from "@/components/app-studio/build-my-app-x20-studio-wow"

export const metadata: Metadata = {
  title: "Build My App X20 — HEGEVA App Studio",
  description: "HEGEVA X20 premium app-building workspace with verified browser builds, responsive preview, safe improvements, version restore and portable code export.",
}

export default function BuildMyAppX20Page() {
  return (
    <AppShell>
      <BuildMyAppX20StudioWow />
    </AppShell>
  )
}
