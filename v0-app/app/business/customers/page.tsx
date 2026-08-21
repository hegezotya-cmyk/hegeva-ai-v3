import { AppShell } from "@/components/app-shell"
import { LocalWorkspace } from "@/components/business/local-workspace"

export default function CustomersPage() {
  return <AppShell><LocalWorkspace kind="customers" /></AppShell>
}
