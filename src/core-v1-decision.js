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
// BUSINESS RULES V1 (DETERMINISTIC / SIDE-EFFECT FREE)
// =========================================

export function evaluateBusinessRules(workspaceData, today = new Date().toISOString().slice(0, 10)) {
  const validDay = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;
  if (!validDay(today)) return [];
  const signals = [];
  const invoices = Array.isArray(workspaceData?.invoices) ? workspaceData.invoices : [];
  const customers = Array.isArray(workspaceData?.customers) ? workspaceData.customers : [];
  const tasks = Array.isArray(workspaceData?.tasks) ? workspaceData.tasks : [];

  const overdueInvoices = invoices.filter(x => x.type === "invoice" && x.status !== "paid" && validDay(x.dueDate) && x.dueDate < today);
  if (overdueInvoices.length) signals.push({ kind: "overdue-invoices", sourceIds: overdueInvoices.map(x => x.id), severity: "high", href: "/business/intelligence#customer-follow-up", ruleId: "overdue-invoice", requiresApproval: true });

  const staleQuotes = invoices.filter(x => x.type === "quote" && x.status !== "paid" && validDay(x.dueDate) && x.dueDate < today);
  if (staleQuotes.length) signals.push({ kind: "stale-quotes", sourceIds: staleQuotes.map(x => x.id), severity: "high", href: "/business/intelligence#customer-follow-up", ruleId: "stale-quote", requiresApproval: true });

  const dueLeads = customers.filter(x => x.customerStatus === "lead" && validDay(x.followUp) && x.followUp <= today);
  if (dueLeads.length) signals.push({ kind: "customer-followups", sourceIds: dueLeads.map(x => x.id), severity: "high", href: "/business/customers", ruleId: "lead-follow-up", requiresApproval: true });

  const cutoff = new Date(today + "T00:00:00Z"); cutoff.setUTCDate(cutoff.getUTCDate() - 90);
  const dormantBefore = cutoff.toISOString().slice(0, 10);
  const dormant = customers.filter(x => x.customerStatus === "active" && validDay(x.updatedAt || x.createdAt) && (x.updatedAt || x.createdAt).slice(0, 10) < dormantBefore);
  if (dormant.length) signals.push({ kind: "dormant-customers", sourceIds: dormant.map(x => x.id), severity: "medium", href: "/business/customers", ruleId: "dormant-customer", requiresApproval: true });

  const overdueTasks = tasks.filter(x => !x.done && validDay(x.due) && x.due < today);
  if (overdueTasks.length) signals.push({ kind: "overdue-tasks", sourceIds: overdueTasks.map(x => x.id), severity: "medium", href: "/business/planner", ruleId: "overdue-task", requiresApproval: true });

  return signals;
}

// =========================================
// LEAD-TO-MONEY V1 (EVIDENCE PROJECTION)
// =========================================
export function projectLeadToMoney(workspaceData) {
  const customers=Array.isArray(workspaceData?.customers)?workspaceData.customers:[];
  const documents=Array.isArray(workspaceData?.invoices)?workspaceData.invoices:[];
  const messages=Array.isArray(workspaceData?.messages)?workspaceData.messages:[];
  const unique=(values)=>[...new Set(values.filter(Boolean))]; const records=[];
  for(const customer of customers){
    const docs=documents.filter(d=>d.customerId===customer.id||d.sourceId===customer.id),quotes=docs.filter(d=>d.type==="quote"),invoices=docs.filter(d=>d.type==="invoice"),related=unique([customer.id,...docs.map(d=>d.id)]),msgs=messages.filter(m=>m.sourceId&&related.includes(m.sourceId)),paid=invoices.some(i=>i.status==="paid"),openInvoice=invoices.some(i=>i.status!=="paid"),hasFollowup=msgs.some(m=>["draft","approved","completed"].includes(m.workflowStatus||""))||Boolean(customer.followUp);
    if(customer.customerStatus==="lead"&&!quotes.length) records.push({stage:"qualified",status:"needs-attention",sourceIds:[customer.id],nextStage:"quote",kind:"lead-qualification",severity:"high",href:"/business/customers"});