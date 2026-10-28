import assert from "node:assert/strict"
import { isValidContactDate, localCalendarDay, selectCustomerReengagement } from "../lib/customer-reengagement.ts"

const today = "2026-10-28"
const customer = (id, extra = {}) => ({ id, title: id, customerStatus: "active", ...extra })
const select = (records) => selectCustomerReengagement(records, today)
assert.equal(localCalendarDay(new Date(2026, 9, 28, 0, 5)), today)
assert.equal(localCalendarDay(new Date(2026, 9, 28, 23, 55)), today)
assert.equal(localCalendarDay(new Date(2026, 2, 29, 0, 5)), "2026-03-29")
assert.equal(localCalendarDay(new Date(2026, 9, 25, 23, 55)), "2026-10-25")
for (const value of ["", "2026-02-29", "2026-02-30", "2026-13-01", "2026-10-29", "2026-1-01", "2026-01-01T00:00:00Z", "bad"]) {
  assert.equal(isValidContactDate(value, today), false, value)
}
assert.equal(isValidContactDate("2024-02-29", today), true)
assert.equal(isValidContactDate(today, today), true)
assert.deepEqual(select([
  customer("89", { lastContactAt: "2026-07-31" }),
  customer("90", { lastContactAt: "2026-07-30" }),
  customer("91", { lastContactAt: "2026-07-29" }),
]).map(x => [x.customer.id, x.reason]), [["91", "inactive"], ["90", "inactive"]])
const records = [
  customer("inactive", { lastContactAt: "2025-01-01" }),
  customer("due-b", { followUp: today }),
  customer("due-a", { followUp: today }),
  customer("overdue", { followUp: "2026-10-01", lastContactAt: "2025-01-01" }),
  customer("future-follow", { followUp: "2026-10-29", lastContactAt: "2025-01-01" }),
  customer("paused", { customerStatus: "paused", followUp: today }),
  customer("lead", { customerStatus: "lead", followUp: today }),
  customer("legacy", { customerStatus: undefined, followUp: today }),
  customer("unknown", { createdAt: "2020-01-01", updatedAt: "2020-01-01" }),
  customer("invalid", { lastContactAt: "2026-02-30", followUp: "2026-02-30" }),
  customer("future-contact", { lastContactAt: "2026-10-29" }),
  customer("invalid-follow", { lastContactAt: "2025-01-01", followUp: "broken" }),
]
const before = structuredClone(records)
assert.deepEqual(select(records).map(x => x.customer.id), ["overdue", "due-a", "due-b", "inactive", "invalid-follow"])
assert.deepEqual(records, before)
assert.deepEqual(select([]), [])
assert.deepEqual(selectCustomerReengagement(records, "2026-02-30"), [])
assert.equal(select([customer("missing", { followUp: today })])[0].reason, "follow-up")
assert.equal(select([customer("impossible-contact", { followUp: today, lastContactAt: "2026-02-30" })])[0].reason, "follow-up")
// Ninety calendar days across both UK DST changes, independent of elapsed hours.
for (const [day, prior] of [["2026-05-01", "2026-01-31"], ["2026-12-01", "2026-09-02"]]) {
  assert.equal(selectCustomerReengagement([customer("dst", { lastContactAt: prior })], day).length, 1)
}
console.log("Customer reengagement tests passed: dates, 89/90/91 days, DST, status, future follow-up, stable ranking, no mutation.")
