export type GoalKind = "sales" | "unpaid" | "local-customers" | "operations" | "custom"
export type GoalEvidence = { customers: number; leads: number; unpaidInvoices: number; unpaidValue: number; overdueTasks: number; currency: string; paidRevenue?: number }
export type GoalPlan = { kind: GoalKind; metric: string; baseline: number; target: number; deadline: string; evidence: GoalEvidence; stepKeys: string[] }
export type GoalOutcomeMeasurement={available:boolean;current:number|null;target:number|null;progress:number|null;source:"paid-invoices"|"active-customers"|"unpaid-invoices"|"overdue-tasks"|"unavailable"}

const words: Record<Exclude<GoalKind, "custom">, RegExp> = {
  sales: /sales|revenue|bev[eé]tel|elad[aá]s|umsatz|verkauf|ventes|chiffre|ventas|ingresos/i,
  unpaid: /unpaid|overdue invoice|kintl[eé]v|lej[aá]rt sz[aá]mla|unbezahlt|facture.*impay|factura.*impag/i,
  "local-customers": /local customer|helyi [üu]gyf[eé]l|lokale kunden|clients locaux|clientes locales/i,
  operations: /admin|task|feladat|m[uű]k[oö]d[eé]s|verwaltung|t[aâ]che|tarea|operaci[oó]n/i,
}

export function classifyGoal(value: string): GoalKind {
  return (Object.entries(words).find(([, pattern]) => pattern.test(value))?.[0] as GoalKind | undefined) || "custom"
}

function requestedGrowth(value: string) {
  const match = value.match(/(\d{1,3})\s*%/)
  return Math.min(200, Math.max(1, Number(match?.[1]) || 20))
}

export function buildGoalPlan(goal: string, evidence: GoalEvidence, today = new Date()): GoalPlan {
  const kind = classifyGoal(goal)
  const deadlineDate = new Date(today); deadlineDate.setUTCDate(deadlineDate.getUTCDate() + 30)
  const deadline = deadlineDate.toISOString().slice(0, 10)
  const config = {
    sales: { metric: "paid-revenue-growth-percent", baseline: evidence.paidRevenue || 0, target: requestedGrowth(goal), stepKeys: ["reviewRevenue", "rankCustomers", "prepareOffer", "measureRevenue"] },
    unpaid: { metric: "unpaid-invoice-count", baseline: evidence.unpaidInvoices, target: 0, stepKeys: ["reviewInvoices", "prepareFollowUps", "approveMessages", "measurePayments"] },
    "local-customers": { metric: "active-customer-count", baseline: evidence.customers, target: evidence.customers + 5, stepKeys: ["defineLocalAudience", "prepareCampaign", "followUpLeads", "measureCustomers"] },
    operations: { metric: "overdue-task-count", baseline: evidence.overdueTasks, target: 0, stepKeys: ["reviewTasks", "prioritiseWork", "completePriority", "measureOperations"] },
    custom: { metric: "completed-goal-steps", baseline: 0, target: 4, stepKeys: ["reviewEvidence", "defineMeasure", "prepareAction", "reviewResult"] },
  }[kind]
  return { kind, deadline, evidence: { ...evidence }, ...config }
}

export function goalProgress(plan: Pick<GoalPlan, "baseline" | "target">, completed: number, total: number) {
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)))
}

const boundedPercent=(value:number)=>Math.min(100,Math.max(0,Math.round(value)))

export function measureGoalOutcome(plan:GoalPlan,evidence:GoalEvidence):GoalOutcomeMeasurement{
 if(plan.kind==="sales"){
  const current=evidence.paidRevenue||0,targetValue=plan.baseline*(1+plan.target/100)
  if(plan.baseline<=0||targetValue<=plan.baseline)return{available:false,current,target:null,progress:null,source:"unavailable"}
  return{available:true,current,target:targetValue,progress:boundedPercent((current-plan.baseline)/(targetValue-plan.baseline)*100),source:"paid-invoices"}
 }
 if(plan.kind==="unpaid")return{available:true,current:evidence.unpaidInvoices,target:0,progress:plan.baseline<=0?100:boundedPercent((plan.baseline-evidence.unpaidInvoices)/plan.baseline*100),source:"unpaid-invoices"}
 if(plan.kind==="local-customers")return{available:true,current:evidence.customers,target:plan.target,progress:plan.target<=plan.baseline?100:boundedPercent((evidence.customers-plan.baseline)/(plan.target-plan.baseline)*100),source:"active-customers"}
 if(plan.kind==="operations")return{available:true,current:evidence.overdueTasks,target:0,progress:plan.baseline<=0?100:boundedPercent((plan.baseline-evidence.overdueTasks)/plan.baseline*100),source:"overdue-tasks"}
 return{available:false,current:null,target:null,progress:null,source:"unavailable"}
}

export function expectedGoalProgress(createdAt:string,deadline:string,now=new Date()){
 const start=Date.parse(createdAt),end=Date.parse(`${deadline}T23:59:59Z`),current=now.getTime()
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return 0
 return boundedPercent((current-start)/(end-start)*100)
}

export function adaptGoalPlan(plan:GoalPlan,evidence:GoalEvidence):GoalPlan{
 return{...plan,evidence:{...evidence},stepKeys:[...plan.stepKeys]}
}
