"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Accessibility,
  AlertTriangle,
  ArrowLeft,
  Bug,
  Database,
  Download,
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
import { sandboxPreviewDocument } from "@/lib/preview-sandbox"
import {
  downloadTextFile,
  looksLikeHtmlDocument,
  runStudioAI,
  stripCodeFence,
  type StudioLocale,
} from "@/lib/app-studio-ai"

const LAST_BUILD_KEY = "hegeva:app-studio:last-built-html"

function summarizeLargeSource(source: string, limit = 7000) {
  if (source.length <= limit) return source
  const chunkSize = 2800
  const chunks = Math.ceil(source.length / chunkSize)
  const tail = Math.max(0, limit - chunkSize - 120)
  return `${source.slice(0, chunkSize)}\n\n<!-- HEGEVA source chunk boundary: ${chunks} chunks total; middle chunks omitted for this bounded repair request. -->\n\n${source.slice(-tail)}`
}

const fixSteps: FlowStep[] = [
  { key: "problem", title: "Describe the problem", description: "Capture the symptom, affected page or feature, expected behaviour, actual behaviour and when the issue started." },
  { key: "evidence", title: "Collect evidence", description: "Add relevant error messages, logs, screenshots, code snippets, routes and reproduction steps. Do not infer facts that were not supplied." },
  { key: "scope", title: "Identify scope", description: "Separate the issue into UI, UX, performance, API, database, authentication, security, mobile or accessibility areas." },
  { key: "cause", title: "Likely cause", description: "Form a testable diagnosis and clearly label uncertainty. A likely cause is not presented as confirmed until evidence verifies it." },
  { key: "plan", title: "Safe fix plan", description: "Define the smallest safe change, list files or systems that may be affected, and protect existing working behaviour." },
  { key: "verify", title: "Verification", description: "Define build, functional, responsive and regression checks required before a fix can be described as completed." },
]

const categories = [
  { icon: LayoutPanelTop },
  { icon: Gauge },
  { icon: Bug },
  { icon: Database },
  { icon: KeyRound },
  { icon: ShieldCheck },
  { icon: Smartphone },
  { icon: Accessibility },
]

const copy = {
  en: {
    problem: "Describe the problem",
    diagnosis: "Create diagnostic plan",
    diagnosisTitle: "Diagnostic plan",
    realTitle: "Real code repair",
    realBody: "Beta can now repair the single-file HTML prototypes produced by Build My App. It does not pretend to modify an external repository or server it cannot access.",
    source: "HTML source to repair",
    sourceHint: "Paste a complete index.html, or open this page after using Build My App and the latest prototype will load automatically.",
    repair: "Repair code",
    repairing: "Repairing…",
    fixed: "Repaired index.html",
    preview: "Repaired preview",
    download: "Download repaired index.html",
    error: "Code repair failed.",
  },
  hu: {
    problem: "Írd le a problémát",
    diagnosis: "Hibakeresési terv készítése",
    diagnosisTitle: "Hibakeresési terv",
    realTitle: "Valódi kódjavítás",
    realBody: "A béta most már képes a Build My App által készített egyfájlos HTML prototípusok tényleges javítására. Nem állítjuk, hogy olyan külső repót vagy szervert módosítunk, amelyhez nincs hozzáférésünk.",
    source: "Javítandó HTML forráskód",
    sourceHint: "Másolj be egy teljes index.html fájlt, vagy nyisd meg ezt az oldalt a Build My App használata után, és a legutóbbi prototípus automatikusan betöltődik.",
    repair: "Kód javítása",
    repairing: "Kód javítása…",
    fixed: "Javított index.html",
    preview: "Javított előnézet",
    download: "Javított index.html letöltése",
    error: "A kódjavítás sikertelen.",
  },
  de: {
    problem: "Problem beschreiben",
    diagnosis: "Diagnoseplan erstellen",
    diagnosisTitle: "Diagnoseplan",
    realTitle: "Echte Code-Reparatur",
    realBody: "Die Beta kann jetzt die von Build My App erzeugten Ein-Datei-HTML-Prototypen tatsächlich reparieren. Externe Repositories oder Server ohne Zugriff werden nicht vorgetäuscht geändert.",
    source: "Zu reparierender HTML-Quellcode",
    sourceHint: "Füge eine vollständige index.html ein oder öffne diese Seite nach Build My App; der letzte Prototyp wird automatisch geladen.",
    repair: "Code reparieren",
    repairing: "Code wird repariert…",
    fixed: "Reparierte index.html",
    preview: "Reparierte Vorschau",
    download: "Reparierte index.html herunterladen",
    error: "Code-Reparatur fehlgeschlagen.",
  },
  fr: {
    problem: "Décrivez le problème",
    diagnosis: "Créer le plan de diagnostic",
    diagnosisTitle: "Plan de diagnostic",
    realTitle: "Réparation réelle du code",
    realBody: "La bêta peut maintenant réparer réellement les prototypes HTML monofichier créés par Build My App. Elle ne prétend pas modifier un dépôt externe ou un serveur auquel elle n’a pas accès.",
    source: "Code HTML à réparer",
    sourceHint: "Collez un index.html complet ou ouvrez cette page après Build My App; le dernier prototype sera chargé automatiquement.",
    repair: "Réparer le code",
    repairing: "Réparation…",
    fixed: "index.html réparé",
    preview: "Aperçu réparé",
    download: "Télécharger index.html réparé",
    error: "La réparation du code a échoué.",
  },
  es: {
    problem: "Describe el problema",
    diagnosis: "Crear plan de diagnóstico",
    diagnosisTitle: "Plan de diagnóstico",
    realTitle: "Reparación real de código",
    realBody: "La beta ya puede reparar de verdad los prototipos HTML de un solo archivo creados por Build My App. No finge modificar repositorios externos o servidores a los que no tiene acceso.",
    source: "Código HTML a reparar",
    sourceHint: "Pega un index.html completo o abre esta página después de Build My App; el último prototipo se cargará automáticamente.",
    repair: "Reparar código",
    repairing: "Reparando…",
    fixed: "index.html reparado",
    preview: "Vista previa reparada",
    download: "Descargar index.html reparado",
    error: "La reparación del código falló.",
  },
} as const

export function FixMyApp() {
  const { locale } = useI18n()
  const shared = getStudioCopy(locale)
  const c = getWorkflowsCopy(locale).fix
  const steps = c.steps.map(([title, description], index) => ({ key: fixSteps[index].key, title, description }))
  const labels = copy[locale]
  const [problem, setProblem] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [sourceCode, setSourceCode] = useState("")
  const [fixedCode, setFixedCode] = useState("")
  const [repairing, setRepairing] = useState(false)
  const [repairError, setRepairError] = useState("")

  useEffect(() => {
    try {
      const lastBuild = localStorage.getItem(LAST_BUILD_KEY)
      if (lastBuild?.trim()) setSourceCode(lastBuild)
    } catch {}
  }, [])

  function createDiagnosis() {
    const value = problem.trim()
    if (!value) return
    setDiagnosis(
      [`# ${c.title}`, "", value, "", ...steps.map((step, index) => `## ${index + 1}. ${step.title}\n${step.description}`)].join("\n"),
    )
  }

  async function repairCode() {
    const issue = problem.trim()
    const code = sourceCode.trim()
    if (!issue || !code || repairing) return

    setRepairError("")
    setRepairing(true)

    const instruction = [
      "You are HEGEVA Fix My App X10.",
      `Target language for visible UI text: ${locale}.`,
      "Repair the supplied self-contained HTML app according to the reported problem.",
      "Return ONLY the complete corrected HTML document. No Markdown fences, commentary, diagnosis or preface.",
      "Preserve working features. Make the smallest safe repair needed, but also correct directly related broken HTML/CSS/JavaScript.",
      "Do not invent successful server authentication, cloud database, payments, email or external API calls. If such a service is unavailable, keep an honest unavailable/integration-required state.",
      "Keep the result compact enough for the response limit and runnable locally as one index.html file.",
      `PROBLEM:\n${issue}`,
      `CURRENT HTML (bounded chunk-aware context):\n${summarizeLargeSource(code)}`,
    ].join("\n\n")

    try {
      const answer = await runStudioAI(instruction, locale as StudioLocale)
      const html = stripCodeFence(answer)
      if (!looksLikeHtmlDocument(html)) throw new Error(labels.error)
      setFixedCode(html)
      setSourceCode(html)
      try {
        localStorage.setItem(LAST_BUILD_KEY, html)
      } catch {}
    } catch (error) {
      setRepairError(error instanceof Error ? error.message : labels.error)
    } finally {
      setRepairing(false)
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

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10">
              <Wrench className="size-5 text-gold" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{c.doctor}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.doctorBody}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-gold" aria-hidden />
            <span className="text-sm font-semibold text-foreground">{c.trust}</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{c.trustBody}</p>
        </div>
      </div>

      <div className="mt-8">
        <StepFlow steps={steps} status="beta" note={c.note} />
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-5">
          <label htmlFor="fix-problem" className="text-sm font-semibold">{labels.problem}</label>
          <textarea id="fix-problem" value={problem} onChange={(event) => setProblem(event.target.value)} rows={7} className="mt-3 w-full rounded-xl border border-input bg-input/30 p-3 text-sm outline-none focus:border-primary/50" />
          <button type="button" disabled={!problem.trim()} onClick={createDiagnosis} className="mt-4 w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{labels.diagnosis}</button>
        </div>
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold">{labels.diagnosisTitle}</h2>
          {diagnosis ? <><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background/50 p-4 text-xs leading-relaxed">{diagnosis}</pre><button type="button" onClick={() => navigator.clipboard.writeText(diagnosis)} className="mt-3 rounded-xl border border-border px-4 py-2 text-sm">{shared.prompt.copy}</button></> : <p className="mt-3 text-sm text-muted-foreground">{c.trustBody}</p>}
        </div>
      </section>

      <section className="mt-8 glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <Bug className="size-4 text-gold" aria-hidden />
          <h2 className="text-lg font-semibold text-foreground">{labels.realTitle}</h2>
          <StatusBadge status="beta" />
        </div>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">{labels.realBody}</p>

        <label htmlFor="fix-source" className="mt-5 block text-sm font-semibold text-foreground">{labels.source}</label>
        <p className="mt-1 text-xs text-muted-foreground">{labels.sourceHint}</p>
        <textarea
          id="fix-source"
          value={sourceCode}
          onChange={(event) => setSourceCode(event.target.value)}
          rows={14}
          spellCheck={false}
          className="mt-3 w-full rounded-xl border border-input bg-background/60 p-4 font-mono text-xs leading-relaxed outline-none focus:border-primary/50"
        />
        <button
          type="button"
          disabled={!problem.trim() || !sourceCode.trim() || repairing}
          onClick={() => void repairCode()}
          className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {repairing ? labels.repairing : labels.repair}
        </button>

        {repairError && (
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{repairError}</p>
        )}

        {fixedCode && (
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{labels.preview}</h3>
              <iframe title={labels.preview} srcDoc={sandboxPreviewDocument(fixedCode)} sandbox="allow-scripts" referrerPolicy="no-referrer" allow="" className="mt-3 h-[520px] w-full rounded-xl border border-border bg-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">{labels.fixed}</h3>
                <button
                  type="button"
                  onClick={() => downloadTextFile("index-fixed.html", fixedCode, "text/html;charset=utf-8")}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium"
                >
                  <Download className="size-4" aria-hidden />
                  {labels.download}
                </button>
              </div>
              <pre className="mt-3 h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-4 text-xs leading-relaxed">{fixedCode}</pre>
            </div>
          </div>
        )}
      </section>

      <section className="mt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{c.section}</p>
        <h2 className="mt-2 text-2xl font-semibold text-foreground">{c.covers}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ icon: Icon }, index) => {
            const [title, text] = c.items[index]
            return (
              <article key={title} className="glass-panel rounded-2xl p-5">
                <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-secondary/50"><Icon className="size-4 text-gold" aria-hidden /></div>
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
