"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Boxes,
  Database,
  Download,
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
import {
  downloadTextFile,
  looksLikeHtmlDocument,
  runStudioAI,
  stripCodeFence,
  type StudioLocale,
} from "@/lib/app-studio-ai"

const APP_STUDIO_HANDOFF_KEY = "hegeva:app-studio:prompt-to-build"
const LAST_BUILD_KEY = "hegeva:app-studio:last-built-html"

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

const prototypeCopy = {
  en: {
    title: "Working browser prototype",
    body: "Beta currently creates a real single-file HTML app that runs in the browser. Server databases, authentication, payments and deployment are not silently simulated; they remain separate build stages.",
    button: "Build working prototype",
    building: "Building prototype…",
    preview: "Live preview",
    code: "Generated index.html",
    download: "Download index.html",
    error: "Prototype generation failed.",
  },
  hu: {
    title: "Működő böngészős prototípus",
    body: "A béta jelenleg valódi, egyfájlos HTML alkalmazást készít, amely a böngészőben fut. A szerveres adatbázist, belépést, fizetést és deployt nem szimuláljuk hamisan; ezek külön építési lépések maradnak.",
    button: "Működő prototípus építése",
    building: "Prototípus építése…",
    preview: "Élő előnézet",
    code: "Generált index.html",
    download: "index.html letöltése",
    error: "A prototípus generálása sikertelen.",
  },
  de: {
    title: "Funktionierender Browser-Prototyp",
    body: "Die Beta erstellt derzeit eine echte Ein-Datei-HTML-App, die im Browser läuft. Server-Datenbank, Anmeldung, Zahlungen und Deployment werden nicht vorgetäuscht und bleiben separate Ausbaustufen.",
    button: "Funktionierenden Prototyp bauen",
    building: "Prototyp wird erstellt…",
    preview: "Live-Vorschau",
    code: "Generierte index.html",
    download: "index.html herunterladen",
    error: "Prototyp konnte nicht erstellt werden.",
  },
  fr: {
    title: "Prototype navigateur fonctionnel",
    body: "La bêta crée actuellement une vraie application HTML en un seul fichier qui fonctionne dans le navigateur. Base de données serveur, authentification, paiements et déploiement ne sont pas simulés et restent des étapes séparées.",
    button: "Construire le prototype fonctionnel",
    building: "Construction du prototype…",
    preview: "Aperçu en direct",
    code: "index.html généré",
    download: "Télécharger index.html",
    error: "La génération du prototype a échoué.",
  },
  es: {
    title: "Prototipo funcional en navegador",
    body: "La beta crea actualmente una aplicación HTML real de un solo archivo que funciona en el navegador. Base de datos del servidor, autenticación, pagos y despliegue no se simulan y siguen siendo etapas separadas.",
    button: "Crear prototipo funcional",
    building: "Creando prototipo…",
    preview: "Vista previa en vivo",
    code: "index.html generado",
    download: "Descargar index.html",
    error: "No se pudo generar el prototipo.",
  },
} as const

const milestoneCopy = {
  en: ["Foundation", "Core product", "Integrations", "Launch readiness"],
  hu: ["Alapok", "Alaptermék", "Integrációk", "Indulásra kész állapot"],
  de: ["Grundlage", "Kernprodukt", "Integrationen", "Startbereitschaft"],
  fr: ["Fondations", "Produit principal", "Intégrations", "Préparation au lancement"],
  es: ["Fundamentos", "Producto principal", "Integraciones", "Preparación para lanzamiento"],
} as const

export function BuildMyApp() {
  const { locale } = useI18n()
  const shared = getStudioCopy(locale)
  const c = getWorkflowsCopy(locale).build
  const steps = c.steps.map(([title, description], index) => ({ key: buildSteps[index].key, title, description }))
  const labels = prototypeCopy[locale]
  const milestones = milestoneCopy[locale]
  const [idea, setIdea] = useState("")
  const [plan, setPlan] = useState("")
  const [sourceSpec, setSourceSpec] = useState("")
  const [prototype, setPrototype] = useState("")
  const [buildingPrototype, setBuildingPrototype] = useState(false)
  const [prototypeError, setPrototypeError] = useState("")

  useEffect(() => {
    let raw: string | null = null
    try {
      raw = sessionStorage.getItem(APP_STUDIO_HANDOFF_KEY)
    } catch {}
    if (!raw) {
      try {
        raw = localStorage.getItem(APP_STUDIO_HANDOFF_KEY)
      } catch {}
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
    } catch {}
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
      ...steps.slice(1, 9).flatMap((step, index) => [
        `## ${index + 2}. ${step.title}`,
        step.description,
        "",
      ]),
      `## 10. ${steps[9].title}`,
      steps[9].description,
      "",
      ...milestones.flatMap((milestone, index) => [
        `### ${index + 1}. ${milestone}`,
        steps[Math.min(index * 3, steps.length - 1)].description,
        "",
      ]),
      sourceSpec ? `## ${shared.prompt.spec}\n${sourceSpec}` : "",
    ].filter(Boolean).join("\n")

    setPlan(generated)
  }

  async function buildPrototype() {
    const value = idea.trim()
    if (!value || buildingPrototype) return

    setPrototypeError("")
    setBuildingPrototype(true)

    const specification = sourceSpec || plan
    const instruction = [
      "You are the HEGEVA Build My App X10 browser-prototype builder.",
      `Target language: ${locale}.`,
      "Create a genuinely working, self-contained browser prototype as ONE complete index.html file.",
      "Return ONLY HTML code. No Markdown fences, explanations or preface.",
      "Use inline CSS and vanilla JavaScript so the file runs locally without dependencies.",
      "Implement meaningful interactions that fit the idea, using localStorage when local persistence is useful.",
      "Do not fake server authentication, cloud database, payments, email or external API success. If the idea requires those, show them clearly as unavailable/integration-required rather than pretending they work.",
      "Keep the code compact enough for the response limit, responsive and usable on mobile.",
      `APP IDEA:\n${value}`,
      specification ? `SPECIFICATION:\n${specification.slice(0, 5000)}` : "",
    ].filter(Boolean).join("\n\n")

    try {
      const answer = await runStudioAI(instruction, locale as StudioLocale)
      const html = stripCodeFence(answer)
      if (!looksLikeHtmlDocument(html)) {
        throw new Error(labels.error)
      }
      setPrototype(html)
      try {
        localStorage.setItem(LAST_BUILD_KEY, html)
      } catch {}
    } catch (error) {
      setPrototypeError(error instanceof Error ? error.message : labels.error)
    } finally {
      setBuildingPrototype(false)
    }
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
          <button type="button" disabled={!idea.trim()} onClick={createPlan} className="mt-4 w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{finishLabels[locale] || finishLabels.en}</button>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground">{c.covers}</h2>
          {plan ? <><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background/50 p-4 text-xs leading-relaxed">{plan}</pre><button type="button" onClick={() => navigator.clipboard.writeText(plan)} className="mt-3 rounded-xl border border-border px-4 py-2 text-sm">{shared.prompt.copy}</button></> : <p className="mt-3 text-sm text-muted-foreground">{shared.prompt.emptyBody}</p>}
        </div>
      </section>

      <section className="mt-8 glass-panel rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <FileCode2 className="size-4 text-primary" aria-hidden />
              <h2 className="text-lg font-semibold text-foreground">{labels.title}</h2>
              <StatusBadge status="beta" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{labels.body}</p>
          </div>
          <button
            type="button"
            onClick={() => void buildPrototype()}
            disabled={!idea.trim() || buildingPrototype}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buildingPrototype ? labels.building : labels.button}
          </button>
        </div>

        {prototypeError && (
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{prototypeError}</p>
        )}

        {prototype && (
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{labels.preview}</h3>
              <iframe
                title={labels.preview}
                srcDoc={prototype}
                sandbox="allow-scripts"
                className="mt-3 h-[520px] w-full rounded-xl border border-border bg-white"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">{labels.code}</h3>
                <button
                  type="button"
                  onClick={() => downloadTextFile("index.html", prototype, "text/html;charset=utf-8")}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium"
                >
                  <Download className="size-4" aria-hidden />
                  {labels.download}
                </button>
              </div>
              <pre className="mt-3 h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-4 text-xs leading-relaxed">{prototype}</pre>
            </div>
          </div>
        )}
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
