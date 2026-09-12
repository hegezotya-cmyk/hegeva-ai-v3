import { AppShell } from "@/components/app-shell"
import { LocalWorkspace } from "@/components/business/local-workspace"

export default function DocumentsPage() {
  return <AppShell><LocalWorkspace kind="documents" /></AppShell>
}
