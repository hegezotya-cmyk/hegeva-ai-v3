"use client"

import Link from "next/link"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Users, FileText, ReceiptText, ArrowRight, CalendarCheck2, BarChart3, MessageSquareText, Wrench, FolderLock, FileSpreadsheet, ShieldCheck, Sparkles, FlaskConical, SearchCheck, Rocket, Store, BadgePoundSterling, Network, Share2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { TOOLS_COPY } from "@/lib/i18n/tools-copy"
import { VAULT_COPY } from "@/lib/i18n/vault-copy"
import { INVOICE_COPY } from "@/lib/i18n/invoice-copy"
import { IntelligenceCard, SignalIcon } from "@/components/visual-engine"

export default function BusinessPage() {
  const { t, locale } = useI18n()
  const modules = [
    { href: "/business/intelligence", title: locale === "hu" ? "Üzleti intelligencia" : "Business Intelligence", text: locale === "hu" ? "Reggeli összefoglaló, reklámok, utánkövetés, heti riport és Watchtower." : "Briefings, ads, follow-ups, weekly reports and Watchtower.", icon: Sparkles },
    { href: "/business/twin", title: locale === "hu" ? "Business Twin" : locale === "de" ? "Business Twin" : locale === "fr" ? "Jumeau d’entreprise" : locale === "es" ? "Gemelo empresarial" : "Business Twin", text: locale === "hu" ? "Tesztelj árazási, marketing- és növekedési döntéseket a valódi adataidon." : locale === "de" ? "Preis-, Marketing- und Wachstumsentscheidungen mit echten Daten testen." : locale === "fr" ? "Testez les décisions de prix, marketing et croissance avec vos données réelles." : locale === "es" ? "Prueba decisiones de precios, marketing y crecimiento con datos reales." : "Test pricing, marketing and growth decisions against your real records.", icon: FlaskConical },
    { href: "/business/fix", title: "Fix My Business", text: locale === "hu" ? "Találd meg a pénzügyi, értékesítési és működési akadályokat, majd készíts jóváhagyható javítási tervet." : locale === "de" ? "Finanzielle, vertriebliche und operative Bremsen finden und einen freigabefähigen Plan erstellen." : locale === "fr" ? "Identifiez les blocages financiers, commerciaux et opérationnels, puis préparez un plan approuvable." : locale === "es" ? "Detecta bloqueos financieros, comerciales y operativos y prepara un plan aprobable." : "Find financial, sales and operational blockers, then prepare an approval-ready recovery plan.", icon: SearchCheck },
    { href: "/business/launch", title: "One-Click Business", text: locale === "hu" ? "Egy valódi lehetőségből jóváhagyható ügyfél-, ajánlat- és utánkövetési folyamat." : locale === "de" ? "Ein freigabefähiger Kunden-, Angebots- und Nachfassablauf aus einer echten Chance." : locale === "fr" ? "Un flux client, devis et relance approuvable à partir d’une opportunité réelle." : locale === "es" ? "Un flujo aprobable de cliente, presupuesto y seguimiento desde una oportunidad real." : "Turn one real opportunity into an approval-ready customer, quote and follow-up flow.", icon: Rocket },
    { href: "/business/marketplace", title: "Marketplace + HEGEVA Skills", text: locale === "hu" ? "Valóban elkészült HEGEVA-képességek átlátható, munkaterületi katalógusa." : locale === "de" ? "Transparenter Workspace-Katalog implementierter HEGEVA-Fähigkeiten." : locale === "fr" ? "Catalogue transparent des capacités HEGEVA réalisées." : locale === "es" ? "Catálogo transparente de capacidades HEGEVA implementadas." : "A transparent workspace catalogue of implemented HEGEVA capabilities.", icon: Store },
    { href: "/business/outcome-pricing", title: "Outcome Pricing", text: locale === "hu" ? "Eredményarányos díj átlátható modellezése valódi kifizetett bevétel alapján." : locale === "de" ? "Transparente Ergebnisgebühr auf Basis echter bezahlter Umsätze." : locale === "fr" ? "Modélisation transparente des frais sur le revenu réellement payé." : locale === "es" ? "Tarifa por resultado basada en ingresos realmente pagados." : "Model transparent outcome-linked fees from verified paid revenue.", icon: BadgePoundSterling },
    { href: "/business/network", title: "Business Network", text: locale === "hu" ? "A valódi ügyfél-, ajánlói és partnerkapcsolatok privát munkaterületi térképe." : locale === "de" ? "Private Karte echter Kunden-, Empfehlungs- und Partnerbeziehungen." : locale === "fr" ? "Carte privée des relations clients, recommandations et partenaires." : locale === "es" ? "Mapa privado de relaciones reales con clientes y socios." : "A private workspace map of real customer, referral and partner relationships.", icon: Network },
    { href: "/business/client-portal", title: "Client Portal", text: locale === "hu" ? "Kiválasztott ügyfélrekordok lejáró, visszavonható, csak olvasható megosztása." : "Share selected customer records through an expiring, revocable, read-only portal.", icon: Share2 },
    { href: "/business/customers", title: t.business.customers, text: t.business.customersDesc, icon: Users },
    { href: "/business/documents", title: t.business.documents, text: t.business.documentsDesc, icon: FileText },
    { href: "/business/expenses", title: t.business.expenses, text: t.business.expensesDesc, icon: ReceiptText },
    { href: "/business/planner", title: t.business.planner, text: t.business.plannerDesc, icon: CalendarCheck2 },
    { href: "/business/reports", title: t.business.reports, text: t.business.reportsDesc, icon: BarChart3 },
    { href: "/business/messages", title: t.business.messages, text: t.business.messagesDesc, icon: MessageSquareText },
    { href: "/business/tools", title: TOOLS_COPY[locale].moduleTitle, text: TOOLS_COPY[locale].moduleDesc, icon: Wrench },
    { href: "/business/vault", title: VAULT_COPY[locale].moduleTitle, text: VAULT_COPY[locale].moduleDesc, icon: FolderLock },
    { href: "/business/invoices", title: INVOICE_COPY[locale].moduleTitle, text: INVOICE_COPY[locale].moduleDesc, icon: FileSpreadsheet },
    { href: "/business/financial-guard", title: t.nav.financialGuard, text: t.nav.financialGuard, icon: ShieldCheck },
    ...(locale === "hu" ? [{ href: "/business/contracts", title: "Szerződések", text: "Saját szerződéstervezetek kezelése.", icon: FileText }, { href: "/business/receipts", title: "Nyugták", text: "Valós tranzakciók nyilvántartása.", icon: ReceiptText }, { href: "/business/tax-summaries", title: "Adóösszesítők", text: "Saját bevételek és kiadások áttekintése.", icon: FileSpreadsheet }] : locale === "de" ? [{ href: "/business/contracts", title: "Verträge", text: "Eigene Vertragsentwürfe verwalten.", icon: FileText }, { href: "/business/receipts", title: "Quittungen", text: "Echte Transaktionen erfassen.", icon: ReceiptText }, { href: "/business/tax-summaries", title: "Steuerübersichten", text: "Eigene Einnahmen und Ausgaben prüfen.", icon: FileSpreadsheet }] : locale === "fr" ? [{ href: "/business/contracts", title: "Contrats", text: "Gérer vos brouillons de contrats.", icon: FileText }, { href: "/business/receipts", title: "Reçus", text: "Enregistrer des transactions réelles.", icon: ReceiptText }, { href: "/business/tax-summaries", title: "Synthèses fiscales", text: "Examiner vos revenus et dépenses.", icon: FileSpreadsheet }] : locale === "es" ? [{ href: "/business/contracts", title: "Contratos", text: "Gestiona tus borradores de contrato.", icon: FileText }, { href: "/business/receipts", title: "Recibos", text: "Registra transacciones reales.", icon: ReceiptText }, { href: "/business/tax-summaries", title: "Resúmenes fiscales", text: "Revisa tus ingresos y gastos.", icon: FileSpreadsheet }] : [{ href: "/business/contracts", title: "Contracts", text: "Prepare and manage contract drafts.", icon: FileText }, { href: "/business/receipts", title: "Receipts", text: "Record real transactions.", icon: ReceiptText }, { href: "/business/tax-summaries", title: "Tax summaries", text: "Review supplied income and expenses.", icon: FileSpreadsheet }]),
  ]
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <PageHeader eyebrow={t.business.eyebrow} title={t.business.title} subtitle={t.business.subtitle} />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {modules.map(({ href, title, text, icon: Icon }, index) => (
            <Link key={href} href={href} className="group rounded-3xl focus-visible:outline-none">
              <IntelligenceCard interactive tone={index===4||index===5?"cyan":index===7?"gold":index===8?"violet":"neutral"} className="h-full p-6">
              <div className="flex items-center justify-between gap-4">
                <SignalIcon icon={Icon} tone={index===4||index===5?"cyan":index===7?"gold":index===8?"violet":"emerald"} />
                <StatusBadge status="working" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground/80 group-hover:text-foreground">{t.business.open} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
              </IntelligenceCard>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
