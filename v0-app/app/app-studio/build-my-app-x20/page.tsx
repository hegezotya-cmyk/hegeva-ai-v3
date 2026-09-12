import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { BuildMyAppX20StudioWow } from "@/components/app-studio/build-my-app-x20-studio-wow"
import { X20CapabilityAutoRepair } from "@/components/app-studio/x20-capability-auto-repair"
import { X20CapabilityStatus } from "@/components/app-studio/x20-capability-status"
import { X20PreviewSandboxHotfix } from "@/components/app-studio/x20-preview-sandbox-hotfix"

export const metadata: Metadata = {
  title: "Build My App X20 — HEGEVA App Studio",
  description: "HEGEVA X20 premium app-building workspace with verified browser builds, responsive preview, safe improvements, version restore and portable code export.",
}

export default function BuildMyAppX20Page() {
  return (
    <AppShell>
      <X20PreviewSandboxHotfix />
      <X20CapabilityAutoRepair />
      <X20CapabilityStatus />
      <BuildMyAppX20StudioWow />
    </AppShell>
  )
}
