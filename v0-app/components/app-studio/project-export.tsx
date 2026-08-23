"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Download, FileCode2, RefreshCw, Sparkles, XCircle } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import {
  downloadTextFile,
  looksLikeHtmlDocument,
  runStudioAI,
  stripCodeFence,
  type StudioLocale,
} from "@/lib/app-studio-ai"

const LAST_BUILD_KEY = "hegeva:app-studio:last-built-html"

type ProjectFiles = {
  "index.html": string
  "styles.css": string
  "app.js": string
  "README.md": string
}

const copy = {
  en: { title:"Multi-file project export", body:"Converts the latest verified browser prototype into a real small project with separate HTML, CSS and JavaScript files, then checks and can repair the split project before export.", waiting:"Build a working prototype above first. The latest successful prototype will appear here automatically.", verified:"Project checks passed", failed:"Project checks need attention — export stays locked until all checks pass", refresh:"Refresh from latest build", repair:"Auto-repair project", repairing:"Repairing project…", repaired:"Project repaired and rechecked.", repairFailed:"Automatic project repair could not produce a verified project.", download:"Download", checks:"Verification", html:"Complete HTML document present", css:"CSS extracted", js:"JavaScript extracted", links:"External file links inserted", syntax:"JavaScript parses after split", clean:"Inline CSS and JavaScript removed from index.html", readme:"README included" },
  hu: { title:"Többfájlos projekt export", body:"A legutóbbi ellenőrzött böngészős prototípust valódi kis projektté alakítja külön HTML-, CSS- és JavaScript-fájlokkal, majd export előtt ellenőrzi, és szükség esetén automatikusan javítani is tudja a projektet.", waiting:"Először készíts fent egy működő prototípust. A legutóbbi sikeres prototípus itt automatikusan megjelenik.", verified:"A projektellenőrzések sikeresek", failed:"A projektellenőrzés figyelmet igényel — az export zárolva marad, amíg minden ellenőrzés sikeres", refresh:"Frissítés a legutóbbi buildből", repair:"Projekt automatikus javítása", repairing:"Projekt javítása…", repaired:"A projekt javítva és újraellenőrizve.", repairFailed:"Az automatikus projektjavítás nem tudott ellenőrzött projektet létrehozni.", download:"Letöltés", checks:"Ellenőrzés", html:"Teljes HTML dokumentum megvan", css:"CSS külön fájlba került", js:"JavaScript külön fájlba került", links:"Külső fájlhivatkozások bekerültek", syntax:"A JavaScript a szétválasztás után is értelmezhető", clean:"Az inline CSS és JavaScript kikerült az index.html-ből", readme:"README fájl elkészült" },
  de: { title:"Mehrdatei-Projektexport", body:"Wandelt den letzten geprüften Browser-Prototyp in ein echtes kleines Projekt mit getrennten HTML-, CSS- und JavaScript-Dateien um, prüft es und kann Fehler vor dem Export automatisch reparieren.", waiting:"Erstelle oben zuerst einen funktionierenden Prototyp. Der letzte erfolgreiche Build erscheint hier automatisch.", verified:"Projektprüfungen bestanden", failed:"Projektprüfung benötigt Aufmerksamkeit — Export bleibt gesperrt, bis alle Prüfungen bestanden sind", refresh:"Aus letztem Build aktualisieren", repair:"Projekt automatisch reparieren", repairing:"Projekt wird repariert…", repaired:"Projekt repariert und erneut geprüft.", repairFailed:"Die automatische Reparatur konnte kein geprüftes Projekt erzeugen.", download:"Herunterladen", checks:"Prüfung", html:"Vollständiges HTML-Dokument vorhanden", css:"CSS extrahiert", js:"JavaScript extrahiert", links:"Externe Dateiverweise eingefügt", syntax:"JavaScript ist nach der Aufteilung syntaktisch gültig", clean:"Inline-CSS und -JavaScript aus index.html entfernt", readme:"README vorhanden" },
  fr: { title:"Export de projet multi-fichiers", body:"Convertit le dernier prototype navigateur vérifié en petit projet réel avec fichiers HTML, CSS et JavaScript séparés, le vérifie et peut réparer automatiquement les erreurs avant export.", waiting:"Créez d’abord un prototype fonctionnel ci-dessus. Le dernier prototype réussi apparaîtra ici automatiquement.", verified:"Vérifications du projet réussies", failed:"Les vérifications nécessitent une attention — l’export reste verrouillé jusqu’à leur réussite", refresh:"Actualiser depuis le dernier build", repair:"Réparer automatiquement le projet", repairing:"Réparation du projet…", repaired:"Projet réparé et revérifié.", repairFailed:"La réparation automatique n’a pas produit de projet vérifié.", download:"Télécharger", checks:"Vérification", html:"Document HTML complet présent", css:"CSS extrait", js:"JavaScript extrait", links:"Liens de fichiers externes insérés", syntax:"JavaScript valide après séparation", clean:"CSS et JavaScript inline retirés de index.html", readme:"README inclus" },
  es: { title:"Exportación de proyecto multifichero", body:"Convierte el último prototipo verificado en un pequeño proyecto real con HTML, CSS y JavaScript separados, lo comprueba y puede reparar automáticamente errores antes de exportar.", waiting:"Primero crea arriba un prototipo funcional. El último prototipo correcto aparecerá aquí automáticamente.", verified:"Comprobaciones del proyecto superadas", failed:"Las comprobaciones requieren atención — la exportación permanece bloqueada hasta superarlas", refresh:"Actualizar desde el último build", repair:"Reparar proyecto automáticamente", repairing:"Reparando proyecto…", repaired:"Proyecto reparado y comprobado de nuevo.", repairFailed:"La reparación automática no pudo producir un proyecto verificado.", download:"Descargar", checks:"Verificación", html:"Documento HTML completo presente", css:"CSS extraído", js:"JavaScript extraído", links:"Referencias externas insertadas", syntax:"JavaScript válido después de separar archivos", clean:"CSS y JavaScript inline eliminados de index.html", readme:"README incluido" },
} as const

function splitPrototype(html: string): ProjectFiles {
  const styleMatches = [...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)]
  const scriptMatches = [...html.matchAll(/<script(?![^>]*\bsrc=)(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  const css = styleMatches.map((match) => match[1].trim()).filter(Boolean).join("\n\n")
  const js = scriptMatches.map((match) => match[1].trim()).filter(Boolean).join("\n\n")

  let index = html
    .replace(/<style(?:\s[^>]*)?>[\s\S]*?<\/style>/gi, "")
    .replace(/<script(?![^>]*\bsrc=)(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, "")

  if (css) index = /<\/head>/i.test(index) ? index.replace(/<\/head>/i, '  <link rel="stylesheet" href="styles.css">\n</head>') : `<link rel="stylesheet" href="styles.css">\n${index}`
  if (js) index = /<\/body>/i.test(index) ? index.replace(/<\/body>/i, '  <script src="app.js"><\/script>\n</body>') : `${index}\n<script src="app.js"><\/script>`

  const readme = [
    "# HEGEVA generated browser project",
    "",
    "Files:",
    "- index.html — application markup",
    "- styles.css — extracted styles",
    "- app.js — extracted browser logic",
    "",
    "Open index.html in a browser to run the project.",
    "This export does not claim server-side authentication, cloud database, payment processing or deployment unless those integrations were separately implemented and verified.",
  ].join("\n")

  return { "index.html": index.trim(), "styles.css": css, "app.js": js, "README.md": readme }
}

function javascriptParses(value: string) {
  if (!value.trim()) return false
  try {
    // Syntax-only compilation. Generated code is not executed here.
    // eslint-disable-next-line no-new-func
    new Function(value)
    return true
  } catch {
    return false
  }
}

export function ProjectExport() {
  const { locale } = useI18n()
  const c = copy[locale]
  const [html, setHtml] = useState("")
  const [repairing, setRepairing] = useState(false)
  const [repairMessage, setRepairMessage] = useState("")

  function refresh() {
    try { setHtml(localStorage.getItem(LAST_BUILD_KEY)?.trim() || "") }
    catch { setHtml("") }
  }

  useEffect(() => {
    refresh()
    const id = window.setInterval(refresh, 1500)
    return () => window.clearInterval(id)
  }, [])

  const files = useMemo(() => (html ? splitPrototype(html) : null), [html])
  const checks = useMemo(() => {
    if (!files) return []
    const index = files["index.html"]
    const css = files["styles.css"]
    const js = files["app.js"]
    const readme = files["README.md"]
    const cleanIndex = !/<style(?:\s|>)/i.test(index) && !/<script(?![^>]*\bsrc=)(?:\s|>)/i.test(index)
    return [
      [c.html, /<!doctype html/i.test(index) && /<html(?:\s|>)/i.test(index) && /<head(?:\s|>)/i.test(index) && /<body(?:\s|>)/i.test(index) && /<\/html>/i.test(index)],
      [c.css, css.trim().length > 0],
      [c.js, js.trim().length > 0],
      [c.links, index.includes('href="styles.css"') && index.includes('src="app.js"')],
      [c.syntax, javascriptParses(js)],
      [c.clean, cleanIndex],
      [c.readme, readme.includes("# HEGEVA generated browser project") && readme.includes("index.html") && readme.includes("styles.css") && readme.includes("app.js")],
    ] as const
  }, [c, files])

  const allPassed = checks.length > 0 && checks.every(([, ok]) => ok)

  async function autoRepairProject() {
    if (!html || allPassed || repairing) return
    setRepairing(true)
    setRepairMessage("")
    const failed = checks.filter(([, ok]) => !ok).map(([label]) => `- ${label}`).join("\n")
    const instruction = [
      "You are HEGEVA Build My App X10 project repair.",
      `Visible UI language: ${locale}.`,
      "Repair the supplied self-contained HTML app so it can be safely split into index.html, styles.css and app.js.",
      "Return ONLY one complete corrected self-contained HTML document with <!doctype html>, <html>, <head>, <body> and closing tags.",
      "It MUST include a non-empty inline <style> block and a non-empty inline <script> block whose JavaScript parses without syntax errors.",
      "Preserve useful working behavior and do not fake server authentication, cloud databases, payments, email delivery or external API success.",
      "Keep it compact and dependency-free.",
      `FAILED PROJECT CHECKS:\n${failed}`,
      `CURRENT HTML:\n${html.slice(0, 8000)}`,
    ].join("\n\n")

    try {
      const answer = await runStudioAI(instruction, locale as StudioLocale)
      const repaired = stripCodeFence(answer)
      if (!looksLikeHtmlDocument(repaired)) throw new Error(c.repairFailed)
      const repairedFiles = splitPrototype(repaired)
      const repairedIndex = repairedFiles["index.html"]
      const projectOk =
        repairedFiles["styles.css"].trim().length > 0 &&
        repairedFiles["app.js"].trim().length > 0 &&
        javascriptParses(repairedFiles["app.js"]) &&
        repairedIndex.includes('href="styles.css"') &&
        repairedIndex.includes('src="app.js"')
      if (!projectOk) throw new Error(c.repairFailed)
      localStorage.setItem(LAST_BUILD_KEY, repaired)
      setHtml(repaired)
      setRepairMessage(c.repaired)
    } catch (error) {
      setRepairMessage(error instanceof Error ? error.message : c.repairFailed)
    } finally {
      setRepairing(false)
    }
  }

  return (
    <section className="mt-8 glass-panel rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2"><FileCode2 className="size-4 text-primary" aria-hidden /><h2 className="text-lg font-semibold text-foreground">{c.title}</h2></div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
        </div>
        <button type="button" onClick={refresh} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium"><RefreshCw className="size-4" aria-hidden />{c.refresh}</button>
      </div>

      {!files ? (
        <p className="mt-5 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">{c.waiting}</p>
      ) : (
        <>
          <div className="mt-5 rounded-xl border border-border bg-background/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {allPassed ? <CheckCircle2 className="size-4 text-primary" aria-hidden /> : <XCircle className="size-4 text-destructive" aria-hidden />}
              {allPassed ? c.verified : c.failed}
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{c.checks}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {checks.map(([label, ok]) => <div key={label} className="flex items-center gap-2 text-sm">{ok ? <CheckCircle2 className="size-4 text-primary" aria-hidden /> : <XCircle className="size-4 text-destructive" aria-hidden />}<span>{label}</span></div>)}
            </div>
            {!allPassed && (
              <button type="button" disabled={repairing} onClick={() => void autoRepairProject()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                <Sparkles className="size-4" aria-hidden />{repairing ? c.repairing : c.repair}
              </button>
            )}
            {repairMessage && <p className="mt-3 text-sm text-muted-foreground">{repairMessage}</p>}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.entries(files) as [keyof ProjectFiles, string][]).map(([name, content]) => (
              <button key={name} type="button" disabled={!allPassed || !content} onClick={() => downloadTextFile(name, content, name.endsWith(".html") ? "text/html;charset=utf-8" : name.endsWith(".css") ? "text/css;charset=utf-8" : name.endsWith(".js") ? "text/javascript;charset=utf-8" : "text/markdown;charset=utf-8")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40">
                <Download className="size-4" aria-hidden />{c.download} {name}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
