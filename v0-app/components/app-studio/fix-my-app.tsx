"use client"

import Link from "next/link"
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
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/app-studio"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to App Studio
        </Link>
      </div>

      <PageHeader
        eyebrow="HEGEVA App Studio"
        title="Fix My App X10"
        subtitle="Diagnose an existing application carefully, build a safe repair plan, and verify changes before anything is described as fixed."
        action={<StatusBadge status="beta" />}
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
              <Wrench className="size-5 text-gold" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">X10 App Doctor</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                This beta structures diagnosis and verification. It does not claim that code was changed, a security scan ran, or a bug was fixed unless a real connected workflow actually performs and verifies that work.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-gold" aria-hidden />
            <span className="text-sm font-semibold text-foreground">Trust rule</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Diagnosis stays evidence-based. Unverified causes are labelled as likely, and unresolved issues are never shown as fixed.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <StepFlow
          steps={fixSteps}
          status="beta"
          note="Fix My App X10 currently provides a guided diagnostic workflow. Automated repository changes, tests and repair execution will only be marked available after they are genuinely connected and verified."
        />
      </div>

      <section className="mt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Diagnostic coverage</p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">Areas X10 can structure for review</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ icon: Icon, title, text }) => (
            <article key={title} className="glass-panel rounded-2xl p-5">
              <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary/50">
                <Icon className="size-4 text-gold" aria-hidden />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
