import { AppShell } from "@/components/app-shell"
import { LocalWorkspace } from "@/components/business/local-workspace"

export default function ExpensesPage() {
  return <AppShell><LocalWorkspace kind="expenses" /></AppShell>
}
