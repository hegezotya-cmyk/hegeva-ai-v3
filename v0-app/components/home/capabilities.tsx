"use client"

import Link from "next/link"
import { BarChart3, Bot, FileText, FolderLock, LayoutGrid, Layers3, Users, type LucideIcon } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { StatusBadge, type FeatureStatus } from "@/components/status-badge"
import { IntelligenceCard, SectionHeading, SignalIcon } from "@/components/visual-engine"

const honestCopy = {
  en: {
    reports: ["Workspace Reports", "Summaries of customers, documents, expenses and tasks from the data you save."],
    invoices: ["Invoice & Quote Builder", "Create, save and print invoices and quotes with calculated totals and VAT."],
    documents: ["Document Records", "Save lightweight document records and sync them with your workspace."],
    studio: ["App Studio", "Beta planning workflows for prompting, building and diagnosing app ideas; AI enhancement is still rolling out."],
    x30: ["X30 renderer preview", "A schema-driven internal preview that renders only approved components and safe values."],
  },
  hu: {
    reports: ["Munkaterületi jelentések", "A mentett ügyfél-, dokumentum-, kiadás- és feladatadatok összesítése."],
    invoices: ["Számla- és árajánlat-készítő", "Számlák és árajánlatok létrehozása, mentése és nyomtatása számított végösszeggel és ÁFÁ-val."],
    documents: ["Dokumentum-nyilvántartás", "Egyszerű dokumentumrekordok mentése és szinkronizálása a munkaterülettel."],
    studio: ["App Stúdió", "Béta tervezési folyamatok appötletek promptolásához, felépítéséhez és diagnosztikájához; az AI-bővítés még bevezetés alatt áll."],
    x30: ["X30 renderelő előnézet", "Séma-alapú belső előnézet, amely kizárólag engedélyezett komponenseket és biztonságos értékeket jelenít meg."],
  },
  de: {
    reports: ["Arbeitsbereich-Berichte", "Zusammenfassungen aus Ihren gespeicherten Kunden-, Dokument-, Ausgaben- und Aufgabendaten."],
    invoices: ["Rechnungs- & Angebotseditor", "Rechnungen und Angebote mit berechneten Summen und MwSt. erstellen, speichern und drucken."],
    documents: ["Dokumenteinträge", "Einfache Dokumenteinträge speichern und mit dem Arbeitsbereich synchronisieren."],
    studio: ["App Studio", "Beta-Planungsabläufe für App-Ideen; KI-Erweiterungen werden noch schrittweise eingeführt."],
    x30: ["X30-Renderer-Vorschau", "Eine schemagesteuerte interne Vorschau, die nur zugelassene Komponenten und sichere Werte darstellt."],
  },
  fr: {
    reports: ["Rapports de l’espace", "Synthèses des clients, documents, dépenses et tâches à partir des données enregistrées."],
    invoices: ["Créateur de factures et devis", "Créez, enregistrez et imprimez des factures et devis avec totaux et TVA calculés."],
    documents: ["Registre de documents", "Enregistrez des fiches documentaires simples et synchronisez-les avec votre espace."],
    studio: ["App Studio", "Flux bêta pour planifier et diagnostiquer des idées d’applications ; l’amélioration IA est encore en déploiement."],
    x30: ["Aperçu du moteur X30", "Un aperçu interne piloté par schéma qui n’affiche que des composants approuvés et des valeurs sûres."],
  },
  es: {
    reports: ["Informes del espacio", "Resúmenes de clientes, documentos, gastos y tareas a partir de los datos guardados."],
    invoices: ["Creador de facturas y presupuestos", "Crea, guarda e imprime facturas y presupuestos con totales e IVA calculados."],
    documents: ["Registro de documentos", "Guarda registros sencillos de documentos y sincronízalos con tu espacio."],
    studio: ["App Studio", "Flujos beta para planificar y diagnosticar ideas de apps; la mejora con IA todavía se está desplegando."],
    x30: ["Vista previa del renderizador X30", "Una vista interna basada en esquemas que solo muestra componentes aprobados y valores seguros."],
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
    { icon: Layers3, title: h.x30[0], desc: h.x30[1], status: "beta", href: "/app-studio/x30-alpha" },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="Connected capabilities" title={t.capabilities.heading} description={t.capabilities.subheading} />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, desc, status, href }, index) => (
          <Link
            key={title}
            href={href}
            className="group rounded-3xl focus-visible:outline-none"
          >
            <IntelligenceCard interactive tone={index===0||index===5?"violet":index===1?"cyan":index===2?"gold":"neutral"} className="flex h-full flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <SignalIcon icon={Icon} tone={index===0||index===5?"violet":index===1?"cyan":index===2?"gold":"emerald"} />
              <StatusBadge status={status} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">{desc}</p>
            </div>
            </IntelligenceCard>
          </Link>
        ))}
      </div>
    </section>
  )
}
