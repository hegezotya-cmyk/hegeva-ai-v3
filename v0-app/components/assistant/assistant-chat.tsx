"use client"

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowUp, Check, Copy, FileText, ListChecks, Sparkles, Trash2, Users } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { authClient } from "@/lib/auth-client"
import { useI18n } from "@/lib/i18n/provider"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { AICore, IntelligenceCard, SkeletonSurface } from "@/components/visual-engine"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type PlanStatus = {
  plan: string
  aiMessages: number
  aiLimit: number
  period: string
}

type SupportedLanguage = "en" | "hu" | "de" | "fr" | "es"
type FailureCopy = {
  session: string
  conflict: string
  expired: string
  rate: (seconds?: number) => string
  tooLarge: string
  unavailable: string
  network: string
}

const failureCopy: Record<SupportedLanguage, FailureCopy> = {
  en: {
    session: "Your session has expired. Please sign in again to continue.",
    conflict: "This request was already received or is still pending. Do not submit it again; wait or refresh the conversation.",
    expired: "This request expired before it completed. Edit the message and send it again when ready.",
    rate: (seconds) => seconds ? `Please wait about ${seconds} second${seconds === 1 ? "" : "s"} before trying again.` : "Please wait a moment before trying again.",
    tooLarge: "This request is too large. Shorten the message or conversation context and try again.",
    unavailable: "HEGEVA AI is temporarily unavailable. Your request was not automatically retried.",
    network: "The connection was interrupted. Check your internet connection and submit the same message again when ready.",
  },
  hu: {
    session: "A munkameneted lejárt. A folytatáshoz jelentkezz be újra.",
    conflict: "Ezt a kérést már fogadtuk, vagy még folyamatban van. Ne küldd el újra; várj vagy frissítsd a beszélgetést.",
    expired: "A kérés a befejezés előtt lejárt. Módosítsd az üzenetet, majd küldd el újra.",
    rate: (seconds) => seconds ? `Várj körülbelül ${seconds} másodpercet az újrapróbálás előtt.` : "Várj egy pillanatot az újrapróbálás előtt.",
    tooLarge: "A kérés túl nagy. Rövidítsd az üzenetet vagy az előzményeket, majd próbáld újra.",
    unavailable: "A HEGEVA AI átmenetileg nem érhető el. A kérést nem próbáltuk meg automatikusan újra.",
    network: "A kapcsolat megszakadt. Ellenőrizd az internetkapcsolatot, majd küldd el újra ugyanazt az üzenetet.",
  },
  de: {
    session: "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
    conflict: "Diese Anfrage wurde bereits empfangen oder ist noch offen. Senden Sie sie nicht erneut; warten oder aktualisieren Sie das Gespräch.",
    expired: "Diese Anfrage ist vor dem Abschluss abgelaufen. Bearbeiten Sie die Nachricht und senden Sie sie erneut.",
    rate: (seconds) => seconds ? `Bitte warten Sie etwa ${seconds} Sekunde${seconds === 1 ? "" : "n"}, bevor Sie es erneut versuchen.` : "Bitte warten Sie einen Moment, bevor Sie es erneut versuchen.",
    tooLarge: "Diese Anfrage ist zu groß. Kürzen Sie Nachricht oder Verlauf und versuchen Sie es erneut.",
    unavailable: "HEGEVA AI ist vorübergehend nicht verfügbar. Die Anfrage wurde nicht automatisch erneut gesendet.",
    network: "Die Verbindung wurde unterbrochen. Prüfen Sie Ihre Internetverbindung und senden Sie dieselbe Nachricht erneut.",
  },
  fr: {
    session: "Votre session a expiré. Reconnectez-vous pour continuer.",
    conflict: "Cette demande a déjà été reçue ou est encore en attente. Ne la renvoyez pas ; attendez ou actualisez la conversation.",
    expired: "Cette demande a expiré avant de se terminer. Modifiez le message et renvoyez-le.",
    rate: (seconds) => seconds ? `Veuillez patienter environ ${seconds} seconde${seconds === 1 ? "" : "s"} avant de réessayer.` : "Veuillez patienter un instant avant de réessayer.",
    tooLarge: "Cette demande est trop volumineuse. Raccourcissez le message ou le contexte, puis réessayez.",
    unavailable: "HEGEVA AI est temporairement indisponible. La demande n’a pas été réessayée automatiquement.",
    network: "La connexion a été interrompue. Vérifiez votre connexion puis renvoyez le même message.",
  },
  es: {
    session: "Tu sesión ha caducado. Inicia sesión de nuevo para continuar.",
    conflict: "Esta solicitud ya se recibió o sigue pendiente. No la envíes otra vez; espera o actualiza la conversación.",
    expired: "Esta solicitud caducó antes de completarse. Edita el mensaje y vuelve a enviarlo.",
    rate: (seconds) => seconds ? `Espera unos ${seconds} segundo${seconds === 1 ? "" : "s"} antes de intentarlo de nuevo.` : "Espera un momento antes de intentarlo de nuevo.",
    tooLarge: "La solicitud es demasiado grande. Acorta el mensaje o el contexto y vuelve a intentarlo.",
    unavailable: "HEGEVA AI no está disponible temporalmente. La solicitud no se reintentó automáticamente.",
    network: "La conexión se interrumpió. Comprueba tu conexión y vuelve a enviar el mismo mensaje.",
  },
}

function safeRetryAfterSeconds(response: Response) {
  const value = response.headers.get("Retry-After")?.trim() || ""
  if (!/^\d+$/.test(value)) return undefined
  const seconds = Number(value)
  return Number.isSafeInteger(seconds) ? Math.min(300, Math.max(1, seconds)) : undefined
}
const partnerCopy={
 en:{context:"Working context",continuity:"Continuity",continuityText:"HEGEVA keeps this conversation with your workspace.",customers:"Customers",tasks:"Open tasks",documents:"Documents",start:"Start with an outcome",empty:"Describe what you want to decide, create or improve. HEGEVA will use the workspace context shown here when it is relevant.",suggestions:["Summarise my current priorities","Draft a customer follow-up","Help me plan the next three actions"],you:"You",hegeva:"HEGEVA"},
 hu:{context:"Munkakörnyezet",continuity:"Folytonosság",continuityText:"A HEGEVA ezt a beszélgetést a munkaterületeddel együtt őrzi.",customers:"Ügyfelek",tasks:"Nyitott feladatok",documents:"Dokumentumok",start:"Kezdd az eredménnyel",empty:"Írd le, mit szeretnél eldönteni, létrehozni vagy javítani. A HEGEVA szükség esetén használja az itt látható munkakörnyezetet.",suggestions:["Foglald össze a prioritásaimat","Írj ügyfélkövető üzenetet","Tervezd meg a következő három lépést"],you:"Te",hegeva:"HEGEVA"},
 de:{context:"Arbeitskontext",continuity:"Kontinuität",continuityText:"HEGEVA bewahrt dieses Gespräch zusammen mit Ihrem Workspace auf.",customers:"Kunden",tasks:"Offene Aufgaben",documents:"Dokumente",start:"Mit dem Ergebnis beginnen",empty:"Beschreiben Sie, was Sie entscheiden, erstellen oder verbessern möchten. HEGEVA nutzt bei Bedarf den sichtbaren Workspace-Kontext.",suggestions:["Meine Prioritäten zusammenfassen","Kunden-Follow-up entwerfen","Die nächsten drei Schritte planen"],you:"Sie",hegeva:"HEGEVA"},
 fr:{context:"Contexte de travail",continuity:"Continuité",continuityText:"HEGEVA conserve cette conversation avec votre espace de travail.",customers:"Clients",tasks:"Tâches ouvertes",documents:"Documents",start:"Commencer par le résultat",empty:"Décrivez ce que vous souhaitez décider, créer ou améliorer. HEGEVA utilisera le contexte visible lorsqu’il est pertinent.",suggestions:["Résumer mes priorités","Rédiger un suivi client","Planifier les trois prochaines actions"],you:"Vous",hegeva:"HEGEVA"},
 es:{context:"Contexto de trabajo",continuity:"Continuidad",continuityText:"HEGEVA conserva esta conversación junto a tu espacio de trabajo.",customers:"Clientes",tasks:"Tareas abiertas",documents:"Documentos",start:"Empieza por el resultado",empty:"Describe qué quieres decidir, crear o mejorar. HEGEVA usará el contexto visible cuando sea relevante.",suggestions:["Resumir mis prioridades","Redactar seguimiento a un cliente","Planificar las próximas tres acciones"],you:"Tú",hegeva:"HEGEVA"},
} as const

function detectMessageLanguage(message: string, fallback: SupportedLanguage): SupportedLanguage {
  const text = message.toLocaleLowerCase()

  if (/[őűáéíóöü]/u.test(text) || /\b(mit|hogy|vagy|tudunk|csinálni|csinalni|mondj|kérek|kerem|üzleti|uzleti|magyarul|segíts|segits)\b/u.test(text)) return "hu"
  if (/[äöüß]/u.test(text) || /\b(und|oder|bitte|heute|geschäft|geschaft|ideen|hilf)\b/u.test(text)) return "de"
  if (/[àâçéèêëîïôûùüÿœ]/u.test(text) || /\b(et|avec|pour|bonjour|idées|idees|entreprise|aide)\b/u.test(text)) return "fr"
  if (/[áéíñóúü¿¡]/u.test(text) || /\b(y|para|hola|ideas|negocio|ayuda|puedes|quiero)\b/u.test(text)) return "es"
  if (/\b(the|and|please|business|help|how|what|today|ideas)\b/u.test(text)) return "en"

  return fallback
}

export function AssistantChat() {
  const { locale, t } = useI18n()
  const p=partnerCopy[locale]
  const { data: session, isPending } = authClient.useSession()
  const { items: messages, setItems: setMessages, syncState } = useWorkspaceData<ChatMessage>("assistant_history")
  const {items:customers}=useWorkspaceData<{id:string}>("customers")
  const {items:tasks}=useWorkspaceData<{id:string;done:boolean}>("planner")
  const {items:documents}=useWorkspaceData<{id:string}>("documents")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [usage, setUsage] = useState<PlanStatus | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pendingOperationRef = useRef<{ message: string; operationId: string } | null>(null)

  const recentHistory = useMemo(
    () => messages.slice(-10),
    [messages]
  )

  const loadUsage = useCallback(async () => {
    try {
      const response = await fetch("/api/plan/status", {
        credentials: "include",
      })
      const data = await response.json().catch(() => null)

      if (response.ok && data) {
        setUsage({
          plan: typeof data.plan === "string" ? data.plan : "basic",
          aiMessages: Number(data.aiMessages) || 0,
          aiLimit: Number(data.aiLimit) || 0,
          period: typeof data.period === "string" ? data.period : "",
        })
      }
    } catch {
      // Chat remains usable when optional plan status is temporarily unavailable.
    }
  }, [])

  useEffect(() => {
    if (session?.user) void loadUsage()
  }, [loadUsage, session?.user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [messages, sending])

  async function copyAnswer(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedIndex(index)
      window.setTimeout(() => setCopiedIndex(null), 1800)
    } catch {
      setError(t.assistant.copyError)
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanMessage = message.trim()
    if (!cleanMessage || sending) return

    setError("")
    setSending(true)
    setMessage("")
    setMessages((current) => [
      ...current,
      { role: "user", content: cleanMessage } as ChatMessage,
    ].slice(-100))

    const pending = pendingOperationRef.current
    const operationId = pending?.message === cleanMessage
      ? pending.operationId
      : globalThis.crypto?.randomUUID?.()
    if (!operationId) {
      setError(t.assistant.unavailable)
      setSending(false)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 30000)

    let responseStatus = 0
    let clearPendingOnError = false
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanMessage,
          history: recentHistory,
          language: detectMessageLanguage(cleanMessage, locale),
          mode: "general",
          assistantOperationId: operationId,
        }),
      })
      responseStatus = response.status

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const copy = failureCopy[locale]
        if (response.status === 401) {
          clearPendingOnError = true
          throw new Error(copy.session)
        }
        if (response.status === 409) {
          const expired = typeof data?.error === "string" && /expired/i.test(data.error)
          clearPendingOnError = expired
          throw new Error(expired ? copy.expired : copy.conflict)
        }
        if (response.status === 413) {
          clearPendingOnError = true
          throw new Error(copy.tooLarge)
        }
        if (response.status === 429) {
          throw new Error(copy.rate(safeRetryAfterSeconds(response)))
        }
        if (response.status === 503) {
          throw new Error(copy.unavailable)
        }
        throw new Error(copy.unavailable)
      }

      const answer =
        typeof data?.response === "string"
          ? data.response.trim()
          : ""

      if (!answer) {
        throw new Error(t.assistant.emptyResponse)
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: answer } as ChatMessage,
      ].slice(-100))
      pendingOperationRef.current = null
      await loadUsage()
    } catch (requestError) {
      const copy = failureCopy[locale]
      if (!responseStatus) {
        pendingOperationRef.current = { message: cleanMessage, operationId }
      } else if (clearPendingOnError) {
        pendingOperationRef.current = null
      } else {
        // Keep the same operation ID for ambiguous server/rate-limit outcomes.
        pendingOperationRef.current = { message: cleanMessage, operationId }
      }
      setError(
        controller.signal.aborted
          ? copy.network
          : requestError instanceof Error
            ? requestError.message
            : copy.network
      )
    } finally {
      window.clearTimeout(timeout)
      setSending(false)
    }
  }

  if (isPending) {
    return <SkeletonSurface lines={4} className="min-h-52" />
  }

  if (!session?.user) {
    return (
      <IntelligenceCard tone="violet" className="p-8">
        <h2 className="text-2xl font-semibold">{t.assistant.signInTitle}</h2>
        <p className="mt-3 text-muted-foreground">
          {t.assistant.signInBody}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground"
        >
          {t.assistant.goLogin}
        </Link>
      </IntelligenceCard>
    )
  }

  return (
    <div className="partner-workspace">
      <aside className="partner-context">
        <div><p className="ve-eyebrow">{p.context}</p><h2>{p.continuity}</h2><p>{p.continuityText}</p></div>
        <dl><div><dt><Users aria-hidden/>{p.customers}</dt><dd>{customers.length}</dd></div><div><dt><ListChecks aria-hidden/>{p.tasks}</dt><dd>{tasks.filter(item=>!item.done).length}</dd></div><div><dt><FileText aria-hidden/>{p.documents}</dt><dd>{documents.length}</dd></div></dl>
        <div className="partner-state"><span/><div><strong>{syncState==="cloud"?t.assistant.synced:syncState==="saving"?t.assistant.saving:t.assistant.loading}</strong><small>{usage?`${usage.plan} · ${usage.aiMessages}/${usage.aiLimit}`:"HEGEVA workspace"}</small></div></div>
      </aside>
      <section className="partner-conversation">
      <div className="partner-conversation-head">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="ve-eyebrow">Human layer · alpha</p><p className="text-sm text-muted-foreground">{t.assistant.signedIn} {session.user.email}</p></div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessages([])
                setError("")
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Trash2 className="size-3.5" aria-hidden />
              {t.assistant.clear}
            </button>
          )}
        </div>
      </div>

      <div className="partner-thread">
        {messages.length === 0 ? (
          <div className="partner-empty"><Sparkles aria-hidden/><p className="ve-eyebrow">{p.start}</p><h3>{p.empty}</h3><div>{p.suggestions.map(suggestion=><button key={suggestion} type="button" onClick={()=>setMessage(suggestion)}>{suggestion}<ArrowUp aria-hidden/></button>)}</div></div>
        ) : (
          messages.map((item, index) => (
            <article key={`${item.role}-${index}`} className={item.role === "user"?"partner-message is-user":"partner-message is-hegeva"}><header><span>{item.role==="user"?p.you:p.hegeva}</span><small>{String(index+1).padStart(2,"0")}</small></header><div>
              {item.role === "user" ? (
                <p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p>
              ) : (
                <>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    skipHtml
                    components={{
                      p: (props) => <p className="mb-3 text-sm leading-6 last:mb-0" {...props} />,
                      strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
                      ul: (props) => <ul className="mb-3 list-disc space-y-1 pl-5 text-sm last:mb-0" {...props} />,
                      ol: (props) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm last:mb-0" {...props} />,
                      li: (props) => <li className="leading-6" {...props} />,
                      code: (props) => <code className="rounded bg-background/70 px-1.5 py-0.5 text-[0.85em]" {...props} />,
                      a: (props) => <a className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />,
                      blockquote: (props) => <blockquote className="my-3 border-l-2 border-primary/50 pl-3 text-muted-foreground" {...props} />,
                    }}
                  >
                    {item.content}
                  </ReactMarkdown>
                  <button
                    type="button"
                    onClick={() => void copyAnswer(item.content, index)}
                    aria-label={t.assistant.copy}
                    title={t.assistant.copy}
                    className="absolute right-2 top-2 rounded-lg p-2 text-muted-foreground opacity-70 transition hover:bg-background hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                  >
                    {copiedIndex === index ? <Check className="size-4 text-primary" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                  </button>
                </>
              )}
            </div></article>
          ))
        )}

        {sending && (
          <div className="partner-thinking" role="status" aria-live="polite">
            <AICore state="thinking" className="scale-75" />
            <span>{t.assistant.thinking}</span>
          </div>
        )}

        {error && (
          <div role="alert" aria-live="assertive" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={submit} className="partner-composer">
        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            maxLength={2500}
            rows={3}
            placeholder={t.assistant.placeholder}
            className="min-h-24 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 self-end rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {sending ? t.assistant.sending : t.assistant.send}<ArrowUp className="size-4" aria-hidden/>
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t.assistant.hint}
        </p>
      </form></section>
    </div>
  )
}
