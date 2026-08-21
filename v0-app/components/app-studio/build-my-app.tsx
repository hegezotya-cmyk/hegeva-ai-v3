import Link from "next/link"
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

const buildSteps: FlowStep[] = [
  {
    key: "idea",
    title: "Idea",
    description:
      "Define what the application should do, who it is for, and the real problem it should solve.",
  },
  {
    key: "requirements",
    title: "Requirements",
    description:
      "Turn the idea into clear functional requirements, user roles, workflows, constraints and priorities.",
  },
  {
    key: "architecture",
    title: "Architecture",
    description:
      "Plan the application structure, routes, reusable modules, services and technical boundaries before implementation.",
  },
  {
    key: "ui",
    title: "UI Design",
    description:
      "Define the interface structure, responsive behavior, design system and key user journeys.",
  },
  {
    key: "data",
    title: "Data Model",
    description:
      "Describe the information the application needs to store and the relationships between records.",
  },
  {
    key: "auth",
    title: "Authentication",
    description:
      "Plan sign-up, sign-in, account ownership, roles and protected areas only where they are genuinely required.",
  },
  {
    key: "ai",
    title: "AI",
    description:
      "Define where AI adds real value, what context it may use, its limits, and how usage should be controlled.",
  },
  {
    key: "payments",
    title: "Payments",
    description:
      "Plan subscription or payment requirements without pretending a transaction has succeeded before a real provider confirms it.",
  },
  {
    key: "security",
    title: "Security",
    description:
      "Identify secrets, server-side requirements, permissions, validation and data protection responsibilities.",
  },
  {
    key: "build",
    title: "Build Plan",
    description:
      "Produce a staged implementation plan with testable milestones instead of attempting one uncontrolled rewrite.",
  },
]

const architectureItems = [
  {
    icon: Workflow,
    title: "Guided architecture",
    text: "Move from an idea to a structured implementation plan in ten clear stages.",
  },
  {
    icon: Palette,
    title: "Design direction",
    text: "Define UI, responsive behavior and reusable design rules before building.",
  },
  {
    icon: Database,
    title: "Data planning",
    text: "Plan real data models and relationships without inventing stored information.",
  },
  {
    icon: KeyRound,
    title: "Authentication",
    text: "Prepare account and permission requirements only when the project needs them.",
  },
  {
    icon: BrainCircuit,
    title: "AI requirements",
    text: "Define useful AI capabilities, context, limits and expected behaviour.",
  },
  {
    icon: CreditCard,
    title: "Payment planning",
    text: "Prepare real payment architecture without simulated payment success.",
  },
  {
    icon: ShieldCheck,
    title: "Security review",
    text: "Keep private keys and sensitive operations out of client-side code.",
  },
  {
    icon: FileCode2,
    title: "Build specification",
    text: "Finish with a structured specification that can later drive implementation.",
  },
]

export function BuildMyApp() {
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
        title="Build My App X10"
        subtitle="Turn an application idea into a clear, structured build plan — architecture, interface, data, authentication, AI, payments and security."
        action={<StatusBadge status="beta" />}
      />

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="glass-panel rounded-2xl p-5 md:col-span-2">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-cyan/25 bg-cyan/10">
              <Boxes className="size-5 text-cyan" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                X10 Project Architect
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                This version structures your project and prepares the build
                specification. It does not claim that a production application
                has been generated or deployed unless a real build system is
                connected and verifies that result.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden />
            <span className="text-sm font-semibold text-foreground">
              X10 status
            </span>
          </div>
          <p className="mt-3 text-2xl font-semibold text-foreground">Beta</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Guided project planning is available. Automated production builds
            will be connected in a later verified phase.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <StepFlow
          steps={buildSteps}
          status="beta"
          note="X10 currently guides and structures the build process. Moving through these steps does not mean code, infrastructure, payments or deployment have already been created."
        />
      </div>

      <section className="mt-10">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            X10 Architecture
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            What the build plan covers
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {architectureItems.map(({ icon: Icon, title, text }) => (
            <article key={title} className="glass-panel rounded-2xl p-5">
              <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary/50">
                <Icon className="size-4 text-primary" aria-hidden />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {text}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
