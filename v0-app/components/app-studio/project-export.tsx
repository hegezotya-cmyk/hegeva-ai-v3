"use client"

import { useEffect, useMemo, useState } from "react"
import { Archive, CheckCircle2, Download, FileCode2, RefreshCw, Sparkles, XCircle } from "lucide-react"
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
  "VERIFY.md": string
}

const copy = {
  en: { title:"Verified project export", body:"Turns the latest verified browser prototype into a small multi-file project, validates the split result, can auto-repair it, and exports the whole project as one TAR bundle.", waiting:"Build a working prototype above first. The latest successful prototype will appear here automatically.", verified:"Project checks passed", failed:"Project checks need attention — export stays locked until all checks pass", refresh:"Refresh from latest build", repair:"Auto-repair project", repairing:"Repairing project…", repaired:"Project repaired and rechecked.", repairFailed:"Automatic project repair could not produce a verified project.", download:"Download", bundle:"Download full project (.tar)", checks:"Verification", html:"Complete HTML document present", css:"CSS extracted", js:"JavaScript extracted", links:"External file links inserted", syntax:"JavaScript parses after split", clean:"Inline CSS and JavaScript removed from index.html", readme:"README included" },
  hu: { title:"Ellenőrzött projekt export", body:"A legutóbbi ellenőrzött böngészős prototípust többfájlos projektté alakítja, ellenőrzi a szétválasztott eredményt, szükség esetén automatikusan javítja, majd egyetlen TAR csomagként is exportálja.", waiting:"Először készíts fent egy működő prototípust. A legutóbbi sikeres prototípus itt automatikusan megjelenik.", verified:"A projektellenőrzések sikeresek", failed:"A projektellenőrzés figyelmet igényel — az export zárolva marad, amíg minden ellenőrzés sikeres", refresh:"Frissítés a legutóbbi buildből", repair:"Projekt automatikus javítása", repairing:"Projekt javítása…", repaired:"A projekt javítva és újraellenőrizve.", repairFailed:"Az automatikus projektjavítás nem tudott ellenőrzött projektet létrehozni.", download:"Letöltés", bundle:"Teljes projekt letöltése (.tar)", checks:"Ellenőrzés", html:"Teljes HTML dokumentum megvan", css:"CSS külön fájlba került", js:"JavaScript külön fájlba került", links:"Külső fájlhivatkozások bekerültek", syntax:"A JavaScript a szétválasztás után is értelmezhető", clean:"Az inline CSS és JavaScript kikerült az index.html-ből", readme:"README fájl elkészült" },
  de: { title:"Geprüfter Projektexport", body:"Wandelt den letzten geprüften Browser-Prototyp in ein Mehrdatei-Projekt um, prüft das Ergebnis, kann Fehler automatisch reparieren und exportiert das gesamte Projekt als TAR-Paket.", waiting:"Erstelle oben zuerst einen funktionierenden Prototyp. Der letzte erfolgreiche Build erscheint hier automatisch.", verified:"Projektprüfungen bestanden", failed:"Projektprüfung benötigt Aufmerksamkeit — Export bleibt gesperrt, bis alle Prüfungen bestanden sind", refresh:"Aus letztem Build aktualisieren", repair:"Projekt automatisch reparieren", repairing:"Projekt wird repariert…", repaired:"Projekt repariert und erneut geprüft.", repairFailed:"Die automatische Reparatur konnte kein geprüftes Projekt erzeugen.", download:"Herunterladen", bundle:"Gesamtes Projekt herunterladen (.tar)", checks:"Prüfung", html:"Vollständiges HTML-Dokument vorhanden", css:"CSS extrahiert", js:"JavaScript extrahiert", links:"Externe Dateiverweise eingefügt", syntax:"JavaScript ist nach der Aufteilung syntaktisch gültig", clean:"Inline-CSS und -JavaScript aus index.html entfernt", readme:"README vorhanden" },
  fr: { title:"Export de projet vérifié", body:"Transforme le dernier prototype vérifié en projet multi-fichiers, contrôle le résultat, peut le réparer automatiquement et exporte l’ensemble dans une archive TAR.", waiting:"Créez d’abord un prototype fonctionnel ci-dessus. Le dernier prototype réussi apparaîtra ici automatiquement.", verified:"Vérifications du projet réussies", failed:"Les vérifications nécessitent une attention — l’export reste verrouillé jusqu’à leur réussite", refresh:"Actualiser depuis le dernier build", repair:"Réparer automatiquement le projet", repairing:"Réparation du projet…", repaired:"Projet réparé et revérifié.", repairFailed:"La réparation automatique n’a pas produit de projet vérifié.", download:"Télécharger", bundle:"Télécharger le projet complet (.tar)", checks:"Vérification", html:"Document HTML complet présent", css:"CSS extrait", js:"JavaScript extrait", links:"Liens de fichiers externes insérés", syntax:"JavaScript valide après séparation", clean:"CSS et JavaScript inline retirés de index.html", readme:"README inclus" },
  es: { title:"Exportación de proyecto verificado", body:"Convierte el último prototipo verificado en un proyecto multifichero, comprueba el resultado, puede repararlo automáticamente y exporta todo como un paquete TAR.", waiting:"Primero crea arriba un prototipo funcional. El último prototipo correcto aparecerá aquí automáticamente.", verified:"Comprobaciones del proyecto superadas", failed:"Las comprobaciones requieren atención — la exportación permanece bloqueada hasta superarlas", refresh:"Actualizar desde el último build", repair:"Reparar proyecto automáticamente", repairing:"Reparando proyecto…", repaired:"Proyecto reparado y comprobado de nuevo.", repairFailed:"La reparación automática no pudo producir un proyecto verificado.", download:"Descargar", bundle:"Descargar proyecto completo (.tar)", checks:"Verificación", html:"Documento HTML completo presente", css:"CSS extraído", js:"JavaScript extraído", links:"Referencias externas insertadas", syntax:"JavaScript válido después de separar archivos", clean:"CSS y JavaScript inline eliminados de index.html", readme:"README incluido" },
} as const

function splitPrototype(html: string): Omit<ProjectFiles, "VERIFY.md"> {
  const styleMatches = [...html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)]
  const scriptMatches = [...html.matchAll(/<script(?![^>]*\bsrc=)(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  const css = styleMatches.map((m) => m[1].trim()).filter(Boolean).join("\n\n")
  const js = scriptMatches.map((m) => m[1].trim()).filter(Boolean).join("\n\n")
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
    "- VERIFY.md — verification result",
    "",
    "Open index.html in a browser to run the project.",
    "Server authentication, cloud databases, payment processing and deployment are not claimed unless separately implemented and verified.",
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

function tarBytes(files: Record<string, string>) {
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  const writeOctal = (value: number, length: number) => value.toString(8).padStart(length - 1, "0") + "\0"
  const put = (header: Uint8Array, offset: number, value: string, length: number) => {
    const bytes = encoder.encode(value)
    header.set(bytes.slice(0, length), offset)
  }

  for (const [name, content] of Object.entries(files)) {
    const data = encoder.encode(content)
    const header = new Uint8Array(512)
    put(header, 0, name, 100)
    put(header, 100, "0000644\0", 8)
    put(header, 108, "0000000\0", 8)
    put(header, 116, "0000000\0", 8)
    put(header, 124, writeOctal(data.length, 12), 12)
    put(header, 136, writeOctal(Math.floor(Date.now() / 1000), 12), 12)
    for (let i = 148; i < 156; i++) header[i] = 32
    header[156] = "0".charCodeAt(0)
    put(header, 257, "ustar\0", 6)
    put(header, 263, "00", 2)
    const checksum = header.reduce((sum, byte) => sum + byte, 0)
    put(header, 148, checksum.toString(8).padStart(6, "0") + "\0 ", 8)
    chunks.push(header, data)
    const padding = (512 - (data.length % 512)) % 512
    if (padding) chunks.push(new Uint8Array(padding))
  }
  chunks.push(new Uint8Array(1024))
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

function downloadTar(files: Record<string, string>) {
  const blob = new Blob([tarBytes(files)], { type: "application/x-tar" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "hegeva-generated-project.tar"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
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

  const baseFiles = useMemo(() => (html ? splitPrototype(html) : null), [html])
  const checks = useMemo(() => {
    if (!baseFiles) return []
    const index = baseFiles["index.html"]
    const css = baseFiles["styles.css"]
    const js = baseFiles["app.js"]
    const readme = baseFiles["README.md"]
    return [
      [c.html, /<!doctype html/i.test(index) && /<html(?:\s|>)/i.test(index) && /<head(?:\s|>)/i.test(index) && /<body(?:\s|>)/i.test(index) && /<\/html>/i.test(index)],
      [c.css, css.trim().length > 0],
      [c.js, js.trim().length > 0],
      [c.links, index.includes('href="styles.css"') && index.includes('src="app.js"')],
      [c.syntax, javascriptParses(js)],
      [c.clean, !/<style(?:\s|>)/i.test(index) && !/<script(?![^>]*\bsrc=)(?:\s|>)/i.test(index)],
      [c.readme, readme.includes("# HEGEVA generated browser project") && readme.includes("VERIFY.md")],
    ] as const
  }, [baseFiles, c])

  const allPassed = checks.length > 0 && checks.every(([, ok]) => ok)
  const files = useMemo<ProjectFiles | null>(() => {
    if (!baseFiles) return null
    const report = [
      "# HEGEVA project verification",
      "",
      `Status: ${allPassed ? "PASS" : "FAIL"}`,
      "",
      ...checks.map(([label, ok]) => `- [${ok ? "x" : " "}] ${label}`),
      "",
      "This report covers the generated browser project structure only. It does not certify external services that were not separately configured and tested.",
    ].join("\n")
    return { ...baseFiles, "VERIFY.md": report }
  }, [allPassed, baseFiles, checks])

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
      const projectOk = repairedFiles["styles.css"].trim().length > 0 && repairedFiles["app.js"].trim().length > 0 && javascriptParses(repairedFiles["app.js"]) && repairedIndex.includes('href="styles.css"') && repairedIndex.includes('src="app.js"')
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
            {!allPassed && <button type="button" disabled={repairing} onClick={() => void autoRepairProject()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Sparkles className="size-4" aria-hidden />{repairing ? c.repairing : c.repair}</button>}
            {repairMessage && <p className="mt-3 text-sm text-muted-foreground">{repairMessage}</p>}
          </div>

          <button type="button" disabled={!allPassed} onClick={() => downloadTar(files)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"><Archive className="size-4" aria-hidden />{c.bundle}</button>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(Object.entries(files) as [keyof ProjectFiles, string][]).map(([name, content]) => (
              <button key={name} type="button" disabled={!allPassed || !content} onClick={() => downloadTextFile(name, content, name.endsWith(".html") ? "text/html;charset=utf-8" : name.endsWith(".css") ? "text/css;charset=utf-8" : name.endsWith(".js") ? "text/javascript;charset=utf-8" : "text/markdown;charset=utf-8")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"><Download className="size-4" aria-hidden />{c.download} {name}</button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
