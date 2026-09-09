"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Blocks,
  Bot,
  CalendarDays,
  FileText,
  MessageSquareText,
  PoundSterling,
  Receipt,
  CircleCheckBig,
  Sparkles,
  Target,
  Users,
  Database,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useSession } from "@/lib/auth-client";
import { useWorkspaceData } from "@/lib/use-workspace-data";
import { cn } from "@/lib/utils";
import {
  SAMPLE_OPERATING_PICTURE,
  SAMPLE_JOURNEY_COUNTS,
  SAMPLE_JOURNEY_START_INDEX,
} from "@/lib/sample-data/sample-workspace-config";

const copy = {
  en: {
    picture: "SEE WHAT HEGEVA CONNECTS",
    pictureDesc:
      "Not another dashboard. HEGEVA turns your real business records into priorities, risks, opportunities and prepared next actions.",
    empty:
      "No sample metrics. Your operating picture appears when your workspace has real data.",
    today: "YOUR BUSINESS TODAY",
    customers: "Customers needing attention",
    invoices: "Overdue invoices",
    tasks: "Tasks due",
    campaign: "Campaign performance",
    opportunity: "Sales opportunities",
    insight:
      "HEGEVA Core analyses connected records and explains what deserves your attention next.",
    potential: "Potential revenue, calculated from your records",
    prepare: "Build my operating picture",
    modules: "Core modules",
    open: "Open module",
    coming: "Coming soon",
    workflow: "One connected way of working",
    workflowDesc:
      "Assist, operate, build and grow from one calm command surface.",
    pricing: "Pricing & Plans",
    pricingDesc: "Compare plans with secure live monthly Stripe billing.",
    viewPlans: "View plans",
  },
  hu: {
    picture: "NÉZD MEG, MIT KAPCSOL ÖSSZE",
    pictureDesc:
      "Nem egy újabb dashboard. A HEGEVA a valós üzleti adataidból prioritásokat, kockázatokat, lehetőségeket és előkészített következő lépéseket készít.",
    empty:
      "Nincsenek minta mérőszámok. A működési képed a saját valós adataidból épül fel.",
    today: "A VÁLLALKOZÁSOD MA",
    customers: "Figyelmet igénylő ügyfelek",
    invoices: "Lejárt számlák",
    tasks: "Esedékes feladatok",
    campaign: "Kampányteljesítmény",
    opportunity: "Értékesítési lehetőségek",
    insight:
      "A HEGEVA Core elemzi az összekapcsolt adatokat, és elmondja, mire érdemes következőként figyelned.",
    potential: "Lehetséges bevétel, a saját adataidból számítva",
    prepare: "Működési képem felépítése",
    modules: "Alaprendszerek",
    open: "Modul megnyitása",
    coming: "Hamarosan",
    workflow: "Egy összekapcsolt munkamód",
    workflowDesc:
      "Segíts, működtess, építs és növekedj egy nyugodt vezérlőfelületről.",
    pricing: "Árak és csomagok",
    pricingDesc:
      "Hasonlítsd össze a csomagokat biztonságos, élő havi Stripe-fizetéssel.",
    viewPlans: "Csomagok megtekintése",
  },
  de: {
    picture: "SEHEN SIE, WAS HEGEVA VERBINDET",
    pictureDesc:
      "HEGEVA verwandelt echte Geschäftsdaten in Prioritäten, Risiken, Chancen und vorbereitete nächste Schritte.",
    empty:
      "Keine Beispielwerte. Das Betriebsbild entsteht aus Ihren echten Daten.",
    today: "IHR UNTERNEHMEN HEUTE",
    customers: "Kunden mit Handlungsbedarf",
    invoices: "Überfällige Rechnungen",
    tasks: "Fällige Aufgaben",
    campaign: "Kampagnenleistung",
    opportunity: "Verkaufschancen",
    insight:
      "HEGEVA Core analysiert verbundene Datensätze und erklärt, was als Nächstes wichtig ist.",
    potential: "Umsatzpotenzial aus Ihren Datensätzen berechnet",
    prepare: "Betriebsbild erstellen",
    modules: "Kernmodule",
    open: "Modul öffnen",
    coming: "Demnächst",
    workflow: "Ein verbundener Arbeitsweg",
    workflowDesc:
      "Assistieren, steuern, bauen und wachsen – in einer ruhigen Leitstelle.",
    pricing: "Preise & Pläne",
    pricingDesc:
      "Tarife mit sicherer monatlicher Stripe-Live-Abrechnung vergleichen.",
    viewPlans: "Pläne ansehen",
  },
  fr: {
    picture: "VOYEZ CE QUE HEGEVA CONNECTE",
    pictureDesc:
      "HEGEVA transforme vos données réelles en priorités, risques, opportunités et prochaines actions préparées.",
    empty:
      "Aucun chiffre fictif. La vue opérationnelle vient de vos données réelles.",
    today: "VOTRE ENTREPRISE AUJOURD’HUI",
    customers: "Clients à surveiller",
    invoices: "Factures en retard",
    tasks: "Tâches à effectuer",
    campaign: "Performance de campagne",
    opportunity: "Opportunités commerciales",
    insight:
      "HEGEVA Core analyse les données connectées et explique ce qui mérite votre attention.",
    potential: "Revenu potentiel calculé depuis vos données",
    prepare: "Créer ma vue opérationnelle",
    modules: "Modules essentiels",
    open: "Ouvrir le module",
    coming: "Bientôt",
    workflow: "Une façon de travailler connectée",
    workflowDesc:
      "Assister, piloter, créer et grandir depuis une surface calme.",
    pricing: "Prix et forfaits",
    pricingDesc:
      "Comparez les forfaits avec une facturation mensuelle Stripe sécurisée et active.",
    viewPlans: "Voir les forfaits",
  },
  es: {
    picture: "MIRA LO QUE HEGEVA CONECTA",
    pictureDesc:
      "HEGEVA convierte datos reales en prioridades, riesgos, oportunidades y siguientes acciones preparadas.",
    empty:
      "Sin métricas ficticias. La vista operativa se crea con tus datos reales.",
    today: "TU NEGOCIO HOY",
    customers: "Clientes que requieren atención",
    invoices: "Facturas vencidas",
    tasks: "Tareas pendientes",
    campaign: "Rendimiento de campaña",
    opportunity: "Oportunidades de venta",
    insight:
      "HEGEVA Core analiza los datos conectados y explica qué requiere tu atención.",
    potential: "Ingresos potenciales calculados desde tus datos",
    prepare: "Crear mi vista operativa",
    modules: "Módulos principales",
    open: "Abrir módulo",
    coming: "Próximamente",
    workflow: "Una forma conectada de trabajar",
    workflowDesc: "Asiste, opera, crea y crece desde una superficie serena.",
    pricing: "Precios y planes",
    pricingDesc:
      "Compara planes con facturación mensual segura y activa de Stripe.",
    viewPlans: "Ver planes",
  },
} as const;

type Locale = keyof typeof copy;
type WorkspaceRecord = { id: string; customerStatus?: "lead" | "active" | "paused"; followUp?: string };
type WorkspaceTask = { id: string; done?: boolean; due?: string };
type WorkspaceMessage = { id: string; sourceId?: string; workflowStatus?: "draft" | "approved" | "completed" };
type WorkspaceInvoice = {
  id: string;
  type: "invoice" | "quote";
  status?: "draft" | "sent" | "paid";
  dueDate?: string;
  currency?: string;
  vatRate?: number;
  items?: readonly { quantity?: number; unitPrice?: number }[];
};
type Module = {
  title: string;
  desc: string;
  href?: string;
  icon: typeof Bot;
  tone: string;
  status: string;
};

const conversionCopy = {
  en: { coreTitle:"Turn daily business activity into a clear next move.", pricingDesc:"Choose the workspace that fits the way you run your business today.", trustEyebrow:"BUILT FOR BUSINESS CONFIDENCE", trustTitle:"Clear data. Clear control. Clear next steps.", trust:["Your workspace, your records|Guest demonstrations are clearly labelled. Signed-in workspaces use the records you add.","You stay in control|HEGEVA can prepare supported work, but important customer actions stay with you for review.","Payments handled by Stripe|HEGEVA does not store your card details."] },
  hu: { coreTitle:"A napi üzleti tevékenységből világos következő lépés.", pricingDesc:"Válaszd azt a munkaterületet, ami ahhoz illik, ahogyan ma vezeted a vállalkozásodat.", trustEyebrow:"ÜZLETI BIZALOMRA ÉPÍTVE", trustTitle:"Tiszta adatok. Tiszta kontroll. Világos következő lépések.", trust:["A te munkaterületed, a te rekordjaid|A vendégbemutatók világosan jelöltek. A bejelentkezett munkaterület a saját hozzáadott rekordjaidat használja.","Nálad marad az irányítás|A HEGEVA előkészíthet támogatott munkát, de a fontos ügyfélműveleteket te nézed át.","A fizetést a Stripe kezeli|A HEGEVA nem tárol bankkártyaadatokat."] },
  de: { coreTitle:"Machen Sie aus täglicher Geschäftsarbeit den klaren nächsten Schritt.", pricingDesc:"Wählen Sie den Workspace, der zu Ihrer heutigen Arbeitsweise passt.", trustEyebrow:"FÜR VERTRAUEN IM GESCHÄFT", trustTitle:"Klare Daten. Klare Kontrolle. Klare nächste Schritte.", trust:["Ihr Workspace, Ihre Datensätze|Gastdemos sind klar gekennzeichnet. Angemeldete Workspaces verwenden die von Ihnen hinzugefügten Daten.","Sie behalten die Kontrolle|HEGEVA kann unterstützte Arbeit vorbereiten; wichtige Kundenaktionen bleiben zur Prüfung bei Ihnen.","Zahlungen über Stripe|HEGEVA speichert keine Kartendaten."] },
  fr: { coreTitle:"Transformez l’activité quotidienne en prochaine action claire.", pricingDesc:"Choisissez l’espace qui correspond à la façon dont vous pilotez votre entreprise aujourd’hui.", trustEyebrow:"CONÇU POUR LA CONFIANCE", trustTitle:"Données claires. Contrôle clair. Prochaines étapes claires.", trust:["Votre espace, vos données|Les démonstrations invité sont clairement identifiées. Les espaces connectés utilisent les données que vous ajoutez.","Vous gardez le contrôle|HEGEVA peut préparer un travail pris en charge, mais vous validez les actions importantes envers les clients.","Paiements gérés par Stripe|HEGEVA ne stocke pas vos données de carte."] },
  es: { coreTitle:"Convierte la actividad diaria en un siguiente paso claro.", pricingDesc:"Elige el espacio que encaja con la forma en que gestionas tu negocio hoy.", trustEyebrow:"DISEÑADO PARA LA CONFIANZA", trustTitle:"Datos claros. Control claro. Próximos pasos claros.", trust:["Tu espacio, tus datos|Las demostraciones para invitados están claramente identificadas. Los espacios con sesión usan los registros que añades.","Tú mantienes el control|HEGEVA puede preparar trabajo compatible, pero las acciones importantes con clientes siguen bajo tu revisión.","Pagos gestionados por Stripe|HEGEVA no almacena los datos de tu tarjeta."] },
} as const;

const operatingCopy = {
  en: { sample:"SAMPLE DATA", live:"LIVE WORKSPACE", sampleNote:"Illustrative demo — not your business data.", liveNote:"Calculated from the records in your business workspace.", customers:"Customers", unavailable:"Not connected", demoInsight:"Three customer opportunities are worth your attention today. Following them up could represent approximately £2,270 in potential revenue.", liveInsight:(attention:number, overdue:string)=>attention || overdue !== "£0.00" ? `${attention} items need attention. Overdue invoices total ${overdue}.` : "No urgent payment or task risk is visible in your current records.", action:"Prepare actions", liveAction:"Open Command Center" },
  hu: { sample:"MINTAADAT", live:"ÉLŐ MUNKATÉR", sampleNote:"Szemléltető demó — nem a vállalkozásod adatai.", liveNote:"A vállalkozásod munkaterületén lévő rekordokból számítva.", customers:"Ügyfelek", unavailable:"Nincs kapcsolat", demoInsight:"Három ügyféllehetőség érdemel figyelmet ma. Az utánkövetésük körülbelül £2 270 lehetséges bevételt jelenthet.", liveInsight:(attention:number, overdue:string)=>attention || overdue !== "0,00 £" ? `${attention} tétel igényel figyelmet. A lejárt számlák összege ${overdue}.` : "A jelenlegi rekordokban nem látható sürgős fizetési vagy feladatkockázat.", action:"Műveletek előkészítése", liveAction:"Vezérlőközpont megnyitása" },
  de: { sample:"BEISPIELDATEN", live:"LIVE-WORKSPACE", sampleNote:"Illustrative Demo — keine echten Unternehmensdaten.", liveNote:"Berechnet aus den Datensätzen Ihres Business-Workspace.", customers:"Kunden", unavailable:"Nicht verbunden", demoInsight:"Drei Kundenchancen verdienen heute Ihre Aufmerksamkeit. Nachfassaktionen könnten rund £2.270 Umsatzpotenzial darstellen.", liveInsight:(attention:number, overdue:string)=>attention ? `${attention} Elemente benötigen Aufmerksamkeit. Überfällige Rechnungen: ${overdue}.` : "Keine dringenden Zahlungs- oder Aufgabenrisiken in Ihren aktuellen Datensätzen.", action:"Aktionen vorbereiten", liveAction:"Leitstelle öffnen" },
  fr: { sample:"DONNÉES D’EXEMPLE", live:"ESPACE EN DIRECT", sampleNote:"Démo illustrative — pas les données de votre entreprise.", liveNote:"Calculé à partir des données de votre espace de travail.", customers:"Clients", unavailable:"Non connecté", demoInsight:"Trois opportunités client méritent votre attention aujourd’hui. Leur suivi pourrait représenter environ 2 270 £ de revenu potentiel.", liveInsight:(attention:number, overdue:string)=>attention ? `${attention} éléments nécessitent votre attention. Factures en retard : ${overdue}.` : "Aucun risque urgent de paiement ou de tâche dans vos données actuelles.", action:"Préparer les actions", liveAction:"Ouvrir le centre de commande" },
  es: { sample:"DATOS DE EJEMPLO", live:"ESPACIO EN DIRECTO", sampleNote:"Demostración ilustrativa; no son datos de tu negocio.", liveNote:"Calculado con los registros de tu espacio de trabajo.", customers:"Clientes", unavailable:"Sin conexión", demoInsight:"Tres oportunidades de clientes merecen tu atención hoy. Su seguimiento podría representar aproximadamente 2270 £ de ingresos potenciales.", liveInsight:(attention:number, overdue:string)=>attention ? `${attention} elementos requieren atención. Facturas vencidas: ${overdue}.` : "No se observan riesgos urgentes de pagos o tareas en tus datos actuales.", action:"Preparar acciones", liveAction:"Abrir centro de mando" },
} as const;

const journeyCopy = {
  en: { eyebrow:"FROM INTEREST TO INCOME", title:"See the whole revenue journey. Know the next move.", desc:"HEGEVA connects the records already in your workspace into one understandable commercial flow.", opportunity:"Opportunity", customer:"Customer", quote:"Quote", followUp:"Follow-up", invoice:"Invoice", payment:"Payment", sample:"Illustrative journey", live:"Your live journey", next:"Recommended next action", actions:["Add your first opportunity","Turn a lead into a customer","Create a quote","Prepare the follow-up","Create or review the invoice","Review collected revenue"], cta:["Open customers","Open customers","Create a quote","Open Business Intelligence","Open invoices","Open Command Center"] },
  hu: { eyebrow:"ÉRDEKLŐDÉSTŐL A BEVÉTELIG", title:"Lásd a teljes bevételi utat. Tudd, mi a következő lépés.", desc:"A HEGEVA a munkaterületed valódi rekordjait egy érthető üzleti folyamattá kapcsolja össze.", opportunity:"Lehetőség", customer:"Ügyfél", quote:"Ajánlat", followUp:"Utánkövetés", invoice:"Számla", payment:"Fizetés", sample:"Szemléltető folyamat", live:"Saját élő folyamatod", next:"Javasolt következő lépés", actions:["Add hozzá az első lehetőséget","Alakítsd az érdeklődőt ügyféllé","Készíts ajánlatot","Készítsd elő az utánkövetést","Készítsd el vagy ellenőrizd a számlát","Tekintsd át a befolyt bevételt"], cta:["Ügyfelek megnyitása","Ügyfelek megnyitása","Ajánlat készítése","Üzleti intelligencia megnyitása","Számlák megnyitása","Vezérlőközpont megnyitása"] },
  de: { eyebrow:"VOM INTERESSE ZUM UMSATZ", title:"Sehen Sie den gesamten Umsatzweg. Kennen Sie den nächsten Schritt.", desc:"HEGEVA verbindet echte Workspace-Datensätze zu einem verständlichen Geschäftsablauf.", opportunity:"Chance", customer:"Kunde", quote:"Angebot", followUp:"Nachfassen", invoice:"Rechnung", payment:"Zahlung", sample:"Beispielhafter Ablauf", live:"Ihr Live-Ablauf", next:"Empfohlener nächster Schritt", actions:["Erste Chance hinzufügen","Lead zum Kunden entwickeln","Angebot erstellen","Nachfassung vorbereiten","Rechnung erstellen oder prüfen","Einnahmen prüfen"], cta:["Kunden öffnen","Kunden öffnen","Angebot erstellen","Business Intelligence öffnen","Rechnungen öffnen","Leitstelle öffnen"] },
  fr: { eyebrow:"DE L’INTÉRÊT AU REVENU", title:"Visualisez tout le parcours commercial. Sachez quoi faire ensuite.", desc:"HEGEVA relie les données réelles de votre espace en un parcours commercial compréhensible.", opportunity:"Opportunité", customer:"Client", quote:"Devis", followUp:"Suivi", invoice:"Facture", payment:"Paiement", sample:"Parcours illustratif", live:"Votre parcours en direct", next:"Prochaine action recommandée", actions:["Ajouter la première opportunité","Convertir le prospect en client","Créer un devis","Préparer le suivi","Créer ou vérifier la facture","Examiner les revenus encaissés"], cta:["Ouvrir les clients","Ouvrir les clients","Créer un devis","Ouvrir Business Intelligence","Ouvrir les factures","Ouvrir le centre de commande"] },
  es: { eyebrow:"DEL INTERÉS A LOS INGRESOS", title:"Ve todo el recorrido de ingresos. Conoce el siguiente paso.", desc:"HEGEVA conecta los registros reales de tu espacio en un flujo comercial comprensible.", opportunity:"Oportunidad", customer:"Cliente", quote:"Presupuesto", followUp:"Seguimiento", invoice:"Factura", payment:"Pago", sample:"Recorrido ilustrativo", live:"Tu recorrido en directo", next:"Siguiente acción recomendada", actions:["Añade la primera oportunidad","Convierte el contacto en cliente","Crea un presupuesto","Prepara el seguimiento","Crea o revisa la factura","Revisa los ingresos cobrados"], cta:["Abrir clientes","Abrir clientes","Crear presupuesto","Abrir inteligencia empresarial","Abrir facturas","Abrir centro de mando"] },
} as const;

function documentTotal(document: WorkspaceInvoice) {
  const subtotal = (document.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );
  return subtotal * (1 + (Number(document.vatRate) || 0) / 100);
}

export function FlagshipSections() {
  const { t, locale } = useI18n();
  const c = copy[locale as Locale];
  const oc = operatingCopy[locale as Locale];
  const cc = conversionCopy[locale as Locale];
  const { data: session, isPending } = useSession();
  const { items: customers } = useWorkspaceData<WorkspaceRecord>("customers");
  const { items: tasks } = useWorkspaceData<WorkspaceTask>("planner");
  const { items: messages } = useWorkspaceData<WorkspaceMessage>("messages");
  const { items: invoices } =
    useWorkspaceData<WorkspaceInvoice>("invoice_documents");
  const isLive = Boolean(session?.user) && !isPending;
  const today = new Date().toISOString().slice(0, 10);
  const livePicture = useMemo(() => {
    const overdue = invoices.filter(
      (document) =>
        document.type === "invoice" &&
        document.status === "sent" &&
        Boolean(document.dueDate) &&
        document.dueDate! < today,
    );
    const dueToday = tasks.filter(
      (task) => !task.done && task.due?.slice(0, 10) === today,
    ).length;
    const opportunities = invoices.filter(
      (document) =>
        document.type === "quote" && document.status !== "paid",
    );
    const overdueValue = overdue.reduce(
      (sum, document) => sum + documentTotal(document),
      0,
    );
    const opportunityValue = opportunities.reduce(
      (sum, document) => sum + documentTotal(document),
      0,
    );
    const money = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    });
    return {
      customers: customers.length.toString(),
      overdue: money.format(overdueValue),
      dueToday: dueToday.toString(),
      opportunities: money.format(opportunityValue),
      campaign: "—",
      attention: overdue.length + dueToday,
      insight: oc.liveInsight(overdue.length + dueToday, money.format(overdueValue)),
    };
  }, [customers.length, invoices, locale, oc, tasks, today]);
  const picture = isLive
    ? livePicture
    : {
        ...SAMPLE_OPERATING_PICTURE,
        insight: oc.demoInsight,
      };
  const jc = journeyCopy[locale as Locale];
  const journey = useMemo(() => {
    const leads = customers.filter((customer) => customer.customerStatus === "lead").length;
    const activeCustomers = customers.filter((customer) => customer.customerStatus !== "lead" && customer.customerStatus !== "paused").length;
    const quotes = invoices.filter((document) => document.type === "quote");
    const followUps = messages.filter((message) => Boolean(message.sourceId));
    const invoiceDocs = invoices.filter((document) => document.type === "invoice");
    const payments = invoiceDocs.filter((document) => document.status === "paid");
    const counts = isLive ? [leads, activeCustomers, quotes.length, followUps.length, invoiceDocs.length, payments.length] : [...SAMPLE_JOURNEY_COUNTS];
    const nextIndex = isLive ? counts.findIndex((count) => count === 0) : SAMPLE_JOURNEY_START_INDEX;
    const resolvedIndex = nextIndex === -1 ? 5 : nextIndex;
    const hrefs = ["/business/customers", "/business/customers", "/business/invoices", "/business/intelligence#customer-follow-up", "/business/invoices", "/command-center"];
    return { counts, nextIndex: resolvedIndex, href: hrefs[resolvedIndex] };
  }, [customers, invoices, isLive, messages]);
  const journeyLabels = [jc.opportunity, jc.customer, jc.quote, jc.followUp, jc.invoice, jc.payment];
  const modules: Module[] = [
    {
      title: t.capabilities.assistant.title,
      desc: t.capabilities.assistant.desc,
      href: "/assistant",
      icon: Bot,
      tone: "emerald",
      status: t.capabilities.assistant.title,
    },
    {
      title: t.nav.appStudio,
      desc: t.studio.buildDesc,
      href: "/app-studio",
      icon: Blocks,
      tone: "cyan",
      status: t.nav.appStudio,
    },
    {
      title: t.nav.business,
      desc: c.empty,
      href: "/business",
      icon: BarChart3,
      tone: "violet",
      status: t.nav.business,
    },
    {
      title: t.business.customers,
      desc: t.business.customersDesc,
      href: "/business/customers",
      icon: Users,
      tone: "cyan",
      status: t.business.customers,
    },
    {
      title: t.business.documents,
      desc: t.business.documentsDesc,
      href: "/business/documents",
      icon: FileText,
      tone: "gold",
      status: t.business.documents,
    },
    {
      title: t.business.planner,
      desc: t.business.plannerDesc,
      href: "/business/planner",
      icon: CalendarDays,
      tone: "violet",
      status: t.business.planner,
    },
    {
      title: t.business.reports,
      desc: t.business.reportsDesc,
      href: "/business/reports",
      icon: Receipt,
      tone: "cyan",
      status: t.business.reports,
    },
    {
      title: t.business.messages,
      desc: t.business.messagesDesc,
      href: "/business/messages",
      icon: MessageSquareText,
      tone: "emerald",
      status: t.business.messages,
    },
    {
      title: c.pricing,
      desc: cc.pricingDesc,
      href: "/pricing",
      icon: Sparkles,
      tone: "gold",
      status: c.viewPlans,
    },
  ];
  return (
    <>
      <section
        id="operating-picture"
        className="home-operating-picture mx-auto max-w-[94rem] px-4 sm:px-6 lg:px-10"
        aria-labelledby="operating-picture-title"
      >
        <div className="operating-picture-shell">
          <div className="operating-picture-demo">
            <header>
              <div>
                <span className={cn("demo-live", !isLive && "is-sample")} />
                <p>{c.today}</p>
              </div>
              <strong>{isLive ? oc.live : oc.sample}</strong>
            </header>
            <div className="demo-signal-grid">
              <article>
                <Users aria-hidden />
                <span>{isLive ? oc.customers : c.customers}</span>
                <b>{picture.customers}</b>
              </article>
              <article>
                <AlertTriangle aria-hidden />
                <span>{c.invoices}</span>
                <b>{picture.overdue}</b>
              </article>
              <article>
                <CalendarDays aria-hidden />
                <span>{c.tasks}</span>
                <b>{picture.dueToday}</b>
              </article>
              <article>
                <Target aria-hidden />
                <span>{c.opportunity}</span>
                <b>{picture.opportunities}</b>
              </article>
              <article>
                <BarChart3 aria-hidden />
                <span>{c.campaign}</span>
                <b title={isLive ? oc.unavailable : undefined}>
                  {picture.campaign}
                </b>
              </article>
            </div>
            <div className="demo-core-insight">
              <div className="demo-core-mark">H</div>
              <div>
                <small>HEGEVA CORE</small>
                <p>{picture.insight}</p>
                <strong>{isLive ? oc.liveNote : oc.sampleNote}</strong>
              </div>
            </div>
            <Link
              prefetch={false}
              href={isLive ? "/command-center" : "/get-started"}
              className="demo-action"
            >
              <Sparkles aria-hidden />
              <span>{isLive ? oc.liveAction : oc.action}</span>
              <ArrowUpRight aria-hidden />
            </Link>
          </div>
          <div className="operating-picture-copy">
            <p className="section-kicker">{c.picture}</p>
            <h2 id="operating-picture-title">
              {cc.coreTitle}
            </h2>
            <p>{c.pictureDesc}</p>
            <div className="operating-picture-status">
              <PoundSterling aria-hidden />
              <span>{isLive ? oc.liveNote : oc.sampleNote}</span>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[94rem] px-4 py-8 sm:px-6 lg:px-10" aria-labelledby="home-trust-title">
        <div className="rounded-[2rem] border border-primary/20 bg-primary/[0.035] p-6 sm:p-8">
          <div className="max-w-2xl">
            <p className="section-kicker">{cc.trustEyebrow}</p>
            <h2 id="home-trust-title" className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{cc.trustTitle}</h2>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[Database, UserRoundCheck, ShieldCheck].map((Icon, index) => {
              const [title, body] = cc.trust[index].split("|");
              return <article key={title} className="rounded-2xl border border-border bg-card/65 p-5">
                <Icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </article>;
            })}
          </div>
        </div>
      </section>
      <section className="home-revenue-journey mx-auto max-w-[94rem] px-4 py-20 sm:px-6 lg:px-10" aria-labelledby="revenue-journey-title">
        <div className="revenue-journey-heading">
          <div><p className="section-kicker">{jc.eyebrow}</p><h2 id="revenue-journey-title">{jc.title}</h2></div>
          <p>{jc.desc}</p>
        </div>
        <div className="revenue-journey-shell">
          <header><span className={cn("demo-live", !isLive && "is-sample")} /><strong>{isLive ? jc.live : jc.sample}</strong><small>{isLive ? oc.liveNote : oc.sampleNote}</small></header>
          <div className="revenue-stage-grid">
            {journeyLabels.map((label, index) => <div className={cn("revenue-stage", index < journey.nextIndex && "is-complete", index === journey.nextIndex && "is-next")} key={label}>
              <span>{index < journey.nextIndex ? <CircleCheckBig aria-hidden /> : index + 1}</span><b>{label}</b><strong>{journey.counts[index]}</strong>{index < journeyLabels.length - 1 && <i aria-hidden>→</i>}
            </div>)}
          </div>
          <div className="revenue-next-action"><div><small>HEGEVA CORE · {jc.next}</small><strong>{jc.actions[journey.nextIndex]}</strong></div><Link prefetch={false} href={journey.href}>{jc.cta[journey.nextIndex]}<ArrowUpRight aria-hidden /></Link></div>
        </div>
      </section>
      <section
        className="home-module-showcase mx-auto max-w-[94rem] px-4 py-20 sm:px-6 lg:px-10"
        aria-labelledby="home-modules-title"
      >
        <div className="showcase-heading">
          <div>
            <p className="section-kicker">{c.modules}</p>
            <h2 id="home-modules-title">{c.modules}</h2>
          </div>
          <Link prefetch={false} href="/pricing" className="showcase-pricing">
            <Sparkles aria-hidden />
            <span>{c.pricing}</span>
            <ArrowUpRight aria-hidden />
          </Link>
        </div>
        <div className="showcase-grid">
          {modules.map(({ title, desc, href, icon: Icon, tone, status }) => {
            const body = (
              <>
                <header>
                  <span className={cn("module-icon", `tone-${tone}`)}>
                    <Icon aria-hidden />
                  </span>
                  <span className="module-status">{status}</span>
                </header>
                <div className="module-copy">
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
                {href && (
                  <footer>
                    <span>{c.open}</span>
                    <ArrowUpRight aria-hidden />
                  </footer>
                )}
              </>
            );
            return href ? (
              <Link
                prefetch={false}
                href={href}
                className={cn("showcase-module", `module-${tone}`)}
                key={title}
              >
                {body}
              </Link>
            ) : (
              <article
                className={cn("showcase-module", "is-coming", `module-${tone}`)}
                key={title}
                aria-label={`${title}, ${c.coming}`}
              >
                {body}
              </article>
            );
          })}
        </div>
      </section>
      <section
        className="home-workflow mx-auto max-w-[94rem] px-4 pb-20 sm:px-6 lg:px-10"
        aria-labelledby="workflow-title"
      >
        <div className="workflow-heading">
          <div>
            <p className="section-kicker">HEGEVA CORE</p>
            <h2 id="workflow-title">{c.workflow}</h2>
          </div>
          <p>{c.workflowDesc}</p>
        </div>
        <div className="workflow-band">
          <div>
            <b>ASSIST</b>
            <span>{t.capabilities.assistant.title}</span>
          </div>
          <i aria-hidden>→</i>
          <div>
            <b>OPERATE</b>
            <span>{t.nav.commandCenter}</span>
          </div>
          <i aria-hidden>→</i>
          <div>
            <b>BUILD</b>
            <span>{t.nav.appStudio}</span>
          </div>
          <i aria-hidden>→</i>
          <div>
            <b>GROW</b>
            <span>{t.nav.business}</span>
          </div>
        </div>
      </section>
    </>
  );
}
