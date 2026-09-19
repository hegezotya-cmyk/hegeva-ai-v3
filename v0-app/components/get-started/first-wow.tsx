"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowRight, FileSpreadsheet, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/provider"
import { analyseCustomerMessage, type QuickStartIntent } from "@/lib/first-wow"
import { recordAnalyticsEvent } from "@/components/acquisition/acquisition-attribution"

export const FIRST_WOW_MESSAGE_SEED_KEY = "hegeva:first-wow-message-seed:v1"

const COPY = {
  en: {
    eyebrow: "FIRST WOW",
    title: "Give HEGEVA one thing to work with.",
    subtitle: "Start with one real item from your business. Nothing is sent automatically.",
    invoiceTitle: "Add an invoice",
    invoiceBody: "Use the invoice workspace to enter one real invoice. HEGEVA can then use its status as a real workspace signal.",
    invoiceAction: "Open invoice workspace",
    messageTitle: "Paste a customer message",
    messageBody: "Paste one real customer message here. This quick-start check stays in your browser until you choose to continue.",
    placeholder: "Paste a customer message…",
    analyse: "CHECK MESSAGE",
    empty: "Paste a message first.",
    signal: "HEGEVA found a likely next step",
    caveat: "Quick-start signal only — based on visible words in the message, not a full AI analysis.",
    openDraft: "OPEN PREPARED REPLY",
    prepared: "Prepared only. Nothing has been sent.",
    intents: {
      payment: ["Payment / invoice attention", "Prepare a clear, polite payment reply.", "Payment follow-up"],
      quote: ["Quote / pricing follow-up", "Prepare a concise reply that moves the quote forward.", "Quote follow-up"],
      schedule: ["Scheduling request", "Prepare a reply that confirms availability and next steps.", "Scheduling reply"],
      support: ["Customer issue", "Prepare a calm acknowledgement and next-step reply.", "Customer support reply"],
      general: ["Customer reply", "Prepare a professional response and confirm the next step.", "Customer reply"],
    },
    replies: {
      payment: "Thanks for your message. I’m checking the invoice and payment status now. I’ll confirm the details and the next step shortly.",
      quote: "Thanks for your message. I’m reviewing the quote details now and I’ll confirm the next step shortly. Please let me know if there is anything specific you would like adjusted.",
      schedule: "Thanks for your message. I’m checking availability and will confirm a suitable time and the next step shortly.",
      support: "Thanks for letting me know. I’m reviewing the issue now and I’ll come back to you with the next step as soon as possible.",
      general: "Thanks for your message. I’m reviewing the details now and I’ll come back to you with the next step shortly.",
    },
  },
  hu: {
    eyebrow: "ELSŐ WOW",
    title: "Adj a HEGEVA-nak egy dolgot, amivel dolgozhat.",
    subtitle: "Kezdj egy valódi üzleti tétellel. Semmi nem kerül automatikusan elküldésre.",
    invoiceTitle: "Adj hozzá egy számlát",
    invoiceBody: "Az invoice munkatérben rögzíts egy valódi számlát. A HEGEVA ezután valódi munkaterületi jelként tudja használni az állapotát.",
    invoiceAction: "Számla munkatér megnyitása",
    messageTitle: "Másolj be egy ügyfélüzenetet",
    messageBody: "Másolj be ide egy valódi ügyfélüzenetet. Ez a gyors ellenőrzés a böngésződben marad, amíg nem döntesz a folytatásról.",
    placeholder: "Másolj be egy ügyfélüzenetet…",
    analyse: "ÜZENET ELLENŐRZÉSE",
    empty: "Először másolj be egy üzenetet.",
    signal: "A HEGEVA valószínű következő lépést talált",
    caveat: "Gyors indítási jelzés — a látható szavak alapján, nem teljes AI-elemzés.",
    openDraft: "ELŐKÉSZÍTETT VÁLASZ MEGNYITÁSA",
    prepared: "Csak előkészítve. Semmi nem került elküldésre.",
    intents: {
      payment: ["Fizetés / számla figyelmet igényel", "Készíts egy világos, udvarias fizetési választ.", "Fizetési utánkövetés"],
      quote: ["Ajánlat / árazás utánkövetés", "Készíts rövid választ, ami továbbviszi az ajánlatot.", "Ajánlat utánkövetés"],
      schedule: ["Időpont-egyeztetés", "Készíts választ az elérhetőség és a következő lépés tisztázására.", "Időpont-egyeztető válasz"],
      support: ["Ügyfélprobléma", "Készíts nyugodt visszajelzést és következő lépést.", "Ügyféltámogatási válasz"],
      general: ["Ügyfélválasz", "Készíts professzionális választ és erősítsd meg a következő lépést.", "Ügyfélválasz"],
    },
    replies: {
      payment: "Köszönöm az üzenetet. Most ellenőrzöm a számla és a fizetés állapotát, és rövidesen visszajelzek a részletekkel és a következő lépéssel.",
      quote: "Köszönöm az üzenetet. Most átnézem az ajánlat részleteit, és rövidesen visszajelzek a következő lépéssel. Kérlek jelezd, ha van valami, amin szeretnél változtatni.",
      schedule: "Köszönöm az üzenetet. Ellenőrzöm az elérhető időpontokat, és rövidesen visszajelzek egy megfelelő időponttal és a következő lépéssel.",
      support: "Köszönöm, hogy jelezted. Most átnézem a problémát, és amint lehet, visszajelzek a következő lépéssel.",
      general: "Köszönöm az üzenetet. Most átnézem a részleteket, és rövidesen visszajelzek a következő lépéssel.",
    },
  },
  de: {
    eyebrow: "ERSTER WOW-MOMENT", title: "Gib HEGEVA eine Sache, mit der es arbeiten kann.",
    subtitle: "Beginne mit einem echten Geschäftselement. Nichts wird automatisch gesendet.",
    invoiceTitle: "Rechnung hinzufügen", invoiceBody: "Erfasse eine echte Rechnung im Rechnungsbereich. HEGEVA kann ihren Status dann als echtes Workspace-Signal nutzen.", invoiceAction: "Rechnungsbereich öffnen",
    messageTitle: "Kundennachricht einfügen", messageBody: "Füge eine echte Kundennachricht ein. Diese Schnellprüfung bleibt im Browser, bis du fortfährst.",
    placeholder: "Kundennachricht einfügen…", analyse: "NACHRICHT PRÜFEN", empty: "Bitte zuerst eine Nachricht einfügen.",
    signal: "HEGEVA hat einen wahrscheinlichen nächsten Schritt gefunden", caveat: "Nur ein Schnellstart-Signal anhand sichtbarer Wörter, keine vollständige KI-Analyse.", openDraft: "VORBEREITETE ANTWORT ÖFFNEN", prepared: "Nur vorbereitet. Nichts wurde gesendet.",
    intents: { payment:["Zahlung / Rechnung","Eine klare, höfliche Zahlungsantwort vorbereiten.","Zahlungsnachverfolgung"], quote:["Angebot / Preisnachverfolgung","Eine kurze Antwort vorbereiten, die das Angebot voranbringt.","Angebotsnachverfolgung"], schedule:["Terminwunsch","Verfügbarkeit und nächsten Schritt bestätigen.","Terminantwort"], support:["Kundenproblem","Ruhige Bestätigung und nächsten Schritt vorbereiten.","Support-Antwort"], general:["Kundenantwort","Professionell antworten und nächsten Schritt bestätigen.","Kundenantwort"] },
    replies: { payment:"Danke für deine Nachricht. Ich prüfe jetzt Rechnung und Zahlungsstatus und melde mich kurz mit den Details und dem nächsten Schritt.", quote:"Danke für deine Nachricht. Ich prüfe die Angebotsdetails und melde mich kurz mit dem nächsten Schritt. Sag gern Bescheid, falls etwas angepasst werden soll.", schedule:"Danke für deine Nachricht. Ich prüfe die Verfügbarkeit und bestätige kurz einen passenden Termin und den nächsten Schritt.", support:"Danke für den Hinweis. Ich prüfe das Problem und melde mich so bald wie möglich mit dem nächsten Schritt.", general:"Danke für deine Nachricht. Ich prüfe die Details und melde mich kurz mit dem nächsten Schritt." },
  },
  fr: {
    eyebrow: "PREMIER WOW", title: "Donnez à HEGEVA une chose sur laquelle travailler.",
    subtitle: "Commencez avec un élément réel de votre activité. Rien n’est envoyé automatiquement.",
    invoiceTitle: "Ajouter une facture", invoiceBody: "Saisissez une vraie facture dans l’espace Factures. HEGEVA pourra utiliser son statut comme signal réel.", invoiceAction: "Ouvrir l’espace factures",
    messageTitle: "Coller un message client", messageBody: "Collez un vrai message client. Cette vérification rapide reste dans votre navigateur jusqu’à ce que vous choisissiez de continuer.",
    placeholder: "Collez un message client…", analyse: "VÉRIFIER LE MESSAGE", empty: "Collez d’abord un message.",
    signal: "HEGEVA a trouvé une prochaine étape probable", caveat: "Signal de démarrage rapide basé sur les mots visibles, pas une analyse IA complète.", openDraft: "OUVRIR LA RÉPONSE PRÉPARÉE", prepared: "Préparé uniquement. Rien n’a été envoyé.",
    intents: { payment:["Paiement / facture","Préparer une réponse de paiement claire et polie.","Suivi de paiement"], quote:["Suivi devis / prix","Préparer une réponse concise pour faire avancer le devis.","Suivi de devis"], schedule:["Demande de rendez-vous","Préparer une réponse confirmant la disponibilité et la suite.","Réponse de planification"], support:["Problème client","Préparer un accusé de réception calme et la prochaine étape.","Réponse support"], general:["Réponse client","Préparer une réponse professionnelle et confirmer la suite.","Réponse client"] },
    replies: { payment:"Merci pour votre message. Je vérifie maintenant la facture et le statut du paiement, puis je vous confirme rapidement les détails et la prochaine étape.", quote:"Merci pour votre message. Je vérifie les détails du devis et je vous confirme rapidement la prochaine étape. N’hésitez pas à me dire si vous souhaitez un ajustement.", schedule:"Merci pour votre message. Je vérifie les disponibilités et je vous confirme rapidement un créneau adapté et la prochaine étape.", support:"Merci de me l’avoir signalé. Je vérifie le problème et je reviens vers vous dès que possible avec la prochaine étape.", general:"Merci pour votre message. Je vérifie les détails et je reviens vers vous rapidement avec la prochaine étape." },
  },
  es: {
    eyebrow: "PRIMER WOW", title: "Dale a HEGEVA una cosa con la que trabajar.",
    subtitle: "Empieza con un elemento real de tu negocio. Nada se envía automáticamente.",
    invoiceTitle: "Añadir una factura", invoiceBody: "Introduce una factura real en el espacio de facturas. HEGEVA podrá usar su estado como una señal real.", invoiceAction: "Abrir espacio de facturas",
    messageTitle: "Pegar un mensaje de cliente", messageBody: "Pega un mensaje real de cliente. Esta comprobación rápida permanece en tu navegador hasta que decidas continuar.",
    placeholder: "Pega un mensaje de cliente…", analyse: "COMPROBAR MENSAJE", empty: "Pega primero un mensaje.",
    signal: "HEGEVA encontró un siguiente paso probable", caveat: "Señal rápida basada en palabras visibles, no un análisis completo de IA.", openDraft: "ABRIR RESPUESTA PREPARADA", prepared: "Solo preparado. No se ha enviado nada.",
    intents: { payment:["Pago / factura","Preparar una respuesta clara y amable sobre el pago.","Seguimiento de pago"], quote:["Seguimiento de presupuesto / precio","Preparar una respuesta breve para avanzar el presupuesto.","Seguimiento de presupuesto"], schedule:["Solicitud de cita","Preparar una respuesta que confirme disponibilidad y próximos pasos.","Respuesta de cita"], support:["Problema de cliente","Preparar una respuesta tranquila y el siguiente paso.","Respuesta de soporte"], general:["Respuesta al cliente","Preparar una respuesta profesional y confirmar el siguiente paso.","Respuesta al cliente"] },
    replies: { payment:"Gracias por tu mensaje. Estoy revisando ahora la factura y el estado del pago y te confirmaré en breve los detalles y el siguiente paso.", quote:"Gracias por tu mensaje. Estoy revisando los detalles del presupuesto y te confirmaré en breve el siguiente paso. Dime si quieres que ajuste algo.", schedule:"Gracias por tu mensaje. Estoy revisando la disponibilidad y te confirmaré en breve una hora adecuada y el siguiente paso.", support:"Gracias por avisarme. Estoy revisando el problema y te responderé lo antes posible con el siguiente paso.", general:"Gracias por tu mensaje. Estoy revisando los detalles y te responderé en breve con el siguiente paso." },
  },
} as const

export function FirstWowQuickStart() {
  const { locale } = useI18n()
  const c = COPY[locale as keyof typeof COPY] ?? COPY.en
  const [message, setMessage] = useState("")
  const [intent, setIntent] = useState<QuickStartIntent | null>(null)
  const [error, setError] = useState("")

  const prepared = useMemo(() => intent ? c.replies[intent] : "", [c.replies, intent])

  const analyse = () => {
    const clean = message.trim()
    if (!clean) {
      setError(c.empty)
      setIntent(null)
      return
    }
    setError("")
    const result = analyseCustomerMessage(clean)
    setIntent(result.intent)
    recordAnalyticsEvent("own_business_start", "/get-started", { input_type: "customer_message" })
    recordAnalyticsEvent("own_business_result", "/get-started", { input_type: "customer_message", result_type: result.intent })
  }

  const openDraft = () => {
    if (!intent || !prepared) return
    try {
      sessionStorage.setItem(FIRST_WOW_MESSAGE_SEED_KEY, JSON.stringify({
        at: Date.now(),
        type: c.intents[intent][2],
        tone: "Professional",
        subject: c.intents[intent][0],
        body: prepared,
      }))
    } catch {}
  }

  return (
    <section className="mt-10 rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/[.07] via-card/60 to-primary/[.04] p-6 sm:p-8">
      <p className="ve-eyebrow text-gold">{c.eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{c.title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{c.subtitle}</p>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-background/45 p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-gold/10 text-gold"><FileSpreadsheet className="size-5" aria-hidden /></span>
          <h3 className="mt-4 text-xl font-semibold">{c.invoiceTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{c.invoiceBody}</p>
          <Link
            href="/business/invoices"
            onClick={() => recordAnalyticsEvent("own_business_start", "/get-started", { input_type: "invoice" })}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-gold/35 px-4 text-sm font-semibold text-gold"
          >
            {c.invoiceAction}<ArrowRight className="size-4" aria-hidden />
          </Link>
        </article>

        <article className="rounded-2xl border border-border bg-background/45 p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><MessageSquareText className="size-5" aria-hidden /></span>
          <h3 className="mt-4 text-xl font-semibold">{c.messageTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{c.messageBody}</p>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} maxLength={4000} placeholder={c.placeholder} className="mt-4 w-full resize-y rounded-xl border border-input bg-input/30 px-3.5 py-3 text-sm outline-none focus:border-primary/50" />
          <button type="button" onClick={analyse} className="hegeva-primary mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
            <Sparkles className="size-4" aria-hidden />{c.analyse}
          </button>
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}

          {intent && (
            <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/[.05] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-primary">{c.signal}</p>
                  <h4 className="mt-1 font-semibold">{c.intents[intent][0]}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">{c.intents[intent][1]}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-border bg-background/60 p-4 text-sm leading-6">{prepared}</div>
              <p className="mt-3 text-xs font-medium text-muted-foreground">{c.prepared}</p>
              <p className="mt-2 text-xs text-muted-foreground">{c.caveat}</p>
              <Link href="/business/messages" onClick={openDraft} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/35 px-4 text-sm font-semibold text-primary">
                {c.openDraft}<ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
