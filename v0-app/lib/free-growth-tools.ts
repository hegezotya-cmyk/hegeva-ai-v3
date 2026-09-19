export type BusinessCheckSignals = {
  overdueInvoice: boolean
  staleQuote: boolean
  inactiveCustomer: boolean
  overdueTask: boolean
  missingFollowUp: boolean
}

export function estimateAnnualAdminCost(hoursPerWeek: number, hourlyRate: number) {
  const hours = Number.isFinite(hoursPerWeek) ? Math.max(0, Math.min(168, hoursPerWeek)) : 0
  const rate = Number.isFinite(hourlyRate) ? Math.max(0, Math.min(10000, hourlyRate)) : 0
  return Math.round(hours * rate * 52 * 100) / 100
}

export function businessCheckScore(signals: BusinessCheckSignals) {
  const deductions = [
    signals.overdueInvoice ? 20 : 0,
    signals.staleQuote ? 20 : 0,
    signals.inactiveCustomer ? 15 : 0,
    signals.overdueTask ? 15 : 0,
    signals.missingFollowUp ? 15 : 0,
  ]
  return Math.max(0, 100 - deductions.reduce((sum, value) => sum + value, 0))
}

export function safeMoney(value: string) {
  const amount = Number(String(value).replace(/[^0-9.]/g, ""))
  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}
