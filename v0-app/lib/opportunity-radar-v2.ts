import { expectedGoalProgress, measureGoalOutcome, type GoalEvidence, type GoalPlan } from "./goal-mode-v4"

export type RadarV2Kind="revenue-gap"|"dormant-customers"|"upsell-opportunity"|"quote-leakage"|"payment-risk"|"followup-effectiveness"|"goal-risk"|"workload-bottleneck"
export type RadarV2Finding={id:string;kind:RadarV2Kind;count:number;amount?:number;currency?:string;confidence:"high"|"medium";evidence:string[];impactValue:number;href:string}
type Customer={id:string;title?:string;customerStatus?:string;followUp?:string;updatedAt?:string;createdAt?:string}
type Invoice={id:string;type?:string;status?:string;dueDate?:string;clientName?:string;currency?:string;vatRate?:number;items?:{quantity?:number;unitPrice?:number}[]}
type Task={id:string;done?:boolean;due?:string}
type Message={id:string;sourceId?:string;workflowStatus?:string}
type Goal={id:string;createdAt:string;state:string;plan?:GoalPlan}
const total=(item:Invoice)=>(item.items||[]).reduce((sum,line)=>sum+(Number(line.quantity)||0)*(Number(line.unitPrice)||0),0)*(1+(Number(item.vatRate)||0)/100)
const safeDate=(value?:string)=>value&&/^\d{4}-\d{2}-\d{2}/.test(value)?value.slice(0,10):null

export function analyseOpportunityRadarV2(input:{customers:Customer[];invoices:Invoice[];tasks:Task[];messages:Message[];goals:Goal[];today:string;evidence:GoalEvidence}):RadarV2Finding[]{
 const {customers,invoices,tasks,messages,goals,today,evidence}=input,findings:RadarV2Finding[]=[]
 const overdueInvoices=invoices.filter(x=>x.type==="invoice"&&x.status!=="paid"&&safeDate(x.dueDate)!==null&&x.dueDate!<today),overdueAmount=overdueInvoices.reduce((sum,x)=>sum+total(x),0)
 if(overdueInvoices.length)findings.push({id:"payment-risk",kind:"payment-risk",count:overdueInvoices.length,amount:overdueAmount,currency:overdueInvoices[0]?.currency||"GBP",confidence:"high",evidence:overdueInvoices.map(x=>x.id),impactValue:100+overdueAmount,href:"/business/intelligence#customer-follow-up"})
 const staleQuotes=invoices.filter(x=>x.type==="quote"&&x.status!=="paid"&&safeDate(x.dueDate)!==null&&x.dueDate!<today),quoteAmount=staleQuotes.reduce((sum,x)=>sum+total(x),0)
 if(staleQuotes.length)findings.push({id:"quote-leakage",kind:"quote-leakage",count:staleQuotes.length,amount:quoteAmount,currency:staleQuotes[0]?.currency||"GBP",confidence:"high",evidence:staleQuotes.map(x=>x.id),impactValue:80+quoteAmount,href:"/business/intelligence#customer-follow-up"})
 const overdueTasks=tasks.filter(x=>!x.done&&safeDate(x.due)!==null&&x.due!<today)
 if(overdueTasks.length)findings.push({id:"workload-bottleneck",kind:"workload-bottleneck",count:overdueTasks.length,confidence:"high",evidence:overdueTasks.map(x=>x.id),impactValue:60+overdueTasks.length,href:"/business/planner"})
 const dormantCutoff=new Date(`${today}T00:00:00Z`);dormantCutoff.setUTCDate(dormantCutoff.getUTCDate()-90);const dormantDate=dormantCutoff.toISOString().slice(0,10),dormant=customers.filter(x=>x.customerStatus==="active"&&safeDate(x.updatedAt||x.createdAt)!==null&&(x.updatedAt||x.createdAt)!<dormantDate)
 if(dormant.length)findings.push({id:"dormant-customers",kind:"dormant-customers",count:dormant.length,confidence:"high",evidence:dormant.map(x=>x.id),impactValue:55+dormant.length,href:"/business/customers"})
 const completedFollowups=messages.filter(x=>x.sourceId&&x.workflowStatus==="completed").length,pendingFollowups=messages.filter(x=>x.sourceId&&x.workflowStatus!=="completed").length
 if(pendingFollowups||completedFollowups)findings.push({id:"followup-effectiveness",kind:"followup-effectiveness",count:pendingFollowups,confidence:"high",evidence:messages.filter(x=>x.sourceId).map(x=>x.id),impactValue:45+pendingFollowups,href:"/business/messages"})
 const goal=goals[0]
 if(goal?.plan){const outcome=measureGoalOutcome(goal.plan,evidence),expected=expectedGoalProgress(goal.createdAt,goal.plan.deadline,new Date(`${today}T12:00:00Z`));if(outcome.available&&outcome.progress!==null&&outcome.progress+5<expected)findings.push({id:"goal-risk",kind:"goal-risk",count:expected-outcome.progress,confidence:"high",evidence:[goal.id],impactValue:110+(expected-outcome.progress),href:"/command-center"});if(goal.plan.kind==="sales"&&outcome.available&&outcome.target!==null&&outcome.current!==null&&outcome.current<outcome.target)findings.push({id:"revenue-gap",kind:"revenue-gap",count:1,amount:outcome.target-outcome.current,currency:goal.plan.evidence.currency,confidence:"high",evidence:[goal.id],impactValue:90+outcome.target-outcome.current,href:"/command-center"})}
 return findings.sort((a,b)=>b.impactValue-a.impactValue)
}
