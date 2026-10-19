"use client"
import {AppShell} from "@/components/app-shell"
import {PageHeader} from "@/components/page-header"
import {BusinessIntelligenceCenter} from "@/components/business/business-intelligence-center"
import {OperationsExpansion} from "@/components/business/operations-expansion"
import {useI18n} from "@/lib/i18n/provider"
const COPY={en:["HEGEVA BUSINESS","Business Intelligence","Turn your workspace records into approved next actions."],hu:["HEGEVA ÜZLET","Üzleti intelligencia","Alakítsd a munkaterületi adatokat jóváhagyott következő lépésekké."],de:["HEGEVA BUSINESS","Business Intelligence","Workspace-Daten in genehmigte nächste Schritte verwandeln."],fr:["HEGEVA BUSINESS","Intelligence Business","Transformez vos données en prochaines actions approuvées."],es:["HEGEVA BUSINESS","Inteligencia empresarial","Convierte tus datos en próximas acciones aprobadas."]} as const
export default function BusinessIntelligencePage(){const{locale}=useI18n(),c=COPY[locale];return <AppShell><main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><PageHeader eyebrow={c[0]} title={c[1]} subtitle={c[2]}/><div className="mt-8"><BusinessIntelligenceCenter/><OperationsExpansion/></div></main></AppShell>}
