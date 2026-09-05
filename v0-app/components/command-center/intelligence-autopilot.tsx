"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock3,
  CloudOff,
  FileCheck2,
  History,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useWorkspaceData } from "@/lib/use-workspace-data";
import {
  analyseAutopilotWorkspace,
  canPrepareAutopilot,
  DEFAULT_AUTOPILOT_POLICY,
  taskForAutopilotAction,
  transitionAutopilotAction,
  type AutopilotAction,
  type AutopilotAuditEvent,
  type AutopilotCustomer,
  type AutopilotInvoice,
  type AutopilotSignal,
  type AutopilotTask,
  type AutopilotPolicy,
} from "@/lib/autopilot-v1";

const COPY = {
  en: {
    eyebrow: "HEGEVA INTELLIGENCE & AUTOPILOT · PHASE 1",
    title: "Know what matters. Prepare the work. Stay in control.",
    sub: "HEGEVA interprets real workspace records, suggests the next move and keeps every prepared or completed action traceable.",
    executive: "Executive brief",
    happened: "What HEGEVA found",
    important: "What matters now",
    recommend: "Recommended move",
    radar: "Opportunity Radar",
    ask: "Ask HEGEVA what to do next",
    askButton: "Ask Core",
    prepare: "Prepare action",
    prepared: "Prepared",
    approve: "Approve",
    execute: "Execute",
    cancel: "Cancel",
    audit: "Audit trail",
    noAudit: "No Autopilot action has been prepared.",
    integrations: "Integration readiness",
    notConnected: "Not connected",
    integrationNote:
      "No external account or action is claimed until a real owner-authorised connection exists.",
    suggest: "Suggest",
    prepareMode: "Prepare",
    executeMode: "Ask & Execute",
    owner: "Owner approval required",
    completed: "Completed",
    signals: {
      "overdue-invoice": "Overdue invoices",
      "neglected-lead": "Neglected leads",
      "stale-quote": "Quotes needing follow-up",
      "overdue-task": "Overdue administration",
      "invoice-draft": "Invoice drafts ready to review",
      clear: "No urgent risk detected",
    },
    actions: {
      "overdue-invoice": "Prepare overdue invoice follow-ups",
      "neglected-lead": "Review and contact neglected leads",
      "stale-quote": "Prepare quote follow-ups",
      "overdue-task": "Resolve overdue administration",
      "invoice-draft": "Review invoice drafts",
      clear: "Review the workspace",
    },
  },
  hu: {
    eyebrow: "HEGEVA INTELLIGENCE & AUTOPILOT · PHASE 1",
    title: "Tudd, mi fontos. Készítsd elő a munkát. Maradj irányításban.",
    sub: "A HEGEVA értelmezi a valódi munkaterületi rekordokat, javasolja a következő lépést, és minden műveletet visszakövethetővé tesz.",
    executive: "Vezetői összefoglaló",
    happened: "Mit talált a HEGEVA",
    important: "Mi fontos most",
    recommend: "Javasolt következő lépés",
    radar: "Opportunity Radar",
    ask: "Kérdezd meg a HEGEVA-t, mi legyen a következő lépés",
    askButton: "Core megkérdezése",
    prepare: "Művelet előkészítése",
    prepared: "Előkészítve",
    approve: "Jóváhagyás",
    execute: "Végrehajtás",
    cancel: "Mégse",
    audit: "Auditnapló",
    noAudit: "Még nincs előkészített Autopilot-művelet.",
    integrations: "Integrációs készenlét",
    notConnected: "Nincs csatlakoztatva",
    integrationNote:
      "Valódi, tulajdonos által engedélyezett kapcsolat nélkül a HEGEVA nem állít külső hozzáférést vagy végrehajtást.",
    suggest: "Javaslat",
    prepareMode: "Előkészítés",
    executeMode: "Kérdezés és végrehajtás",
    owner: "Tulajdonosi jóváhagyás szükséges",
    completed: "Befejezve",
    signals: {
      "overdue-invoice": "Lejárt számlák",
      "neglected-lead": "Elhanyagolt leadek",
      "stale-quote": "Utánkövetést igénylő ajánlatok",
      "overdue-task": "Lejárt adminisztráció",
      "invoice-draft": "Ellenőrzésre kész számlavázlatok",
      clear: "Nincs sürgős kockázat",
    },
    actions: {
      "overdue-invoice": "Lejárt számlák utánkövetésének előkészítése",
      "neglected-lead": "Elhanyagolt leadek áttekintése és megkeresése",
      "stale-quote": "Ajánlat-utánkövetések előkészítése",
      "overdue-task": "Lejárt adminisztráció rendezése",
      "invoice-draft": "Számlavázlatok ellenőrzése",
      clear: "Munkaterület áttekintése",
    },
  },
  de: {
    eyebrow: "HEGEVA INTELLIGENCE & AUTOPILOT · PHASE 1",
    title: "Wissen, was zählt. Arbeit vorbereiten. Kontrolle behalten.",
    sub: "HEGEVA interpretiert echte Workspace-Daten, empfiehlt den nächsten Schritt und macht jede Aktion nachvollziehbar.",
    executive: "Executive Brief",
    happened: "Was HEGEVA gefunden hat",
    important: "Was jetzt wichtig ist",
    recommend: "Empfohlener Schritt",
    radar: "Opportunity Radar",
    ask: "HEGEVA nach dem nächsten Schritt fragen",
    askButton: "Core fragen",
    prepare: "Aktion vorbereiten",
    prepared: "Vorbereitet",
    approve: "Freigeben",
    execute: "Ausführen",
    cancel: "Abbrechen",
    audit: "Auditverlauf",
    noAudit: "Noch keine Autopilot-Aktion vorbereitet.",
    integrations: "Integrationsbereitschaft",
    notConnected: "Nicht verbunden",
    integrationNote:
      "Ohne echte, vom Eigentümer autorisierte Verbindung wird kein externer Zugriff behauptet.",
    suggest: "Vorschlagen",
    prepareMode: "Vorbereiten",
    executeMode: "Fragen & Ausführen",
    owner: "Eigentümerfreigabe erforderlich",
    completed: "Abgeschlossen",
    signals: {
      "overdue-invoice": "Überfällige Rechnungen",
      "neglected-lead": "Vernachlässigte Leads",
      "stale-quote": "Angebote zum Nachfassen",
      "overdue-task": "Überfällige Verwaltung",
      "invoice-draft": "Prüfbereite Rechnungsentwürfe",
      clear: "Kein dringendes Risiko",
    },
    actions: {
      "overdue-invoice": "Rechnungsnachfassungen vorbereiten",
      "neglected-lead": "Vernachlässigte Leads prüfen",
      "stale-quote": "Angebotsnachfassungen vorbereiten",
      "overdue-task": "Überfällige Verwaltung klären",
      "invoice-draft": "Rechnungsentwürfe prüfen",
      clear: "Workspace prüfen",
    },
  },
  fr: {
    eyebrow: "HEGEVA INTELLIGENCE & AUTOPILOT · PHASE 1",
    title: "Sachez ce qui compte. Préparez le travail. Gardez le contrôle.",
    sub: "HEGEVA interprète les données réelles, recommande la prochaine étape et conserve la traçabilité de chaque action.",
    executive: "Résumé exécutif",
    happened: "Ce que HEGEVA a trouvé",
    important: "Ce qui compte maintenant",
    recommend: "Action recommandée",
    radar: "Opportunity Radar",
    ask: "Demander à HEGEVA quoi faire ensuite",
    askButton: "Interroger Core",
    prepare: "Préparer l’action",
    prepared: "Préparée",
    approve: "Approuver",
    execute: "Exécuter",
    cancel: "Annuler",
    audit: "Journal d’audit",
    noAudit: "Aucune action Autopilot préparée.",
    integrations: "État des intégrations",
    notConnected: "Non connecté",
    integrationNote:
      "Aucun accès externe n’est annoncé sans connexion réelle autorisée par le propriétaire.",
    suggest: "Suggérer",
    prepareMode: "Préparer",
    executeMode: "Demander et exécuter",
    owner: "Approbation du propriétaire requise",
    completed: "Terminée",
    signals: {
      "overdue-invoice": "Factures en retard",
      "neglected-lead": "Prospects négligés",
      "stale-quote": "Devis à relancer",
      "overdue-task": "Administration en retard",
      "invoice-draft": "Brouillons de factures à vérifier",
      clear: "Aucun risque urgent",
    },
    actions: {
      "overdue-invoice": "Préparer les relances de factures",
      "neglected-lead": "Examiner les prospects négligés",
      "stale-quote": "Préparer les relances de devis",
      "overdue-task": "Résoudre les retards administratifs",
      "invoice-draft": "Vérifier les brouillons de factures",
      clear: "Examiner l’espace",
    },
  },
  es: {
    eyebrow: "HEGEVA INTELLIGENCE & AUTOPILOT · PHASE 1",
    title: "Sabe qué importa. Prepara el trabajo. Mantén el control.",
    sub: "HEGEVA interpreta registros reales, recomienda el siguiente paso y mantiene cada acción trazable.",
    executive: "Resumen ejecutivo",
    happened: "Qué encontró HEGEVA",
    important: "Qué importa ahora",
    recommend: "Acción recomendada",
    radar: "Opportunity Radar",
    ask: "Pregunta a HEGEVA qué hacer después",
    askButton: "Preguntar a Core",
    prepare: "Preparar acción",
    prepared: "Preparada",
    approve: "Aprobar",
    execute: "Ejecutar",
    cancel: "Cancelar",
    audit: "Registro de auditoría",
    noAudit: "Aún no se ha preparado ninguna acción Autopilot.",
    integrations: "Estado de integraciones",
    notConnected: "Sin conectar",
    integrationNote:
      "No se afirma acceso externo sin una conexión real autorizada por el propietario.",
    suggest: "Sugerir",
    prepareMode: "Preparar",
    executeMode: "Preguntar y ejecutar",
    owner: "Se requiere aprobación del propietario",
    completed: "Completada",
    signals: {
      "overdue-invoice": "Facturas vencidas",
      "neglected-lead": "Contactos desatendidos",
      "stale-quote": "Presupuestos por seguir",
      "overdue-task": "Administración vencida",
      "invoice-draft": "Borradores de factura para revisar",
      clear: "Sin riesgo urgente",
    },
    actions: {
      "overdue-invoice": "Preparar seguimientos de facturas",
      "neglected-lead": "Revisar contactos desatendidos",
      "stale-quote": "Preparar seguimientos de presupuestos",
      "overdue-task": "Resolver administración vencida",
      "invoice-draft": "Revisar borradores de factura",
      clear: "Revisar el espacio",
    },
  },
} as const;

export function IntelligenceAutopilot() {
  const { locale } = useI18n();
  const c = COPY[locale];
  const { items: customers } = useWorkspaceData<AutopilotCustomer>("customers"),
    { items: tasks, setItems: setTasks } =
      useWorkspaceData<AutopilotTask>("planner"),
    { items: invoices } =
      useWorkspaceData<AutopilotInvoice>("invoice_documents"),
    {
      items: actions,
      setItems: setActions,
      cloudEnabled,
    } = useWorkspaceData<AutopilotAction>("autopilot_actions"),
    { items: audit, setItems: setAudit } =
      useWorkspaceData<AutopilotAuditEvent>("autopilot_audit");
  const { items: policies } = useWorkspaceData<AutopilotPolicy>("autopilot_policy");
  const policy = policies[0] || DEFAULT_AUTOPILOT_POLICY;
  const [asked, setAsked] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const signals = useMemo(
    () => analyseAutopilotWorkspace({ customers, tasks, invoices, today }),
    [customers, tasks, invoices, today],
  );
  const primary = signals[0];
  const label = (signal: AutopilotSignal) => c.signals[signal.kind];
  const actionTitle = (signal: AutopilotSignal) => c.actions[signal.kind];
  const log = (
    actionId: string,
    event: AutopilotAuditEvent["event"],
    summary: string,
    occurredAt: string,
  ) =>
    setAudit((all) =>
      [
        { id: crypto.randomUUID(), actionId, event, summary, occurredAt },
        ...all,
      ].slice(0, 100),
    );
  const prepare = (signal: AutopilotSignal) => {
    if (!canPrepareAutopilot(signal, actions, policy, today)) return;
    const now = new Date().toISOString();
    const action: AutopilotAction = {
      id: crypto.randomUUID(),
      signalId: signal.id,
      kind: signal.kind,
      status: "prepared",
      title: actionTitle(signal),
      sourceIds: signal.sourceIds,
      createdAt: now,
    };
    setActions((all) => [action, ...all]);
    log(action.id, "prepared", action.title, now);
    setAsked(true);
  };
  const update = (
    action: AutopilotAction,
    next: "approve" | "complete" | "cancel",
  ) => {
    const now = new Date().toISOString(),
      updated = transitionAutopilotAction(action, next, now);
    if (updated === action) return;
    setActions((all) =>
      all.map((item) => (item.id === action.id ? updated : item)),
    );
    log(
      action.id,
      updated.status === "approved"
        ? "approved"
        : updated.status === "completed"
          ? "completed"
          : "cancelled",
      updated.title,
      now,
    );
    if (updated.status === "completed")
      setTasks((all) =>
        all.some((task) => task.sourceId === `autopilot:${action.id}`)
          ? all
          : [taskForAutopilotAction(action, today), ...all],
      );
  };
  const active = actions.find(
    (item) => item.status === "prepared" || item.status === "approved",
  );
  const modes: Array<[LucideIcon, string]> = [
    [Sparkles, c.suggest],
    [FileCheck2, c.prepareMode],
    [ShieldCheck, c.executeMode],
  ];
  return (
    <section className="mt-10 space-y-5" aria-labelledby="autopilot-title">
      <header className="rounded-3xl border border-cyan-300/25 bg-gradient-to-br from-cyan-300/[.08] via-background to-emerald-300/[.06] p-6">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">
          {c.eyebrow}
        </p>
        <h2
          id="autopilot-title"
          className="mt-3 max-w-4xl font-display text-3xl font-semibold sm:text-4xl"
        >
          {c.title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {c.sub}
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {modes.map(([Icon, text]) => (
            <div
              key={String(text)}
              className="flex items-center gap-2 rounded-xl border border-border bg-background/45 p-3 text-sm font-semibold"
            >
              <Icon className="size-4 text-primary" />
              {text}
            </div>
          ))}
        </div>
      </header>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <article className="glass-panel rounded-3xl p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-gold" />
            <h3 className="text-xl font-semibold">{c.executive}</h3>
            <span className="ml-auto rounded-full border border-primary/30 px-2 py-1 text-[.62rem] text-primary">
              {cloudEnabled ? "LIVE WORKSPACE" : "LOCAL WORKSPACE"}
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border p-4">
              <small className="text-muted-foreground">{c.happened}</small>
              <strong className="mt-2 block text-2xl">
                {signals.reduce((sum, item) => sum + item.count, 0)}
              </strong>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <small className="text-muted-foreground">{c.important}</small>
              <strong className="mt-2 block text-sm">{label(primary)}</strong>
            </div>
            <div className="rounded-2xl border border-gold/35 bg-gold/5 p-4">
              <small className="text-muted-foreground">{c.recommend}</small>
              <strong className="mt-2 block text-sm text-gold">
                {actionTitle(primary)}
              </strong>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center">
            <Search className="size-5 text-primary" />
            <p className="flex-1 text-sm">{c.ask}</p>
            <button
              type="button"
              onClick={() => setAsked(true)}
              className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              {c.askButton}
            </button>
          </div>
          {asked && (
            <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-cyan-300/25 p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <small className="text-cyan-300">HEGEVA CORE</small>
                <p className="mt-1 text-sm font-semibold">
                  {actionTitle(primary)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {primary.count} · {label(primary)}
                </p>
              </div>
              {primary.kind !== "clear" && (
                <button
                  type="button"
                  onClick={() => prepare(primary)}
                  className="min-h-11 rounded-xl border border-cyan-300/35 px-4 text-sm font-semibold text-cyan-200"
                >
                  {c.prepare}
                </button>
              )}
            </div>
          )}
        </article>
        <article className="glass-panel rounded-3xl p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-primary" />
            <h3 className="text-xl font-semibold">{c.radar}</h3>
          </div>
          <div className="mt-4 space-y-2">
            {signals.map((signal) => (
              <div
                key={signal.id}
                className="flex items-center gap-3 rounded-xl border border-border p-3"
              >
                <span
                  className={`grid size-9 place-items-center rounded-full ${signal.severity === "critical" ? "bg-red-400/10 text-red-300" : signal.severity === "attention" ? "bg-gold/10 text-gold" : "bg-primary/10 text-primary"}`}
                >
                  {signal.kind === "neglected-lead" ? (
                    <UserCheck className="size-4" />
                  ) : signal.kind === "invoice-draft" ? (
                    <FileCheck2 className="size-4" />
                  ) : signal.kind === "clear" ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <AlertTriangle className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="text-sm">{label(signal)}</strong>
                  <p className="text-xs text-muted-foreground">
                    {signal.count}
                    {signal.amount
                      ? ` · ${signal.amount.toLocaleString(locale, { style: "currency", currency: signal.currency || "GBP" })}`
                      : ""}
                  </p>
                </div>
                <Link href={signal.href} aria-label={label(signal)}>
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            ))}
          </div>
        </article>
      </div>
      {active && (
        <article className="rounded-3xl border border-gold/30 bg-gold/[.05] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Clock3 className="size-5 text-gold" />
            <div className="flex-1">
              <small className="text-gold">
                AUTOPILOT ·{" "}
                {active.status === "prepared" ? c.prepared : c.owner}
              </small>
              <h3 className="mt-1 font-semibold">{active.title}</h3>
            </div>
            {active.status === "prepared" && (
              <button
                onClick={() => update(active, "approve")}
                className="min-h-11 rounded-xl border border-primary/35 px-4 text-sm font-semibold text-primary"
              >
                {c.approve}
              </button>
            )}
            {active.status === "approved" && (
              <button
                onClick={() => update(active, "complete")}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <Play className="size-4" />
                {c.execute}
              </button>
            )}
            <button
              onClick={() => update(active, "cancel")}
              className="min-h-11 rounded-xl border border-border px-4 text-sm"
            >
              {c.cancel}
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{c.owner}</p>
        </article>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <article className="glass-panel rounded-3xl p-5">
          <div className="flex items-center gap-2">
            <CloudOff className="size-5 text-muted-foreground" />
            <h3 className="font-semibold">{c.integrations}</h3>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {["Gmail / Outlook", "Google Calendar", "CRM / Commerce"].map(
              (name) => (
                <div key={name} className="rounded-xl border border-border p-3">
                  <strong className="text-sm">{name}</strong>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {c.notConnected}
                  </p>
                </div>
              ),
            )}
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {c.integrationNote}
          </p>
        </article>
        <article className="glass-panel rounded-3xl p-5">
          <div className="flex items-center gap-2">
            <History className="size-5 text-primary" />
            <h3 className="font-semibold">{c.audit}</h3>
          </div>
          <div className="mt-4 space-y-2">
            {audit.length === 0 ? (
              <p className="text-sm text-muted-foreground">{c.noAudit}</p>
            ) : (
              audit.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 text-xs"
                >
                  <ShieldCheck className="size-4 text-primary" />
                  <span className="flex-1">{event.summary}</span>
                  <strong>{event.event}</strong>
                  <time className="text-muted-foreground">
                    {new Date(event.occurredAt).toLocaleDateString(locale)}
                  </time>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
