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
      contact: "Contact",
      login: "Login",
      getStarted: "Get Started",
      account: "Account",
      logout: "Logout",
      openWorkspace: "Open workspace",
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
      openAssistant: "Open Assistant",
      connected: "Cloud workspace connected. Working modules sync real account data through the authenticated HEGEVA backend.",
      checking: "Checking workspace connection…",
      expensesDesc: "Track spending and keep your books clean.",
      planner: "Planner / Time Saver",
      plannerDesc: "Plan priorities, due dates and completed work.",
      messageStudio: "Message Studio",
      messageDesc: "Create and cloud-save professional message drafts.",
      vault: "Vault & Templates",
      vaultDesc: "Secure documents and ready-to-use templates.",
      tools: "Business Tools",
      toolsDesc: "Calculators and utilities for everyday operations.",
      previewNote:
        "This is a preview. Modules connect to your Cloudflare workspace once your account is linked — no data is simulated.",
    },
    appStudio: {
      title: "HEGEVA App Studio",
      subtitle: "From idea to shipped application, guided end to end by HEGEVA AI.",
    },
    business: {
      eyebrow: "HEGEVA Business Workspace", title: "Run the everyday work in one place",
      subtitle: "Signed-in accounts sync working module data to the HEGEVA cloud workspace. A browser-local copy remains available as a fallback, while guests stay local only.",
      open: "Open module", customers: "Customers & CRM", customersDesc: "Save and search real customer records with authenticated cloud sync.",
      documents: "Documents", documentsDesc: "Create lightweight document records and keep them synced to your workspace.", expenses: "Expenses", expensesDesc: "Track real expense entries and sync saved data across sessions.",
      planner: "Planner / Time Saver", plannerDesc: "Sync real priorities, due dates and completed tasks to your workspace.", reports: "Reports", reportsDesc: "Summarize customers, documents, expenses and tasks from real workspace data.",
      messages: "Message Studio", messagesDesc: "Save message drafts to your workspace without claiming they were sent."
    },
    assistant: {
      title: "Assistant", subtitle: "Practical AI help connected to the live HEGEVA backend. Answers are generated only after you send a real request.", checkingAccount: "Checking your HEGEVA account…", signInTitle: "Sign in to use HEGEVA Assistant", signInBody: "The live assistant uses your authenticated account and real monthly AI usage limit.", goLogin: "Go to login", signedIn: "Signed in as", plan: "plan", messagesMonth: "AI messages this month", saving: "Saving conversation…", synced: "Conversation cloud synced", syncError: "Cloud sync temporarily unavailable", loading: "Loading conversation…", clear: "Clear chat", empty: "Ask HEGEVA for practical business help. No demo conversation is inserted here.", thinking: "HEGEVA is thinking…", placeholder: "Ask HEGEVA AI…", sending: "Sending…", send: "Send", hint: "Enter to send · Shift+Enter for a new line · Maximum 2,500 characters. Usage is counted by the live HEGEVA backend.", copy: "Copy answer", copyError: "The answer could not be copied.", unavailable: "HEGEVA AI is temporarily unavailable.", emptyResponse: "HEGEVA AI returned an empty response."
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

type WidenStrings<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends object
      ? WidenStrings<T[K]>
      : T[K]
}

type Dict = WidenStrings<(typeof dictionaries)["en"]>

// Localized overrides. Anything not overridden falls back to English so the UI is never blank.
const overrides: Partial<Record<Locale, DeepPartial<Dict>>> = {
  hu: {
    nav: {
      home: "Kezdőlap",
      commandCenter: "Vezérlőközpont",
      appStudio: "App Stúdió",
      business: "Üzlet",
      pricing: "Árak",
      contact: "Kapcsolat",
      login: "Belépés",
      getStarted: "Kezdjük el",
      account: "Fiók",
      logout: "Kijelentkezés",
      openWorkspace: "Munkaterület megnyitása",
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
      pillBuild: "Építés",
      pillManage: "Kezelés",
      pillAutomate: "Automatizálás",
      pillGrow: "Növekedés",
    },
    capabilities: { heading: "Mit tehetsz a HEGEVA AI-val", subheading: "Egyetlen operációs rendszer az egész vállalkozásodhoz.", assistant: { title: "AI Asszisztens", desc: "Intelligens üzleti partnered, amikor szükséged van rá." }, reports: { title: "Pénzügyi jelentések", desc: "Átlátható jelentések és betekintések a valódi üzleti adataidból." }, invoices: { title: "Számlakészítő", desc: "Professzionális számlák, árajánlatok és nyugták." }, documents: { title: "Üzleti dokumentumok", desc: "Szerződések, ajánlatok és megállapodások egy helyen." }, crm: { title: "CRM és ügyfelek", desc: "Ügyfelek, érdeklődők és utánkövetések kezelése egy helyen." }, studio: { title: "App Stúdió", desc: "Alkalmazások tervezése, építése és javítása irányított AI-val." } },
    dashboard: { heading: "Vezérlő irányítópult", subheading: "Valódi üzleti adatok egy pillantásra. Semmi sem kitalált.", priorities: "Mai prioritások", customers: "Ügyfelek", followups: "Utánkövetések", documents: "Dokumentumok", expenses: "Kiadások", projects: "Projektek", activity: "Legutóbbi aktivitás", aiUsage: "AI-használat", studioProjects: "App Stúdió projektek", emptyTitle: "Még nincs adat", emptyBody: "Kapcsold össze a munkaterületet a valódi adatok megtekintéséhez.", connect: "Munkaterület csatlakoztatása" },
    status: { working: "Működik", beta: "Béta", coming: "Hamarosan", planned: "Tervezett" },
    commandCenter: {
      title: "Vezérlőközpont", subtitle: "A HEGEVA munkaterületed működési központja.", openAssistant: "Asszisztens megnyitása",
      connected: "A felhőalapú munkaterület csatlakoztatva. A működő modulok a hitelesített HEGEVA backend segítségével szinkronizálják a valódi fiókadatokat.", checking: "Munkaterület-kapcsolat ellenőrzése…",
      expensesDesc: "Kövesd a kiadásokat és tartsd rendben a pénzügyeidet.", planner: "Tervező / Időmegtakarító", plannerDesc: "Tervezz prioritásokat, határidőket és elvégzett feladatokat.",
      messageStudio: "Üzenetstúdió", messageDesc: "Készíts és ments felhőbe professzionális üzenetvázlatokat.", vault: "Széf és sablonok", vaultDesc: "Biztonságos dokumentumok és használatra kész sablonok.", tools: "Üzleti eszközök", toolsDesc: "Kalkulátorok és segédeszközök a napi működéshez."
    },
    footer: { encryption: "256 bites titkosítás", cloud: "Felhőszinkron", languages: "5 nyelv", support: "AI + emberi támogatás", noFees: "Nincsenek rejtett díjak", tagline: "Üzlet · AI · Szabadság" },
    business: { eyebrow: "HEGEVA üzleti munkaterület", title: "A mindennapi munka egy helyen", subtitle: "A bejelentkezett fiókok a működő modulok adatait a HEGEVA felhőalapú munkaterületével szinkronizálják. A böngészőben helyi biztonsági másolat marad, a vendégek adatai pedig csak helyben tárolódnak.", open: "Modul megnyitása", customers: "Ügyfelek és CRM", customersDesc: "Valódi ügyféladatok mentése és keresése hitelesített felhőszinkronnal.", documents: "Dokumentumok", documentsDesc: "Egyszerű dokumentumadatok létrehozása és szinkronizálása a munkaterülettel.", expenses: "Kiadások", expensesDesc: "Valódi kiadások követése és szinkronizálása a munkamenetek között.", planner: "Tervező / Időmegtakarító", plannerDesc: "Prioritások, határidők és elvégzett feladatok szinkronizálása.", reports: "Jelentések", reportsDesc: "Valódi munkaterületi adatok összesítése az ügyfelekről, dokumentumokról, kiadásokról és feladatokról.", messages: "Üzenetstúdió", messagesDesc: "Üzenetvázlatok mentése anélkül, hogy elküldöttként jelennének meg." },
    assistant: { title: "Asszisztens", subtitle: "Gyakorlati AI-segítség az élő HEGEVA backendhez kapcsolva. Válasz csak valódi kérés elküldése után készül.", checkingAccount: "HEGEVA-fiók ellenőrzése…", signInTitle: "Jelentkezz be a HEGEVA Asszisztens használatához", signInBody: "Az élő asszisztens a hitelesített fiókodat és a valódi havi AI-limitedet használja.", goLogin: "Belépés", signedIn: "Bejelentkezve mint", plan: "csomag", messagesMonth: "AI-üzenet ebben a hónapban", saving: "Beszélgetés mentése…", synced: "Beszélgetés felhőbe szinkronizálva", syncError: "A felhőszinkron átmenetileg nem érhető el", loading: "Beszélgetés betöltése…", clear: "Beszélgetés törlése", empty: "Kérj gyakorlati üzleti segítséget a HEGEVA-tól. Nincs beillesztett demóbeszélgetés.", thinking: "A HEGEVA gondolkodik…", placeholder: "Kérdezd a HEGEVA AI-t…", sending: "Küldés…", send: "Küldés", hint: "Enter: küldés · Shift+Enter: új sor · Legfeljebb 2500 karakter. A használatot az élő HEGEVA backend számolja.", copy: "Válasz másolása", copyError: "A válasz másolása nem sikerült.", unavailable: "A HEGEVA AI átmenetileg nem érhető el.", emptyResponse: "A HEGEVA AI üres választ adott." },
  },
  de: {
    nav: {
      home: "Startseite",
      commandCenter: "Kommandozentrale",
      appStudio: "App Studio",
      business: "Business",
      pricing: "Preise",
      contact: "Kontakt",
      login: "Anmelden",
      getStarted: "Loslegen",
      account: "Konto", logout: "Abmelden", openWorkspace: "Arbeitsbereich öffnen",
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
      pillBuild: "Bauen",
      pillManage: "Verwalten",
      pillAutomate: "Automatisieren",
      pillGrow: "Wachsen",
    },
    capabilities: { heading: "Was Sie mit HEGEVA AI tun können", subheading: "Ein Betriebssystem für Ihr gesamtes Unternehmen.", assistant: { title: "KI-Assistent", desc: "Ihr intelligenter Geschäftspartner, wenn Sie ihn brauchen." }, reports: { title: "Finanzberichte", desc: "Klare Berichte aus echten Geschäftsdaten." }, invoices: { title: "Rechnungsgenerator", desc: "Professionelle Rechnungen, Angebote und Belege." }, documents: { title: "Geschäftsdokumente", desc: "Verträge, Angebote und Vereinbarungen an einem Ort." }, crm: { title: "CRM & Kunden", desc: "Kunden, Leads und Nachfassaktionen zentral verwalten." }, studio: { title: "App Studio", desc: "Apps mit geführter KI planen, bauen und verbessern." } },
    dashboard: { heading: "Kommando-Dashboard", subheading: "Ihr echtes Unternehmen auf einen Blick. Nichts ist erfunden.", priorities: "Heutige Prioritäten", customers: "Kunden", followups: "Nachfassaktionen", documents: "Dokumente", expenses: "Ausgaben", projects: "Projekte", activity: "Letzte Aktivität", aiUsage: "KI-Nutzung", studioProjects: "App-Studio-Projekte", emptyTitle: "Noch keine Daten", emptyBody: "Verbinden Sie den Arbeitsbereich, um echte Daten zu sehen.", connect: "Arbeitsbereich verbinden" },
    status: { working: "Aktiv", beta: "Beta", coming: "Demnächst", planned: "Geplant" },
    commandCenter: { title: "Kommandozentrale", subtitle: "Der operative Kern Ihres HEGEVA-Arbeitsbereichs.", openAssistant: "Assistent öffnen", connected: "Cloud-Arbeitsbereich verbunden. Aktive Module synchronisieren echte Kontodaten über das authentifizierte HEGEVA-Backend.", checking: "Verbindung wird geprüft…", expensesDesc: "Ausgaben verfolgen und Finanzen übersichtlich halten.", planner: "Planer / Zeitsparer", plannerDesc: "Prioritäten, Fristen und erledigte Aufgaben planen.", messageStudio: "Nachrichtenstudio", messageDesc: "Professionelle Nachrichtenentwürfe erstellen und in der Cloud speichern.", vault: "Tresor & Vorlagen", vaultDesc: "Sichere Dokumente und einsatzbereite Vorlagen.", tools: "Business-Tools", toolsDesc: "Rechner und Werkzeuge für den Geschäftsalltag." },
    footer: { encryption: "256-Bit-Verschlüsselung", cloud: "Cloud-Synchronisierung", languages: "5 Sprachen", support: "KI + menschlicher Support", noFees: "Keine versteckten Gebühren", tagline: "Business · KI · Freiheit" },
    business: { eyebrow: "HEGEVA Business-Arbeitsbereich", title: "Die tägliche Arbeit an einem Ort", subtitle: "Angemeldete Konten synchronisieren aktive Moduldaten mit dem HEGEVA-Cloud-Arbeitsbereich. Eine lokale Browserkopie bleibt als Sicherung erhalten; Gäste bleiben ausschließlich lokal.", open: "Modul öffnen", customers: "Kunden & CRM", customersDesc: "Echte Kundendaten mit authentifizierter Cloud-Synchronisierung speichern und durchsuchen.", documents: "Dokumente", documentsDesc: "Dokumenteinträge erstellen und mit dem Arbeitsbereich synchronisieren.", expenses: "Ausgaben", expensesDesc: "Echte Ausgaben erfassen und sitzungsübergreifend synchronisieren.", planner: "Planer / Zeitsparer", plannerDesc: "Prioritäten, Fristen und erledigte Aufgaben synchronisieren.", reports: "Berichte", reportsDesc: "Kunden, Dokumente, Ausgaben und Aufgaben aus echten Daten zusammenfassen.", messages: "Nachrichtenstudio", messagesDesc: "Nachrichtenentwürfe speichern, ohne sie als gesendet darzustellen." },
    assistant: { title: "Assistent", subtitle: "Praktische KI-Hilfe über das Live-HEGEVA-Backend. Antworten entstehen erst nach einer echten Anfrage.", checkingAccount: "HEGEVA-Konto wird geprüft…", signInTitle: "Für den HEGEVA-Assistenten anmelden", signInBody: "Der Live-Assistent nutzt Ihr authentifiziertes Konto und das echte monatliche KI-Limit.", goLogin: "Zur Anmeldung", signedIn: "Angemeldet als", plan: "Tarif", messagesMonth: "KI-Nachrichten in diesem Monat", saving: "Gespräch wird gespeichert…", synced: "Gespräch in der Cloud synchronisiert", syncError: "Cloud-Synchronisierung vorübergehend nicht verfügbar", loading: "Gespräch wird geladen…", clear: "Chat löschen", empty: "Bitten Sie HEGEVA um praktische Geschäftshilfe. Es gibt keine Demo-Unterhaltung.", thinking: "HEGEVA denkt nach…", placeholder: "HEGEVA AI fragen…", sending: "Wird gesendet…", send: "Senden", hint: "Enter: senden · Shift+Enter: neue Zeile · Maximal 2.500 Zeichen. Nutzung wird live gezählt.", copy: "Antwort kopieren", copyError: "Die Antwort konnte nicht kopiert werden.", unavailable: "HEGEVA AI ist vorübergehend nicht verfügbar.", emptyResponse: "HEGEVA AI hat leer geantwortet." },
  },
  fr: {
    nav: {
      home: "Accueil",
      commandCenter: "Centre de commande",
      appStudio: "App Studio",
      business: "Business",
      pricing: "Tarifs",
      contact: "Contact",
      login: "Connexion",
      getStarted: "Commencer",
      account: "Compte", logout: "Déconnexion", openWorkspace: "Ouvrir l’espace",
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
      pillBuild: "Créer",
      pillManage: "Gérer",
      pillAutomate: "Automatiser",
      pillGrow: "Développer",
    },
    capabilities: { heading: "Ce que vous pouvez faire avec HEGEVA AI", subheading: "Un seul système pour toute votre entreprise.", assistant: { title: "Assistant IA", desc: "Votre partenaire professionnel intelligent quand vous en avez besoin." }, reports: { title: "Rapports financiers", desc: "Des rapports clairs à partir de vos données réelles." }, invoices: { title: "Générateur de factures", desc: "Factures, devis et reçus professionnels." }, documents: { title: "Documents professionnels", desc: "Contrats, propositions et accords au même endroit." }, crm: { title: "CRM et clients", desc: "Gérez clients, prospects et suivis au même endroit." }, studio: { title: "App Studio", desc: "Planifiez, créez et améliorez des applications avec une IA guidée." } },
    dashboard: { heading: "Tableau de commande", subheading: "Votre entreprise réelle en un coup d’œil. Rien n’est inventé.", priorities: "Priorités du jour", customers: "Clients", followups: "Suivis", documents: "Documents", expenses: "Dépenses", projects: "Projets", activity: "Activité récente", aiUsage: "Utilisation de l’IA", studioProjects: "Projets App Studio", emptyTitle: "Pas encore de données", emptyBody: "Connectez votre espace pour afficher les données réelles.", connect: "Connecter l’espace" },
    status: { working: "Actif", beta: "Bêta", coming: "Bientôt", planned: "Prévu" },
    commandCenter: { title: "Centre de commande", subtitle: "Le cœur opérationnel de votre espace HEGEVA.", openAssistant: "Ouvrir l’assistant", connected: "Espace cloud connecté. Les modules actifs synchronisent les données réelles via le backend HEGEVA authentifié.", checking: "Vérification de la connexion…", expensesDesc: "Suivez les dépenses et gardez vos comptes en ordre.", planner: "Planificateur / Gain de temps", plannerDesc: "Planifiez priorités, échéances et tâches terminées.", messageStudio: "Studio de messages", messageDesc: "Créez et sauvegardez dans le cloud des brouillons professionnels.", vault: "Coffre & modèles", vaultDesc: "Documents sécurisés et modèles prêts à l’emploi.", tools: "Outils professionnels", toolsDesc: "Calculatrices et outils pour les opérations quotidiennes." },
    footer: { encryption: "Chiffrement 256 bits", cloud: "Synchronisation cloud", languages: "5 langues", support: "IA + assistance humaine", noFees: "Aucun frais caché", tagline: "Entreprise · IA · Liberté" },
    business: { eyebrow: "Espace professionnel HEGEVA", title: "Le travail quotidien en un seul endroit", subtitle: "Les comptes connectés synchronisent les données des modules actifs avec l’espace cloud HEGEVA. Une copie locale reste disponible; les invités restent uniquement en local.", open: "Ouvrir le module", customers: "Clients et CRM", customersDesc: "Enregistrez et recherchez de vrais clients avec la synchronisation cloud authentifiée.", documents: "Documents", documentsDesc: "Créez des fiches documentaires et synchronisez-les avec votre espace.", expenses: "Dépenses", expensesDesc: "Suivez les dépenses réelles et synchronisez-les entre les sessions.", planner: "Planificateur / Gain de temps", plannerDesc: "Synchronisez priorités, échéances et tâches terminées.", reports: "Rapports", reportsDesc: "Résumez clients, documents, dépenses et tâches à partir de données réelles.", messages: "Studio de messages", messagesDesc: "Enregistrez des brouillons sans les présenter comme envoyés." },
    assistant: { title: "Assistant", subtitle: "Aide IA pratique connectée au backend HEGEVA en direct. Les réponses sont générées uniquement après une vraie demande.", checkingAccount: "Vérification du compte HEGEVA…", signInTitle: "Connectez-vous pour utiliser l’assistant HEGEVA", signInBody: "L’assistant utilise votre compte authentifié et votre limite IA mensuelle réelle.", goLogin: "Se connecter", signedIn: "Connecté en tant que", plan: "forfait", messagesMonth: "messages IA ce mois-ci", saving: "Enregistrement de la conversation…", synced: "Conversation synchronisée dans le cloud", syncError: "Synchronisation cloud temporairement indisponible", loading: "Chargement de la conversation…", clear: "Effacer le chat", empty: "Demandez une aide professionnelle pratique à HEGEVA. Aucune conversation démo n’est insérée.", thinking: "HEGEVA réfléchit…", placeholder: "Demandez à HEGEVA AI…", sending: "Envoi…", send: "Envoyer", hint: "Entrée : envoyer · Maj+Entrée : nouvelle ligne · 2 500 caractères maximum. L’utilisation est comptée en direct.", copy: "Copier la réponse", copyError: "La réponse n’a pas pu être copiée.", unavailable: "HEGEVA AI est temporairement indisponible.", emptyResponse: "HEGEVA AI a renvoyé une réponse vide." },
  },
  es: {
    nav: {
      home: "Inicio",
      commandCenter: "Centro de mando",
      appStudio: "App Studio",
      business: "Negocio",
      pricing: "Precios",
      contact: "Contacto",
      login: "Entrar",
      getStarted: "Empezar",
      account: "Cuenta", logout: "Cerrar sesión", openWorkspace: "Abrir espacio",
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
      pillBuild: "Crear",
      pillManage: "Gestionar",
      pillAutomate: "Automatizar",
      pillGrow: "Crecer",
    },
    capabilities: { heading: "Lo que puedes hacer con HEGEVA AI", subheading: "Un solo sistema operativo para todo tu negocio.", assistant: { title: "Asistente de IA", desc: "Tu socio empresarial inteligente cuando lo necesites." }, reports: { title: "Informes financieros", desc: "Informes claros a partir de tus datos reales." }, invoices: { title: "Generador de facturas", desc: "Facturas, presupuestos y recibos profesionales." }, documents: { title: "Documentos empresariales", desc: "Contratos, propuestas y acuerdos en un solo lugar." }, crm: { title: "CRM y clientes", desc: "Gestiona clientes, prospectos y seguimientos en un solo lugar." }, studio: { title: "App Studio", desc: "Planifica, crea y mejora aplicaciones con IA guiada." } },
    dashboard: { heading: "Panel de mando", subheading: "Tu negocio real de un vistazo. Nada es inventado.", priorities: "Prioridades de hoy", customers: "Clientes", followups: "Seguimientos", documents: "Documentos", expenses: "Gastos", projects: "Proyectos", activity: "Actividad reciente", aiUsage: "Uso de IA", studioProjects: "Proyectos de App Studio", emptyTitle: "Sin datos todavía", emptyBody: "Conecta tu espacio para ver datos reales.", connect: "Conectar espacio" },
    status: { working: "Activo", beta: "Beta", coming: "Próximamente", planned: "Planificado" },
    commandCenter: { title: "Centro de mando", subtitle: "El núcleo operativo de tu espacio HEGEVA.", openAssistant: "Abrir asistente", connected: "Espacio de trabajo en la nube conectado. Los módulos activos sincronizan datos reales mediante el backend autenticado de HEGEVA.", checking: "Comprobando la conexión…", expensesDesc: "Controla los gastos y mantén tus cuentas ordenadas.", planner: "Planificador / Ahorro de tiempo", plannerDesc: "Planifica prioridades, fechas límite y tareas completadas.", messageStudio: "Estudio de mensajes", messageDesc: "Crea y guarda en la nube borradores profesionales.", vault: "Bóveda y plantillas", vaultDesc: "Documentos seguros y plantillas listas para usar.", tools: "Herramientas de negocio", toolsDesc: "Calculadoras y utilidades para las operaciones diarias." },
    footer: { encryption: "Cifrado de 256 bits", cloud: "Sincronización en la nube", languages: "5 idiomas", support: "IA + soporte humano", noFees: "Sin cargos ocultos", tagline: "Negocio · IA · Libertad" },
    business: { eyebrow: "Espacio de negocio HEGEVA", title: "El trabajo diario en un solo lugar", subtitle: "Las cuentas conectadas sincronizan los datos de los módulos activos con el espacio en la nube de HEGEVA. Se conserva una copia local; los invitados permanecen solo en local.", open: "Abrir módulo", customers: "Clientes y CRM", customersDesc: "Guarda y busca clientes reales con sincronización autenticada en la nube.", documents: "Documentos", documentsDesc: "Crea registros de documentos y sincronízalos con tu espacio.", expenses: "Gastos", expensesDesc: "Controla gastos reales y sincronízalos entre sesiones.", planner: "Planificador / Ahorro de tiempo", plannerDesc: "Sincroniza prioridades, fechas límite y tareas completadas.", reports: "Informes", reportsDesc: "Resume clientes, documentos, gastos y tareas a partir de datos reales.", messages: "Estudio de mensajes", messagesDesc: "Guarda borradores sin presentarlos como enviados." },
    assistant: { title: "Asistente", subtitle: "Ayuda práctica de IA conectada al backend HEGEVA en vivo. Las respuestas solo se generan tras una solicitud real.", checkingAccount: "Comprobando tu cuenta HEGEVA…", signInTitle: "Inicia sesión para usar el asistente HEGEVA", signInBody: "El asistente usa tu cuenta autenticada y tu límite mensual real de IA.", goLogin: "Ir al acceso", signedIn: "Sesión iniciada como", plan: "plan", messagesMonth: "mensajes de IA este mes", saving: "Guardando conversación…", synced: "Conversación sincronizada en la nube", syncError: "Sincronización temporalmente no disponible", loading: "Cargando conversación…", clear: "Borrar chat", empty: "Pide ayuda empresarial práctica a HEGEVA. No se inserta ninguna conversación de demostración.", thinking: "HEGEVA está pensando…", placeholder: "Pregunta a HEGEVA AI…", sending: "Enviando…", send: "Enviar", hint: "Enter: enviar · Shift+Enter: nueva línea · Máximo 2500 caracteres. El uso se cuenta en vivo.", copy: "Copiar respuesta", copyError: "No se pudo copiar la respuesta.", unavailable: "HEGEVA AI no está disponible temporalmente.", emptyResponse: "HEGEVA AI devolvió una respuesta vacía." },
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
