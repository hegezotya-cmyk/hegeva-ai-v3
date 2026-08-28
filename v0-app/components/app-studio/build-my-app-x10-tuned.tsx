"use client"

import { useMemo, useState } from "react"
import { Braces, CheckCircle2, Code2, Download, Eye, Laptop, Smartphone, Sparkles, Tablet, WandSparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { downloadTextFile, looksLikeHtmlDocument, runStudioAI, stripCodeFence, type StudioLocale } from "@/lib/app-studio-ai"
import { auditStudioSpecMatch } from "@/lib/app-studio-spec-match"
import { preparePreviewHtml, verifyGeneratedHtml } from "@/lib/app-studio-boundary"

type ViewMode = "preview" | "code"
type DeviceMode = "desktop" | "tablet" | "mobile"

const X10_MIN_REQUEST_MATCH = 75
const X10_MAX_ATTEMPTS = 3

function audit(html: string, idea: string) {
  const spec = auditStudioSpecMatch(html, idea)
  const checks = [
    ["Working JS", /<script\b/i.test(html)],
    ["Persistence", /localStorage/i.test(html)],
    ["Responsive", /@media|viewport/i.test(html)],
    ["Forms", /<form\b/i.test(html) && /<(input|select|textarea)\b/i.test(html)],
    ["Navigation", /<(nav|aside)\b/i.test(html)],
    ["Accessible", /aria-label|<label\b/i.test(html)],
  ] as const
  const capabilityScore = html ? Math.round((checks.filter(([, ok]) => ok).length / checks.length) * 100) : 0
  const buildScore = html ? Math.min(capabilityScore, spec.score) : 0
  return { checks, ...spec, specScore: spec.score, capabilityScore, buildScore }
}

function instruction(idea: string, locale: string, missing: string[] = [], previousScore?: number) {
  return [
    "You are the HEGEVA Build My App X10 premium browser-app engine.",
    `Visible UI language: ${locale}.`,
    "Create one polished, genuinely working self-contained index.html with inline CSS and vanilla JavaScript.",
    "Build the CUSTOMER'S ACTUAL REQUEST. Do not replace a specific domain request with a generic CRM, dashboard, Business OS, invoice app or template unless the customer explicitly asked for that.",
    "Preserve the customer's important domain nouns, entities, fields and workflows in the visible UI, navigation, forms, state model and working interactions.",
    "X10 should be focused rather than huge: 2-4 meaningful product areas with one excellent end-to-end workflow.",
    "Every visible primary button and form must work locally. Use real add/update/delete/search/filter/calculation behavior when relevant to the request.",
    "Persist useful user-created data with localStorage when appropriate.",
    "Use strong premium SaaS UX, responsive mobile layout, clear hierarchy, helpful empty states and accessible labels.",
    "Do not fake server authentication, payments, cloud database, email or external API success. Mark external integrations honestly when they cannot run locally.",
    previousScore !== undefined ? `PREVIOUS REQUEST MATCH: ${previousScore}%. This is below the X10 target of ${X10_MIN_REQUEST_MATCH}%. Rebuild around the customer's actual domain instead of preserving unrelated generic modules.` : "",
    missing.length ? `PREVIOUS BUILD MISSED THESE REQUEST CONCEPTS. The new build must visibly and functionally implement them where relevant: ${missing.join(", ")}. Do not merely mention these words in headings or comments.` : "",
    "Before returning, mentally verify that the main records, form fields, navigation labels and actions are specific to the customer's request rather than a generic business template.",
    "Return ONLY the complete HTML document. No Markdown fences or explanation.",
    `CUSTOMER REQUEST:\n${idea.slice(0, 1600)}`,
  ].filter(Boolean).join("\n\n")
}

const copy = {
  en: { eyebrow: "HEGEVA APP STUDIO · X10", title: "Focused builds that feel finished.", sub: "A faster paid-quality builder for smaller customer apps — with request matching, live preview and honest verification.", label: "Describe the customer app", placeholder: "What should the app do? Who uses it? Which workflows must actually work?", build: "Build X10 app", building: "Building X10…", preview: "Preview", code: "Code", download: "Download index.html", empty: "Your X10 build will appear here.", request: "Request match", health: "Build health" },
  hu: { eyebrow: "HEGEVA APP STUDIO · X10", title: "Fókuszált appok, kész termék érzetével.", sub: "Gyorsabb, fizetős minőségű builder kisebb ügyfélappokhoz — kérés-illesztéssel, élő előnézettel és őszinte ellenőrzéssel.", label: "Írd le az ügyfél appját", placeholder: "Mit csináljon az app? Ki használja? Mely folyamatoknak kell valóban működniük?", build: "X10 app építése", building: "X10 építése…", preview: "Előnézet", code: "Kód", download: "index.html letöltése", empty: "Az X10 build itt jelenik meg.", request: "Kérés egyezés", health: "Build állapot" },
  de: { eyebrow: "HEGEVA APP STUDIO · X10", title: "Fokussierte Apps mit fertigem Produktgefühl.", sub: "Schneller Premium-Builder für kleinere Kunden-Apps mit Request-Matching und Live-Vorschau.", label: "Kunden-App beschreiben", placeholder: "Was soll die App tun und welche Abläufe müssen funktionieren?", build: "X10-App bauen", building: "X10 wird gebaut…", preview: "Vorschau", code: "Code", download: "index.html herunterladen", empty: "Der X10-Build erscheint hier.", request: "Request-Match", health: "Build-Status" },
  fr: { eyebrow: "HEGEVA APP STUDIO · X10", title: "Des apps ciblées qui semblent terminées.", sub: "Builder premium plus rapide pour les petites apps client avec vérification de la demande.", label: "Décrivez l’app client", placeholder: "Que doit faire l’app et quels flux doivent vraiment fonctionner ?", build: "Construire l’app X10", building: "Construction X10…", preview: "Aperçu", code: "Code", download: "Télécharger index.html", empty: "Le build X10 apparaîtra ici.", request: "Correspondance", health: "État du build" },
  es: { eyebrow: "HEGEVA APP STUDIO · X10", title: "Apps enfocadas con sensación de producto terminado.", sub: "Builder premium más rápido para apps pequeñas con verificación de la solicitud.", label: "Describe la app del cliente", placeholder: "¿Qué debe hacer y qué flujos tienen que funcionar de verdad?", build: "Crear app X10", building: "Creando X10…", preview: "Vista previa", code: "Código", download: "Descargar index.html", empty: "El build X10 aparecerá aquí.", request: "Coincidencia", health: "Estado del build" },
} as const

export function BuildMyAppX10Tuned() {
  const { locale } = useI18n()
  const c = copy[locale]
  const [idea, setIdea] = useState("")
  const [html, setHtml] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [view, setView] = useState<ViewMode>("preview")
  const [device, setDevice] = useState<DeviceMode>("desktop")
  const result = useMemo(() => audit(html, idea), [html, idea])
  const width = device === "mobile" ? "390px" : device === "tablet" ? "820px" : "100%"

  async function build() {
    const request = idea.trim()
    if (!request || busy) return
    setBusy(true)
    setError("")
    try {
      let bestHtml = ""
      let bestCheck: ReturnType<typeof audit> | null = null
      let missing: string[] = []
      let previousScore: number | undefined

      for (let attempt = 0; attempt < X10_MAX_ATTEMPTS; attempt += 1) {
        const candidate = stripCodeFence(await runStudioAI(instruction(request, locale, missing, previousScore), locale as StudioLocale))
        if (!looksLikeHtmlDocument(candidate)) continue
        const candidateCheck = audit(candidate, request)
        if (!bestCheck || candidateCheck.specScore > bestCheck.specScore || (candidateCheck.specScore === bestCheck.specScore && candidateCheck.capabilityScore > bestCheck.capabilityScore)) {
          bestHtml = candidate
          bestCheck = candidateCheck
        }
        if (candidateCheck.specScore >= X10_MIN_REQUEST_MATCH && candidateCheck.capabilityScore >= 67) break
        missing = candidateCheck.missing.slice(0, 14)
        previousScore = candidateCheck.specScore
      }

      if (!bestCheck || !bestHtml) throw new Error("HEGEVA could not verify this X10 build.")
      verifyGeneratedHtml(bestHtml)
      if (bestCheck.specScore < X10_MIN_REQUEST_MATCH) {
        setHtml(bestHtml)
        setView("preview")
        throw new Error(`X10 did not pass request verification (${bestCheck.specScore}%/${X10_MIN_REQUEST_MATCH}%). The best attempt is shown for inspection, but it is not accepted as a finished build.`)
      }

      setHtml(bestHtml)
      setView("preview")
    } catch (e) {
      setError(e instanceof Error ? e.message : "HEGEVA X10 build failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[32px] border border-primary/25 bg-[radial-gradient(circle_at_85%_0%,rgba(16,213,141,.18),transparent_34%),linear-gradient(135deg,rgba(7,18,14,.99),rgba(10,30,22,.98))] p-7 shadow-[0_34px_100px_rgba(0,0,0,.28)] sm:p-9">
        <p className="text-xs font-black uppercase tracking-[.24em] text-primary">{c.eyebrow}</p>
        <div className="mt-3 grid gap-7 xl:grid-cols-[1.2fr_.8fr] xl:items-end">
          <div><h1 className="max-w-4xl text-4xl font-black tracking-[-.05em] text-foreground sm:text-6xl">{c.title}</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">{c.sub}</p></div>
          <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-primary/20 bg-primary/8 p-4"><span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{c.request}</span><strong className="mt-1 block text-3xl text-primary">{html ? result.specScore : 0}%</strong></div><div className="rounded-2xl border border-gold/20 bg-gold/8 p-4"><span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{c.health}</span><strong className="mt-1 block text-3xl text-gold">{html ? result.buildScore : 0}%</strong></div></div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
        <section className="glass-panel rounded-3xl p-5 sm:p-6">
          <div className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /><h2 className="text-base font-black text-foreground">X10 Customer Build</h2></div>
          <label htmlFor="x10-idea" className="mt-5 block text-sm font-black text-foreground">{c.label}</label>
          <textarea id="x10-idea" rows={12} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder={c.placeholder} className="mt-3 w-full rounded-2xl border border-input bg-input/25 p-4 text-sm leading-6 outline-none transition focus:border-primary/50" />
          <button type="button" disabled={!idea.trim() || busy} onClick={() => void build()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-black text-primary-foreground shadow-[0_18px_42px_rgba(16,213,141,.20)] disabled:opacity-50"><WandSparkles className="size-4" />{busy ? c.building : c.build}</button>
          {error && <p role="alert" className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{result.checks.map(([label, ok]) => <div key={label} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${ok ? "border-primary/20 bg-primary/8 text-primary" : "border-border text-muted-foreground"}`}><CheckCircle2 className="size-3.5" />{label}</div>)}</div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-border bg-background/30 shadow-[0_28px_85px_rgba(0,0,0,.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5"><div><h2 className="text-sm font-black text-foreground">X10 Live Workspace</h2><p className="mt-1 text-[11px] text-muted-foreground">Focused single-file customer build</p></div><div className="flex flex-wrap items-center gap-2"><div className="flex rounded-xl border border-border bg-background/40 p-1"><button onClick={() => setView("preview")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${view === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><Eye className="size-3.5" />{c.preview}</button><button onClick={() => setView("code")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${view === "code" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><Code2 className="size-3.5" />{c.code}</button></div><button disabled={!html} onClick={() => html && downloadTextFile("index.html", html, "text/html;charset=utf-8")} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold disabled:opacity-40"><Download className="size-4" />{c.download}</button></div></div>
          <div className="flex items-center justify-between gap-3 border-b border-border bg-background/20 px-4 py-2.5 sm:px-5"><div className="flex rounded-xl border border-border bg-background/40 p-1">{([["desktop",Laptop],["tablet",Tablet],["mobile",Smartphone]] as const).map(([key, Icon]) => <button key={key} onClick={() => setDevice(key)} className={`rounded-lg p-2 ${device === key ? "bg-primary/15 text-primary" : "text-muted-foreground"}`} aria-label={key}><Icon className="size-4" /></button>)}</div><span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{html ? `${result.specScore}% request match` : "Ready"}</span></div>
          {!html ? <div className="flex min-h-[720px] items-center justify-center p-8 text-center"><div><div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10"><WandSparkles className="size-6 text-primary" /></div><p className="mt-4 text-sm font-black text-foreground">{c.empty}</p></div></div> : view === "preview" ? <div className="bg-[#040907] p-3 sm:p-5"><div className="mx-auto overflow-hidden rounded-[22px] border border-white/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,.35)] transition-[width]" style={{ width, maxWidth: "100%" }}><div className="flex items-center justify-between border-b border-black/10 bg-[#f6f7f7] px-3 py-2"><span className="text-[10px] font-semibold text-black/45">customer-app.local</span></div><iframe title="HEGEVA X10 preview" srcDoc={preparePreviewHtml(html)} sandbox="allow-scripts" className="h-[720px] w-full bg-white" /></div></div> : <div className="bg-[#07100d] p-4"><div className="rounded-[22px] border border-white/10 bg-[#020705] p-4"><div className="mb-3 flex items-center gap-2"><Braces className="size-4 text-primary" /><span className="text-xs font-bold text-white/75">index.html</span></div><pre className="h-[720px] overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-emerald-50/80">{html}</pre></div></div>}
        </section>
      </div>
    </div>
  )
}
