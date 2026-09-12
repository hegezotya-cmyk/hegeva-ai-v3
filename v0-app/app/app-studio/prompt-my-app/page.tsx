import type { Metadata } from "next"
import { AppShell } from "@/components/app-shell"
import { PromptMyApp } from "@/components/app-studio/prompt-my-app"

export const metadata: Metadata = {
  title: "Prompt My App — HEGEVA App Studio",
  description:
    "Turn an app idea into a practical, structured specification and optionally enhance it with HEGEVA AI before continuing into Build My App.",
}

export default function PromptMyAppPage() {
  return (
    <AppShell>
      <PromptMyApp />
    </AppShell>
  )
}
