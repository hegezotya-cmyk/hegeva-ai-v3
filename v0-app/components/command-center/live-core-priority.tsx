"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, Inbox, ShieldCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { analyseIntegrationLoad, type AutopilotTask, type IntegrationLoadInput } from "@/lib/autopilot-v1"

const COPY={
 en:{label:"Live HEGEVA Core signal",inboxLabel:"Inbox workload",calendarLabel:"Calendar workload",inbox:(count:number)=>`${count} unread messages detected in the last 7 days. Set aside a focused review block.`,calendar:(count:number,capped:boolean)=>`${count}${capped?"+":""} events are scheduled for the next 7 days. Review capacity and priorities.`,planned:"Linked to today’s Planner",completed:"Completed in today’s Planner",review:"Review in Autopilot",boundary:"Read-only aggregate · no message is sent"},
 hu:{label:"Élő HEGEVA Core-jelzés",inboxLabel:"Beérkező üzenetek terhelése",calendarLabel:"Naptári terhelés",inbox:(count:number)=>`Az elmúlt 7 napban ${count} olvasatlan üzenetet észleltünk. Érdemes külön időt kijelölni az áttekintésre.`,calendar:(count:number,capped:boolean)=>`A következő 7 napra ${count}${capped?"+":""} esemény van ütemezve. Tekintsd át a kapacitást és a prioritásokat.`,planned:"Kapcsolódik a mai Tervezőhöz",completed:"Elkészült a mai Tervezőben",review:"Áttekintés az Autopilotban",boundary:"Csak összesített, olvasható adat · nincs automatikus üzenetküldés"},
 de:{label:"Live-Signal von HEGEVA Core",inboxLabel:"Posteingangsauslastung",calendarLabel:"Kalenderauslastung",inbox:(count:number)=>`In den letzten 7 Tagen wurden ${count} ungelesene Nachrichten erkannt. Planen Sie einen konzentrierten Prüfblock ein.`,calendar:(count:number,capped:boolean)=>`Für die nächsten 7 Tage sind ${count}${capped?"+":""} Termine geplant. Prüfen Sie Kapazität und Prioritäten.`,planned:"Mit dem heutigen Planer verknüpft",completed:"Im heutigen Planer abgeschlossen",review:"Im Autopilot prüfen",boundary:"Aggregierte Nur-Lese-Daten · keine Nachricht wird gesendet"},
 fr:{label:"Signal HEGEVA Core en direct",inboxLabel:"Charge de la boîte de réception",calendarLabel:"Charge du calendrier",inbox:(count:number)=>`${count} messages non lus ont été détectés au cours des 7 derniers jours. Prévoyez un créneau de traitement ciblé.`,calendar:(count:number,capped:boolean)=>`${count}${capped?"+":""} événements sont prévus au cours des 7 prochains jours. Vérifiez la capacité et les priorités.`,planned:"Lié au planning du jour",completed:"Terminé dans le planning du jour",review:"Examiner dans Autopilot",boundary:"Données agrégées en lecture seule · aucun message n’est envoyé"},
 es:{label:"Señal HEGEVA Core en vivo",inboxLabel:"Carga de la bandeja de entrada",calendarLabel:"Carga del calendario",inbox:(count:number)=>`Se detectaron ${count} mensajes no leídos en los últimos 7 días. Reserva un bloque de revisión específico.`,calendar:(count:number,capped:boolean)=>`Hay ${count}${capped?"+":""} eventos programados para los próximos 7 días. Revisa la capacidad y las prioridades.`,planned:"Vinculada al planificador de hoy",completed:"Completada en el planificador de hoy",review:"Revisar en Autopilot",boundary:"Datos agregados de solo lectura · no se envía ningún mensaje"},
} as const

export function LiveCorePriority(){
 const {locale}=useI18n(),c=COPY[locale]
 const {items:tasks}=useWorkspaceData<AutopilotTask>("planner")
 const [signals,setSignals]=useState<IntegrationLoadInput[]|null>(null)
 useEffect(()=>{let active=true;void fetch("/api/integrations/signals",{cache:"no-store"}).then(async response=>response.ok?(await response.json()) as {signals?:IntegrationLoadInput[]}:null).then(payload=>{if(active)setSignals(Array.isArray(payload?.signals)?payload.signals:[])}).catch(()=>{if(active)setSignals([])});return()=>{active=false}},[])
 const priority=useMemo(()=>analyseIntegrationLoad(signals||[])[0],[signals])
 if(!priority)return null
 const today=new Date().toISOString().slice(0,10)
 const task=tasks.find(item=>item.sourceId===`integration-signal:${priority.id}:${today}`)
 const provider=priority.provider==="google"?"Google Workspace":"Microsoft 365"
 const category=priority.kind==="inbox-load"?c.inboxLabel:c.calendarLabel
 const text=priority.kind==="inbox-load"?c.inbox(priority.count):c.calendar(priority.count,priority.capped)
 const plannerState=task?.done?c.completed:task?c.planned:null
 return <section className="mt-8 rounded-2xl border border-cyan-300/25 bg-gradient-to-r from-cyan-300/[.08] via-background to-emerald-300/[.06] p-4 sm:p-5" aria-label={c.label}>
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><span className="grid size-11 shrink-0 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10"><Inbox className="size-5 text-cyan-200" aria-hidden/></span><div className="min-w-0 flex-1"><p className="text-[.65rem] font-semibold uppercase tracking-[.16em] text-cyan-300">{c.label}</p><p className="mt-1 text-xs font-semibold text-foreground/80">{provider} · {category}</p><p className="mt-1 text-sm font-semibold leading-6">{text}</p>{plannerState&&<p className="mt-2 inline-flex rounded-full border border-emerald-300/25 bg-emerald-300/[.07] px-2.5 py-1 text-[.68rem] font-semibold text-emerald-300">{plannerState}</p>}<p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" aria-hidden/>{c.boundary}</p></div><Link href="/business/autopilot" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-300/35 px-4 text-sm font-semibold text-cyan-200 transition-colors hover:bg-cyan-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70">{c.review}<ArrowUpRight className="size-4" aria-hidden/></Link></div>
 </section>
}
