"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Gauge, MonitorSmartphone, Palette, Sparkles, WandSparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { downloadTextFile, looksLikeHtmlDocument, runStudioAI, stripCodeFence, type StudioLocale } from "@/lib/app-studio-ai"

const IDEA_KEY = "hegeva:x20:idea"
const HTML_KEY = "hegeva:x20:last-html"
const MODE_KEY = "hegeva:x20:last-mode"

const copy = {
  en: {
    eyebrow: "HEGEVA APP STUDIO · PRO BETA",
    title: "Build My App X20",
    sub: "Turn an idea into a verified working browser app, then improve the same app without replacing it.",
    idea: "What should the app do?",
    placeholder: "Describe the app, who it is for, and the most important job it must do.",
    build: "Build X20 app",
    building: "Building…",
    improve: "Improve this app",
    premium: "Make it premium",
    mobile: "Improve mobile",
    dashboard: "Add dashboard",
    accessible: "Improve accessibility",
    preview: "Live app preview",
    code: "Verified index.html",
    download: "Download index.html",
    empty: "Build an app to unlock the live preview and safe improvement passes.",
    saved: "Your latest X20 idea and verified build stay in this browser so you can continue later.",
    error: "X20 could not create a strong verified app. Please try again.",
    progress: ["Idea", "Working app", "Improvement", "Ready to continue"],
  },
  hu: {
    eyebrow: "HEGEVA APP STUDIO · PRO BÉTA",
    title: "Build My App X20",
    sub: "Az ötletből ellenőrzött, működő böngészős appot készít, majd ugyanazt az appot fejleszti tovább lecserélés nélkül.",
    idea: "Mit tudjon az alkalmazás?",
    placeholder: "Írd le az appot, kinek készül, és mi a legfontosabb feladata.",
    build: "X20 app építése",
    building: "Építés…",
    improve: "App továbbfejlesztése",
    premium: "Legyen prémiumabb",
    mobile: "Mobil javítása",
    dashboard: "Dashboard hozzáadása",
    accessible: "Akadálymentesség javítása",
    preview: "Élő app előnézet",
    code: "Ellenőrzött index.html",
    download: "index.html letöltése",
    empty: "Építs egy appot az élő előnézet és a biztonságos fejlesztések feloldásához.",
    saved: "A legutóbbi X20 ötlet és ellenőrzött build ebben a böngészőben megmarad, így később folytathatod.",
    error: "Az X20 most nem tudott elég erős, ellenőrzött appot készíteni. Próbáld újra.",
    progress: ["Ötlet", "Működő app", "Fejlesztés", "Folytatható projekt"],
  },
  de: {
    eyebrow: "HEGEVA APP STUDIO · PRO BETA", title: "Build My App X20", sub: "Erstellt eine geprüfte Browser-App und verbessert dieselbe App, ohne sie zu ersetzen.", idea: "Was soll die App können?", placeholder: "Beschreibe App, Zielgruppe und wichtigste Aufgabe.", build: "X20-App bauen", building: "Wird gebaut…", improve: "App verbessern", premium: "Premium-Design", mobile: "Mobile verbessern", dashboard: "Dashboard hinzufügen", accessible: "Barrierefreiheit", preview: "Live-Vorschau", code: "Geprüfte index.html", download: "index.html herunterladen", empty: "Baue zuerst eine App.", saved: "Die letzte X20-Idee und der geprüfte Build bleiben in diesem Browser gespeichert.", error: "X20 konnte keine starke geprüfte App erstellen.", progress: ["Idee", "App", "Verbesserung", "Weiterbauen"],
  },
  fr: {
    eyebrow: "HEGEVA APP STUDIO · PRO BÊTA", title: "Build My App X20", sub: "Crée une application navigateur vérifiée puis améliore la même application sans la remplacer.", idea: "Que doit faire l’application ?", placeholder: "Décrivez l’application, son public et sa tâche principale.", build: "Construire l’app X20", building: "Construction…", improve: "Améliorer l’app", premium: "Rendre premium", mobile: "Améliorer mobile", dashboard: "Ajouter dashboard", accessible: "Améliorer accessibilité", preview: "Aperçu en direct", code: "index.html vérifié", download: "Télécharger index.html", empty: "Construisez d’abord une app.", saved: "La dernière idée X20 et son build vérifié restent dans ce navigateur.", error: "X20 n’a pas pu créer une application vérifiée assez complète.", progress: ["Idée", "App", "Amélioration", "Continuer"],
  },
  es: {
    eyebrow: "HEGEVA APP STUDIO · PRO BETA", title: "Build My App X20", sub: "Crea una app de navegador verificada y mejora la misma app sin reemplazarla.", idea: "¿Qué debe hacer la app?", placeholder: "Describe la app, su público y su tarea principal.", build: "Crear app X20", building: "Creando…", improve: "Mejorar app", premium: "Hacerla premium", mobile: "Mejorar móvil", dashboard: "Añadir dashboard", accessible: "Mejorar accesibilidad", preview: "Vista previa", code: "index.html verificado", download: "Descargar index.html", empty: "Primero crea una app.", saved: "La última idea X20 y su build verificado permanecen en este navegador.", error: "X20 no pudo crear una app verificada suficientemente completa.", progress: ["Idea", "App", "Mejora", "Continuar"],
  },
} as const

type ImproveMode = "premium" | "mobile" | "dashboard" | "accessible"

const premiumCss = `
<style data-hegeva-x20="premium">
:root{--x20:#10d58d;--x20b:#0b1713;--x20card:#102019;--x20line:rgba(16,213,141,.22)}
body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;background:radial-gradient(circle at 85% 0%,rgba(16,213,141,.15),transparent 36%),#07100d!important;color:#eef7f3!important;margin:0!important;line-height:1.5!important}
body>*{box-sizing:border-box} .container,main{max-width:1180px!important;margin-inline:auto!important;padding:24px!important}
header,.header{background:linear-gradient(135deg,#0c1914,#12281f)!important;border:1px solid var(--x20line)!important;border-radius:22px!important;padding:24px!important;box-shadow:0 22px 70px rgba(0,0,0,.28)!important}
nav,.nav{display:flex!important;gap:10px!important;flex-wrap:wrap!important;margin:14px 0!important}
nav a,.nav a{color:#dff8ee!important;text-decoration:none!important;padding:9px 13px!important;border:1px solid var(--x20line)!important;border-radius:999px!important;background:rgba(255,255,255,.035)!important}
section,.card,article,form{background:linear-gradient(180deg,rgba(18,34,28,.96),rgba(12,24,19,.96))!important;border:1px solid var(--x20line)!important;border-radius:18px!important;padding:20px!important;box-shadow:0 12px 34px rgba(0,0,0,.18)!important;margin-block:16px!important}
h1,h2,h3{letter-spacing:-.025em!important} h1{font-size:clamp(2rem,5vw,3.4rem)!important} h2{font-size:clamp(1.35rem,3vw,2rem)!important}
button,input,select,textarea{font:inherit!important;border-radius:12px!important;border:1px solid rgba(255,255,255,.12)!important;padding:11px 13px!important;min-height:44px!important;box-sizing:border-box!important}
input,select,textarea{background:#0a1511!important;color:#f0faf6!important} button{background:linear-gradient(135deg,#10d58d,#39e1a5)!important;color:#03110b!important;font-weight:800!important;cursor:pointer!important;border:0!important;box-shadow:0 8px 24px rgba(16,213,141,.18)!important} button:hover{transform:translateY(-1px)!important;filter:brightness(1.05)!important}
table{width:100%!important;border-collapse:collapse!important;background:#0b1713!important;border-radius:14px!important;overflow:hidden!important} th,td{padding:12px!important;border-bottom:1px solid rgba(255,255,255,.08)!important;text-align:left!important}
a{color:#5de6b1!important} .muted,small{color:#95aaa1!important}
</style>`

const mobileCss = `
<style data-hegeva-x20="mobile">
*{box-sizing:border-box} img,svg,video,canvas{max-width:100%;height:auto} input,select,textarea,button{max-width:100%}
@media(max-width:720px){body{font-size:15px!important}.container,main{width:100%!important;padding:14px!important}header,.header,section,.card,article,form{padding:16px!important;border-radius:15px!important}nav,.nav{overflow-x:auto!important;flex-wrap:nowrap!important;padding-bottom:4px!important}nav a,.nav a{white-space:nowrap!important}table{display:block!important;overflow-x:auto!important}button{min-height:46px!important}input,select,textarea{width:100%!important}h1{font-size:2rem!important}h2{font-size:1.4rem!important}}
</style>`

const accessiblePatch = `
<style data-hegeva-x20="accessible">:focus-visible{outline:3px solid #53e7b3!important;outline-offset:3px!important}button,a,input,select,textarea{transition:outline-offset .15s ease} @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}</style>
<script data-hegeva-x20="accessible">(()=>{document.querySelectorAll('input,textarea,select').forEach((el,i)=>{if(!el.getAttribute('aria-label')&&!el.getAttribute('aria-labelledby')){const p=el.getAttribute('placeholder')||el.getAttribute('name')||('Field '+(i+1));el.setAttribute('aria-label',p)}});document.querySelectorAll('button').forEach((b,i)=>{if(!b.textContent?.trim()&&!b.getAttribute('aria-label'))b.setAttribute('aria-label','Action '+(i+1))})})();</script>`

const dashboardPatch = `
<section data-hegeva-x20="dashboard" style="margin:18px auto;max-width:1180px;padding:18px;border:1px solid rgba(16,213,141,.25);border-radius:18px;background:#0d1c16;color:#eef7f3;font-family:Inter,system-ui,sans-serif">
  <div style="display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap"><div><small style="color:#72dcb2;font-weight:800;letter-spacing:.12em">X20 DASHBOARD</small><h2 style="margin:.35rem 0">Live app overview</h2></div><span id="x20-storage-status" style="padding:8px 11px;border-radius:999px;background:rgba(16,213,141,.12);color:#7de6bc">Local app data</span></div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:14px"><div style="padding:14px;border-radius:14px;background:#10251d"><small>Saved keys</small><strong id="x20-key-count" style="display:block;font-size:1.8rem">0</strong></div><div style="padding:14px;border-radius:14px;background:#10251d"><small>Interactive controls</small><strong id="x20-control-count" style="display:block;font-size:1.8rem">0</strong></div><div style="padding:14px;border-radius:14px;background:#10251d"><small>Sections</small><strong id="x20-section-count" style="display:block;font-size:1.8rem">0</strong></div></div>
</section>
<script data-hegeva-x20="dashboard">(()=>{const q=(s)=>document.querySelector(s);const safe=()=>{try{return localStorage.length}catch{return 0}};const k=q('#x20-key-count'),c=q('#x20-control-count'),s=q('#x20-section-count');if(k)k.textContent=String(safe());if(c)c.textContent=String(document.querySelectorAll('button,input,select,textarea,a[href]').length);if(s)s.textContent=String(document.querySelectorAll('main section,section,article').length)})();</script>`

function injectBeforeClosing(html: string, closing: "head" | "body", patch: string) {
  const marker = new RegExp(`</${closing}>`, "i")
  return marker.test(html) ? html.replace(marker, `${patch}\n</${closing}>`) : `${html}\n${patch}`
}

function hasPatch(html: string, name: string) {
  return html.includes(`data-hegeva-x20=\"${name}\"`)
}

function applyImprovement(source: string, mode: ImproveMode) {
  let next = source
  if (mode === "premium" && !hasPatch(next, "premium")) next = injectBeforeClosing(next, "head", premiumCss)
  if (mode === "mobile" && !hasPatch(next, "mobile")) next = injectBeforeClosing(next, "head", mobileCss)
  if (mode === "accessible" && !hasPatch(next, "accessible")) next = injectBeforeClosing(next, "body", accessiblePatch)
  if (mode === "dashboard" && !hasPatch(next, "dashboard")) next = injectBeforeClosing(next, "body", dashboardPatch)
  return next
}

function qualityScore(html: string) {
  const controls = (html.match(/<(button|input|select|textarea)\b/gi) || []).length
  const sections = (html.match(/<(section|article|form|table)\b/gi) || []).length
  const hasScript = /<script\b/i.test(html)
  const hasStorage = /localStorage/i.test(html)
  const genericOnly = /HEGEVA App Studio/i.test(html) && /Home[\s\S]{0,100}About[\s\S]{0,100}Contact/i.test(html)
  return (controls >= 4 ? 2 : controls >= 2 ? 1 : 0) + (sections >= 3 ? 2 : sections >= 1 ? 1 : 0) + (hasScript ? 1 : 0) + (hasStorage ? 1 : 0) - (genericOnly ? 3 : 0)
}

function buildInstruction(value: string, locale: string, retry = false) {
  return [
    "You are HEGEVA Build My App X20, a premium product builder.",
    `Visible UI language: ${locale}.`,
    retry ? "The previous attempt was too generic. Regenerate a substantially more complete app." : "Create the first strong working build.",
    "Return ONLY one complete self-contained index.html with inline CSS and vanilla JavaScript. No dependencies.",
    "Build the actual product described by the idea, NOT a landing page, demo shell, Home/About/Contact template, placeholder panel or tutorial example.",
    "Create at least 4 meaningful product areas when the idea supports them, with real forms, buttons, lists/tables/cards and useful empty states.",
    "Every visible primary action must do something locally. Use localStorage for useful persistence and restore saved data on reload.",
    "Include a useful overview/dashboard derived only from real local app state. Never invent revenue, customers, payment success or external-service results.",
    "Use a polished modern dark professional interface, responsive layout, strong hierarchy, accessible labels and mobile-friendly controls.",
    "Do not fake authentication, payments, email, cloud databases, deployment or external APIs. Clearly mark integrations unavailable when needed.",
    "Finish with valid closing body and html tags.",
    `APP IDEA: ${value}`,
  ].join("\n\n")
}

export function BuildMyAppX20() {
  const { locale } = useI18n()
  const c = copy[locale]
  const [idea, setIdea] = useState("")
  const [html, setHtml] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [lastMode, setLastMode] = useState<string>("")

  useEffect(() => {
    try {
      setIdea(localStorage.getItem(IDEA_KEY) || "")
      setHtml(localStorage.getItem(HTML_KEY) || "")
      setLastMode(localStorage.getItem(MODE_KEY) || "")
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(IDEA_KEY, idea) } catch {}
  }, [idea])

  const progress = useMemo(() => {
    const values = [Boolean(idea.trim()), Boolean(html), Boolean(html && lastMode && lastMode !== "build"), Boolean(html && idea.trim())]
    return values.map((done, index) => ({ label: c.progress[index], done }))
  }, [idea, html, lastMode, c.progress])

  async function build() {
    const value = idea.trim()
    if (!value || busy) return
    setBusy(true)
    setError("")

    try {
      let next = stripCodeFence(await runStudioAI(buildInstruction(value, locale), locale as StudioLocale))
      if (!looksLikeHtmlDocument(next)) throw new Error(c.error)

      if (qualityScore(next) < 4) {
        next = stripCodeFence(await runStudioAI(buildInstruction(value, locale, true), locale as StudioLocale))
        if (!looksLikeHtmlDocument(next) || qualityScore(next) < 4) throw new Error(c.error)
      }

      if (!hasPatch(next, "premium")) next = injectBeforeClosing(next, "head", premiumCss)
      if (!hasPatch(next, "mobile")) next = injectBeforeClosing(next, "head", mobileCss)

      setHtml(next)
      setLastMode("build")
      try {
        localStorage.setItem(HTML_KEY, next)
        localStorage.setItem(MODE_KEY, "build")
      } catch {}
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
    if (!looksLikeHtmlDocument(next)) {
      setError(c.error)
      return
    }
    setHtml(next)
    setLastMode(mode)
    try {
      localStorage.setItem(HTML_KEY, next)
      localStorage.setItem(MODE_KEY, mode)
    } catch {}
  }

  const actions: { key: ImproveMode; label: string; icon: typeof Palette }[] = [
    { key: "premium", label: c.premium, icon: Palette },
    { key: "mobile", label: c.mobile, icon: MonitorSmartphone },
    { key: "dashboard", label: c.dashboard, icon: Gauge },
    { key: "accessible", label: c.accessible, icon: Sparkles },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{c.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{c.title}</h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{c.sub}</p>
          </div>
          <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">PRO · BETA</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {progress.map((item, index) => (
          <div key={item.label} className="glass-panel rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <span className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${item.done ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>{index + 1}</span>
              <span className={item.done ? "text-sm font-semibold text-foreground" : "text-sm text-muted-foreground"}>{item.label}</span>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="glass-panel rounded-2xl p-5">
          <label htmlFor="x20-idea" className="text-sm font-semibold text-foreground">{c.idea}</label>
          <textarea id="x20-idea" value={idea} onChange={(e) => setIdea(e.target.value)} rows={8} placeholder={c.placeholder} className="mt-3 w-full rounded-xl border border-input bg-input/30 p-3 text-sm outline-none focus:border-primary/50" />
          <button type="button" onClick={() => void build()} disabled={!idea.trim() || busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
            <WandSparkles className="size-4" aria-hidden />{busy ? c.building : c.build}
          </button>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{c.saved}</p>
          {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground">{c.improve}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {actions.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" onClick={() => improve(key)} disabled={!html || busy} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 text-left text-sm font-medium transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40">
                <Icon className="size-4 text-primary" aria-hidden />{label}
              </button>
            ))}
          </div>
          {!html && <p className="mt-4 text-sm text-muted-foreground">{c.empty}</p>}
        </div>
      </section>

      {html && (
        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-foreground">{c.preview}</h2>
            <iframe title={c.preview} srcDoc={html} sandbox="allow-scripts" className="mt-3 h-[620px] w-full rounded-xl border border-border bg-white" />
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">{c.code}</h2>
              <button type="button" onClick={() => downloadTextFile("index.html", html, "text/html;charset=utf-8")} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium">
                <Download className="size-4" aria-hidden />{c.download}
              </button>
            </div>
            <pre className="mt-3 h-[620px] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-4 text-xs leading-relaxed">{html}</pre>
          </div>
        </section>
      )}
    </div>
  )
}
