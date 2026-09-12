// Core V1 Decision Engine - Worker Runtime Version
// Pure JavaScript implementation, no TypeScript imports
// Logic ported from v0-app/lib/ modules

// =========================================
// HEGEVA CORE PRIORITY ENGINE (from hegeva-core.ts)
// =========================================

function safeCount(value) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function rankHegevaCorePriorities(signals) {
  const candidates = [
    { kind: "complete-followups", count: safeCount(signals.approvedFollowUps), href: "/business/messages", severity: "attention" },
    { kind: "review-followups", count: safeCount(signals.followUpsAwaitingApproval), href: "/business/messages", severity: "attention" },
    { kind: "overdue-invoices", count: safeCount(signals.overdueInvoices), href: "/business/intelligence#customer-follow-up", severity: "attention" },
    { kind: "customer-followups", count: safeCount(signals.customerFollowUpsDue), href: "/business/customers", severity: "attention" },
    { kind: "stale-quotes", count: safeCount(signals.staleQuotes), href: "/business/intelligence#customer-follow-up", severity: "attention" },
    { kind: "overdue-tasks", count: safeCount(signals.overdueTasks), href: "/business/planner", severity: "attention" },
    { kind: "today-tasks", count: safeCount(signals.tasksToday), href: "/business/planner", severity: "attention" },
    { kind: "draft-invoices", count: safeCount(signals.draftInvoices), href: "/business/invoices", severity: "ready" },
  ];
  const ranked = candidates.filter(item => item.count > 0);
  return ranked.length ? ranked : [
    signals.hasRecords
      ? { kind: "clear", count: 0, href: "/business", severity: "ready" }
      : { kind: "start", count: 0, href: "/business/customers", severity: "ready" }
  ];
}

export function selectHegevaCorePriority(signals) {
  return rankHegevaCorePriorities(signals)[0];
}

// =========================================
// OPPORTUNITY RADAR V2 (from opportunity-radar-v2.ts)
// =========================================

function radarTotal(item) {
  return (item.items || []).reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0) * (1 + (Number(item.vatRate) || 0) / 100);
}

function radarSafeDate(value) {
  return value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;
}

export function analyseOpportunityRadarV2(input) {
  const { customers, invoices, tasks, messages, goals, today, evidence } = input;
  const findings = [];

  const overdueInvoices = invoices.filter(x => x.type === "invoice" && x.status !== "paid" && radarSafeDate(x.dueDate) !== null && x.dueDate < today);
  const overdueAmount = overdueInvoices.reduce((sum, x) => sum + radarTotal(x), 0);
  if (overdueInvoices.length) {
    findings.push({
      id: "payment-risk",
      kind: "payment-risk",
      count: overdueInvoices.length,
      amount: overdueAmount,
      currency: overdueInvoices[0]?.currency || "GBP",
      confidence: "high",
      evidence: overdueInvoices.map(x => x.id),
      impactValue: 100 + overdueAmount,
      href: "/business/intelligence#customer-follow-up",
    });
  }

  const staleQuotes = invoices.filter(x => x.type === "quote" && x.status !== "paid" && radarSafeDate(x.dueDate) !== null && x.dueDate < today);
  const quoteAmount = staleQuotes.reduce((sum, x) => sum + radarTotal(x), 0);
  if (staleQuotes.length) {
    findings.push({
      id: "quote-leakage",
      kind: "quote-leakage",
      count: staleQuotes.length,
      amount: quoteAmount,
      currency: staleQuotes[0]?.currency || "GBP",
      confidence: "high",
      evidence: staleQuotes.map(x => x.id),
      impactValue: 80 + quoteAmount,
      href: "/business/intelligence#customer-follow-up",
    });
  }

  const overdueTasks = tasks.filter(x => !x.done && radarSafeDate(x.due) !== null && x.due < today);
  if (overdueTasks.length) {
    findings.push({
      id: "workload-bottleneck",
      kind: "workload-bottleneck",
      count: overdueTasks.length,
      confidence: "high",
      evidence: overdueTasks.map(x => x.id),
      impactValue: 60 + overdueTasks.length,
      href: "/business/planner",
    });
  }

  const dormantCutoff = new Date(`${today}T00:00:00Z`);
  dormantCutoff.setUTCDate(dormantCutoff.getUTCDate() - 90);
  const dormantDate = dormantCutoff.toISOString().slice(0, 10);
  const dormant = customers.filter(x =>
    x.customerStatus === "active" && radarSafeDate(x.updatedAt || x.createdAt) !== null && (x.updatedAt || x.createdAt) < dormantDate
  );
  if (dormant.length) {
    findings.push({
      id: "dormant-customers",
      kind: "dormant-customers",
      count: dormant.length,
      confidence: "high",
      evidence: dormant.map(x => x.id),
      impactValue: 55 + dormant.length,
      href: "/business/customers",
    });
  }

  const completedFollowups = messages.filter(x => x.sourceId && x.workflowStatus === "completed").length;
  const pendingFollowups = messages.filter(x => x.sourceId && x.workflowStatus !== "completed").length;
  if (pendingFollowups || completedFollowups) {
    findings.push({
      id: "followup-effectiveness",
      kind: "followup-effectiveness",
      count: pendingFollowups,
      confidence: "high",
      evidence: messages.filter(x => x.sourceId).map(x => x.id),
      impactValue: 45 + pendingFollowups,
      href: "/business/messages",
    });
  }

  const goal = goals[0];
  if (goal?.plan) {
    // Simplified goal risk check without full goal-mode-v4 dependency
    if (goal.plan.kind === "sales" && goal.plan.target) {
      findings.push({
        id: "revenue-gap",
        kind: "revenue-gap",
        count: 1,
        amount: Math.max(0, goal.plan.target - (evidence.paidRevenue || 0)),
        currency: evidence.currency || "GBP",
        confidence: "high",
        evidence: [goal.id],
        impactValue: 90 + Math.max(0, goal.plan.target - (evidence.paidRevenue || 0)),
        href: "/command-center",
      });
    }
  }

  return findings.sort((a, b) => b.impactValue - a.impactValue);
}

// =========================================
// FIX MY BUSINESS (from fix-my-business.ts)
// =========================================

function fixTotal(invoice) {
  return (invoice.items || []).reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0) * (1 + (Number(invoice.vatRate) || 0) / 100);
}

export function diagnoseBusiness(input) {
  const { today, customers, tasks, invoices } = input;
  const overdueInvoices = invoices.filter(x => x.type === "invoice" && x.status !== "paid" && x.dueDate && x.dueDate < today);
  const neglectedLeads = customers.filter(x => x.customerStatus === "lead" && x.followUp && x.followUp < today);
  const overdueTasks = tasks.filter(x => !x.done && x.due && x.due < today);
  const signals = [];

  if (overdueInvoices.length) {
    signals.push({
      kind: "cash",
      severity: "critical",
      count: overdueInvoices.length,
      amount: overdueInvoices.filter(x => (x.currency || "GBP") === "GBP").reduce((sum, x) => sum + fixTotal(x), 0),
      sourceIds: overdueInvoices.map(x => x.id),
      actionKey: "recoverCash",
    });
  }
  if (neglectedLeads.length) {
    signals.push({
      kind: "leads",
      severity: "attention",
      count: neglectedLeads.length,
      sourceIds: neglectedLeads.map(x => x.id),
      actionKey: "followLeads",
    });
  }
  if (overdueTasks.length) {
    signals.push({
      kind: "operations",
      severity: "attention",
      count: overdueTasks.length,
      sourceIds: overdueTasks.map(x => x.id),
      actionKey: "clearTasks",
    });
  }
  if (!customers.length && !invoices.length && !tasks.length) {
    signals.push({
      kind: "foundation",
      severity: "ready",
      count: 0,
      sourceIds: [],
      actionKey: "buildFoundation",
    });
  }
  if (!signals.length) {
    signals.push({
      kind: "clear",
      severity: "ready",
      count: 0,
      sourceIds: [],
      actionKey: "reviewGrowth",
    });
  }
  return signals.slice(0, 3);
}

// =========================================
// GOAL MODE (simplified from goal-mode-v4.ts)
// =========================================

function boundedPercent(value) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function measureGoalOutcome(plan, evidence) {
  if (plan.kind === "sales") {
    const current = evidence.paidRevenue || 0;
    const targetValue = plan.baseline * (1 + plan.target / 100);
    if (plan.baseline <= 0 || targetValue <= plan.baseline) {
      return { available: false, current, target: null, progress: null, source: "unavailable" };
    }
    return { available: true, current, target: targetValue, progress: boundedPercent((current - plan.baseline) / (targetValue - plan.baseline) * 100), source: "paid-invoices" };
  }
  if (plan.kind === "unpaid") {
    return { available: true, current: evidence.unpaidInvoices, target: 0, progress: plan.baseline <= 0 ? 100 : boundedPercent((plan.baseline - evidence.unpaidInvoices) / plan.baseline * 100), source: "unpaid-invoices" };
  }
  if (plan.kind === "local-customers") {
    return { available: true, current: evidence.customers, target: plan.target, progress: plan.target <= plan.baseline ? 100 : boundedPercent((evidence.customers - plan.baseline) / (plan.target - plan.baseline) * 100), source: "active-customers" };
  }
  if (plan.kind === "operations") {
    return { available: true, current: evidence.overdueTasks, target: 0, progress: plan.baseline <= 0 ? 100 : boundedPercent((plan.baseline - evidence.overdueTasks) / plan.baseline * 100), source: "overdue-tasks" };
  }
  return { available: false, current: null, target: null, progress: null, source: "unavailable" };
}

export function expectedGoalProgress(createdAt, deadline, now = new Date()) {
  const start = Date.parse(createdAt);
  const end = Date.parse(`${deadline}T23:59:59Z`);
  const current = now.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return boundedPercent((current - start) / (end - start) * 100);
}

// =========================================
// AUTOPILOT (simplified from autopilot-v1.ts)
// =========================================

function autopilotTotal(doc) {
  return (doc.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0) * (1 + (Number(doc.vatRate) || 0) / 100);
}

export function analyseAutopilotWorkspace(input) {
  const { customers, tasks, invoices, today } = input;
  const overdueInvoices = invoices.filter(item => item.type === "invoice" && item.status !== "paid" && item.dueDate && item.dueDate < today);
  const neglectedLeads = customers.filter(item => item.customerStatus === "lead" && item.followUp && item.followUp <= today);
  const staleQuotes = invoices.filter(item => item.type === "quote" && item.status !== "paid" && item.dueDate && item.dueDate < today);
  const overdueTasks = tasks.filter(item => !item.done && item.due && item.due < today);
  const invoiceDrafts = invoices.filter(item => item.type === "invoice" && item.status === "draft");

  const groups = [
    { id: "overdue-invoice", kind: "overdue-invoice", severity: "critical", count: overdueInvoices.length, amount: overdueInvoices.filter(item => (item.currency || "GBP") === "GBP").reduce((sum, item) => sum + autopilotTotal(item), 0), currency: "GBP", sourceIds: overdueInvoices.map(item => item.id), href: "/business/intelligence#customer-follow-up" },
    { id: "neglected-lead", kind: "neglected-lead", severity: "attention", count: neglectedLeads.length, sourceIds: neglectedLeads.map(item => item.id), href: "/business/customers" },
    { id: "stale-quote", kind: "stale-quote", severity: "attention", count: staleQuotes.length, amount: staleQuotes.filter(item => (item.currency || "GBP") === "GBP").reduce((sum, item) => sum + autopilotTotal(item), 0), currency: "GBP", sourceIds: staleQuotes.map(item => item.id), href: "/business/intelligence#customer-follow-up" },
    { id: "overdue-task", kind: "overdue-task", severity: "attention", count: overdueTasks.length, sourceIds: overdueTasks.map(item => item.id), href: "/business/planner" },
    { id: "invoice-draft", kind: "invoice-draft", severity: "ready", count: invoiceDrafts.length, sourceIds: invoiceDrafts.map(item => item.id), href: "/business/invoices" },
  ];

  const active = groups.filter(signal => signal.count > 0);
  return active.length ? active : [{ id: "clear", kind: "clear", severity: "ready", count: 0, sourceIds: [], href: "/business" }];
}

// =========================================
// BUSINESS TWIN (from business-twin.ts)
// =========================================

function finite(value) {
  return Number.isFinite(value) ? value : 0;
}

export function simulateBusinessTwin(input) {
  const paidRevenue = Math.max(0, finite(input.paidRevenue));
  const expenses = Math.max(0, finite(input.expenses));
  const customers = Math.max(0, Math.round(finite(input.customers)));
  const priceChange = Math.min(200, Math.max(-90, finite(input.priceChangePercent))) / 100;
  const retention = Math.min(100, Math.max(0, finite(input.retentionPercent))) / 100;
  const marketingSpend = Math.max(0, finite(input.marketingSpend));
  const newCustomers = Math.max(0, Math.round(finite(input.expectedNewCustomers)));
  const averageValue = Math.max(0, finite(input.averageCustomerValue));

  const retainedRevenue = paidRevenue * (1 + priceChange) * retention;
  const acquiredRevenue = newCustomers * averageValue;
  const projectedRevenue = retainedRevenue + acquiredRevenue;
  const baselineNet = paidRevenue - expenses;
  const projectedNet = projectedRevenue - expenses - marketingSpend;

  return {
    baselineRevenue: paidRevenue,
    baselineNet,
    projectedRevenue,
    projectedNet,
    revenueDelta: projectedRevenue - paidRevenue,
    netDelta: projectedNet - baselineNet,
    projectedCustomers: Math.round(customers * retention) + newCustomers,
    assumptions: [
      `price-change:${Math.round(priceChange * 100)}%`,
      `retention:${Math.round(retention * 100)}%`,
      `marketing-spend:${marketingSpend}`,
      `new-customers:${newCustomers}`,
      `average-customer-value:${averageValue}`,
    ],
  };
}

// =========================================
// PULSE & COMPANION (from roadmap-foundations.ts)
// =========================================

export function createWorkspacePulseProjection(input) {
  const local = input.scope === "local-browser";
  const continuity = [
    local ? "Local workspace" : "Authenticated workspace",
    input.hasRecords ? "Workspace records available" : "No workspace data available",
    input.missionState === "awaiting-approval" ? "Mission awaiting approval" : "Mission context available",
  ];
  return {
    understood: input.hasRecords ? "Workspace continuity is ready for review." : "No workspace data available.",
    continuity,
    needsUser: input.missionState === "awaiting-approval" ? "Review and approve the next mission step." : undefined,
    nextActions: input.openTasks > 0 ? ["Review open work", "Open the planner"] : ["Review current state", "Choose the next step"],
  };
}

export function createCompanionProjection(input) {
  const safe = (value) => value.trim().slice(0, 120);
  return {
    context: [safe(input.pulse.understood), ...input.pulse.continuity.slice(0, 3).map(safe), input.pulse.needsUser ? safe(input.pulse.needsUser) : ""].filter(Boolean),
    suggestions: input.suggestions.slice(0, 3).map(safe).filter(Boolean),
    scope: input.scope,
    userControlled: true,
  };
}

// =========================================
// SIGNAL EXTRACTION
// =========================================

function extractCoreSignals(workspaceData, today) {
  const { customers, invoices, tasks, messages, documents, expenses } = workspaceData;

  const overdueInvoiceRecords = invoices.filter(item =>
    item.type === "invoice" && item.status !== "paid" && item.dueDate && item.dueDate < today
  );
  const openInvoices = invoices.filter(item => item.type === "invoice" && item.status !== "paid");
  const expectedRevenue = openInvoices
    .filter(item => (item.currency || "GBP") === "GBP")
    .reduce((sum, item) => {
      const subtotal = (item.items || []).reduce((v, line) => v + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0);
      return sum + subtotal * (1 + (Number(item.vatRate) || 0) / 100);
    }, 0);
  const overdueRevenue = overdueInvoiceRecords
    .filter(item => (item.currency || "GBP") === "GBP")
    .reduce((sum, item) => {
      const subtotal = (item.items || []).reduce((v, line) => v + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0);
      return sum + subtotal * (1 + (Number(item.vatRate) || 0) / 100);
    }, 0);

  const followUpsAwaitingApproval = messages.filter(item => item.sourceId && (!item.workflowStatus || item.workflowStatus === "draft")).length;
  const approvedFollowUps = messages.filter(item => item.sourceId && item.workflowStatus === "approved").length;
  const customerFollowUpsDue = customers.filter(item => item.followUp && item.followUp <= today && item.customerStatus !== "paused").length;
  const staleQuotes = invoices.filter(item => item.type === "quote" && item.status !== "paid" && item.dueDate && item.dueDate < today).length;
  const draftInvoices = invoices.filter(item => item.type === "invoice" && item.status === "draft").length;
  const openTasks = tasks.filter(item => !item.done);
  const overdueTasks = openTasks.filter(item => item.due && item.due < today).length;
  const tasksToday = openTasks.filter(item => item.due === today).length;
  const hasRecords = customers.length + documents.length + expenses.length + invoices.length > 0;

  return {
    approvedFollowUps,
    followUpsAwaitingApproval,
    overdueInvoices: overdueInvoiceRecords.length,
    customerFollowUpsDue,
    staleQuotes,
    overdueTasks,
    tasksToday,
    draftInvoices,
    hasRecords,
    _context: {
      expectedRevenue,
      overdueRevenue,
      openInvoices: openInvoices.length,
      customers: customers.length,
      documents: documents.length,
      expenses: expenses.length,
      openTasks: openTasks.length,
      activeFollowUps: messages.filter(item => item.sourceId && item.workflowStatus !== "completed").length,
    }
  };
}

// =========================================
// CORE DECISION ENGINE
// =========================================

export function computeCoreDecision(workspaceData, cloudEnabled) {
  const today = new Date().toISOString().slice(0, 10);
  const coreSignals = extractCoreSignals(workspaceData, today);

  // Core priorities
  const corePriorities = rankHegevaCorePriorities(coreSignals);
  const coreDecision = selectHegevaCorePriority(coreSignals);

  // Opportunity Radar
  const radarInput = {
    customers: workspaceData.customers,
    invoices: workspaceData.invoices,
    tasks: workspaceData.tasks,
    messages: workspaceData.messages,
    goals: workspaceData.goals || [],
    today,
    evidence: {
      customers: workspaceData.customers.length,
      leads: workspaceData.customers.filter(c => c.customerStatus === "lead").length,
      unpaidInvoices: workspaceData.invoices.filter(i => i.type === "invoice" && i.status !== "paid").length,
      unpaidValue: coreSignals._context.overdueRevenue,
      overdueTasks: coreSignals.overdueTasks,
      currency: "GBP",
    }
  };
  const opportunityRadar = analyseOpportunityRadarV2(radarInput);

  // Fix My Business
  const fixInput = {
    today,
    customers: workspaceData.customers,
    tasks: workspaceData.tasks,
    invoices: workspaceData.invoices,
  };
  const fixMyBusiness = diagnoseBusiness(fixInput);

  // Goal Mode (if active goal exists)
  const activeGoal = workspaceData.goals?.[0];
  let goalMode = null;
  if (activeGoal?.plan) {
    const outcome = measureGoalOutcome(activeGoal.plan, {
      customers: workspaceData.customers.length,
      leads: workspaceData.customers.filter(c => c.customerStatus === "lead").length,
      unpaidInvoices: workspaceData.invoices.filter(i => i.type === "invoice" && i.status !== "paid").length,
      unpaidValue: coreSignals._context.overdueRevenue,
      overdueTasks: coreSignals.overdueTasks,
      currency: "GBP",
      paidRevenue: coreSignals._context.expectedRevenue,
    });
    const expected = expectedGoalProgress(activeGoal.createdAt, activeGoal.plan.deadline, new Date(`${today}T12:00:00Z`));
    goalMode = {
      plan: activeGoal.plan,
      outcome,
      expectedProgress: expected,
      onTrack: outcome.available && outcome.progress !== null && outcome.progress + 5 >= expected,
    };
  }

  // Pulse & Companion
  const pulse = createWorkspacePulseProjection({
    scope: cloudEnabled ? "authenticated-cloud" : "local-browser",
    hasRecords: coreSignals.hasRecords,
    openTasks: coreSignals._context.openTasks,
    missionState: "awaiting-approval",
  });

  const companion = createCompanionProjection({
    pulse,
    scope: cloudEnabled ? "authenticated-cloud" : "local-browser",
    customers: workspaceData.customers.length,
    openTasks: coreSignals._context.openTasks,
    documents: workspaceData.documents.length,
    suggestions: corePriorities.slice(0, 3).map(p => `${p.kind}: ${p.count}`),
  });

  return {
    coreSignals,
    corePriorities,
    coreDecision,
    opportunityRadar,
    fixMyBusiness,
    goalMode,
    pulse,
    companion,
  };
}

// =========================================
// ACTION PREPARATION (DRAFT ONLY)
// =========================================

function prepareFollowupMessageDraft(signal, workspaceData, locale = "en") {
  const customer = workspaceData.customers.find(c => signal.sourceIds?.includes(c.id));
  const message = workspaceData.messages.find(m => signal.sourceIds?.includes(m.id));
  const templates = {
    en: (c, m) => `Follow up with ${c?.title || "customer"}: ${m?.content?.slice(0, 200) || "Review pending follow-up"}`,
    hu: (c, m) => `Utánkövetés ${c?.title || "ügyfél"}-sel: ${m?.content?.slice(0, 200) || "Függőben lévő utánkövetés áttekintése"}`,
    de: (c, m) => `Nachfassen bei ${c?.title || "Kunde"}: ${m?.content?.slice(0, 200) || "Offene Nachfassaktion prüfen"}`,
    fr: (c, m) => `Relancer ${c?.title || "client"}: ${m?.content?.slice(0, 200) || "Examiner le suivi en attente"}`,
    es: (c, m) => `Hacer seguimiento con ${c?.title || "cliente"}: ${m?.content?.slice(0, 200) || "Revisar seguimiento pendiente"}`,
  };
  const t = templates[locale] || templates.en;
  return {
    kind: "followup-message",
    status: "prepared",
    title: `Follow up: ${customer?.title || "Customer"}`,
    content: t(customer, message),
    sourceIds: signal.sourceIds,
    targetType: "messages",
    targetHref: "/business/messages",
    reason: "followup-approval-pending",
    preparedAt: new Date().toISOString(),
  };
}

function prepareInvoiceFollowupDraft(signal, workspaceData, locale = "en") {
  const invoice = workspaceData.invoices.find(i => signal.sourceIds?.includes(i.id));
  const subtotal = invoice?.items?.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0) || 0;
  const total = subtotal * (1 + (Number(invoice?.vatRate) || 0) / 100);
  const templates = {
    en: (i, t) => `Send payment reminder for invoice ${i?.number || "INV-XXX"} (${i?.currency || "GBP"} ${t})`,
    hu: (i, t) => `Fizetési emlékeztető küldése a(z) ${i?.number || "INV-XXX"} számlához (${i?.currency || "GBP"} ${t})`,
    de: (i, t) => `Zahlungserinnerung für Rechnung ${i?.number || "INV-XXX"} senden (${i?.currency || "GBP"} ${t})`,
    fr: (i, t) => `Envoyer un rappel de paiement pour la facture ${i?.number || "INV-XXX"} (${i?.currency || "GBP"} ${t})`,
    es: (i, t) => `Enviar recordatorio de pago para la factura ${i?.number || "INV-XXX"} (${i?.currency || "GBP"} ${t})`,
  };
  const t = templates[locale] || templates.en;
  return {
    kind: "invoice-followup",
    status: "prepared",
    title: `Payment reminder: ${invoice?.number || "Invoice"}`,
    content: t(invoice, total.toFixed(2)),
    sourceIds: signal.sourceIds,
    targetType: "messages",
    targetHref: "/business/messages",
    reason: "overdue-invoice-followup",
    preparedAt: new Date().toISOString(),
  };
}

function prepareTaskDraft(signal, workspaceData, locale = "en") {
  const task = workspaceData.tasks.find(t => signal.sourceIds?.includes(t.id));
  const templates = {
    en: (t) => `Complete overdue task: ${t?.title || "Task"}${t?.due ? ` (due ${t.due})` : ""}`,
    hu: (t) => `Lejárt feladat befejezése: ${t?.title || "Feladat"}${t?.due ? ` (határidő ${t.due})` : ""}`,
    de: (t) => `Überfällige Aufgabe erledigen: ${t?.title || "Aufgabe"}${t?.due ? ` (fällig ${t.due})` : ""}`,
    fr: (t) => `Terminer la tâche en retard: ${t?.title || "Tâche"}${t?.due ? ` (échéance ${t.due})` : ""}`,
    es: (t) => `Completar tarea vencida: ${t?.title || "Tarea"}${t?.due ? ` (vencimiento ${t.due})` : ""}`,
  };
  const t = templates[locale] || templates.en;
  return {
    kind: "task",
    status: "prepared",
    title: `Task: ${task?.title || "Overdue task"}`,
    content: t(task),
    sourceIds: signal.sourceIds,
    targetType: "planner",
    targetHref: "/business/planner",
    reason: "overdue-task",
    preparedAt: new Date().toISOString(),
  };
}

function prepareX20SpecDraft(signal, workspaceData, locale = "en") {
  return {
    kind: "x20-spec",
    status: "prepared",
    title: "Build X20 app for workflow automation",
    content: `Generate an X20 application to automate: ${signal.kind.replace(/-/g, " ")}. This app would connect ${signal.sourceIds?.length || 0} workspace records.`,
    sourceIds: signal.sourceIds,
    targetType: "app-studio",
    targetHref: "/app-studio/build-my-app-x20",
    reason: "automation-opportunity",
    preparedAt: new Date().toISOString(),
  };
}

function prepareCreativeBriefDraft(signal, workspaceData, locale = "en") {
  return {
    kind: "creative-brief",
    status: "prepared",
    title: "Create marketing asset for campaign",
    content: `Draft creative brief for: ${signal.kind}. Target audience: existing customers with overdue invoices.`,
    sourceIds: signal.sourceIds,
    targetType: "creative",
    targetHref: "/app-studio/advertising",
    reason: "marketing-opportunity",
    preparedAt: new Date().toISOString(),
  };
}

function prepareAIBotHandoffDraft(signal, workspaceData, locale = "en") {
  return {
    kind: "ai-bot-handoff",
    status: "prepared",
    title: "Delegate to AI Bot",
    content: `Handoff to AI Bot for: ${signal.kind}. Context: ${signal.sourceIds?.length || 0} related records.`,
    sourceIds: signal.sourceIds,
    targetType: "ai-bot",
    targetHref: "/app-studio/ai-bots",
    reason: "ai-bot-delegation",
    preparedAt: new Date().toISOString(),
  };
}

const PREPARATION_DISPATCH = {
  "complete-followups": prepareFollowupMessageDraft,
  "review-followups": prepareFollowupMessageDraft,
  "customer-followups": prepareFollowupMessageDraft,
  "overdue-invoices": prepareInvoiceFollowupDraft,
  "stale-quotes": prepareInvoiceFollowupDraft,
  "draft-invoices": prepareInvoiceFollowupDraft,
  "overdue-tasks": prepareTaskDraft,
  "today-tasks": prepareTaskDraft,
  "payment-risk": prepareInvoiceFollowupDraft,
  "quote-leakage": prepareInvoiceFollowupDraft,
  "workload-bottleneck": prepareTaskDraft,
  "dormant-customers": prepareFollowupMessageDraft,
  "followup-effectiveness": prepareFollowupMessageDraft,
  "goal-risk": prepareTaskDraft,
  "revenue-gap": prepareX20SpecDraft,
  "cash": prepareInvoiceFollowupDraft,
  "leads": prepareFollowupMessageDraft,
  "operations": prepareTaskDraft,
  "foundation": prepareX20SpecDraft,
};

export function prepareActionsForSignals(signals, workspaceData, locale = "en", max = 3) {
  const allSignals = [];

  // Core priority signals
  for (const priority of signals.corePriorities) {
    if (PREPARATION_DISPATCH[priority.kind]) {
      allSignals.push({ kind: priority.kind, sourceIds: [priority.kind], severity: priority.severity, href: priority.href });
    }
  }

  // Opportunity Radar signals
  for (const finding of signals.opportunityRadar) {
    if (PREPARATION_DISPATCH[finding.kind]) {
      allSignals.push({ kind: finding.kind, sourceIds: finding.evidence, severity: finding.confidence, href: finding.href });
    }
  }

  // Fix My Business signals
  for (const fix of signals.fixMyBusiness) {
    if (PREPARATION_DISPATCH[fix.kind]) {
      allSignals.push({ kind: fix.kind, sourceIds: fix.sourceIds, severity: fix.severity, href: fix.actionKey });
    }
  }

  // Deduplicate by kind, keep highest severity
  const byKind = new Map();
  for (const s of allSignals) {
    const existing = byKind.get(s.kind);
    const severityOrder = { critical: 3, attention: 2, ready: 1, high: 3, medium: 2, low: 1 };
    if (!existing || (severityOrder[s.severity] || 0) > (severityOrder[existing.severity] || 0)) {
      byKind.set(s.kind, s);
    }
  }

  // Sort by severity, take top N
  const sorted = [...byKind.values()].sort((a, b) => {
    const sevOrder = { critical: 3, attention: 2, ready: 1, high: 3, medium: 2, low: 1 };
    return (sevOrder[b.severity] || 0) - (sevOrder[a.severity] || 0);
  }).slice(0, max);

  // Prepare drafts
  return sorted.map(s => {
    const fn = PREPARATION_DISPATCH[s.kind];
    return fn ? fn(s, workspaceData, locale) : null;
  }).filter(Boolean);
}

// =========================================
// MAIN EXPORT
// =========================================

export function runCoreV1Decision(workspaceData, cloudEnabled, locale = "en") {
  const decision = computeCoreDecision(workspaceData, cloudEnabled);
  const preparedActions = prepareActionsForSignals(decision, workspaceData, locale, 3);

  return {
    coreSignals: decision.coreSignals,
    corePriorities: decision.corePriorities,
    coreDecision: decision.coreDecision,
    opportunityRadar: decision.opportunityRadar,
    fixMyBusiness: decision.fixMyBusiness,
    goalMode: decision.goalMode,
    pulse: decision.pulse,
    companion: decision.companion,
    priorities: decision.corePriorities.map(p => ({
      kind: p.kind,
      count: p.count,
      href: p.href,
      severity: p.severity,
    })),
    preparedActions,
    metadata: {
      version: "core-v1",
      generatedAt: new Date().toISOString(),
      locale,
      scope: cloudEnabled ? "authenticated-cloud" : "local-browser",
    },
  };
}
