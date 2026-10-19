import type { Locale } from "@/lib/i18n/dictionaries"

type FirstCustomerCopy = {
  eyebrow: string
  title: string
  subtitle: string
  readyTitle: string
  readyBody: string
  openCore: string
  loopTitle: string
  loopBody: string
  steps: Array<{ title: string; body: string; action: string; href: string }>
  proofTitle: string
  proofBody: string
  proofItems: string[]
  boundary: string
}

export const FIRST_CUSTOMER_COPY: Record<Locale, FirstCustomerCopy> = {
  en: {
    eyebrow: "HEGEVA AI · FIRST STEPS",
    title: "Let’s get HEGEVA working for your business.",
    subtitle: "Start with a few real records. HEGEVA then uses your workspace to show priorities, opportunities and owner-approved next actions.",
    readyTitle: "Your first workspace signals are in place.",
    readyBody: "Open HEGEVA Core to review the next priority from your real workspace data.",
    openCore: "Open HEGEVA Core",
    loopTitle: "Your first business loop",
    loopBody: "Customer → quote → follow-up → invoice → payment status → HEGEVA Core priority.",
    steps: [
      { title: "Turn one real opportunity into a ready workflow", body: "Enter the facts once. Review a customer record, quote draft and follow-up task before anything is created.", action: "Start the 90-second workflow", href: "/business/launch" },
      { title: "Set the outcome that matters now", body: "Goal Mode prepares a plan from real workspace evidence. You approve every prepared action.", action: "Choose a goal", href: "/command-center#goal-mode" },
      { title: "Create a quote or invoice", body: "Use your customer record to prepare a real quote or invoice, then track its status.", action: "Create a quote or invoice", href: "/business/invoices" },
    ],
    proofTitle: "What HEGEVA can help you do next",
    proofBody: "Once real records exist, HEGEVA can organise work and identify evidence-backed priorities. It does not invent business data or act without approval.",
    proofItems: ["Organise customers, quotes, invoices, documents and tasks", "Spot overdue invoices and prepare follow-up drafts", "Show evidence-backed priorities, risks and opportunities", "Prepare next actions for your approval"],
    boundary: "Nothing is sent or executed automatically.",
  },
  hu: {
    eyebrow: "HEGEVA AI · ELSŐ LÉPÉSEK",
    title: "Indítsuk el a HEGEVA-t a vállalkozásodhoz.",
    subtitle: "Kezdj néhány valódi rekorddal. A HEGEVA ezután a munkaterületed alapján prioritásokat, lehetőségeket és tulajdonosi jóváhagyásra váró következő lépéseket mutat.",
    readyTitle: "Az első munkaterületi jelzéseid már rendelkezésre állnak.",
    readyBody: "Nyisd meg a HEGEVA Core-t, és nézd át a valódi adataid alapján javasolt következő prioritást.",
    openCore: "HEGEVA Core megnyitása",
    loopTitle: "Az első üzleti folyamatod",
    loopBody: "Ügyfél → ajánlat → utánkövetés → számla → fizetési állapot → HEGEVA Core-prioritás.",
    steps: [
      { title: "Egy valódi lehetőségből készíts teljes munkafolyamatot", body: "Add meg egyszer a tényeket. Létrehozás előtt nézd át az ügyfélrekordot, az ajánlattervezetet és az utánkövetési feladatot.", action: "90 másodperces indítás", href: "/business/launch" },
      { title: "Határozd meg a most fontos eredményt", body: "A Goal Mode valódi munkaterületi bizonyítékból készít tervet. Minden előkészített műveletet te hagysz jóvá.", action: "Cél kiválasztása", href: "/command-center#goal-mode" },
      { title: "Készíts ajánlatot vagy számlát", body: "Használd az ügyfélrekordot valódi ajánlat vagy számla előkészítéséhez, majd kövesd az állapotát.", action: "Ajánlat vagy számla készítése", href: "/business/invoices" },
    ],
    proofTitle: "Amiben a HEGEVA ezután segíthet",
    proofBody: "Ha vannak valódi rekordok, a HEGEVA rendszerezi a munkát és bizonyítékalapú prioritásokat azonosít. Nem talál ki üzleti adatokat, és nem cselekszik jóváhagyás nélkül.",
    proofItems: ["Ügyfelek, ajánlatok, számlák, dokumentumok és feladatok rendszerezése", "Lejárt számlák felismerése és utánkövetési vázlatok előkészítése", "Bizonyítékalapú prioritások, kockázatok és lehetőségek megmutatása", "Következő műveletek előkészítése a jóváhagyásodra"],
    boundary: "Semmi sem kerül automatikusan elküldésre vagy végrehajtásra.",
  },
  de: {
    eyebrow: "HEGEVA AI · ERSTE SCHRITTE",
    title: "Machen wir HEGEVA für Ihr Unternehmen einsatzbereit.",
    subtitle: "Beginnen Sie mit einigen echten Einträgen. HEGEVA zeigt dann anhand Ihres Workspace Prioritäten, Chancen und nächste Schritte zur Freigabe.",
    readyTitle: "Ihre ersten Workspace-Signale sind vorhanden.",
    readyBody: "Öffnen Sie HEGEVA Core, um die nächste Priorität aus Ihren echten Workspace-Daten zu prüfen.",
    openCore: "HEGEVA Core öffnen",
    loopTitle: "Ihr erster Geschäftsablauf",
    loopBody: "Kunde → Angebot → Nachfassen → Rechnung → Zahlungsstatus → HEGEVA-Core-Priorität.",
    steps: [
      { title: "Eine echte Chance in einen fertigen Ablauf verwandeln", body: "Fakten einmal eingeben. Kundendatensatz, Angebotsentwurf und Nachfassaufgabe vor der Erstellung prüfen.", action: "90-Sekunden-Ablauf starten", href: "/business/launch" },
      { title: "Wichtigstes aktuelles Ergebnis festlegen", body: "Goal Mode erstellt einen Plan aus echten Workspace-Belegen. Sie genehmigen jede vorbereitete Aktion.", action: "Ziel wählen", href: "/command-center#goal-mode" },
      { title: "Angebot oder Rechnung erstellen", body: "Nutzen Sie den Kundeneintrag für ein echtes Angebot oder eine Rechnung und verfolgen Sie den Status.", action: "Angebot oder Rechnung erstellen", href: "/business/invoices" },
    ],
    proofTitle: "Wobei HEGEVA als Nächstes helfen kann",
    proofBody: "Sobald echte Einträge vorhanden sind, organisiert HEGEVA Arbeit und erkennt belegte Prioritäten. Es erfindet keine Geschäftsdaten und handelt nicht ohne Freigabe.",
    proofItems: ["Kunden, Angebote, Rechnungen, Dokumente und Aufgaben organisieren", "Überfällige Rechnungen erkennen und Nachfassentwürfe vorbereiten", "Belegte Prioritäten, Risiken und Chancen zeigen", "Nächste Schritte zur Freigabe vorbereiten"],
    boundary: "Nichts wird automatisch gesendet oder ausgeführt.",
  },
  fr: {
    eyebrow: "HEGEVA AI · PREMIERS PAS",
    title: "Mettons HEGEVA au travail pour votre entreprise.",
    subtitle: "Commencez avec quelques données réelles. HEGEVA utilisera ensuite votre espace pour présenter les priorités, opportunités et prochaines actions à approuver.",
    readyTitle: "Vos premiers signaux d’espace de travail sont prêts.",
    readyBody: "Ouvrez HEGEVA Core pour examiner la prochaine priorité issue de vos données réelles.",
    openCore: "Ouvrir HEGEVA Core",
    loopTitle: "Votre premier parcours métier",
    loopBody: "Client → devis → relance → facture → statut de paiement → priorité HEGEVA Core.",
    steps: [
      { title: "Transformez une opportunité réelle en flux prêt", body: "Saisissez les faits une fois. Vérifiez la fiche client, le devis et la tâche de relance avant création.", action: "Lancer le parcours de 90 secondes", href: "/business/launch" },
      { title: "Choisissez le résultat qui compte maintenant", body: "Goal Mode prépare un plan à partir de preuves réelles. Vous approuvez chaque action préparée.", action: "Choisir un objectif", href: "/command-center#goal-mode" },
      { title: "Créez un devis ou une facture", body: "Utilisez votre fiche client pour préparer un vrai devis ou une facture, puis suivez son statut.", action: "Créer un devis ou une facture", href: "/business/invoices" },
    ],
    proofTitle: "Ce que HEGEVA peut vous aider à faire ensuite",
    proofBody: "Une fois des données réelles disponibles, HEGEVA organise le travail et identifie des priorités étayées. Il n’invente pas de données et n’agit pas sans approbation.",
    proofItems: ["Organiser clients, devis, factures, documents et tâches", "Repérer les factures échues et préparer des brouillons de relance", "Présenter priorités, risques et opportunités étayés", "Préparer les prochaines actions pour votre approbation"],
    boundary: "Rien n’est envoyé ou exécuté automatiquement.",
  },
  es: {
    eyebrow: "HEGEVA AI · PRIMEROS PASOS",
    title: "Pongamos HEGEVA a trabajar para tu negocio.",
    subtitle: "Empieza con algunos registros reales. HEGEVA usará después tu espacio para mostrar prioridades, oportunidades y próximos pasos que tú apruebas.",
    readyTitle: "Tus primeras señales del espacio ya están listas.",
    readyBody: "Abre HEGEVA Core para revisar la siguiente prioridad basada en tus datos reales.",
    openCore: "Abrir HEGEVA Core",
    loopTitle: "Tu primer ciclo de negocio",
    loopBody: "Cliente → presupuesto → seguimiento → factura → estado de pago → prioridad de HEGEVA Core.",
    steps: [
      { title: "Convierte una oportunidad real en un flujo listo", body: "Introduce los datos una vez. Revisa cliente, presupuesto y seguimiento antes de crear nada.", action: "Iniciar flujo de 90 segundos", href: "/business/launch" },
      { title: "Elige el resultado más importante ahora", body: "Goal Mode prepara un plan a partir de evidencia real. Tú apruebas cada acción preparada.", action: "Elegir objetivo", href: "/command-center#goal-mode" },
      { title: "Crea un presupuesto o una factura", body: "Usa el registro del cliente para preparar un presupuesto o factura real y seguir su estado.", action: "Crear presupuesto o factura", href: "/business/invoices" },
    ],
    proofTitle: "En qué puede ayudarte HEGEVA después",
    proofBody: "Cuando existan registros reales, HEGEVA organiza el trabajo e identifica prioridades respaldadas por evidencia. No inventa datos ni actúa sin aprobación.",
    proofItems: ["Organizar clientes, presupuestos, facturas, documentos y tareas", "Detectar facturas vencidas y preparar borradores de seguimiento", "Mostrar prioridades, riesgos y oportunidades respaldados", "Preparar próximos pasos para tu aprobación"],
    boundary: "Nada se envía ni se ejecuta automáticamente.",
  },
}
