export const LOCALES = ["en", "hu", "de", "fr", "es"] as const
export type Locale = (typeof LOCALES)[number]

export const LOCALE_LABELS: Record<Locale, { label: string; native: string }> = {
  en: { label: "English", native: "EN" },
  hu: { label: "Magyar", native: "HU" },
  de: { label: "Deutsch", native: "DE" },
  fr: { label: "Français", native: "FR" },
  es: { label: "Español", native: "ES" },
}

// Nested dictionary. Keep keys stable across locales so the UI never mixes languages.
const dictionaries = {
  en: {
    nav: {
      home: "Home",
      commandCenter: "Command Center",
      appStudio: "App Studio",
      business: "Business",
      pricing: "Pricing",
      login: "Login",
      getStarted: "Get Started",
    },
    studio: {
      prompt: "Prompt My App",
      build: "Build My App X10",
      fix: "Fix My App X10",
      promptDesc: "Turn your idea into a professional app specification.",
      buildDesc: "Guided AI build: idea to production, step by step.",
      fixDesc: "Diagnose and improve an existing application.",
    },
    status: { working: "Working", beta: "Beta", coming: "Coming Soon", planned: "Planned" },
    hero: {
      badge: "AI Business Operating System",
      titleLine1: "Save time.",
      titleLine2: "Grow smarter.",
      titleLine3: "Live better.",
      subtitle:
        "One connected premium platform to build, manage, automate and grow your business — powered by HEGEVA AI.",
      ctaPrimary: "Open Command Center",
      ctaSecondary: "Ask HEGEVA AI",
      pillBuild: "Build",
      pillManage: "Manage",
      pillAutomate: "Automate",
      pillGrow: "Grow",
    },
    capabilities: {
      heading: "What you can do with HEGEVA AI",
      subheading: "A single operating system for your entire business.",
      assistant: { title: "AI Assistant", desc: "Your intelligent business partner, available around the clock." },
      reports: { title: "Financial Reports", desc: "Clear reports and insights from your real business data." },
      invoices: { title: "Invoice Generator", desc: "Professional invoices, quotes and receipts in seconds." },
      documents: { title: "Business Documents", desc: "Contracts, proposals and agreements in one vault." },
      crm: { title: "CRM & Clients", desc: "Manage customers, leads and follow-ups in one place." },
      studio: { title: "App Studio", desc: "Prompt, build and fix applications with guided AI." },
    },
    dashboard: {
      heading: "Command dashboard",
      subheading: "Your real business at a glance. Nothing here is invented.",
      priorities: "Today's priorities",
      customers: "Customers",
      followups: "Follow-ups",
      documents: "Documents",
      expenses: "Expenses",
      projects: "Projects",
      activity: "Recent activity",
      aiUsage: "AI usage",
      studioProjects: "App Studio projects",
      emptyTitle: "No data yet",
      emptyBody: "Connect your workspace to see real information here.",
      connect: "Connect workspace",
    },
    commandCenter: {
      title: "Command Center",
      subtitle: "The operational core of your HEGEVA workspace.",
      previewNote:
        "This is a preview. Modules connect to your Cloudflare workspace once your account is linked — no data is simulated.",
    },
    appStudio: {
      title: "HEGEVA App Studio",
      subtitle: "From idea to shipped application, guided end to end by HEGEVA AI.",
    },
    footer: {
      encryption: "256-bit encryption",
      cloud: "Cloud sync",
      languages: "5 Languages",
      support: "AI + Human support",
      noFees: "No hidden fees",
      tagline: "Business · AI · Freedom",
    },
    common: { comingSoonBody: "This module is on the HEGEVA roadmap. We will never fake results before it is ready." },
  },
} as const

type Dict = (typeof dictionaries)["en"]

// Localized overrides. Anything not overridden falls back to English so the UI is never blank.
const overrides: Partial<Record<Locale, DeepPartial<Dict>>> = {
  hu: {
    nav: {
      home: "Kezdőlap",
      commandCenter: "Vezérlőközpont",
      appStudio: "App Stúdió",
      business: "Üzlet",
      pricing: "Árak",
      login: "Belépés",
      getStarted: "Kezdjük el",
    },
    hero: {
      badge: "AI Üzleti Operációs Rendszer",
      titleLine1: "Spórolj időt.",
      titleLine2: "Növekedj okosabban.",
      titleLine3: "Élj jobban.",
      subtitle:
        "Egyetlen összekapcsolt prémium platform vállalkozásod építéséhez, kezeléséhez, automatizálásához és növekedéséhez — a HEGEVA AI erejével.",
      ctaPrimary: "Vezérlőközpont",
      ctaSecondary: "Kérdezd a HEGEVA AI-t",
    },
    capabilities: { heading: "Mit tehetsz a HEGEVA AI-val" },
    dashboard: { heading: "Vezérlő irányítópult", emptyTitle: "Még nincs adat" },
    commandCenter: { title: "Vezérlőközpont" },
    footer: { languages: "5 nyelv" },
  },
  de: {
    nav: {
      home: "Startseite",
      commandCenter: "Kommandozentrale",
      appStudio: "App Studio",
      business: "Business",
      pricing: "Preise",
      login: "Anmelden",
      getStarted: "Loslegen",
    },
    hero: {
      badge: "KI-Betriebssystem für Unternehmen",
      titleLine1: "Zeit sparen.",
      titleLine2: "Klüger wachsen.",
      titleLine3: "Besser leben.",
      subtitle:
        "Eine vernetzte Premium-Plattform, um Ihr Unternehmen aufzubauen, zu verwalten, zu automatisieren und wachsen zu lassen — mit HEGEVA AI.",
      ctaPrimary: "Kommandozentrale öffnen",
      ctaSecondary: "HEGEVA AI fragen",
    },
    capabilities: { heading: "Was Sie mit HEGEVA AI tun können" },
    dashboard: { heading: "Kommando-Dashboard", emptyTitle: "Noch keine Daten" },
    commandCenter: { title: "Kommandozentrale" },
    footer: { languages: "5 Sprachen" },
  },
  fr: {
    nav: {
      home: "Accueil",
      commandCenter: "Centre de commande",
      appStudio: "App Studio",
      business: "Business",
      pricing: "Tarifs",
      login: "Connexion",
      getStarted: "Commencer",
    },
    hero: {
      badge: "Système d'exploitation d'entreprise IA",
      titleLine1: "Gagnez du temps.",
      titleLine2: "Grandissez plus intelligemment.",
      titleLine3: "Vivez mieux.",
      subtitle:
        "Une plateforme premium connectée pour créer, gérer, automatiser et développer votre entreprise — propulsée par HEGEVA AI.",
      ctaPrimary: "Ouvrir le centre de commande",
      ctaSecondary: "Demander à HEGEVA AI",
    },
    capabilities: { heading: "Ce que vous pouvez faire avec HEGEVA AI" },
    dashboard: { heading: "Tableau de commande", emptyTitle: "Pas encore de données" },
    commandCenter: { title: "Centre de commande" },
    footer: { languages: "5 langues" },
  },
  es: {
    nav: {
      home: "Inicio",
      commandCenter: "Centro de mando",
      appStudio: "App Studio",
      business: "Negocio",
      pricing: "Precios",
      login: "Entrar",
      getStarted: "Empezar",
    },
    hero: {
      badge: "Sistema operativo de negocio con IA",
      titleLine1: "Ahorra tiempo.",
      titleLine2: "Crece con inteligencia.",
      titleLine3: "Vive mejor.",
      subtitle:
        "Una plataforma premium conectada para construir, gestionar, automatizar y hacer crecer tu negocio — impulsada por HEGEVA AI.",
      ctaPrimary: "Abrir centro de mando",
      ctaSecondary: "Pregunta a HEGEVA AI",
    },
    capabilities: { heading: "Lo que puedes hacer con HEGEVA AI" },
    dashboard: { heading: "Panel de mando", emptyTitle: "Sin datos todavía" },
    commandCenter: { title: "Centro de mando" },
    footer: { languages: "5 idiomas" },
  },
}

type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] }

function deepMerge<T>(base: T, patch?: DeepPartial<T>): T {
  if (!patch) return base
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base }
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const pv = (patch as any)[key]
    const bv = (base as any)[key]
    out[key] = pv && typeof pv === "object" && !Array.isArray(pv) ? deepMerge(bv, pv) : pv
  }
  return out
}

export function getDictionary(locale: Locale): Dict {
  return deepMerge(dictionaries.en, overrides[locale])
}

export type Dictionary = Dict
