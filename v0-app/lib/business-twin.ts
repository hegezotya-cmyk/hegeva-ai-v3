export type TwinInputs={paidRevenue:number;expenses:number;customers:number;priceChangePercent:number;retentionPercent:number;marketingSpend:number;expectedNewCustomers:number;averageCustomerValue:number}
export type TwinProjection={baselineRevenue:number;baselineNet:number;projectedRevenue:number;projectedNet:number;revenueDelta:number;netDelta:number;projectedCustomers:number;assumptions:string[]}

const finite=(value:number)=>Number.isFinite(value)?value:0
export function simulateBusinessTwin(input:TwinInputs):TwinProjection{
 const paidRevenue=Math.max(0,finite(input.paidRevenue)),expenses=Math.max(0,finite(input.expenses)),customers=Math.max(0,Math.round(finite(input.customers)))
 const priceChange=Math.min(200,Math.max(-90,finite(input.priceChangePercent)))/100
 const retention=Math.min(100,Math.max(0,finite(input.retentionPercent)))/100
 const marketingSpend=Math.max(0,finite(input.marketingSpend)),newCustomers=Math.max(0,Math.round(finite(input.expectedNewCustomers))),averageValue=Math.max(0,finite(input.averageCustomerValue))
 const retainedRevenue=paidRevenue*(1+priceChange)*retention
 const acquiredRevenue=newCustomers*averageValue
 const projectedRevenue=retainedRevenue+acquiredRevenue
 const baselineNet=paidRevenue-expenses,projectedNet=projectedRevenue-expenses-marketingSpend
 return {baselineRevenue:paidRevenue,baselineNet,projectedRevenue,projectedNet,revenueDelta:projectedRevenue-paidRevenue,netDelta:projectedNet-baselineNet,projectedCustomers:Math.round(customers*retention)+newCustomers,assumptions:[`price-change:${Math.round(priceChange*100)}%`,`retention:${Math.round(retention*100)}%`,`marketing-spend:${marketingSpend}`,`new-customers:${newCustomers}`,`average-customer-value:${averageValue}`]}
}
