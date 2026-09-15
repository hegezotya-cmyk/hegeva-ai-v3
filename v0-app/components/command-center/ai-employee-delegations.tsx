"use client"

import Link from "next/link"
import { ArrowUpRight, ShieldCheck, Users } from "lucide-react"
import type { Locale } from "@/lib/i18n/dictionaries"
import type { AIEmployeeDelegation } from "@/lib/use-core-decision"

const EMPLOYEE_ROLES = ["Sales", "Finance", "Marketing", "Support"] as const

const COPY: Record<Locale, { eyebrow: string; title: string; subtitle: string; evidence: string; rationale: string; review: string; empty: string }> = {
  en: { eyebrow: "AI EMPLOYEES / ORCHESTRATION", title: "Prepared employee reviews", subtitle: "Core delegates bounded review work from verified workspace evidence. Nothing executes automatically.", evidence: "Evidence", rationale: "Rationale", review: "Review workspace", empty: "No employee review is supported by the current prepared work." },
  hu: { eyebrow: "AI ALKALMAZOTTAK / ORKESZTRÁCIÓ", title: "Előkészített munkatársi áttekintések", subtitle: "A Core hitelesített munkaterületi bizonyítékból korlátozott áttekintési munkát delegál. Semmi nem fut le automatikusan.", evidence: "Bizonyíték", rationale: "Indoklás", review: "Munkaterület áttekintése", empty: "A jelenlegi előkészített munka alapján nincs támogatott munkatársi áttekintés." },
  de: { eyebrow: "AI-MITARBEITER / ORCHESTRIERUNG", title: "Vorbereitete Mitarbeiterprüfungen", subtitle: "Core delegiert begrenzte Prüfungsarbeit anhand verifizierter Workspace-Nachweise. Nichts wird automatisch ausgeführt.", evidence: "Nachweis", rationale: "Begründung", review: "Workspace prüfen", empty: "Die aktuelle vorbereitete Arbeit unterstützt keine Mitarbeiterprüfung." },
  fr: { eyebrow: "COLLABORATEURS IA / ORCHESTRATION", title: "Revues collaborateur préparées", subtitle: "Core délègue un travail de revue limité à partir de preuves vérifiées de l’espace. Rien ne s’exécute automatiquement.", evidence: "Preuve", rationale: "Justification", review: "Examiner l’espace", empty: "Aucune revue collaborateur n’est prise en charge par le travail préparé actuel." },
  es: { eyebrow: "EMPLEADOS IA / ORQUESTACIÓN", title: "Revisiones de empleados preparadas", subtitle: "Core delega trabajo de revisión limitado a partir de evidencia verificada del espacio. Nada se ejecuta automáticamente.", evidence: "Evidencia", rationale: "Motivo", review: "Revisar espacio de trabajo", empty: "El trabajo preparado actual no admite una revisión de empleados." },
}

export function AIEmployeeDelegations({ locale, delegations }: { locale: Locale; delegations: AIEmployeeDelegation[] }) {
  const copy = COPY[locale]
  const orderedDelegations = EMPLOYEE_ROLES.flatMap((role) => delegations.filter((delegation) => delegation.role === role))
  return <section className="border-t border-border px-4 py-6 sm:px-6" aria-labelledby="ai-employee-delegations-title">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="ve-eyebrow">{copy.eyebrow}</p>
        <h3 id="ai-employee-delegations-title" className="mt-1 font-display text-2xl font-semibold">{copy.title}</h3>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{copy.subtitle}</p>
      </div>
    </div>
    {orderedDelegations.length > 0 ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{orderedDelegations.map((delegation) => <article key={delegation.role} className="rounded-2xl border border-cyan-300/25 bg-cyan-300/[.04] p-4">
      <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><Users className="size-4" /></span><div className="min-w-0"><p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-cyan-200">{delegation.role}</p><strong className="mt-1 block text-sm">{delegation.label}</strong><p className="mt-1 text-xs text-muted-foreground">{delegation.title}</p></div></div>
      <p className="mt-3 line-clamp-3 text-xs leading-5 text-muted-foreground">{delegation.content}</p>
      <p className="mt-3 text-xs text-muted-foreground"><b>{copy.evidence}:</b> {delegation.sourceIds.length}</p>
      <p className="mt-1 text-xs text-muted-foreground"><b>{copy.rationale}:</b> {delegation.rationale}</p>
      <div className="mt-4 flex flex-wrap gap-1.5 text-[.6rem] font-bold tracking-[.1em]"><span className="rounded-full border border-amber-300/35 bg-amber-300/10 px-2 py-1 text-amber-200">AWAITING APPROVAL</span><span className="rounded-full border border-border px-2 py-1 text-muted-foreground">PREPARED ONLY</span><span className="rounded-full border border-border px-2 py-1 text-muted-foreground">NOT SENT</span><span className="rounded-full border border-border px-2 py-1 text-muted-foreground">NOT EXECUTED</span></div>
      <Link href={delegation.targetHref} className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-primary">{copy.review}<ArrowUpRight className="size-4" /></Link>
    </article>)}</div> : <div className="mt-4 rounded-2xl border border-border bg-background/45 p-5 text-sm text-muted-foreground"><ShieldCheck className="mr-2 inline size-4 text-primary" />{copy.empty}</div>}
  </section>
}
