"use client"

import { CheckCircle2, ShieldCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"

type Campaign = { id:string; productOrService?:string; channel?:string; approvalState?:"draft"|"approved"; approvedAt?:string; updatedAt?:string }

const COPY={
 en:{title:"Campaign approvals",sub:"A campaign must be explicitly approved before it can be used for publishing.",empty:"Save a campaign draft above first.",draft:"Needs review",approved:"Owner approved",approve:"Approve",reopen:"Return to review"},
 hu:{title:"Kampányjóváhagyások",sub:"A kampányt a közzététel előtt külön jóvá kell hagynod.",empty:"Először ments egy kampányvázlatot fent.",draft:"Ellenőrzésre vár",approved:"Tulajdonos által jóváhagyva",approve:"Jóváhagyás",reopen:"Vissza ellenőrzésre"},
 de:{title:"Kampagnenfreigaben",sub:"Eine Kampagne muss vor der Veröffentlichung ausdrücklich freigegeben werden.",empty:"Speichern Sie zuerst oben einen Entwurf.",draft:"Prüfung erforderlich",approved:"Freigegeben",approve:"Freigeben",reopen:"Zurück zur Prüfung"},
 fr:{title:"Approbation des campagnes",sub:"Une campagne doit être approuvée avant publication.",empty:"Enregistrez d’abord un brouillon ci-dessus.",draft:"À vérifier",approved:"Approuvée",approve:"Approuver",reopen:"Remettre en révision"},
 es:{title:"Aprobación de campañas",sub:"Una campaña debe aprobarse antes de publicarse.",empty:"Guarda primero un borrador arriba.",draft:"Requiere revisión",approved:"Aprobada",approve:"Aprobar",reopen:"Volver a revisión"},
} as const

export function CampaignApprovalBoard(){
 const{locale}=useI18n(),c=COPY[locale]
 const{items,setItems,syncState}=useWorkspaceData<Campaign>("advertising_drafts")
 const toggle=(item:Campaign)=>setItems(current=>current.map(entry=>entry.id===item.id?{...entry,approvalState:item.approvalState==="approved"?"draft":"approved",approvedAt:item.approvalState==="approved"?undefined:new Date().toISOString(),updatedAt:new Date().toISOString()}:entry))
 return <section className="glass-panel mt-6 rounded-3xl p-5 sm:p-7"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary"/><h2 className="font-display text-xl">{c.title}</h2></div><p className="mt-2 text-sm text-muted-foreground">{c.sub} · {syncState}</p><div className="mt-5 grid gap-3 md:grid-cols-2">{items.length===0&&<p className="text-sm text-muted-foreground">{c.empty}</p>}{items.map(item=>{const approved=item.approvalState==="approved";return <article key={item.id} className={`rounded-2xl border p-4 ${approved?"border-primary/30 bg-primary/5":"border-border"}`}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{item.productOrService||"Campaign"}</h3><p className="mt-1 text-xs text-muted-foreground">{item.channel||"channel"} · {approved?c.approved:c.draft}</p></div>{approved&&<CheckCircle2 className="size-5 text-primary"/>}</div><button type="button" onClick={()=>toggle(item)} className="mt-4 min-h-11 rounded-xl border border-primary/40 px-4 text-sm font-semibold text-primary">{approved?c.reopen:c.approve}</button></article>})}</div></section>
}
