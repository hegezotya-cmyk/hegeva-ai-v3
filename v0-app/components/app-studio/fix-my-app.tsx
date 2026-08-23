"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Accessibility,
  AlertTriangle,
  ArrowLeft,
  Bug,
  Database,
  Gauge,
  KeyRound,
  LayoutPanelTop,
  ShieldCheck,
  Smartphone,
  Wrench,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { StepFlow, type FlowStep } from "@/components/app-studio/step-flow"
import { StatusBadge } from "@/components/status-badge"
import { useI18n } from "@/lib/i18n/provider"
import { getStudioCopy } from "@/lib/i18n/studio-copy"
import { getWorkflowsCopy } from "@/lib/i18n/workflows-copy"

const fixSteps: FlowStep[] = [
  {
    key: "problem",
    title: "Describe the problem",
    description:
      "Capture the symptom, affected page or feature, expected behaviour, actual behaviour and when the issue started.",
  },
  {
    key: "evidence",
    title: "Collect evidence",
    description:
      "Add relevant error messages, logs, screenshots, code snippets, routes and reproduction steps. Do not infer facts that were not supplied.",
  },
  {
    key: "scope",
    title: "Identify scope",
    description:
      "Separate the issue into UI, UX, performance, API, database, authentication, security, mobile or accessibility areas.",
  },
  {
    key: "cause",
    title: "Likely cause",
    description:
      "Form a testable diagnosis and clearly label uncertainty. A likely cause is not presented as confirmed until evidence verifies it.",
  },
  {
    key: "plan",
    title: "Safe fix plan",
    description:
      "Define the smallest safe change, list files or systems that may be affected, and protect existing working behaviour.",
  },
  {
    key: "verify",
    title: "Verification",
    description:
      "Define build, functional, responsive and regression checks required before a fix can be described as completed.",
  },
]

const categories = [
  { icon: LayoutPanelTop, title: "UI & UX", text: "Layout, hierarchy, interaction and visual consistency." },
  { icon: Gauge, title: "Performance", text: "Rendering, loading, dependencies and avoidable repeated work." },
  { icon: Bug, title: "JavaScript & App Logic", text: "Runtime errors, state flow, routes and component behaviour." },
  { icon: Database, title: "API & Database", text: "Requests, responses, persistence and data relationships." },
  { icon: KeyRound, title: "Authentication", text: "Sessions, protected areas, roles and account flow." },
  { icon: ShieldCheck, title: "Security", text: "Secrets, validation, permissions and sensitive operations." },
  { icon: Smartphone, title: "Mobile", text: "Responsive layouts, touch behaviour and small-screen usability." },
  { icon: Accessibility, title: "Accessibility", text: "Keyboard use, semantics, focus and readable interfaces." },
]

export function FixMyApp() {
  const { locale } = useI18n()
  const shared = getStudioCopy(locale)
  const c = getWorkflowsCopy(locale).fix
  const steps = c.steps.map(([title, description], index) => ({ key: fixSteps[index].key, title, description }))
  const labels = {
    en: ["Describe the problem", "Create diagnostic plan", "Diagnostic plan"],
    hu: ["Írd le a problémát", "Hibakeresési terv készítése", "Hibakeresési terv"],
    de: ["Problem beschreiben", "Diagnoseplan erstellen", "Diagnoseplan"],
    fr: ["Décrivez le problème", "Créer le plan de diagnostic", "Plan de diagnostic"],
    es: ["Describe el problema", "Crear plan de diagnóstico", "Plan de diagnóstico"],
  }[locale]
  const [problem, setProblem] = useState("")
  const [diagnosis, setDiagnosis] = useState("")

  function createDiagnosis() {
    const value = problem.trim()
    if (!value) return
    setDiagnosis(
      [`# ${c.title}`, "", value, "", ...steps.map((step, index) => `## ${index + 1}. ${step.title}\n${step.description}`)].join("\n"),
    )
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/app-studio"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {shared.backStudio}
        </Link>
      </div>

      <PageHeader
        eyebrow="HEGEVA App Studio"
        title={c.title}
        subtitle={c.sub}
        action={<StatusBadge status="beta" />}
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
              <Wrench className="size-5 text-gold" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{c.doctor}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {c.doctorBody}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-gold" aria-hidden />
            <span className="text-sm font-semibold text-foreground">{c.trust}</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {c.trustBody}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <StepFlow
          steps={steps}
          status="beta"
          note={c.note}
        />
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-5">
          <label htmlFor="fix-problem" className="text-sm font-semibold">{labels[0]}</label>
          <textarea id="fix-problem" value={problem} onChange={(event) => setProblem(event.target.value)} rows={7} className="mt-3 w-full rounded-xl border border-input bg-input/30 p-3 text-sm outline-none focus:border-primary/50" />
          <button type="button" disabled={!problem.trim()} onClick={createDiagnosis} className="mt-4 w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{labels[1]}</button>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold">{labels[2]}</h2>
          {diagnosis ? <><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background/50 p-4 text-xs leading-relaxed">{diagnosis}</pre><button type="button" onClick={() => navigator.clipboard.writeText(diagnosis)} className="mt-3 rounded-xl border border-border px-4 py-2 text-sm">{shared.prompt.copy}</button></> : <p className="mt-3 text-sm text-muted-foreground">{c.trustBody}</p>}
        </div>
      </section>

      <section className="mt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{c.section}</p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">{c.covers}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ icon: Icon }, index) => {
            const [title, text] = c.items[index]
            return (
            <article key={title} className="glass-panel rounded-2xl p-5">
              <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary/50">
                <Icon className="size-4 text-gold" aria-hidden />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p>
            </article>
          )})}
        </div>
      </section>
    </div>
  )
}
