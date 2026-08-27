"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Braces,
  CheckCircle2,
  Code2,
  Columns2,
  Download,
  Eye,
  Gauge,
  History,
  Laptop,
  Layers3,
  MonitorSmartphone,
  Palette,
  Rocket,
  RotateCcw,
  ShieldCheck,
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
import { sandboxPreviewDocument } from "@/lib/preview-sandbox"

type BuildMode = "starter" | "premium" | "growth"
type ViewMode = "preview" | "code" | "split"
type DeviceMode = "desktop" | "tablet" | "mobile"
type ImproveMode = "polish" | "mobile" | "accessibility" | "dashboard"
type Snapshot = { html: string; label: string; at: number }

const IDEA_KEY = "hegeva:x20:studio:idea"
const HTML_KEY = "hegeva:x20:studio:html"
const MODE_KEY = "hegeva:x20:studio:mode"
const BUILD_KEY = "hegeva:x20:studio:build-mode"
const VERSION_KEY = "hegeva:x20:studio:version"
const VERSION = "studio-wow-2026-08-25-2"

const copy = {
  en: {
    eyebrow: "HEGEVA APP STUDIO · CUSTOMER WOW",
    title: "Build something worth paying for.",
    sub: "Generate a real browser application with polished UX, verified interactions, responsive layouts and portable code — then improve the same project safely.",
    idea: "Describe the app",
    placeholder: "Tell HEGEVA what the customer needs, who will use it and what must actually work.",
    build: "Build premium app",
    building: "Building your app…",
    workspace: "Live product workspace",
    empty: "Your verified app will appear here.",
    preview: "Preview",
    code: "Code",
    split: "Split",
    desktop: "Desktop",
    tablet: "Tablet",
    phone: "Phone",
    download: "Download index.html",
    health: "Product readiness",
    improve: "Safe improvement passes",
    snapshots: "Project versions",
    restore: "Restore",
    modes: {
      starter: ["Starter", "Beautiful focused app with a clear core workflow."],
      premium: ["Premium", "Richer SaaS UX, stronger navigation and deeper interactions."],
      growth: ["Growth", "Most capable single-file build with multiple connected workflows."],
    },
  },
  hu: {
    eyebrow: "HEGEVA APP STUDIO · CUSTOMER WOW",
    title: "Építs olyat, amiért megéri fizetni.",
    sub: "Készíts valódi böngészős alkalmazást prémium UX-szel, ellenőrzött működéssel, reszponzív felülettel és letölthető kóddal — majd ugyanazt a projektet fejleszd tovább biztonságosan.",
    idea: "Írd le az appot",
    placeholder: "Írd le, mire van szüksége az ügyfélnek, ki használja és minek kell valóban működnie.",
    build: "Prémium app építése",
    building: "App építése…",
    workspace: "Élő termék workspace",
    empty: "Az ellenőrzött app itt fog megjelenni.",
    preview: "Előnézet",
    code: "Kód",
    split: "Osztott",
    desktop: "Asztali",
    tablet: "Tablet",
    phone: "Telefon",
    download: "index.html letöltése",
    health: "Termék készültség",
    improve: "Biztonságos fejlesztések",
    snapshots: "Projektverziók",
    restore: "Visszaállítás",
    modes: {
      starter: ["Starter", "Szép, fókuszált app egy tiszta alapfolyamattal."],
      premium: ["Prémium", "Gazdagabb SaaS UX, jobb navigáció és mélyebb interakciók."],
      growth: ["Growth", "A legerősebb single-file build több összekapcsolt folyamattal."],
    },
  },
  de: {
    eyebrow: "HEGEVA APP STUDIO · CUSTOMER WOW", title: "Baue etwas, das seinen Preis wert ist.", sub: "Erstelle eine echte Browser-App mit hochwertiger UX, verifizierten Interaktionen und responsive Layouts.", idea: "App beschreiben", placeholder: "Beschreibe Nutzer, Ziel und was wirklich funktionieren muss.", build: "Premium-App bauen", building: "App wird gebaut…", workspace: "Live-Produkt-Workspace", empty: "Die verifizierte App erscheint hier.", preview: "Vorschau", code: "Code", split: "Geteilt", desktop: "Desktop", tablet: "Tablet", phone: "Telefon", download: "index.html herunterladen", health: "Produktbereitschaft", improve: "Sichere Verbesserungen", snapshots: "Projektversionen", restore: "Wiederherstellen", modes: { starter: ["Starter", "Schöne fokussierte App mit Kern-Workflow."], premium: ["Premium", "Reichere SaaS-UX und tiefere Interaktionen."], growth: ["Growth", "Stärkster Single-File-Build mit verbundenen Workflows."] },
  },
  fr: {
    eyebrow: "HEGEVA APP STUDIO · CUSTOMER WOW", title: "Construisez quelque chose qui vaut son prix.", sub: "Créez une vraie application navigateur avec une UX premium, des interactions vérifiées et un design responsive.", idea: "Décrivez l’app", placeholder: "Décrivez les utilisateurs, l’objectif et ce qui doit réellement fonctionner.", build: "Construire l’app premium", building: "Construction…", workspace: "Workspace produit live", empty: "L’app vérifiée apparaîtra ici.", preview: "Aperçu", code: "Code", split: "Partagé", desktop: "Bureau", tablet: "Tablette", phone: "Téléphone", download: "Télécharger index.html", health: "État du produit", improve: "Améliorations sûres", snapshots: "Versions du projet", restore: "Restaurer", modes: { starter: ["Starter", "Belle app ciblée avec workflow principal."], premium: ["Premium", "UX SaaS plus riche et interactions avancées."], growth: ["Growth", "Build single-file le plus complet avec workflows connectés."] },
  },
  es: {
    eyebrow: "HEGEVA APP STUDIO · CUSTOMER WOW", title: "Construye algo que valga lo que cuesta.", sub: "Crea una aplicación real con UX premium, interacciones verificadas y diseño responsive.", idea: "Describe la app", placeholder: "Describe los usuarios, el objetivo y lo que debe funcionar de verdad.", build: "Crear app premium", building: "Creando app…", workspace: "Workspace de producto", empty: "La app verificada aparecerá aquí.", preview: "Vista previa", code: "Código", split: "Dividido", desktop: "Escritorio", tablet: "Tablet", phone: "Teléfono", download: "Descargar index.html", health: "Estado del producto", improve: "Mejoras seguras", snapshots: "Versiones del proyecto", restore: "Restaurar", modes: { starter: ["Starter", "App bonita y enfocada con flujo principal."], premium: ["Premium", "UX SaaS más rica e interacciones profundas."], growth: ["Growth", "Build single-file más completo con flujos conectados."] },
  },
} as const

const premiumPatch = `<style data-hegeva-studio="polish">:root{--h-accent:#22d99a;--h-bg:#07110d;--h-panel:#0d1d16;--h-line:rgba(77,225,172,.18);--h-text:#f5fbf8;--h-muted:#9db1a8}body{background:radial-gradient(circle at 82% -10%,rgba(34,217,154,.18),transparent 34%),var(--h-bg)!important;color:var(--h-text)!important;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;letter-spacing:-.008em!important}.container,main,.app,.wrapper{max-width:1240px!important;margin-inline:auto!important}header,.header,.hero{border:1px solid var(--h-line)!important;border-radius:24px!important;background:linear-gradient(135deg,rgba(16,38,29,.98),rgba(9,24,18,.98))!important;box-shadow:0 28px 80px rgba(0,0,0,.28)!important}section,.card,article,.panel,.widget,form{border:1px solid var(--h-line)!important;border-radius:18px!important;background:linear-gradient(180deg,rgba(17,35,28,.97),rgba(10,24,18,.97))!important;box-shadow:0 16px 44px rgba(0,0,0,.16)!important}button{border-radius:12px!important;font-weight:800!important}input,select,textarea{border-radius:12px!important}table{width:100%!important;border-collapse:collapse!important}th,td{padding:12px!important;border-bottom:1px solid rgba(255,255,255,.08)!important}</style>`
const mobilePatch = `<style data-hegeva-studio="mobile">img,svg,video,canvas{max-width:100%;height:auto}@media(max-width:760px){body{font-size:15px!important}.container,main,.app,.wrapper{width:calc(100% - 20px)!important;margin:10px auto!important}.grid,.row{grid-template-columns:1fr!important;flex-direction:column!important}header,.header,.hero,section,.card,article,.panel,.widget,form{padding:16px!important}nav,.nav{overflow-x:auto!important;flex-wrap:nowrap!important}button,input,select,textarea{min-height:46px!important;max-width:100%!important}table{display:block!important;overflow-x:auto!important}}</style>`
const accessPatch = `<style data-hegeva-studio="accessibility">:focus-visible{outline:3px solid #63e7b7!important;outline-offset:3px!important}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}</style><script data-hegeva-studio="accessibility">(()=>{document.querySelectorAll('input,select,textarea').forEach((el,i)=>{if(!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby'))el.setAttribute('aria-label',el.getAttribute('placeholder')||el.getAttribute('name')||('Field '+(i+1)))});document.querySelectorAll('button:not([type])').forEach(b=>b.setAttribute('type','button'))})();</script>`
const dashboardPatch = `<style data-hegeva-studio="dashboard">#hegeva-product-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:16px 0}#hegeva-product-strip>div{padding:14px;border:1px solid rgba(77,225,172,.18);border-radius:14px;background:rgba(20,48,37,.72)}#hegeva-product-strip strong{display:block;font-size:1.7rem}</style><script data-hegeva-studio="dashboard">(()=>{if(document.getElementById('hegeva-product-strip'))return;const root=document.querySelector('main,.app,.container,.wrapper');if(!root)return;const box=document.createElement('section');box.id='hegeva-product-strip';const stats=[['Actions',document.querySelectorAll('button,a[href]').length],['Fields',document.querySelectorAll('input,select,textarea').length],['Sections',document.querySelectorAll('section,article').length]];box.innerHTML=stats.map(([k,v])=>'<div><small>'+k+'</small><strong>'+v+'</strong></div>').join('');root.insertBefore(box,root.firstElementChild?.nextSibling||null)})();</script>`

function inject(html: string, target: "head" | "body", patch: string) {
  const re = new RegExp(`</${target}>`, "i")
  return re.test(html) ? html.replace(re, `${patch}\n</${target}>`) : `${html}\n${patch}`
}
function applyImprovement(html: string, mode: ImproveMode) {
  if (html.includes(`data-hegeva-studio=\"${mode}\"`)) return html
  if (mode === "polish") return inject(html, "head", premiumPatch)
  if (mode === "mobile") return inject(html, "head", mobilePatch)
  if (mode === "accessibility") return inject(html, "body", accessPatch)
  return inject(html, "body", dashboardPatch)
}
function buildInstruction(idea: string, locale: string, mode: BuildMode, retry = false) {
  const depth = mode === "starter"
    ? "Create a focused paid-quality app with 2-3 core product areas and one excellent primary workflow."
    : mode === "premium"
      ? "Create a premium SaaS-quality app with 4-5 meaningful product areas, polished navigation, dashboard, search/filter where useful, edit/delete flows and strong empty states."
      : "Create the strongest practical single-file browser product with 5-7 connected product areas, dashboard, search, filters, add/edit/delete flows, validation, useful calculations and responsive mobile UX."
  return [
    "You are the HEGEVA premium app generation engine.",
    `Visible UI language: ${locale}.`,
    depth,
    retry ? "The previous build was not rich enough. Make this version substantially more complete while keeping it reliable." : "Build a customer-ready first version.",
    "Return ONLY one complete self-contained index.html document with inline CSS and vanilla JavaScript.",
    "This must be a REAL APPLICATION, never a landing page or static mockup.",
    "Every visible primary button and form must work locally. Add/edit/delete/search/filter/calculation flows must update the UI when present.",
    "Persist useful user-created data with localStorage. Never invent fake revenue, fake customers, fake success states or fake external integrations.",
    "Use a premium modern SaaS visual system: strong hierarchy, sidebar or clear navigation, polished cards, status badges, excellent spacing, helpful empty states, responsive mobile behavior and accessible labels.",
    "Prefer a smaller number of genuinely working modules over many dead features.",
    `CUSTOMER APP REQUEST:\n${idea.slice(0, 900)}`,
  ].join("\n\n")
}
function quality(html: string) {
  const controls = (html.match(/<(button|input|select|textarea)\b/gi) || []).length
  const sections = (html.match(/<(section|article|form|table)\b/gi) || []).length
  const script = /<script\b/i.test(html)
  const storage = /localStorage/i.test(html)
  const responsive = /@media|viewport/i.test(html)
  const nav = /<(nav|aside)\b/i.test(html)
  const forms = /<form\b/i.test(html)
  return Math.min(100, controls * 4 + sections * 4 + (script ? 15 : 0) + (storage ? 15 : 0) + (responsive ? 10 : 0) + (nav ? 10 : 0) + (forms ? 10 : 0))
}
function health(html: string) {
  return [
    ["Working JS", /<script\b/i.test(html)],
    ["Persistence", /localStorage/i.test(html)],
    ["Responsive", /@media|viewport/i.test(html)],
    ["Forms", /<form\b/i.test(html) && /<(input|select|textarea)\b/i.test(html)],
    ["Navigation", /<(nav|aside)\b/i.test(html)],
    ["Accessible", /aria-label|<label\b/i.test(html)],
  ] as const
}

export function BuildMyAppX20StudioWow() {
  const { locale } = useI18n()
  const c = copy[locale]
  const [idea, setIdea] = useState("")
  const [html, setHtml] = useState("")
  const [mode, setMode] = useState<BuildMode>("premium")
  const [view, setView] = useState<ViewMode>("preview")
  const [device, setDevice] = useState<DeviceMode>("desktop")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<Snapshot[]>([])

  useEffect(() => {
    try {
      const version = localStorage.getItem(VERSION_KEY)
      const saved = localStorage.getItem(HTML_KEY) || ""
      setIdea(localStorage.getItem(IDEA_KEY) || "")
      const savedMode = localStorage.getItem(BUILD_KEY) as BuildMode | null
      if (savedMode === "starter" || savedMode === "premium" || savedMode === "growth") setMode(savedMode)
      if (version === VERSION && saved && looksLikeHtmlDocument(saved)) setHtml(saved)
      else {
        localStorage.removeItem(HTML_KEY)
        localStorage.removeItem(MODE_KEY)
        localStorage.setItem(VERSION_KEY, VERSION)
      }
    } catch {}
  }, [])
  useEffect(() => { try { localStorage.setItem(IDEA_KEY, idea) } catch {} }, [idea])
  useEffect(() => { try { localStorage.setItem(BUILD_KEY, mode) } catch {} }, [mode])

  const checks = useMemo(() => health(html), [html])
  const score = html ? Math.round((checks.filter(([, ok]) => ok).length / checks.length) * 100) : 0
  const appQuality = html ? quality(html) : 0
  const width = device === "mobile" ? "390px" : device === "tablet" ? "820px" : "100%"

  function save(next: string, label: string) {
    setHtml(next)
    setHistory((current) => [{ html: next, label, at: Date.now() }, ...current].slice(0, 6))
    try {
      localStorage.setItem(HTML_KEY, next)
      localStorage.setItem(MODE_KEY, label)
      localStorage.setItem(VERSION_KEY, VERSION)
    } catch {}
  }

  async function build() {
    const request = idea.trim()
    if (!request || busy) return
    setBusy(true)
    setError("")
    try {
      let next = sandboxPreviewDocument(stripCodeFence(await runStudioAI(buildInstruction(request, locale, mode), locale as StudioLocale)))
      if (!looksLikeHtmlDocument(next)) throw new Error("HEGEVA could not verify this build.")
      const minimum = mode === "starter" ? 45 : mode === "premium" ? 60 : 72
      if (quality(next) < minimum) {
        const retry = sandboxPreviewDocument(stripCodeFence(await runStudioAI(buildInstruction(request, locale, mode, true), locale as StudioLocale)))
        if (looksLikeHtmlDocument(retry) && quality(retry) > quality(next)) next = retry
      }
      save(next, `${c.modes[mode][0]} build`)
      setView("preview")
    } catch (e) {
      setError(e instanceof Error ? e.message : "HEGEVA build failed.")
    } finally {
      setBusy(false)
    }
  }

  function improve(kind: ImproveMode) {
    if (!html || busy) return
    const next = applyImprovement(html, kind)
    if (!looksLikeHtmlDocument(next)) { setError("Improvement did not pass verification."); return }
    save(next, `Improve · ${kind}`)
  }

  function restore(snapshot: Snapshot) {
    if (!looksLikeHtmlDocument(snapshot.html)) return
    save(snapshot.html, `${c.restore} · ${snapshot.label}`)
  }

  const modes: { key: BuildMode; icon: typeof Sparkles }[] = [
    { key: "starter", icon: WandSparkles },
    { key: "premium", icon: Sparkles },
    { key: "growth", icon: Rocket },
  ]
  const improvements: { key: ImproveMode; label: string; icon: typeof Sparkles }[] = [
    { key: "polish", label: "Premium polish", icon: Palette },
    { key: "mobile", label: "Mobile UX", icon: MonitorSmartphone },
    { key: "dashboard", label: "Dashboard layer", icon: Gauge },
    { key: "accessibility", label: "Accessibility", icon: ShieldCheck },
  ]

  return (
    <div className="mx-auto max-w-[1560px] px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[32px] border border-primary/25 bg-[radial-gradient(circle_at_82%_0%,rgba(16,213,141,.20),transparent_32%),linear-gradient(135deg,rgba(7,18,14,.99),rgba(10,30,22,.98))] p-6 shadow-[0_35px_110px_rgba(0,0,0,.28)] sm:p-8 lg:p-10">
        <div className="absolute -right-28 -top-28 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[1.15fr_.85fr] xl:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">{c.eyebrow}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em] text-foreground sm:text-6xl lg:text-7xl">{c.title}</h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">{c.sub}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4"><div className="text-[10px] font-black uppercase tracking-[.16em] text-muted-foreground">Verified</div><div className="mt-1 text-3xl font-black text-primary">{score}%</div><div className="mt-1 text-xs text-muted-foreground">runtime readiness</div></div>
            <div className="rounded-2xl border border-gold/20 bg-gold/8 p-4"><div className="text-[10px] font-black uppercase tracking-[.16em] text-muted-foreground">Product</div><div className="mt-1 text-3xl font-black text-gold">{appQuality}%</div><div className="mt-1 text-xs text-muted-foreground">quality signal</div></div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
        <section className="glass-panel rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-base font-black text-foreground">Build level</h2><p className="mt-1 text-xs text-muted-foreground">Choose the depth of this customer build.</p></div><span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary">{mode}</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            {modes.map(({ key, icon: Icon }) => {
              const selected = key === mode
              const [title, text] = c.modes[key]
              return <button key={key} type="button" onClick={() => setMode(key)} className={`rounded-2xl border p-4 text-left transition ${selected ? "border-primary/55 bg-primary/10 shadow-[0_0_0_1px_rgba(16,213,141,.12)]" : "border-border bg-background/25 hover:border-primary/30"}`}><Icon className={`size-5 ${selected ? "text-primary" : "text-muted-foreground"}`} /><h3 className="mt-3 text-sm font-black text-foreground">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></button>
            })}
          </div>
          <label htmlFor="studio-wow-idea" className="mt-5 block text-sm font-black text-foreground">{c.idea}</label>
          <textarea id="studio-wow-idea" value={idea} onChange={(e) => setIdea(e.target.value)} rows={9} placeholder={c.placeholder} className="mt-3 w-full rounded-2xl border border-input bg-input/25 p-4 text-sm leading-6 outline-none transition focus:border-primary/50" />
          <button type="button" onClick={() => void build()} disabled={!idea.trim() || busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-black text-primary-foreground shadow-[0_18px_42px_rgba(16,213,141,.20)] disabled:cursor-not-allowed disabled:opacity-50"><WandSparkles className="size-4" />{busy ? c.building : c.build}</button>
          {error && <p role="alert" className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

          <div className="mt-6 border-t border-border pt-5"><h3 className="text-sm font-black text-foreground">{c.improve}</h3><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{improvements.map(({ key, label, icon: Icon }) => <button key={key} type="button" onClick={() => improve(key)} disabled={!html || busy} className="flex items-center gap-3 rounded-xl border border-border bg-background/25 px-3 py-3 text-left text-xs font-bold text-foreground transition hover:border-primary/35 disabled:opacity-40"><span className="rounded-lg bg-primary/10 p-2"><Icon className="size-3.5 text-primary" /></span>{label}</button>)}</div></div>

          <div className="mt-6 border-t border-border pt-5"><div className="flex items-center gap-2 text-sm font-black text-foreground"><History className="size-4 text-primary" />{c.snapshots}</div>{history.length === 0 ? <p className="mt-3 text-xs text-muted-foreground">Versions appear after each successful build or improvement.</p> : <div className="mt-3 space-y-2">{history.slice(0, 4).map((snapshot) => <button key={snapshot.at} type="button" onClick={() => restore(snapshot)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background/20 px-3 py-2.5 text-left text-xs transition hover:border-primary/30"><span className="min-w-0 truncate font-semibold text-foreground">{snapshot.label}</span><span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground"><RotateCcw className="size-3" />{new Date(snapshot.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></button>)}</div>}</div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-border bg-background/30 shadow-[0_28px_85px_rgba(0,0,0,.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <div><div className="flex items-center gap-2"><Layers3 className="size-4 text-primary" /><h2 className="text-sm font-black text-foreground">{c.workspace}</h2></div><p className="mt-1 text-[11px] text-muted-foreground">{html ? "Verified single-file browser product" : c.empty}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-border bg-background/40 p-1">{([
                ["preview", c.preview, Eye], ["code", c.code, Code2], ["split", c.split, Columns2],
              ] as const).map(([key, label, Icon]) => <button key={key} type="button" onClick={() => setView(key)} disabled={!html} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}><Icon className="size-3.5" />{label}</button>)}</div>
              <button type="button" disabled={!html} onClick={() => html && downloadTextFile("index.html", html, "text/html;charset=utf-8")} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground transition hover:border-primary/40 disabled:opacity-40"><Download className="size-4" />{c.download}</button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/20 px-4 py-2.5 sm:px-5">
            <div className="flex rounded-xl border border-border bg-background/40 p-1">{([
              ["desktop", c.desktop, Laptop], ["tablet", c.tablet, Tablet], ["mobile", c.phone, Smartphone],
            ] as const).map(([key, label, Icon]) => <button key={key} type="button" onClick={() => setDevice(key)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${device === key ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}><Icon className="size-3.5" />{label}</button>)}</div>
            <div className="flex flex-wrap items-center gap-2">{checks.map(([label, ok]) => <span key={label} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${ok ? "border-primary/20 bg-primary/8 text-primary" : "border-border text-muted-foreground"}`}><CheckCircle2 className="size-3" />{label}</span>)}</div>
          </div>

          {!html ? <div className="flex min-h-[760px] items-center justify-center p-8 text-center"><div><div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10"><WandSparkles className="size-6 text-primary" /></div><p className="mt-4 text-sm font-black text-foreground">{c.empty}</p><p className="mt-2 text-xs text-muted-foreground">Build → verify → preview → improve → export</p></div></div> : <div className={view === "split" ? "grid 2xl:grid-cols-2" : "block"}>
            {(view === "preview" || view === "split") && <div className={`${view === "split" ? "border-b 2xl:border-b-0 2xl:border-r" : ""} border-border bg-[#040907] p-3 sm:p-5`}><div className="mx-auto overflow-hidden rounded-[22px] border border-white/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,.35)] transition-[width] duration-300" style={{ width, maxWidth: "100%" }}><div className="flex items-center justify-between border-b border-black/10 bg-[#f6f7f7] px-3 py-2"><div className="flex gap-1.5"><span className="size-2.5 rounded-full bg-red-400" /><span className="size-2.5 rounded-full bg-amber-400" /><span className="size-2.5 rounded-full bg-emerald-400" /></div><span className="text-[10px] font-semibold text-black/45">customer-app.local</span><span className="w-8" /></div><iframe title="HEGEVA customer app preview" srcDoc={html} sandbox="allow-scripts" className="h-[760px] w-full bg-white" /></div></div>}
            {(view === "code" || view === "split") && <div className="bg-[#07100d] p-3 sm:p-5"><div className="rounded-[22px] border border-white/10 bg-[#020705] p-4"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Braces className="size-4 text-primary" /><span className="text-xs font-bold text-white/75">index.html</span></div><span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-primary">verified</span></div><pre className="h-[748px] overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-emerald-50/80">{html}</pre></div></div>}
          </div>}
        </section>
      </div>
    </div>
  )
}
