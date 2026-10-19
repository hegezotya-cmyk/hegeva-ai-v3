"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Calculator, CheckCircle2, Copy, FileText, MessageSquareText, ReceiptText, SearchCheck, ShieldCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { businessCheckScore, estimateAnnualAdminCost, safeMoney, type BusinessCheckSignals } from "@/lib/free-growth-tools"
import { recordAnalyticsEvent } from "@/components/acquisition/acquisition-attribution"

type ToolKey = "invoice" | "quote" | "admin" | "check" | "followup"

const COPY = {
  en: {
    eyebrow: "FREE SMALL-BUSINESS TOOLS",
    title: "Useful now. No signup required.",
    subtitle: "Five simple browser-based tools for common small-business admin. No AI provider call and nothing is sent automatically.",
    tools: { invoice:"Invoice Chaser", quote:"Quote Follow-up", admin:"Admin Cost Calculator", check:"Business Check", followup:"Customer Follow-up Writer" },
    customer:"Customer name", reference:"Reference", amount:"Amount (£)", days:"Days overdue", context:"What are you following up about?", generate:"GENERATE", copy:"COPY", copied:"Copied", hours:"Admin hours per week", rate:"Your hourly value (£)", annual:"Estimated annual admin cost", estimate:"Estimate only: hours × hourly value × 52 weeks.", businessCheck:"Tick the signals that apply today.", score:"Business Check score", heuristic:"Transparent checklist heuristic — not a scientific or financial rating.", signals:["Overdue invoice","Quote waiting 7+ days","Returning customer gone quiet","Important task overdue","Follow-up not scheduled"], challenge:"TRY THE 60-SECOND CHALLENGE", boundary:"These tools prepare text or estimates only. They do not send messages, change records or take external action.",
    messages:{
      invoice:(name:string,ref:string,amount:number,days:number)=>`Hi ${name || "there"}, just a quick reminder that invoice ${ref || "your invoice"} for £${amount.toFixed(2)} is now ${days > 0 ? `${days} days overdue` : "due"}. Please let me know if you need another copy or have any questions. Thanks.`,
      quote:(name:string,ref:string,amount:number)=>`Hi ${name || "there"}, I’m following up on quote ${ref || "the quote"}${amount > 0 ? ` for £${amount.toFixed(2)}` : ""}. Please let me know if you have any questions or would like me to adjust anything. Happy to confirm the next step.`,
      followup:(name:string,context:string)=>`Hi ${name || "there"}, just checking in regarding ${context || "our recent conversation"}. Let me know where things stand and whether you need anything from me to move this forward. Thanks.`,
    },
  },
  hu: {
    eyebrow:"INGYENES KISVÁLLALKOZÁSI ESZKÖZÖK", title:"Hasznos most. Regisztráció nélkül.", subtitle:"Öt egyszerű, böngészőben futó eszköz gyakori kisvállalkozási adminhoz. Nincs AI-provider hívás, és semmi nem kerül automatikusan elküldésre.",
    tools:{invoice:"Számlabehajtó szöveg",quote:"Ajánlat utánkövetés",admin:"Admin költség kalkulátor",check:"Üzleti ellenőrzés",followup:"Ügyfél utánkövető író"},
    customer:"Ügyfél neve",reference:"Hivatkozás",amount:"Összeg (£)",days:"Hány napja lejárt",context:"Miről szól az utánkövetés?",generate:"ELKÉSZÍTÉS",copy:"MÁSOLÁS",copied:"Kimásolva",hours:"Admin órák hetente",rate:"Óránkénti értéked (£)",annual:"Becsült éves admin költség",estimate:"Becslés: órák × óránkénti érték × 52 hét.",businessCheck:"Jelöld be, ami ma igaz.",score:"Üzleti ellenőrzési pontszám",heuristic:"Átlátható ellenőrzőlista-heurisztika — nem tudományos vagy pénzügyi minősítés.",signals:["Lejárt számla","7+ napja váró ajánlat","Visszatérő ügyfél elcsendesedett","Fontos feladat lejárt","Nincs beállítva utánkövetés"],challenge:"60 MÁSODPERCES KIHÍVÁS",boundary:"Ezek az eszközök csak szöveget vagy becslést készítenek. Nem küldenek üzenetet, nem módosítanak rekordot és nem hajtanak végre külső műveletet.",
    messages:{
      invoice:(name:string,ref:string,amount:number,days:number)=>`Szia ${name || ""}! Egy gyors emlékeztető: a(z) ${ref || "számla"} ${amount > 0 ? `£${amount.toFixed(2)} összegben ` : ""}${days > 0 ? `${days} napja lejárt` : "esedékes"}. Kérlek jelezd, ha szükséged van új példányra vagy kérdésed van. Köszönöm.`,
      quote:(name:string,ref:string,amount:number)=>`Szia ${name || ""}! Szeretnék utánkövetni a(z) ${ref || "ajánlat"} kapcsán${amount > 0 ? `, amelynek értéke £${amount.toFixed(2)}` : ""}. Kérlek jelezd, ha van kérdésed vagy szeretnél valamin változtatni. Szívesen egyeztetem a következő lépést.`,
      followup:(name:string,context:string)=>`Szia ${name || ""}! Csak szeretnék utánkövetni ${context || "a legutóbbi egyeztetésünkkel kapcsolatban"}. Kérlek jelezd, hol tartunk, és szükséged van-e valamire tőlem a folytatáshoz. Köszönöm.`,
    },
  },
  de: {
    eyebrow:"KOSTENLOSE TOOLS FÜR KLEINE UNTERNEHMEN",title:"Sofort nützlich. Ohne Anmeldung.",subtitle:"Fünf einfache Browser-Tools für typische Verwaltungsaufgaben. Kein KI-Provider-Aufruf und nichts wird automatisch gesendet.",
    tools:{invoice:"Rechnungserinnerung",quote:"Angebot nachfassen",admin:"Admin-Kosten-Rechner",check:"Business Check",followup:"Kunden-Nachfasshilfe"},customer:"Kundenname",reference:"Referenz",amount:"Betrag (£)",days:"Tage überfällig",context:"Worum geht es beim Nachfassen?",generate:"ERSTELLEN",copy:"KOPIEREN",copied:"Kopiert",hours:"Admin-Stunden pro Woche",rate:"Ihr Stundenwert (£)",annual:"Geschätzte jährliche Admin-Kosten",estimate:"Schätzung: Stunden × Stundenwert × 52 Wochen.",businessCheck:"Markieren Sie die Signale, die heute zutreffen.",score:"Business-Check-Score",heuristic:"Transparente Checklisten-Heuristik — keine wissenschaftliche oder finanzielle Bewertung.",signals:["Überfällige Rechnung","Angebot wartet 7+ Tage","Stammkunde ist still geworden","Wichtige Aufgabe überfällig","Kein Nachfassen geplant"],challenge:"60-SEKUNDEN-CHALLENGE TESTEN",boundary:"Diese Tools erstellen nur Text oder Schätzungen. Sie senden nichts und führen keine externen Aktionen aus.",
    messages:{invoice:(n:string,r:string,a:number,d:number)=>`Hallo ${n||""}, kurze Erinnerung: Rechnung ${r||""}${a>0?` über £${a.toFixed(2)}`:""} ist ${d>0?`${d} Tage überfällig`:"fällig"}. Bitte melden Sie sich, wenn Sie eine weitere Kopie brauchen oder Fragen haben. Danke.`,quote:(n:string,r:string,a:number)=>`Hallo ${n||""}, ich möchte zu Angebot ${r||""}${a>0?` über £${a.toFixed(2)}`:""} nachfassen. Bitte melden Sie sich bei Fragen oder Änderungswünschen. Gern bestätige ich den nächsten Schritt.`,followup:(n:string,x:string)=>`Hallo ${n||""}, ich wollte kurz zu ${x||"unserem letzten Gespräch"} nachfassen. Bitte sagen Sie mir, wie der Stand ist und ob Sie etwas von mir brauchen. Danke.`},
  },
  fr: {
    eyebrow:"OUTILS GRATUITS POUR PETITES ENTREPRISES",title:"Utile maintenant. Sans inscription.",subtitle:"Cinq outils simples dans le navigateur pour l’administratif courant. Aucun appel à un fournisseur IA et rien n’est envoyé automatiquement.",
    tools:{invoice:"Relance de facture",quote:"Relance de devis",admin:"Calculateur de coût administratif",check:"Business Check",followup:"Rédacteur de relance client"},customer:"Nom du client",reference:"Référence",amount:"Montant (£)",days:"Jours de retard",context:"Objet de la relance",generate:"GÉNÉRER",copy:"COPIER",copied:"Copié",hours:"Heures d’admin par semaine",rate:"Valeur horaire (£)",annual:"Coût administratif annuel estimé",estimate:"Estimation : heures × valeur horaire × 52 semaines.",businessCheck:"Cochez les signaux vrais aujourd’hui.",score:"Score Business Check",heuristic:"Heuristique transparente basée sur une checklist — pas une note scientifique ou financière.",signals:["Facture échue","Devis en attente 7+ jours","Client récurrent silencieux","Tâche importante en retard","Aucune relance planifiée"],challenge:"ESSAYER LE DÉFI 60 SECONDES",boundary:"Ces outils préparent uniquement du texte ou des estimations. Ils n’envoient rien et n’effectuent aucune action externe.",
    messages:{invoice:(n:string,r:string,a:number,d:number)=>`Bonjour ${n||""}, petit rappel : la facture ${r||""}${a>0?` de £${a.toFixed(2)}`:""} est ${d>0?`en retard de ${d} jours`:"arrivée à échéance"}. Dites-moi si vous avez besoin d’une autre copie ou si vous avez des questions. Merci.`,quote:(n:string,r:string,a:number)=>`Bonjour ${n||""}, je reviens vers vous au sujet du devis ${r||""}${a>0?` de £${a.toFixed(2)}`:""}. Dites-moi si vous avez des questions ou souhaitez un ajustement. Je peux confirmer la prochaine étape.`,followup:(n:string,x:string)=>`Bonjour ${n||""}, je reviens vers vous au sujet de ${x||"notre dernier échange"}. Dites-moi où vous en êtes et si vous avez besoin de quelque chose de ma part pour avancer. Merci.`},
  },
  es: {
    eyebrow:"HERRAMIENTAS GRATIS PARA PEQUEÑOS NEGOCIOS",title:"Útiles ahora. Sin registro.",subtitle:"Cinco herramientas sencillas en el navegador para tareas administrativas comunes. Sin llamada a proveedor de IA y nada se envía automáticamente.",
    tools:{invoice:"Recordatorio de factura",quote:"Seguimiento de presupuesto",admin:"Calculadora de coste administrativo",check:"Business Check",followup:"Redactor de seguimiento"},customer:"Nombre del cliente",reference:"Referencia",amount:"Importe (£)",days:"Días vencida",context:"¿Sobre qué haces seguimiento?",generate:"GENERAR",copy:"COPIAR",copied:"Copiado",hours:"Horas de admin por semana",rate:"Valor por hora (£)",annual:"Coste administrativo anual estimado",estimate:"Estimación: horas × valor por hora × 52 semanas.",businessCheck:"Marca las señales que se aplican hoy.",score:"Puntuación Business Check",heuristic:"Heurística transparente de checklist — no es una valoración científica ni financiera.",signals:["Factura vencida","Presupuesto esperando 7+ días","Cliente recurrente en silencio","Tarea importante vencida","Sin seguimiento programado"],challenge:"PROBAR EL RETO DE 60 SEGUNDOS",boundary:"Estas herramientas solo preparan texto o estimaciones. No envían mensajes ni realizan acciones externas.",
    messages:{invoice:(n:string,r:string,a:number,d:number)=>`Hola ${n||""}, un recordatorio rápido: la factura ${r||""}${a>0?` por £${a.toFixed(2)}`:""} está ${d>0?`vencida hace ${d} días`:"vencida"}. Avísame si necesitas otra copia o tienes alguna pregunta. Gracias.`,quote:(n:string,r:string,a:number)=>`Hola ${n||""}, hago seguimiento del presupuesto ${r||""}${a>0?` por £${a.toFixed(2)}`:""}. Avísame si tienes preguntas o quieres ajustar algo. Encantado de confirmar el siguiente paso.`,followup:(n:string,x:string)=>`Hola ${n||""}, quería hacer seguimiento sobre ${x||"nuestra conversación reciente"}. Dime cómo va y si necesitas algo de mi parte para avanzar. Gracias.`},
  },
} as const

const toolIcons = { invoice:ReceiptText, quote:FileText, admin:Calculator, check:SearchCheck, followup:MessageSquareText }

export function FreeToolsHub() {
  const { locale } = useI18n()
  const c = COPY[locale as keyof typeof COPY] ?? COPY.en
  const [tool, setTool] = useState<ToolKey>("invoice")
  const [name, setName] = useState("")
  const [reference, setReference] = useState("")
  const [amount, setAmount] = useState("")
  const [days, setDays] = useState("14")
  const [context, setContext] = useState("")
  const [hours, setHours] = useState("5")
  const [rate, setRate] = useState("25")
  const [checks, setChecks] = useState<BusinessCheckSignals>({ overdueInvoice:false, staleQuote:false, inactiveCustomer:false, overdueTask:false, missingFollowUp:false })
  const [generated, setGenerated] = useState("")
  const [copied, setCopied] = useState(false)

  const annualCost = useMemo(() => estimateAnnualAdminCost(Number(hours), Number(rate)), [hours, rate])
  const checkScore = useMemo(() => businessCheckScore(checks), [checks])

  const selectTool = (next: ToolKey) => {
    setTool(next)
    setGenerated("")
    setCopied(false)
    recordAnalyticsEvent("free_tool_use", "/free-tools", { tool: next, action: "open" })
  }

  const generate = () => {
    const money = safeMoney(amount)
    const overdue = Math.max(0, Math.min(3650, Number(days) || 0))
    const next = tool === "invoice" ? c.messages.invoice(name.trim(), reference.trim(), money, overdue)
      : tool === "quote" ? c.messages.quote(name.trim(), reference.trim(), money)
      : c.messages.followup(name.trim(), context.trim())
    setGenerated(next)
    setCopied(false)
    recordAnalyticsEvent("free_tool_use", "/free-tools", { tool, action: "generate" })
  }

  const copy = async () => {
    if (!generated) return
    try {
      await navigator.clipboard.writeText(generated)
      setCopied(true)
      recordAnalyticsEvent("free_tool_use", "/free-tools", { tool, action: "copy" })
    } catch {}
  }

  const toolKeys = Object.keys(c.tools) as ToolKey[]

  return (
    <main className="mx-auto w-full max-w-[94rem] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <section className="rounded-[2rem] border border-gold/30 bg-gradient-to-br from-gold/[.08] via-background to-primary/[.04] p-6 shadow-2xl sm:p-9 lg:p-12">
        <p className="ve-eyebrow text-gold">{c.eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-.04em] sm:text-5xl lg:text-6xl">{c.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{c.subtitle}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {toolKeys.map((key) => {
            const Icon = toolIcons[key]
            return (
              <button key={key} type="button" onClick={() => selectTool(key)} className={`rounded-2xl border p-4 text-left transition ${tool===key?"border-gold/45 bg-gold/[.08]":"border-border bg-background/45 hover:border-gold/25"}`}>
                <Icon className="size-5 text-gold" aria-hidden />
                <span className="mt-3 block text-sm font-semibold">{c.tools[key]}</span>
              </button>
            )
          })}
        </div>

        <section className="mt-7 rounded-3xl border border-border bg-background/55 p-5 sm:p-7">
          {(tool === "invoice" || tool === "quote" || tool === "followup") && (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium">{c.customer}<input value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-input/30 px-3.5 py-3" /></label>
              {tool !== "followup" && <label className="text-sm font-medium">{c.reference}<input value={reference} onChange={e=>setReference(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-input/30 px-3.5 py-3" /></label>}
              {tool !== "followup" && <label className="text-sm font-medium">{c.amount}<input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-input/30 px-3.5 py-3" /></label>}
              {tool === "invoice" && <label className="text-sm font-medium">{c.days}<input inputMode="numeric" value={days} onChange={e=>setDays(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-input/30 px-3.5 py-3" /></label>}
              {tool === "followup" && <label className="text-sm font-medium md:col-span-2">{c.context}<textarea value={context} onChange={e=>setContext(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-input bg-input/30 px-3.5 py-3" /></label>}
              <div className="md:col-span-2">
                <button type="button" onClick={generate} className="hegeva-primary min-h-11 rounded-xl px-5 text-sm font-semibold">{c.generate}</button>
              </div>
            </div>
          )}

          {tool === "admin" && (
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium">{c.hours}<input inputMode="decimal" value={hours} onChange={e=>setHours(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-input/30 px-3.5 py-3" /></label>
              <label className="text-sm font-medium">{c.rate}<input inputMode="decimal" value={rate} onChange={e=>setRate(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-input/30 px-3.5 py-3" /></label>
              <div className="md:col-span-2 rounded-2xl border border-gold/30 bg-gold/[.06] p-5">
                <p className="text-sm text-muted-foreground">{c.annual}</p>
                <strong className="mt-2 block font-display text-4xl text-gold">£{annualCost.toLocaleString(locale,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>
                <p className="mt-2 text-xs text-muted-foreground">{c.estimate}</p>
              </div>
            </div>
          )}

          {tool === "check" && (
            <div>
              <p className="text-sm font-semibold">{c.businessCheck}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(Object.keys(checks) as Array<keyof BusinessCheckSignals>).map((key,index)=>(
                  <label key={key} className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm">
                    <input type="checkbox" checked={checks[key]} onChange={e=>{setChecks(current=>({...current,[key]:e.target.checked}));recordAnalyticsEvent("free_tool_use","/free-tools",{tool:"check",action:"signal"})}} />
                    {c.signals[index]}
                  </label>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-gold/30 bg-gold/[.06] p-5">
                <p className="text-sm text-muted-foreground">{c.score}</p>
                <strong className="mt-2 block font-display text-5xl text-gold">{checkScore}/100</strong>
                <p className="mt-2 text-xs text-muted-foreground">{c.heuristic}</p>
              </div>
            </div>
          )}

          {generated && (tool === "invoice" || tool === "quote" || tool === "followup") && (
            <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/[.05] p-5">
              <p className="text-sm leading-7">{generated}</p>
              <button type="button" onClick={() => void copy()} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary/35 px-4 text-sm font-semibold text-primary">
                {copied ? <CheckCircle2 className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}{copied ? c.copied : c.copy}
              </button>
            </div>
          )}
        </section>

        <section className="mt-7 rounded-3xl border border-primary/30 bg-primary/[.045] p-6 text-center">
          <Link href="/challenge" onClick={() => recordAnalyticsEvent("free_tool_cta_click","/free-tools",{tool})} className="hegeva-primary inline-flex min-h-12 items-center rounded-xl px-6 text-sm font-bold">{c.challenge}</Link>
          <p className="mx-auto mt-4 max-w-3xl text-xs leading-5 text-muted-foreground"><ShieldCheck className="mr-1 inline size-4 text-primary" aria-hidden />{c.boundary}</p>
        </section>
      </section>
    </main>
  )
}
