"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Gauge, MonitorSmartphone, Palette, Sparkles, WandSparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { downloadTextFile, looksLikeHtmlDocument, runStudioAI, stripCodeFence, type StudioLocale } from "@/lib/app-studio-ai"

const IDEA_KEY = "hegeva:x20:idea"
const HTML_KEY = "hegeva:x20:last-html"
const MODE_KEY = "hegeva:x20:last-mode"

const copy = {
  en: { eyebrow:"HEGEVA APP STUDIO · PRO BETA", title:"Build My App X20", sub:"Turn an idea into a verified browser app, then improve the same app safely with one-click enhancement passes.", idea:"What should the app do?", placeholder:"Describe the app, who it is for, and the most important job it must do.", build:"Build X20 app", building:"Building…", improve:"Improve this app", premium:"Make it premium", mobile:"Improve mobile", dashboard:"Add dashboard", accessible:"Improve accessibility", preview:"Live app preview", code:"Verified index.html", download:"Download index.html", empty:"Build an app to unlock the live preview and improvement passes.", saved:"Your latest X20 idea and verified build stay in this browser so you can continue later.", error:"X20 could not create a verified app. Please try again.", progress:["Idea","Working app","Improvement","Ready to continue"] },
  hu: { eyebrow:"HEGEVA APP STUDIO · PRO BÉTA", title:"Build My App X20", sub:"Az ötletből ellenőrzött böngészős appot készít, majd ugyanazt az appot biztonságosan fejlesztheted tovább egykattintásos javításokkal.", idea:"Mit tudjon az alkalmazás?", placeholder:"Írd le az appot, kinek készül, és mi a legfontosabb feladata.", build:"X20 app építése", building:"Építés…", improve:"App továbbfejlesztése", premium:"Legyen prémiumabb", mobile:"Mobil javítása", dashboard:"Dashboard hozzáadása", accessible:"Akadálymentesség javítása", preview:"Élő app előnézet", code:"Ellenőrzött index.html", download:"index.html letöltése", empty:"Építs egy appot az élő előnézet és a fejlesztések feloldásához.", saved:"A legutóbbi X20 ötlet és ellenőrzött build ebben a böngészőben megmarad, így később folytathatod.", error:"Az X20 nem tudott ellenőrzött appot készíteni. Próbáld újra.", progress:["Ötlet","Működő app","Fejlesztés","Folytatható projekt"] },
  de: { eyebrow:"HEGEVA APP STUDIO · PRO BETA", title:"Build My App X20", sub:"Erstellt eine geprüfte Browser-App und verbessert dieselbe App anschließend sicher mit Ein-Klick-Pässen.", idea:"Was soll die App können?", placeholder:"Beschreibe App, Zielgruppe und wichtigste Aufgabe.", build:"X20-App bauen", building:"Wird gebaut…", improve:"App verbessern", premium:"Premium-Design", mobile:"Mobile verbessern", dashboard:"Dashboard hinzufügen", accessible:"Barrierefreiheit", preview:"Live-Vorschau", code:"Geprüfte index.html", download:"index.html herunterladen", empty:"Baue zuerst eine App.", saved:"Die letzte X20-Idee und der geprüfte Build bleiben in diesem Browser gespeichert.", error:"X20 konnte keine geprüfte App erstellen.", progress:["Idee","App","Verbesserung","Weiterbauen"] },
  fr: { eyebrow:"HEGEVA APP STUDIO · PRO BÊTA", title:"Build My App X20", sub:"Crée une app navigateur vérifiée puis améliore la même app en toute sécurité avec des passes en un clic.", idea:"Que doit faire l’application ?", placeholder:"Décrivez l’application, son public et sa tâche principale.", build:"Construire l’app X20", building:"Construction…", improve:"Améliorer l’app", premium:"Rendre premium", mobile:"Améliorer mobile", dashboard:"Ajouter dashboard", accessible:"Améliorer accessibilité", preview:"Aperçu en direct", code:"index.html vérifié", download:"Télécharger index.html", empty:"Construisez d’abord une app.", saved:"La dernière idée X20 et son build vérifié restent dans ce navigateur.", error:"X20 n’a pas pu créer une app vérifiée.", progress:["Idée","App","Amélioration","Continuer"] },
  es: { eyebrow:"HEGEVA APP STUDIO · PRO BETA", title:"Build My App X20", sub:"Crea una app de navegador verificada y mejora la misma app de forma segura con pases de un clic.", idea:"¿Qué debe hacer la app?", placeholder:"Describe la app, su público y su tarea principal.", build:"Crear app X20", building:"Creando…", improve:"Mejorar app", premium:"Hacerla premium", mobile:"Mejorar móvil", dashboard:"Añadir dashboard", accessible:"Mejorar accesibilidad", preview:"Vista previa", code:"index.html verificado", download:"Descargar index.html", empty:"Primero crea una app.", saved:"La última idea X20 y su build verificado permanecen en este navegador.", error:"X20 no pudo crear una app verificada.", progress:["Idea","App","Mejora","Continuar"] },
} as const

type ImproveMode = "premium" | "mobile" | "dashboard" | "accessible"

function injectBeforeHeadClose(html: string, block: string) {
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${block}\n</head>`) : html
}

function injectBeforeBodyClose(html: string, block: string) {
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${block}\n</body>`) : html
}

function applySafeImprovement(source: string, mode: ImproveMode) {
  let html = source
  const marker = `hegeva-x20-${mode}`
  if (html.includes(marker)) return html

  if (mode === "premium") {
    html = injectBeforeHeadClose(html, `<style id="${marker}">
:root{--x20-accent:#16c784;--x20-deep:#0f172a;--x20-surface:#fff;--x20-soft:#f5f7fb;--x20-line:#dfe5ec;--x20-muted:#64748b}
*{box-sizing:border-box}body{background:linear-gradient(180deg,#eef7f3 0,#f8fafc 38%,#fff 100%)!important;color:#172033!important;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important}
.container,main,.app,.wrapper{max-width:1100px!important;margin:28px auto!important;padding:24px!important;background:rgba(255,255,255,.96)!important;border:1px solid var(--x20-line)!important;border-radius:22px!important;box-shadow:0 18px 50px rgba(15,23,42,.10)!important}
header,.header{border-radius:18px!important;background:linear-gradient(135deg,#0f172a,#163f34)!important;color:white!important;padding:24px!important;box-shadow:0 14px 30px rgba(15,23,42,.18)!important}
nav{display:flex!important;gap:10px!important;flex-wrap:wrap!important;margin:14px 0!important}nav a,nav button{border:1px solid rgba(255,255,255,.18)!important;border-radius:999px!important;padding:9px 14px!important}
section,.card,article,form{border-radius:16px!important}button,input,select,textarea{font:inherit!important;border-radius:11px!important;border:1px solid var(--x20-line)!important;padding:10px 12px!important}button{cursor:pointer!important;background:var(--x20-deep)!important;color:white!important;font-weight:700!important;transition:.18s transform,.18s opacity!important}button:hover{transform:translateY(-1px)!important;opacity:.94!important}input,select,textarea{background:white!important;color:#172033!important}h1,h2,h3{letter-spacing:-.02em!important}table{width:100%!important;border-collapse:collapse!important}th,td{padding:12px!important;border-bottom:1px solid var(--x20-line)!important;text-align:left!important}
</style>`)
  }

  if (mode === "mobile") {
    html = injectBeforeHeadClose(html, `<style id="${marker}">@media(max-width:720px){body{padding:0!important}.container,main,.app,.wrapper{width:auto!important;margin:0!important;padding:16px!important;border-radius:0!important}header,.header{padding:18px!important}nav{overflow-x:auto!important;flex-wrap:nowrap!important}nav a,nav button{white-space:nowrap!important}input,select,textarea,button{min-height:44px!important;width:100%!important}table{display:block!important;overflow-x:auto!important}.grid,.row{grid-template-columns:1fr!important;flex-direction:column!important}}</style>`)
  }

  if (mode === "accessible") {
    html = injectBeforeHeadClose(html, `<style id="${marker}">:focus-visible{outline:3px solid #0ea5e9!important;outline-offset:3px!important}button,a,input,select,textarea{min-height:42px}button:disabled{opacity:.55!important;cursor:not-allowed!important}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}</style>`)
    html = injectBeforeBodyClose(html, `<script id="${marker}-script">(()=>{document.querySelectorAll('img:not([alt])').forEach((el)=>el.setAttribute('alt',''));document.querySelectorAll('button:not([type])').forEach((el)=>el.setAttribute('type','button'));document.querySelectorAll('input,select,textarea').forEach((el,i)=>{if(!el.getAttribute('aria-label')&&!el.id){el.setAttribute('aria-label','Field '+(i+1))}})})();</script>`)
  }

  if (mode === "dashboard") {
    html = injectBeforeHeadClose(html, `<style id="${marker}">#x20-smart-dashboard{margin:18px 0;padding:18px;border:1px solid #dfe5ec;border-radius:16px;background:#fff}#x20-smart-dashboard .x20-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.x20-stat{padding:14px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0}.x20-stat strong{display:block;font-size:24px}.x20-stat span{font-size:12px;color:#64748b}@media(max-width:700px){#x20-smart-dashboard .x20-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}</style>`)
    html = injectBeforeBodyClose(html, `<script id="${marker}-script">(()=>{if(document.getElementById('x20-smart-dashboard'))return;const root=document.querySelector('main,.container,.app,.wrapper,body');if(!root)return;const box=document.createElement('section');box.id='x20-smart-dashboard';const stats=[['Sections',document.querySelectorAll('section,article').length],['Forms',document.forms.length],['Inputs',document.querySelectorAll('input,select,textarea').length],['Actions',document.querySelectorAll('button,a').length]];box.innerHTML='<h2 style="margin:0 0 12px">App overview</h2><div class="x20-grid">'+stats.map(([label,value])=>'<div class="x20-stat"><strong>'+value+'</strong><span>'+label+'</span></div>').join('')+'</div>';root.insertBefore(box,root.firstChild.nextSibling||root.firstChild)})();</script>`)
  }

  return html
}

export function BuildMyAppX20Stable() {
  const { locale } = useI18n()
  const c = copy[locale]
  const [idea, setIdea] = useState("")
  const [html, setHtml] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [lastMode, setLastMode] = useState("")

  useEffect(() => { try { setIdea(localStorage.getItem(IDEA_KEY)||""); setHtml(localStorage.getItem(HTML_KEY)||""); setLastMode(localStorage.getItem(MODE_KEY)||"") } catch {} }, [])
  useEffect(() => { try { localStorage.setItem(IDEA_KEY, idea) } catch {} }, [idea])

  const progress = useMemo(() => {
    const values = [Boolean(idea.trim()), Boolean(html), Boolean(lastMode && lastMode !== "build"), Boolean(html && idea.trim())]
    return values.map((done,index)=>({label:c.progress[index],done}))
  }, [idea, html, lastMode, c.progress])

  async function build() {
    const value = idea.trim()
    if (!value || busy) return
    setBusy(true); setError("")
    const instruction = [
      "You are HEGEVA Build My App X20.",
      `Visible UI language: ${locale}.`,
      "Create ONE complete, genuinely usable, self-contained index.html browser application.",
      "Return ONLY HTML. Use inline CSS and vanilla JavaScript. No dependencies.",
      "Create a polished professional first result, not a bare demo. Include useful empty states, clear navigation and meaningful working interactions.",
      "Use localStorage where local persistence helps.",
      "Do not fake authentication, payments, email, cloud database or external API success.",
      "Make the result responsive, compact and complete with closing body/html tags.",
      `APP IDEA: ${value}`,
    ].join("\n\n")
    try {
      const answer = await runStudioAI(instruction, locale as StudioLocale)
      const next = stripCodeFence(answer)
      if (!looksLikeHtmlDocument(next)) throw new Error(c.error)
      setHtml(next); setLastMode("build")
      try { localStorage.setItem(HTML_KEY,next); localStorage.setItem(MODE_KEY,"build") } catch {}
    } catch (e) { setError(e instanceof Error ? e.message : c.error) } finally { setBusy(false) }
  }

  function improve(mode: ImproveMode) {
    if (!html || busy) return
    setError("")
    const next = applySafeImprovement(html, mode)
    if (!looksLikeHtmlDocument(next)) { setError(c.error); return }
    setHtml(next); setLastMode(mode)
    try { localStorage.setItem(HTML_KEY,next); localStorage.setItem(MODE_KEY,mode) } catch {}
  }

  const actions = [
    { key:"premium" as const, label:c.premium, icon:Palette },
    { key:"mobile" as const, label:c.mobile, icon:MonitorSmartphone },
    { key:"dashboard" as const, label:c.dashboard, icon:Gauge },
    { key:"accessible" as const, label:c.accessible, icon:Sparkles },
  ]

  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{c.eyebrow}</p><h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{c.title}</h1><p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{c.sub}</p></div><span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">PRO · BETA</span></div></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{progress.map((item,index)=><div key={item.label} className="glass-panel rounded-2xl p-4"><div className="flex items-center gap-3"><span className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${item.done?"bg-primary text-primary-foreground":"border border-border text-muted-foreground"}`}>{index+1}</span><span className={item.done?"text-sm font-semibold":"text-sm text-muted-foreground"}>{item.label}</span></div></div>)}</div>
    <section className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><div className="glass-panel rounded-2xl p-5"><label htmlFor="x20-idea" className="text-sm font-semibold">{c.idea}</label><textarea id="x20-idea" value={idea} onChange={(e)=>setIdea(e.target.value)} rows={8} placeholder={c.placeholder} className="mt-3 w-full rounded-xl border border-input bg-input/30 p-3 text-sm outline-none focus:border-primary/50"/><button type="button" onClick={()=>void build()} disabled={!idea.trim()||busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"><WandSparkles className="size-4"/>{busy?c.building:c.build}</button><p className="mt-3 text-xs leading-relaxed text-muted-foreground">{c.saved}</p>{error&&<p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}</div><div className="glass-panel rounded-2xl p-5"><h2 className="text-sm font-semibold">{c.improve}</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{actions.map(({key,label,icon:Icon})=><button key={key} type="button" onClick={()=>improve(key)} disabled={!html||busy} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 text-left text-sm font-medium hover:border-primary/40 disabled:opacity-40"><Icon className="size-4 text-primary"/>{label}</button>)}</div>{!html&&<p className="mt-4 text-sm text-muted-foreground">{c.empty}</p>}</div></section>
    {html&&<section className="mt-6 grid gap-5 xl:grid-cols-2"><div className="glass-panel rounded-2xl p-5"><h2 className="text-sm font-semibold">{c.preview}</h2><iframe title={c.preview} srcDoc={html} sandbox="allow-scripts" className="mt-3 h-[620px] w-full rounded-xl border border-border bg-white"/></div><div className="glass-panel rounded-2xl p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold">{c.code}</h2><button type="button" onClick={()=>downloadTextFile("index.html",html,"text/html;charset=utf-8")} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium"><Download className="size-4"/>{c.download}</button></div><pre className="mt-3 h-[620px] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-4 text-xs leading-relaxed">{html}</pre></div></section>}
  </div>
}
