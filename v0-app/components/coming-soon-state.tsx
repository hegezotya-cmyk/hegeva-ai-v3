"use client"

import { useI18n } from "@/lib/i18n/provider"

type FeatureKey = "assistant" | "x10" | "fix" | "prompt" | "aiBots" | "creative" | "advertising" | "x30" | "video"

const COPY = {
  en: {
    assistant: { title: "AI Assistant", body: "The AI assistant is being prepared for a secure public release. Your signed-in HEGEVA workspace — customers, invoices, expenses, planner, reports and client portal — keeps working today." },
    x10: { title: "Build My App X10", body: "Build My App X10 is being prepared for a secure public release. Your signed-in HEGEVA workspace keeps working today." },
    fix: { title: "Fix My App", body: "Fix My App is being prepared for a secure public release. Your signed-in HEGEVA workspace keeps working today." },
    prompt: { title: "Prompt My App", body: "Prompt My App is being prepared for a secure public release. Your signed-in HEGEVA workspace keeps working today." },
    aiBots: { title: "AI Bots", body: "AI Bots are being prepared for a secure public release. Your signed-in HEGEVA workspace keeps working today." },
    creative: { title: "Creative Studio", body: "Creative Studio is being prepared for a secure public release. Your signed-in HEGEVA workspace keeps working today." },
    advertising: { title: "Advertising Studio", body: "Advertising AI generation is being prepared for a secure public release. You can still save advertising drafts manually." },
    x30: { title: "X30 Studio", body: "X30 Studio is being prepared for a secure public release. Your signed-in HEGEVA workspace keeps working today." },
    video: { title: "Video Ad Studio", body: "Video Ad Studio is being prepared for a secure public release. Your signed-in HEGEVA workspace keeps working today." },
    eyebrow: "HEGEVA · Coming soon",
  },
  hu: {
    assistant: { title: "AI Asszisztens", body: "Az AI asszisztens biztonságos nyilvános kiadásra készül. A bejelentkezett HEGEVA munkaterületed — ügyfelek, számlák, kiadások, tervező, jelentések és ügyfélkapu — ma is működik." },
    x10: { title: "Build My App X10", body: "A Build My App X10 biztonságos nyilvános kiadásra készül. A bejelentkezett HEGEVA munkaterületed ma is működik." },
    fix: { title: "Fix My App", body: "A Fix My App biztonságos nyilvános kiadásra készül. A bejelentkezett HEGEVA munkaterületed ma is működik." },
    prompt: { title: "Prompt My App", body: "A Prompt My App biztonságos nyilvános kiadásra készül. A bejelentkezett HEGEVA munkaterületed ma is működik." },
    aiBots: { title: "AI Botok", body: "Az AI Botok biztonságos nyilvános kiadásra készülnek. A bejelentkezett HEGEVA munkaterületed ma is működik." },
    creative: { title: "Kreatív Stúdió", body: "A Kreatív Stúdió biztonságos nyilvános kiadásra készül. A bejelentkezett HEGEVA munkaterületed ma is működik." },
    advertising: { title: "Hirdetési Stúdió", body: "A hirdetési AI-generálás biztonságos nyilvános kiadásra készül. A reklámvázlatokat kézzel továbbra is elmentheted." },
    x30: { title: "X30 Stúdió", body: "Az X30 Stúdió biztonságos nyilvános kiadásra készül. A bejelentkezett HEGEVA munkaterületed ma is működik." },
    video: { title: "Videóreklám Stúdió", body: "A Videóreklám Stúdió biztonságos nyilvános kiadásra készül. A bejelentkezett HEGEVA munkaterületed ma is működik." },
    eyebrow: "HEGEVA · Hamarosan",
  },
  de: {
    assistant: { title: "KI-Assistent", body: "Der KI-Assistent wird auf eine sichere öffentliche Veröffentlichung vorbereitet. Dein angemeldeter HEGEVA-Arbeitsbereich — Kunden, Rechnungen, Ausgaben, Planer, Berichte und Kundenportal — funktioniert heute weiter." },
    x10: { title: "Build My App X10", body: "Build My App X10 wird auf eine sichere öffentliche Veröffentlichung vorbereitet. Dein angemeldeter HEGEVA-Arbeitsbereich funktioniert heute weiter." },
    fix: { title: "Fix My App", body: "Fix My App wird auf eine sichere öffentliche Veröffentlichung vorbereitet. Dein angemeldeter HEGEVA-Arbeitsbereich funktioniert heute weiter." },
    prompt: { title: "Prompt My App", body: "Prompt My App wird auf eine sichere öffentliche Veröffentlichung vorbereitet. Dein angemeldeter HEGEVA-Arbeitsbereich funktioniert heute weiter." },
    aiBots: { title: "KI-Bots", body: "KI-Bots werden auf eine sichere öffentliche Veröffentlichung vorbereitet. Dein angemeldeter HEGEVA-Arbeitsbereich funktioniert heute weiter." },
    creative: { title: "Creative Studio", body: "Creative Studio wird auf eine sichere öffentliche Veröffentlichung vorbereitet. Dein angemeldeter HEGEVA-Arbeitsbereich funktioniert heute weiter." },
    advertising: { title: "Werbestudio", body: "Die KI-Erstellung von Werbung wird auf eine sichere öffentliche Veröffentlichung vorbereitet. Werbeentwürfe kannst du weiterhin manuell speichern." },
    x30: { title: "X30 Studio", body: "X30 Studio wird auf eine sichere öffentliche Veröffentlichung vorbereitet. Dein angemeldeter HEGEVA-Arbeitsbereich funktioniert heute weiter." },
    video: { title: "Video-Werbestudio", body: "Video-Werbestudio wird auf eine sichere öffentliche Veröffentlichung vorbereitet. Dein angemeldeter HEGEVA-Arbeitsbereich funktioniert heute weiter." },
    eyebrow: "HEGEVA · Demnächst",
  },
  fr: {
    assistant: { title: "Assistant IA", body: "L'assistant IA est en cours de préparation pour une publication publique sécurisée. Votre espace de travail HEGEVA connecté — clients, factures, dépenses, planificateur, rapports et portail client — continue de fonctionner aujourd'hui." },
    x10: { title: "Build My App X10", body: "Build My App X10 est en cours de préparation pour une publication publique sécurisée. Votre espace de travail HEGEVA connecté continue de fonctionner aujourd'hui." },
    fix: { title: "Fix My App", body: "Fix My App est en cours de préparation pour une publication publique sécurisée. Votre espace de travail HEGEVA connecté continue de fonctionner aujourd'hui." },
    prompt: { title: "Prompt My App", body: "Prompt My App est en cours de préparation pour une publication publique sécurisée. Votre espace de travail HEGEVA connecté continue de fonctionner aujourd'hui." },
    aiBots: { title: "Bots IA", body: "Les Bots IA sont en cours de préparation pour une publication publique sécurisée. Votre espace de travail HEGEVA connecté continue de fonctionner aujourd'hui." },
    creative: { title: "Creative Studio", body: "Creative Studio est en cours de préparation pour une publication publique sécurisée. Votre espace de travail HEGEVA connecté continue de fonctionner aujourd'hui." },
    advertising: { title: "Studio publicitaire", body: "La génération IA publicitaire est en cours de préparation pour une publication publique sécurisée. Vous pouvez toujours enregistrer des brouillons publicitaires manuellement." },
    x30: { title: "X30 Studio", body: "X30 Studio est en cours de préparation pour une publication publique sécurisée. Votre espace de travail HEGEVA connecté continue de fonctionner aujourd'hui." },
    video: { title: "Studio vidéo publicitaire", body: "Studio vidéo publicitaire est en cours de préparation pour une publication publique sécurisée. Votre espace de travail HEGEVA connecté continue de fonctionner aujourd'hui." },
    eyebrow: "HEGEVA · Bientôt disponible",
  },
  es: {
    assistant: { title: "Asistente IA", body: "El asistente IA se está preparando para un lanzamiento público seguro. Tu espacio de trabajo de HEGEVA registrado — clientes, facturas, gastos, planificador, reportes y portal de clientes — sigue funcionando hoy." },
    x10: { title: "Build My App X10", body: "Build My App X10 se está preparando para un lanzamiento público seguro. Tu espacio de trabajo de HEGEVA registrado sigue funcionando hoy." },
    fix: { title: "Fix My App", body: "Fix My App se está preparando para un lanzamiento público seguro. Tu espacio de trabajo de HEGEVA registrado sigue funcionando hoy." },
    prompt: { title: "Prompt My App", body: "Prompt My App se está preparando para un lanzamiento público seguro. Tu espacio de trabajo de HEGEVA registrado sigue funcionando hoy." },
    aiBots: { title: "Bots IA", body: "Los Bots IA se están preparando para un lanzamiento público seguro. Tu espacio de trabajo de HEGEVA registrado sigue funcionando hoy." },
    creative: { title: "Creative Studio", body: "Creative Studio se está preparando para un lanzamiento público seguro. Tu espacio de trabajo de HEGEVA registrado sigue funcionando hoy." },
    advertising: { title: "Estudio publicitario", body: "La generación IA publicitaria se está preparando para un lanzamiento público seguro. Puedes seguir guardando borradores publicitarios manualmente." },
    x30: { title: "X30 Studio", body: "X30 Studio se está preparando para un lanzamiento público seguro. Tu espacio de trabajo de HEGEVA registrado sigue funcionando hoy." },
    video: { title: "Estudio de video publicitario", body: "El estudio de video publicitario se está preparando para un lanzamiento público seguro. Tu espacio de trabajo de HEGEVA registrado sigue funcionando hoy." },
    eyebrow: "HEGEVA · Próximamente",
  },
} as const

export function ComingSoonCard({ feature, className = "" }: { feature: FeatureKey; className?: string }) {
  const { locale } = useI18n()
  const c = COPY[locale][feature]
  return (
    <div className={`rounded-2xl border border-border bg-background/80 p-8 text-center ${className}`}>
      <p className="text-[.6rem] font-semibold uppercase tracking-[.16em] text-muted-foreground">{COPY[locale].eyebrow}</p>
      <h2 className="mt-3 text-xl font-semibold text-foreground">{c.title}</h2>
      <p className="mt-3 mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">{c.body}</p>
    </div>
  )
}

export function ComingSoonBanner({ feature, className = "" }: { feature: FeatureKey; className?: string }) {
  const { locale } = useI18n()
  const c = COPY[locale][feature]
  return (
    <div className={`rounded-xl border border-border bg-background/60 p-4 ${className}`}>
      <p className="text-[.6rem] font-semibold uppercase tracking-[.16em] text-muted-foreground">{COPY[locale].eyebrow}</p>
      <p className="mt-1.5 text-sm font-semibold text-foreground">{c.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.body}</p>
    </div>
  )
}
