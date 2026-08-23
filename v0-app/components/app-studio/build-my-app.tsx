"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Boxes,
  Database,
  KeyRound,
  Palette,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Workflow,
  FileCode2,
  BrainCircuit,
} from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { StepFlow, type FlowStep } from "@/components/app-studio/step-flow"
import { StatusBadge } from "@/components/status-badge"
import { useI18n } from "@/lib/i18n/provider"
import { getStudioCopy } from "@/lib/i18n/studio-copy"
import { getWorkflowsCopy } from "@/lib/i18n/workflows-copy"

const APP_STUDIO_HANDOFF_KEY = "hegeva:app-studio:prompt-to-build"

const buildSteps: FlowStep[] = [
  { key: "idea", title: "Idea", description: "Define what the application should do, who it is for, and the real problem it should solve." },
  { key: "requirements", title: "Requirements", description: "Turn the idea into clear functional requirements, user roles, workflows, constraints and priorities." },
  { key: "architecture", title: "Architecture", description: "Plan the application structure, routes, reusable modules, services and technical boundaries before implementation." },
  { key: "ui", title: "UI Design", description: "Define the interface structure, responsive behavior, design system and key user journeys." },
  { key: "data", title: "Data Model", description: "Describe the information the application needs to store and the relationships between records." },
  { key: "auth", title: "Authentication", description: "Plan sign-up, sign-in, account ownership, roles and protected areas only where they are genuinely required." },
  { key: "ai", title: "AI", description: "Define where AI adds real value, what context it may use, its limits, and how usage should be controlled." },
  { key: "payments", title: "Payments", description: "Plan subscription or payment requirements without pretending a transaction has succeeded before a real provider confirms it." },
  { key: "security", title: "Security", description: "Identify secrets, server-side requirements, permissions, validation and data protection responsibilities." },
  { key: "build", title: "Build Plan", description: "Produce a staged implementation plan with testable milestones instead of attempting one uncontrolled rewrite." },
]

const architectureItems = [
  { icon: Workflow },
  { icon: Palette },
  { icon: Database },
  { icon: KeyRound },
  { icon: BrainCircuit },
  { icon: CreditCard },
  { icon: ShieldCheck },
  { icon: FileCode2 },
]

const finishLabels: Record<string, string> = {
  en: "Create build plan",
  hu: "Építési terv elkészítése",
  de: "Bauplan erstellen",
  fr: "Créer le plan de construction",
  es: "Crear plan de construcción",
}

export function BuildMyApp() {
  const { locale } = useI18n()
  const shared = getStudioCopy(locale)
  const c = getWorkflowsCopy(locale).build
  const steps = c.steps.map(([title, description], index) => ({ key: buildSteps[index].key, title, description }))
  const [idea, setIdea] = useState("")
  const [plan, setPlan] = useState("")
  const [sourceSpec, setSourceSpec] = useState("")

  useEffect(() => {
    let raw: string | null = null
    try {
      raw = sessionStorage.getItem(APP_STUDIO_HANDOFF_KEY)
    } catch {
      // Continue with localStorage fallback.
    }
    if (!raw) {
      try {
        raw = localStorage.getItem(APP_STUDIO_HANDOFF_KEY)
      } catch {
        // Browser storage may be restricted.
      }
    }
    if (!raw) return

    try {
      const payload = JSON.parse(raw) as { idea?: unknown; specification?: unknown }
      const transferredIdea = typeof payload.idea === "string" ? payload.idea.trim() : ""
      const transferredSpec = typeof payload.specification === "string" ? payload.specification.trim() : ""
      if (transferredIdea) setIdea(transferredIdea)
      if (transferredSpec) {
        setSourceSpec(transferredSpec)
        setPlan(transferredSpec)
      }
      try { sessionStorage.removeItem(APP_STUDIO_HANDOFF_KEY) } catch {}
      try { localStorage.removeItem(APP_STUDIO_HANDOFF_KEY) } catch {}
    } catch {
      // Malformed handoff data must never break the page.
    }
  }, [])

  function createPlan() {
    const value = idea.trim()
    if (!value) return

    const generated = [
      `# ${c.title} — X10`,
      "",
      `## 1. ${steps[0].title}`,
      value,
      "",
      `## 2. ${steps[1].title}`,
      steps[1].description,
      "- Define must-have features before nice-to-have features.",
      "- Identify primary users, permissions, validation rules and acceptance criteria.",
      "",
      `## 3. ${steps[2].title}`,
      steps[2].description,
      "- Separate UI, application logic, data access and external integrations.",
      "- Keep secrets and privileged operations server-side.",
      "",
      `## 4. ${steps[3].title}`,
      steps[3].description,
      "- Design responsive desktop and mobile flows.",
      "- Reuse a consistent component system and accessible interaction states.",
      "",
      `## 5. ${steps[4].title}`,
      steps[4].description,
      "- Define entities, ownership, relationships, timestamps and lifecycle rules.",
      "- Validate all writes and avoid invented or simulated stored data.",
      "",
      `## 6. ${steps[5].title}`,
      steps[5].description,
      "- Protect account and workspace data by authenticated ownership.",
      "- Define session expiry, logout and authorization checks.",
      "",
      `## 7. ${steps[6].title}`,
      steps[6].description,
      "- Send only necessary context to AI services.",
      "- Add usage limits, error handling and clear beta/availability states.",
      "",
      `## 8. ${steps[7].title}`,
      steps[7].description,
      "- Treat provider confirmation as the source of truth for payments.",
      "- Prevent duplicate subscriptions and keep plan state auditable.",
      "",
      `## 9. ${steps[8].title}`,
      steps[8].description,
      "- Keep API keys out of client code and validate every privileged request.",
      "- Review data exposure, rate limits and failure behaviour before launch.",
      "",
      `## 10. ${steps[9].title}`,
      "### Milestone 1 — Foundation",
      "- Confirm requirements, routes, data model and access rules.",
      "- Acceptance: project builds cleanly and core navigation works.",
      "",
      "### Milestone 2 — Core product",
      "- Implement real CRUD workflows, account isolation and validation.",
      "- Acceptance: critical user journeys pass end-to-end tests.",
      "",
      "### Milestone 3 — AI and payments",
      "- Connect production AI/payment services with limits and failure handling.",
      "- Acceptance: usage tracking and provider-confirmed payment state are correct.",
      "",
      "### Milestone 4 — Launch readiness",
      "- Run security, responsive, multilingual and regression checks.",
      "- Acceptance: no blocking errors, misleading claims or broken primary flows.",
      sourceSpec ? "\n## Source specification\n" + sourceSpec : "",
    ].filter(Boolean).join("\n")

    setPlan(generated)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/app-studio" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />
          {shared.backStudio}
        </Link>
      </div>

      <PageHeader eyebrow="HEGEVA App Studio" title={c.title} subtitle={c.sub} action={<StatusBadge status="beta" />} />

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="glass-panel rounded-2xl p-5 md:col-span-2">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-cyan/25 bg-cyan/10">
              <Boxes className="size-5 text-cyan" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{c.architect}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.architectBody}</p>
            </div>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden />
            <span className="text-sm font-semibold text-foreground">{c.status}</span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-foreground">{c.beta}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.statusBody}</p>
        </div>
      </div>

      <div className="mt-8">
        <StepFlow
          steps={steps}
          status="beta"
          note={c.note}
          onFinish={createPlan}
          finishLabel={finishLabels[locale] || finishLabels.en}
        />
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-5">
          <label htmlFor="build-idea" className="text-sm font-semibold text-foreground">{shared.prompt.idea}</label>
          <textarea id="build-idea" value={idea} onChange={(event) => setIdea(event.target.value)} rows={7} placeholder={shared.prompt.placeholder} className="mt-3 w-full rounded-xl border border-input bg-input/30 p-3 text-sm outline-none focus:border-primary/50" />
          <button type="button" disabled={!idea.trim()} onClick={createPlan} className="mt-4 w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{shared.prompt.generate}</button>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground">{c.covers}</h2>
          {plan ? <><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background/50 p-4 text-xs leading-relaxed">{plan}</pre><button type="button" onClick={() => navigator.clipboard.writeText(plan)} className="mt-3 rounded-xl border border-border px-4 py-2 text-sm">{shared.prompt.copy}</button></> : <p className="mt-3 text-sm text-muted-foreground">{shared.prompt.emptyBody}</p>}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{c.section}</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">{c.covers}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {architectureItems.map(({ icon: Icon }, index) => {
            const [title, text] = c.items[index]
            return (
              <article key={title} className="glass-panel rounded-2xl p-5">
                <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary/50"><Icon className="size-4 text-primary" aria-hidden /></div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
