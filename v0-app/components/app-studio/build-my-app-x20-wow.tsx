"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Code2,
  Columns2,
  Download,
  Eye,
  Gauge,
  History,
  Laptop,
  MonitorSmartphone,
  Palette,
  Rocket,
  Smartphone,
  Sparkles,
  Tablet,
  WandSparkles,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import {
  downloadTextFile,
  looksLikeHtmlDocument,
  runStudioAI,
  stripCodeFence,
  type StudioLocale,
} from "@/lib/app-studio-ai"

const IDEA_KEY = "hegeva:x20:idea"
const HTML_KEY = "hegeva:x20:last-html"
const MODE_KEY = "hegeva:x20:last-mode"
const BUILD_MODE_KEY = "hegeva:x20:build-mode"
const STORAGE_VERSION_KEY = "hegeva:x20:storage-version"
const STORAGE_VERSION = "x20-wow-2026-08-25-1"

type ImproveMode = "premium" | "mobile" | "dashboard" | "accessible"
type BuildMode = "simple" | "premium" | "growth"
type ViewMode = "preview" | "code" | "split"
type DeviceMode = "desktop" | "tablet" | "mobile"

type Snapshot = { html: string; label: string; at: number }

const copy = {
  en: {
    eyebrow: "HEGEVA APP STUDIO · X20 WOW",
    title: "Build My App X20",
    sub: "Build, inspect and improve one verified app in a pro workspace without breaking the stable runtime.",
    idea: "What should the app do?",
    placeholder: "Describe the app, who it is for, and the most important job it must do.",
    choose: "Build depth",
    chooseSub: "Choose how ambitious the first build should be.",
    simple: "Simple",
    simpleText: "Fast focused MVP with the core workflow.",
    premiumMode: "Premium",
    premiumText: "Polished SaaS-style product with richer UI.",
    growth: "Growth",
    growthText: "Deeper workflows and scale-ready information structure.",
    build: "Build X20 app",
    building: "Building…",
    improve: "Safe improvement passes",
    premium: "Make it premium",
    mobile: "Improve mobile",
    dashboard: "Add dashboard",
    accessible: "Improve accessibility",
    health: "HEGEVA App Health",
    healthSub: "Readiness checks for the current verified build.",
    score: "Readiness",
    workspace: "X20 Workspace",
    preview: "Preview",
    code: "Code",
    split: "Split",
    desktop: "Desktop",
    tablet: "Tablet",
    phone: "Phone",
    download: "Download index.html",
    empty: "Build an app to unlock the workspace.",
    saved: "Your latest verified build stays in this browser so you can continue later.",
    error: "X20 could not create a strong verified app. Please try again.",
    history: "Build snapshots",
    latest: "Latest verified build",
    progress: ["Idea", "Working app", "Improvement", "Ready to continue"],
  },
  hu: {
    eyebrow: "HEGEVA APP STUDIO · X20 WOW",
    title: "Build My App X20",
    sub: "Építs, ellenőrizz és fejlessz egyetlen ellenőrzött appot profi workspace-ben a stabil runtime megtartásával.",
    idea: "Mit tudjon az alkalmazás?",
    placeholder: "Írd le az appot, kinek készül, és mi a legfontosabb feladata.",
    choose: "Build szint",
    chooseSub: "Válaszd ki, mennyire legyen komoly az első build.",
    simple: "Egyszerű",
    simpleText: "Gyors, fókuszált MVP az alap folyamattal.",
    premiumMode: "Prémium",
    premiumText: "Kidolgozott SaaS-jellegű termékfelület.",
    growth: "Növekedés",
    growthText: "Mélyebb folyamatok és skálázható információs szerkezet.",
    build: "X20 app építése",
    building: "Építés…",
    improve: "Biztonságos fejlesztési lépések",
    premium: "Legyen prémiumabb",
    mobile: "Mobil javítása",
    dashboard: "Dashboard hozzáadása",
    accessible: "Akadálymentesség javítása",
    health: "HEGEVA App Health",
    healthSub: "Készültségi ellenőrzések a jelenlegi verified buildhez.",
    score: "Készültség",
    workspace: "X20 Workspace",
    preview: "Előnézet",
    code: "Kód",
    split: "Osztott",
    desktop: "Asztali",
    tablet: "Tablet",
    phone: "Telefon",
    download: "index.html letöltése",
    empty: "Építs egy appot a workspace feloldásához.",
    saved: "A legutóbbi verified build ebben a böngészőben megmarad.",
    error: "Az X20 most nem tudott elég erős, ellenőrzött appot készíteni. Próbáld újra.",
    history: "Build pillanatképek",
    latest: "Legutóbbi verified build",
    progress: ["Ötlet", "Működő app", "Fejlesztés", "Folytatható projekt"],
  },
  de: {
    eyebrow: "HEGEVA APP STUDIO · X20 WOW", title: "Build My App X20", sub: "Baue und verbessere eine geprüfte App im Pro-Workspace, ohne die stabile Runtime zu beschädigen.", idea: "Was soll die App können?", placeholder: "Beschreibe App, Zielgruppe und wichtigste Aufgabe.", choose: "Build-Tiefe", chooseSub: "Wähle den Umfang des ersten Builds.", simple: "Einfach", simpleText: "Schnelles fokussiertes MVP.", premiumMode: "Premium", premiumText: "Polierte SaaS-Oberfläche.", growth: "Growth", growthText: "Tiefere Workflows und skalierbare Struktur.", build: "X20-App bauen", building: "Wird gebaut…", improve: "Sichere Verbesserungen", premium: "Premium-Design", mobile: "Mobile verbessern", dashboard: "Dashboard hinzufügen", accessible: "Barrierefreiheit", health: "HEGEVA App Health", healthSub: "Bereitschaftscheck des geprüften Builds.", score: "Readiness", workspace: "X20 Workspace", preview: "Vorschau", code: "Code", split: "Geteilt", desktop: "Desktop", tablet: "Tablet", phone: "Telefon", download: "index.html herunterladen", empty: "Baue zuerst eine App.", saved: "Der letzte geprüfte Build bleibt im Browser gespeichert.", error: "X20 konnte keine starke geprüfte App erstellen.", history: "Build-Snapshots", latest: "Letzter geprüfter Build", progress: ["Idee", "App", "Verbesserung", "Weiterbauen"],
  },
  fr: {
    eyebrow: "HEGEVA APP STUDIO · X20 WOW", title: "Build My App X20", sub: "Construisez et améliorez une app vérifiée dans un workspace pro sans casser le runtime stable.", idea: "Que doit faire l’application ?", placeholder: "Décrivez l’application, son public et sa tâche principale.", choose: "Niveau du build", chooseSub: "Choisissez l’ambition du premier build.", simple: "Simple", simpleText: "MVP rapide et ciblé.", premiumMode: "Premium", premiumText: "Interface SaaS soignée.", growth: "Growth", growthText: "Workflows plus profonds et structure évolutive.", build: "Construire l’app X20", building: "Construction…", improve: "Améliorations sûres", premium: "Rendre premium", mobile: "Améliorer mobile", dashboard: "Ajouter dashboard", accessible: "Améliorer accessibilité", health: "HEGEVA App Health", healthSub: "Contrôle du build vérifié actuel.", score: "Score", workspace: "X20 Workspace", preview: "Aperçu", code: "Code", split: "Partagé", desktop: "Bureau", tablet: "Tablette", phone: "Téléphone", download: "Télécharger index.html", empty: "Construisez d’abord une app.", saved: "Le dernier build vérifié reste enregistré dans ce navigateur.", error: "X20 n’a pas pu créer une application vérifiée assez solide.", history: "Snapshots du build", latest: "Dernier build vérifié", progress: ["Idée", "App", "Amélioration", "Continuer"],
  },
  es: {
    eyebrow: "HEGEVA APP STUDIO · X20 WOW", title: "Build My App X20", sub: "Crea y mejora una app verificada en un workspace profesional sin romper el runtime estable.", idea: "¿Qué debe hacer la app?", placeholder: "Describe la app, su público y su tarea principal.", choose: "Nivel del build", chooseSub: "Elige la ambición del primer build.", simple: "Simple", simpleText: "MVP rápido y enfocado.", premiumMode: "Premium", premiumText: "Interfaz SaaS pulida.", growth: "Growth", growthText: "Flujos más profundos y estructura escalable.", build: "Crear app X20", building: "Creando…", improve: "Mejoras seguras", premium: "Hacerla premium", mobile: "Mejorar móvil", dashboard: "Añadir dashboard", accessible: "Mejorar accesibilidad", health: "HEGEVA App Health", healthSub: "Chequeo del build verificado actual.", score: "Puntuación", workspace: "X20 Workspace", preview: "Vista previa", code: "Código", split: "Dividido", desktop: "Escritorio", tablet: "Tablet", phone: "Teléfono", download: "Descargar index.html", empty: "Primero crea una app.", saved: "El último build verificado permanece guardado en este navegador.", error: "X20 no pudo crear una app verificada suficientemente sólida.", history: "Snapshots del build", latest: "Último build verificado", progress: ["Idea", "App", "Mejora", "Continuar"],
  },
} as const

const premiumCss = `<style data-hegeva-x20="premium">:root{--x20:#10d58d;--x20line:rgba(16,213,141,.22)}body{font-family:Inter,ui-sans-serif,system-ui,sans-serif!important;background:radial-gradient(circle at 85% 0%,rgba(16,213,141,.15),transparent 36%),#07100d!important;color:#eef7f3!important;margin:0!important;line-height:1.5!important}*{box-sizing:border-box}.container,main{max-width:1180px!important;margin-inline:auto!important;padding:24px!important}header,.header,section,.card,article,form{background:linear-gradient(180deg,rgba(18,34,28,.96),rgba(12,24,19,.96))!important;border:1px solid var(--x20line)!important;border-radius:18px!important;padding:20px!important;margin-block:16px!important}nav,.nav{display:flex!important;gap:10px!important;flex-wrap:wrap!important}nav a,.nav a{color:#dff8ee!important;text-decoration:none!important;padding:9px 13px!important;border:1px solid var(--x20line)!important;border-radius:999px!important}button,input,select,textarea{font:inherit!important;border-radius:12px!important;min-height:44px!important;padding:11px 13px!important}input,select,textarea{background:#0a1511!important;color:#f0faf6!important;border:1px solid rgba(255,255,255,.12)!important}button{background:linear-gradient(135deg,#10d58d,#39e1a5)!important;color:#03110b!important;font-weight:800!important;border:0!important;cursor:pointer!important}</style>`
const mobileCss = `<style data-hegeva-x20="mobile">img,svg,video,canvas{max-width:100%;height:auto}@media(max-width:720px){body{font-size:15px!important}.container,main{width:100%!important;padding:14px!important}header,.header,section,.card,article,form{padding:16px!important;border-radius:15px!important}nav,.nav{overflow-x:auto!important;flex-wrap:nowrap!important}input,select,textarea{width:100%!important}button{min-height:46px!important}}</style>`
const accessiblePatch = `<style data-hegeva-x20="accessible">:focus-visible{outline:3px solid #53e7b3!important;outline-offset:3px!important}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}</style>`
const dashboardPatch = `<section data-hegeva-x20="dashboard" style="margin:18px auto;max-width:1180px;padding:18px;border:1px solid rgba(16,213,141,.25);border-radius:18px;background:#0d1c16;color:#eef7f3"><small style="color:#72dcb2;font-weight:800;letter-spacing:.12em">X20 DASHBOARD</small><h2 style="margin:.35rem 0">Live app overview</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px"><div style="padding:14px;border-radius:14px;background:#10251d"><small>Interactive controls</small><strong id="x20-control-count" style="display:block;font-size:1.8rem">0</strong></div><div style="padding:14px;border-radius:14px;background:#10251d"><small>Sections</small><strong id="x20-section-count" style="display:block;font-size:1.8rem">0</strong></div></div></section><script data-hegeva-x20="dashboard">(()=>{const c=document.getElementById('x20-control-count'),s=document.getElementById('x20-section-count');if(c)c.textContent=String(document.querySelectorAll('button,input,select,textarea,a[href]').length);if(s)s.textContent=String(document.querySelectorAll('section,article').length)})();</script>`

function injectBeforeClosing(html: string, closing: "head" | "body", patch: string) {
  const marker = new RegExp(`</${closing}>`, "i")
  return marker.test(html) ? html.replace(marker, `${patch}\n</${closing}>`) : `${html}\n${patch}`
}
function hasPatch(html: string, name: string) { return html.includes(`data-hegeva-x20=\"${name}\"`) }
function applyImprovement(source: string, mode: ImproveMode) {
  let next = source
  if (mode === "premium" && !hasPatch(next, "premium")) next = injectBeforeClosing(next, "head", premiumCss)
  if (mode === "mobile" && !hasPatch(next, "mobile")) next = injectBeforeClosing(next, "head", mobileCss)
  if (mode === "accessible" && !hasPatch(next, "accessible")) next = injectBeforeClosing(next, "head", accessiblePatch)
  if (mode === "dashboard" && !hasPatch(next, "dashboard")) next = injectBeforeClosing(next, "body", dashboardPatch)
  return next
}
function healthChecks(html: string) {
  const scripts = /<script\b/i.test(html)
  const fields = /<(input|select|textarea)\b/i.test(html)
  return [
    { label: "Buttons", ok: /<button\b/i.test(html) && scripts },
    { label: "Forms", ok: /<form\b/i.test(html) && fields && scripts },
    { label: "Storage", ok: /localStorage|window\.name/i.test(html) },
    { label: "Mobile", ok: /@media|viewport/i.test(html) },
    { label: "Accessibility", ok: /<label\b|aria-label|aria-live/i.test(html) },
    { label: "Assets", ok: !/<img[^>]+src=["']https?:\/\//i.test(html) },
  ]
}
function buildModeInstruction(mode: BuildMode) {
  if (mode === "simple") return "BUILD MODE: SIMPLE. Focus on one reliable workflow and a compact UI."
  if (mode === "premium") return "BUILD MODE: PREMIUM. Use a polished product-style interface, clear navigation, strong hierarchy and meaningful empty states."
  return "BUILD MODE: GROWTH. Use richer information architecture, dashboard, search/filter patterns where useful, while keeping the same stable local runtime contract."
}
function buildInstruction(value: string, locale: string, mode: BuildMode) {
  return [
    "HEGEVA Build My App X20",
    `Visible UI language: ${locale}.`,
    buildModeInstruction(mode),
    "Return ONLY one complete self-contained HTML document / index.html.",
    "Use inline CSS and vanilla JavaScript. No external dependencies.",
    "This is a browser application, not a landing page.",
    "Every visible primary action must work locally. Use the required X20 customer/data-entry runtime contract when applicable.",
    "Do not fake authentication, payment, email, deployment, cloud storage or external API success.",
    `APP IDEA: ${value}`,
  ].join("\n\n")
}
function saveBuild(html: string, mode: string) {
  localStorage.setItem(HTML_KEY, html)
  localStorage.setItem(MODE_KEY, mode)
  localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION)
}

export function BuildMyAppX20Wow() {
  const { locale } = useI18n()
  const c = copy[locale]
  const [idea, setIdea] = useState("")
  const [html, setHtml] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [lastMode, setLastMode] = useState("")
  const [buildMode, setBuildMode] = useState<BuildMode>("premium")
  const [viewMode, setViewMode] = useState<ViewMode>("preview")
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop")
  const [history, setHistory] = useState<Snapshot[]>([])

  useEffect(() => {
    try {
      setIdea(localStorage.getItem(IDEA_KEY) || "")
      const storedBuildMode = localStorage.getItem(BUILD_MODE_KEY) as BuildMode | null
      if (storedBuildMode === "simple" || storedBuildMode === "premium" || storedBuildMode === "growth") setBuildMode(storedBuildMode)
      const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY)
      const storedHtml = localStorage.getItem(HTML_KEY) || ""
      const storedMode = localStorage.getItem(MODE_KEY) || ""
      if ((storedVersion === STORAGE_VERSION || storedVersion?.startsWith("x20-stable")) && storedHtml && looksLikeHtmlDocument(storedHtml)) {
        setHtml(storedHtml)
        setLastMode(storedMode)
        setHistory([{ html: storedHtml, label: c.latest, at: Date.now() }])
      }
    } catch {}
  }, [c.latest])

  useEffect(() => { try { localStorage.setItem(IDEA_KEY, idea) } catch {} }, [idea])
  useEffect(() => { try { localStorage.setItem(BUILD_MODE_KEY, buildMode) } catch {} }, [buildMode])

  const checks = useMemo(() => healthChecks(html), [html])
  const readiness = html ? Math.round((checks.filter((item) => item.ok).length / checks.length) * 100) : 0
  const progress = useMemo(() => {
    const values = [Boolean(idea.trim()), Boolean(html), Boolean(html && lastMode && lastMode !== "build"), Boolean(html && idea.trim())]
    return values.map((done, index) => ({ label: c.progress[index], done }))
  }, [idea, html, lastMode, c.progress])

  const deviceWidth = deviceMode === "mobile" ? "390px" : deviceMode === "tablet" ? "820px" : "100%"

  function commitSnapshot(next: string, label: string) {
    setHtml(next)
    setHistory((current) => [{ html: next, label, at: Date.now() }, ...current].slice(0, 5))
  }

  async function build() {
    const value = idea.trim()
    if (!value || busy) return
    setBusy(true)
    setError("")
    try {
      const next = stripCodeFence(await runStudioAI(buildInstruction(value, locale, buildMode), locale as StudioLocale))
      if (!looksLikeHtmlDocument(next)) throw new Error(c.error)
      commitSnapshot(next, `${c.build} · ${buildMode.toUpperCase()}`)
      setLastMode("build")
      setViewMode("preview")
      try { saveBuild(next, "build") } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : c.error)
    } finally {
      setBusy(false)
    }
  }

  function improve(mode: ImproveMode) {
    if (!html || busy) return
    setError("")
    const next = applyImprovement(html, mode)
    if (!looksLikeHtmlDocument(next)) { setError(c.error); return }
    commitSnapshot(next, mode)
    setLastMode(mode)
    try { saveBuild(next, mode) } catch {}
  }

  function restore(snapshot: Snapshot) {
    if (!looksLikeHtmlDocument(snapshot.html)) return
    setHtml(snapshot.html)
    setLastMode("restore")
    try { saveBuild(snapshot.html, "restore") } catch {}
  }

  const buildModes = [
    { key: "simple" as const, title: c.simple, text: c.simpleText, icon: WandSparkles },
    { key: "premium" as const, title: c.premiumMode, text: c.premiumText, icon: Sparkles },
    { key: "growth" as const, title: c.growth, text: c.growthText, icon: Rocket },
  ]
  const actions = [
    { key: "premium" as const, label: c.premium, icon: Palette },
    { key: "mobile" as const, label: c.mobile, icon: MonitorSmartphone },
    { key: "dashboard" as const, label: c.dashboard, icon: Gauge },
    { key: "accessible" as const, label: c.accessible, icon: Sparkles },
  ]
  const views = [
    { key: "preview" as const, label: c.preview, icon: Eye },
    { key: "code" as const, label: c.code, icon: Code2 },
    { key: "split" as const, label: c.split, icon: Columns2 },
  ]
  const devices = [
    { key: "desktop" as const, label: c.desktop, icon: Laptop },
    { key: "tablet" as const, label: c.tablet, icon: Tablet },
    { key: "mobile" as const, label: c.phone, icon: Smartphone },
  ]

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[28px] border border-primary/25 bg-[radial-gradient(circle_at_85%_0%,rgba(16,213,141,.18),transparent_34%),linear-gradient(135deg,rgba(8,20,16,.98),rgba(11,30,23,.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,.25)] sm:p-8">
        <div className="absolute -right-20 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">{c.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-foreground sm:text-6xl">{c.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{c.sub}</p>
          </div>
          <div className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-right">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">X20 VERIFIED</div>
            <div className="mt-1 text-2xl font-black text-foreground">{readiness || 0}%</div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {progress.map((item, index) => <div key={item.label} className={`rounded-2xl border p-4 ${item.done ? "border-primary/30 bg-primary/8" : "border-border bg-background/35"}`}><div className="flex items-center gap-3"><span className={`flex size-8 items-center justify-center rounded-full text-xs font-black ${item.done ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>{index + 1}</span><span className={item.done ? "text-sm font-bold text-foreground" : "text-sm text-muted-foreground"}>{item.label}</span></div></div>)}
      </div>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel rounded-3xl p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4"><div><h2 className="text-base font-bold text-foreground">{c.choose}</h2><p className="mt-1 text-sm text-muted-foreground">{c.chooseSub}</p></div><span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary">{buildMode.toUpperCase()}</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {buildModes.map(({ key, title, text, icon: Icon }) => { const selected = buildMode === key; return <button key={key} type="button" onClick={() => setBuildMode(key)} className={`rounded-2xl border p-4 text-left transition ${selected ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(16,213,141,.14)]" : "border-border bg-background/30 hover:border-primary/30"}`}><Icon className={`size-5 ${selected ? "text-primary" : "text-muted-foreground"}`} /><h3 className="mt-3 text-sm font-bold text-foreground">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></button> })}
          </div>
          <label htmlFor="x20-wow-idea" className="mt-5 block text-sm font-bold text-foreground">{c.idea}</label>
          <textarea id="x20-wow-idea" value={idea} onChange={(e) => setIdea(e.target.value)} rows={7} placeholder={c.placeholder} className="mt-3 w-full rounded-2xl border border-input bg-input/25 p-4 text-sm outline-none transition focus:border-primary/50" />
          <button type="button" onClick={() => void build()} disabled={!idea.trim() || busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-black text-primary-foreground shadow-[0_16px_35px_rgba(16,213,141,.18)] disabled:cursor-not-allowed disabled:opacity-50"><WandSparkles className="size-4" />{busy ? c.building : c.build}</button>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{c.saved}</p>
          {error && <p role="alert" className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        </div>

        <div className="glass-panel rounded-3xl p-5 sm:p-6">
          <h2 className="text-base font-bold text-foreground">{c.improve}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{actions.map(({ key, label, icon: Icon }) => <button key={key} type="button" onClick={() => improve(key)} disabled={!html || busy} className="group flex items-center gap-3 rounded-2xl border border-border bg-background/35 px-4 py-4 text-left text-sm font-bold transition hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"><span className="rounded-xl bg-primary/10 p-2"><Icon className="size-4 text-primary" /></span>{label}</button>)}</div>
          <div className="mt-5 rounded-2xl border border-border bg-background/25 p-4">
            <div className="flex items-center justify-between gap-4"><div><h3 className="text-sm font-bold text-foreground">{c.health}</h3><p className="mt-1 text-xs text-muted-foreground">{c.healthSub}</p></div><div className="text-right"><div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{c.score}</div><div className="text-3xl font-black text-primary">{readiness}%</div></div></div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{checks.map((item) => <div key={item.label} className={`rounded-xl border px-3 py-2 ${item.ok ? "border-primary/25 bg-primary/5" : "border-border bg-background/30"}`}><div className="flex items-center gap-2"><CheckCircle2 className={`size-3.5 ${item.ok ? "text-primary" : "text-muted-foreground"}`} /><span className="text-xs font-semibold text-foreground">{item.label}</span></div></div>)}</div>
          </div>
          {history.length > 0 && <div className="mt-5"><div className="flex items-center gap-2 text-sm font-bold text-foreground"><History className="size-4 text-primary" />{c.history}</div><div className="mt-3 space-y-2">{history.slice(0, 3).map((snapshot) => <button type="button" key={snapshot.at} onClick={() => restore(snapshot)} className="flex w-full items-center justify-between rounded-xl border border-border bg-background/25 px-3 py-2 text-left text-xs transition hover:border-primary/30"><span className="font-semibold text-foreground">{snapshot.label}</span><span className="text-muted-foreground">{new Date(snapshot.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></button>)}</div></div>}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-background/30 shadow-[0_24px_70px_rgba(0,0,0,.18)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div><h2 className="text-sm font-black text-foreground">{c.workspace}</h2><p className="mt-0.5 text-xs text-muted-foreground">{html ? c.latest : c.empty}</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-border bg-background/40 p-1">{views.map(({ key, label, icon: Icon }) => <button key={key} type="button" onClick={() => setViewMode(key)} disabled={!html} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${viewMode === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}><Icon className="size-3.5" />{label}</button>)}</div>
            <button type="button" disabled={!html} onClick={() => html && downloadTextFile("index.html", html, "text/html;charset=utf-8")} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground transition hover:border-primary/40 disabled:opacity-40"><Download className="size-4" />{c.download}</button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/20 px-4 py-2 sm:px-5">
          <div className="flex rounded-xl border border-border bg-background/40 p-1">{devices.map(({ key, label, icon: Icon }) => <button key={key} type="button" onClick={() => setDeviceMode(key)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${deviceMode === key ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}><Icon className="size-3.5" />{label}</button>)}</div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{deviceMode === "desktop" ? "Responsive canvas" : deviceWidth}</span>
        </div>

        {!html ? <div className="flex min-h-[520px] items-center justify-center p-8 text-center"><div><WandSparkles className="mx-auto size-8 text-primary" /><p className="mt-3 text-sm font-semibold text-foreground">{c.empty}</p></div></div> : <div className={viewMode === "split" ? "grid xl:grid-cols-2" : "block"}>
          {(viewMode === "preview" || viewMode === "split") && <div className={`${viewMode === "split" ? "border-b xl:border-b-0 xl:border-r" : ""} border-border bg-[#050a08] p-3 sm:p-5`}><div className="mx-auto overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl transition-[width] duration-300" style={{ width: deviceWidth, maxWidth: "100%" }}><iframe title="X20 live preview" srcDoc={html} sandbox="allow-scripts" className="h-[720px] w-full bg-white" /></div></div>}
          {(viewMode === "code" || viewMode === "split") && <div className="bg-[#07100d] p-3 sm:p-5"><div className="rounded-2xl border border-white/10 bg-[#030806] p-4"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-red-400" /><span className="size-2.5 rounded-full bg-amber-400" /><span className="size-2.5 rounded-full bg-emerald-400" /></div><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">index.html · verified</span></div><pre className="h-[690px] overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-emerald-50/80">{html}</pre></div></div>}
        </div>}
      </section>
    </div>
  )
}
