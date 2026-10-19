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
      { title: "Add your first real customer", body: "Enter the opportunity once. Review the customer, quote draft and follow-up task before creating anything.", action: "Start the 90-second workflow", href: "/business/launch" },
      { title: "Create the customer's first quote", body: "Open the quote workspace, check the customer, price, VAT, dates and terms, then save the draft.", action: "Create a quote", href: "/business/invoices" },
      { title: "Send the quote", body: "Open the saved quote, prepare the customer email, send it from your approved workflow and mark the quote as sent.", action: "Open the quote workspace", href: "/business/invoices" },
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
      { title: "Add hozzá az első valódi ügyfeledet", body: "Add meg egyszer a lehetőség adatait. Létrehozás előtt nézd át az ügyfelet, az ajánlattervezetet és az utánkövetési feladatot.", action: "90 másodperces indítás", href: "/business/launch" },
      { title: "Készítsd el az ügyfél első ajánlatát", body: "Nyisd meg az ajánlatkezelőt, ellenőrizd az ügyfelet, az árat, az áfát, a dátumokat és a feltételeket, majd mentsd a piszkozatot.", action: "Ajánlat készítése", href: "/business/invoices" },
      { title: "Küldd el az ajánlatot", body: "Nyisd meg a mentett ajánlatot, készítsd elő az ügyfélnek szóló e-mailt, küldd el a jóváhagyott folyamatból, majd jelöld elküldöttnek.", action: "Ajánlatkezelő megnyitása", href: "/business/invoices" },
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
      { title: "Ersten echten Kunden hinzufügen", body: "Geben Sie die Chance einmal ein. Prüfen Sie Kunde, Angebotsentwurf und Nachfassaufgabe vor der Erstellung.", action: "90-Sekunden-Ablauf starten", href: "/business/launch" },
      { title: "Erstes Kundenangebot erstellen", body: "Öffnen Sie den Angebotsbereich, prüfen Sie Kunde, Preis, Steuer, Daten und Bedingungen und speichern Sie den Entwurf.", action: "Angebot erstellen", href: "/business/invoices" },
      { title: "Angebot senden", body: "Öffnen Sie das gespeicherte Angebot, bereiten Sie die Kunden-E-Mail vor, senden Sie sie über den freigegebenen Ablauf und markieren Sie das Angebot als gesendet.", action: "Angebotsbereich öffnen", href: "/business/invoices" },
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
      { title: "Ajoutez votre premier vrai client", body: "Saisissez l’opportunité une fois. Vérifiez le client, le devis et la tâche de relance avant création.", action: "Lancer le parcours de 90 secondes", href: "/business/launch" },
      { title: "Créez le premier devis du client", body: "Ouvrez l’espace devis, vérifiez le client, le prix, la TVA, les dates et les conditions, puis enregistrez le brouillon.", action: "Créer un devis", href: "/business/invoices" },
      { title: "Envoyez le devis", body: "Ouvrez le devis enregistré, préparez l’e-mail client, envoyez-le via le processus approuvé et marquez le devis comme envoyé.", action: "Ouvrir l’espace devis", href: "/business/invoices" },
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
      { title: "Añade tu primer cliente real", body: "Introduce la oportunidad una vez. Revisa el cliente, el presupuesto y la tarea de seguimiento antes de crear nada.", action: "Iniciar flujo de 90 segundos", href: "/business/launch" },
      { title: "Crea el primer presupuesto del cliente", body: "Abre el espacio de presupuestos, revisa el cliente, precio, impuestos, fechas y condiciones, y guarda el borrador.", action: "Crear un presupuesto", href: "/business/invoices" },
      { title: "Envía el presupuesto", body: "Abre el presupuesto guardado, prepara el correo al cliente, envíalo mediante el proceso aprobado y márcalo como enviado.", action: "Abrir presupuestos", href: "/business/invoices" },
    ],
    proofTitle: "En qué puede ayudarte HEGEVA después",
    proofBody: "Cuando existan registros reales, HEGEVA organiza el trabajo e identifica prioridades respaldadas por evidencia. No inventa datos ni actúa sin aprobación.",
    proofItems: ["Organizar clientes, presupuestos, facturas, documentos y tareas", "Detectar facturas vencidas y preparar borradores de seguimiento", "Mostrar prioridades, riesgos y oportunidades respaldados", "Preparar próximos pasos para tu aprobación"],
    boundary: "Nada se envía ni se ejecuta automáticamente.",
  },
}
