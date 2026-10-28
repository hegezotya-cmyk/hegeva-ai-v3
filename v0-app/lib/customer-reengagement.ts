export type ReengagementCustomer = {
  id: string
  title: string
  customerStatus?: string
  followUp?: string
  lastContactAt?: string
}

export function localCalendarDay(date: Date): string {
  return `${date.getFullYear().toString().padStart(4, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`
}

function dayOrdinal(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split("-").map(Number)
  if (year < 1) return null
  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year, month - 1, day)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return date.getTime() / 86400000
}

export function isValidContactDate(value: string, today: string): boolean {
  const contact = dayOrdinal(value)
  const current = dayOrdinal(today)
  return contact !== null && current !== null && contact <= current
}

export type ReengagementCandidate = { customer: ReengagementCustomer; reason: "follow-up" | "inactive"; date: string }

export function selectCustomerReengagement(customers: ReengagementCustomer[], today: string): ReengagementCandidate[] {
  const current = dayOrdinal(today)
  if (current === null) return []
  const candidates: ReengagementCandidate[] = []
  for (const customer of customers) {
    if (customer.customerStatus !== "active") continue
    const followUp = customer.followUp ? dayOrdinal(customer.followUp) : null
    if (followUp !== null && followUp > current) continue
    if (followUp !== null) {
      candidates.push({ customer, reason: "follow-up", date: customer.followUp! })
      continue
    }
    const lastContact = customer.lastContactAt ? dayOrdinal(customer.lastContactAt) : null
    if (lastContact !== null && current - lastContact >= 90) {
      candidates.push({ customer, reason: "inactive", date: customer.lastContactAt! })
    }
  }
  return candidates.sort((a, b) => {
    if (a.reason !== b.reason) return a.reason === "follow-up" ? -1 : 1
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return a.customer.id < b.customer.id ? -1 : a.customer.id > b.customer.id ? 1 : 0
  })
}
