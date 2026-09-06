"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, Inbox, ShieldCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { analyseIntegrationLoad, type AutopilotTask, type IntegrationLoadInput } from "@/lib/autopilot-v1"

const COPY={
 en:{label:"Live HEGEVA Core signal",inbox:(count:number)=>`${count} unread messages need a focused review.`,calendar:(count:number,capped:boolean)=>`${count}${capped?"+":""} upcoming calendar items need workload planning.`,planned:"Already linked to today’s Planner.",completed:"Today’s linked priority is complete.",review:"Review in Autopilot",boundary:"Read-only signal · no message is sent"},
 hu:{label:"Élő HEGEVA Core-jelzés",inbox:(count:number)=>`${count} olvasatlan üzenet célzott áttekintést igényel.`,calendar:(count:number,capped:boolean)=>`${count}${capped?"+":""} közelgő naptári esemény terheléstervezést igényel.`,planned:"Már kapcsolódik a mai Tervezőhöz.",completed:"A mai kapcsolódó prioritás elkészült.",review:"Áttekintés az Autopilotban",boundary:"Csak olvasható jelzés · nincs automatikus üzenetküldés"},
 de:{label:"Live-Signal von HEGEVA Core",inbox:(count:number)=>`${count} ungelesene Nachrichten erfordern eine gezielte Prüfung.`,calendar:(count:number,capped:boolean)=>`${count}${capped?"+":""} anstehende Kalendereinträge erfordern Kapazitätsplanung.`,planned:"Bereits mit dem heutigen Planer verknüpft.",completed:"Die heute verknüpfte Priorität ist abgeschlossen.",review:"Im Autopilot prüfen",boundary:"Nur-Lese-Signal · keine Nachricht wird gesendet"},
 fr:{label:"Signal HEGEVA Core en direct",inbox:(count:number)=>`${count} messages non lus nécessitent un examen ciblé.`,calendar:(count:number,capped:boolean)=>`${count}${capped?"+":""} événements à venir nécessitent une planification de charge.`,planned:"Déjà lié au planning du jour.",completed:"La priorité liée du jour est terminée.",review:"Examiner dans Autopilot",boundary:"Signal en lecture seule · aucun message n’est envoyé"},
 es:{label:"Señal HEGEVA Core en vivo",inbox:(count:number)=>`${count} mensajes no leídos requieren una revisión enfocada.`,calendar:(count:number,capped:boolean)=>`${count}${capped?"+":""} eventos próximos requieren planificación de carga.`,planned:"Ya está vinculada al planificador de hoy.",completed:"La prioridad vinculada de hoy está completada.",review:"Revisar en Autopilot",boundary:"Señal de solo lectura · no se envía ningún mensaje"},
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
 const text=task?.done?c.completed:task?c.planned:priority.kind==="inbox-load"?c.inbox(priority.count):c.calendar(priority.count,priority.capped)
 return <section className="mt-8 rounded-2xl border border-cyan-300/25 bg-gradient-to-r from-cyan-300/[.08] via-background to-emerald-300/[.06] p-4 sm:p-5" aria-label={c.label}>
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><span className="grid size-11 shrink-0 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10"><Inbox className="size-5 text-cyan-200" aria-hidden/></span><div className="min-w-0 flex-1"><p className="text-[.65rem] font-semibold uppercase tracking-[.16em] text-cyan-300">{c.label}</p><p className="mt-1 text-sm font-semibold leading-6">{text}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" aria-hidden/>{c.boundary}</p></div><Link href="/business/autopilot" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-300/35 px-4 text-sm font-semibold text-cyan-200">{c.review}<ArrowUpRight className="size-4" aria-hidden/></Link></div>
 </section>
}
