export type DemoBusiness = { id: string; name: string; city: string; sector: string; contact: string; customers: string[]; quotes: { ref: string; customer: string; title: string; amount: number; status: string; age?: number }[]; invoices: { ref: string; customer: string; title: string; amount: number; status: string; days?: number }[]; tasks: { title: string; priority: "HIGH" | "MEDIUM" }[]; priorities: string[]; monthlyRevenue: number[] }

export const DEMO_DETAILS: Record<string, { timeline: { date: string; text: string }[]; goal: { target: number; current: number; insight: string }; opportunities: { label: string; detail: string; amount: number }[] }> = {
  "northgate-property-care": {
    timeline: [
      { date: "18 Sep", text: "Customer record prepared" },
      { date: "19 Sep", text: "Annual property maintenance quote prepared" },
      { date: "20 Sep", text: "Customer follow-up identified" },
      { date: "23 Sep", text: "Follow-up due 23 September 2026" },
    ],
    goal: { target: 9000, current: 6600, insight: "The prepared Riverside Estates Management follow-up represents the full £2,400 remaining monthly revenue gap." },
    opportunities: [{ label: "CUSTOMER FOLLOW-UP", detail: "Riverside Estates Management · follow-up due 23 September 2026", amount: 2400 }],
  },
}

export const DEMO_BUSINESSES: DemoBusiness[] = [
  {
    id: "northgate-property-care",
    name: "Northgate Property Care Ltd",
    city: "Manchester",
    sector: "Property maintenance",
    contact: "Amelia Carter",
    customers: ["Riverside Estates Management"],
    quotes: [{ ref: "QUO-DEMO-2400", customer: "Riverside Estates Management", title: "Annual property maintenance contract", amount: 2400, status: "Awaiting approval", age: 3 }],
    invoices: [{ ref: "INV-DEMO-2400", customer: "Riverside Estates Management", title: "Annual property maintenance contract", amount: 2400, status: "Prepared" }],
    tasks: [{ title: "Follow up with Riverside Estates Management", priority: "HIGH" }],
    priorities: ["Customer follow-up is due for the £2,400 annual property maintenance contract."],
    monthlyRevenue: [4200, 4700, 5100, 5600, 6100, 6600],
  },
]
