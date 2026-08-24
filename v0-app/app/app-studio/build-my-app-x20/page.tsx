import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { BuildMyAppX20 } from "@/components/app-studio/build-my-app-x20"

export const metadata: Metadata = {
  title: "Build My App X20 — HEGEVA App Studio",
  description: "HEGEVA Pro beta app-building workspace with verified browser builds, one-click AI improvement passes and resumable local project state.",
}

export default function BuildMyAppX20Page() {
  return (
    <AppShell>
      <BuildMyAppX20 />
    </AppShell>
  )
}
