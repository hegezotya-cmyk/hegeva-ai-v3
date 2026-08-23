"use client"

import Link from "next/link"
import { BarChart3, Bot, FileText, FolderLock, LayoutGrid, Users, type LucideIcon } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { StatusBadge, type FeatureStatus } from "@/components/status-badge"

const honestCopy = {
  en: {
    reports: ["Workspace Reports", "Summaries of customers, documents, expenses and tasks from the data you save."],
    invoices: ["Invoice & Quote Builder", "Create, save and print invoices and quotes with calculated totals and VAT."],
    documents: ["Document Records", "Save lightweight document records and sync them with your workspace."],
    studio: ["App Studio", "Beta planning workflows for prompting, building and diagnosing app ideas; AI enhancement is still rolling out."],
  },
  hu: {
    reports: ["Munkaterületi jelentések", "A mentett ügyfél-, dokumentum-, kiadás- és feladatadatok összesítése."],
    invoices: ["Számla- és árajánlat-készítő", "Számlák és árajánlatok létrehozása, mentése és nyomtatása számított végösszeggel és ÁFÁ-val."],
    documents: ["Dokumentum-nyilvántartás", "Egyszerű dokumentumrekordok mentése és szinkronizálása a munkaterülettel."],
    studio: ["App Stúdió", "Béta tervezési folyamatok appötletek promptolásához, felépítéséhez és diagnosztikájához; az AI-bővítés még bevezetés alatt áll."],
  },
  de: {
    reports: ["Arbeitsbereich-Berichte", "Zusammenfassungen aus Ihren gespeicherten Kunden-, Dokument-, Ausgaben- und Aufgabendaten."],
    invoices: ["Rechnungs- & Angebotseditor", "Rechnungen und Angebote mit berechneten Summen und MwSt. erstellen, speichern und drucken."],
    documents: ["Dokumenteinträge", "Einfache Dokumenteinträge speichern und mit dem Arbeitsbereich synchronisieren."],
    studio: ["App Studio", "Beta-Planungsabläufe für App-Ideen; KI-Erweiterungen werden noch schrittweise eingeführt."],
  },
  fr: {
    reports: ["Rapports de l’espace", "Synthèses des clients, documents, dépenses et tâches à partir des données enregistrées."],
    invoices: ["Créateur de factures et devis", "Créez, enregistrez et imprimez des factures et devis avec totaux et TVA calculés."],
    documents: ["Registre de documents", "Enregistrez des fiches documentaires simples et synchronisez-les avec votre espace."],
    studio: ["App Studio", "Flux bêta pour planifier et diagnostiquer des idées d’applications ; l’amélioration IA est encore en déploiement."],
  },
  es: {
    reports: ["Informes del espacio", "Resúmenes de clientes, documentos, gastos y tareas a partir de los datos guardados."],
    invoices: ["Creador de facturas y presupuestos", "Crea, guarda e imprime facturas y presupuestos con totales e IVA calculados."],
    documents: ["Registro de documentos", "Guarda registros sencillos de documentos y sincronízalos con tu espacio."],
    studio: ["App Studio", "Flujos beta para planificar y diagnosticar ideas de apps; la mejora con IA todavía se está desplegando."],
  },
} as const

export function Capabilities() {
  const { t, locale } = useI18n()
  const h = honestCopy[locale]

  const items: { icon: LucideIcon; title: string; desc: string; status: FeatureStatus; href: string }[] = [
    { icon: Bot, title: t.capabilities.assistant.title, desc: t.capabilities.assistant.desc, status: "beta", href: "/assistant" },
    { icon: BarChart3, title: h.reports[0], desc: h.reports[1], status: "working", href: "/business/reports" },
    { icon: FileText, title: h.invoices[0], desc: h.invoices[1], status: "working", href: "/business/invoices" },
    { icon: FolderLock, title: h.documents[0], desc: h.documents[1], status: "working", href: "/business/documents" },
    { icon: Users, title: t.capabilities.crm.title, desc: t.capabilities.crm.desc, status: "working", href: "/business/customers" },
    { icon: LayoutGrid, title: h.studio[0], desc: h.studio[1], status: "beta", href: "/app-studio" },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
          {t.capabilities.heading}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.capabilities.subheading}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, desc, status, href }) => (
          <Link
            key={title}
            href={href}
            className="glass-panel glass-panel-hover group flex flex-col gap-3 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Icon className="size-5" aria-hidden />
              </span>
              <StatusBadge status={status} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
