import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Users, FileText, ReceiptText, ArrowRight, CalendarCheck2, BarChart3, MessageSquareText } from "lucide-react"

const modules = [
  { href: "/business/customers", title: "Customers & CRM", text: "Save and search real customer records with authenticated cloud sync.", icon: Users, status: "working" as const },
  { href: "/business/documents", title: "Documents", text: "Create lightweight document records and keep them synced to your workspace.", icon: FileText, status: "working" as const },
  { href: "/business/expenses", title: "Expenses", text: "Track real expense entries and sync saved data across sessions.", icon: ReceiptText, status: "working" as const },
  { href: "/business/planner", title: "Planner / Time Saver", text: "Sync real priorities, due dates and completed tasks to your workspace.", icon: CalendarCheck2, status: "working" as const },
  { href: "/business/reports", title: "Reports", text: "Summarize customers, documents, expenses and tasks from real workspace data.", icon: BarChart3, status: "working" as const },
  { href: "/business/messages", title: "Message Studio", text: "Save message drafts to your workspace without claiming they were sent.", icon: MessageSquareText, status: "working" as const },
]

export default function BusinessPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader eyebrow="HEGEVA Business Workspace" title="Run the everyday work in one place" subtitle="Signed-in accounts sync working module data to the HEGEVA cloud workspace. A browser-local copy remains available as a fallback, while guests stay local only." />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modules.map(({ href, title, text, icon: Icon, status }) => (
            <Link key={href} href={href} className="glass-panel glass-panel-hover group rounded-3xl p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="flex size-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10"><Icon className="size-5 text-primary" /></span>
                <StatusBadge status={status} />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground/80 group-hover:text-foreground">Open module <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
