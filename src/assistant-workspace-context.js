const WORKSPACE_TYPES = Object.freeze([
  "customers",
  "documents",
  "expenses",
  "planner",
  "invoice_documents",
  "messages",
])

function parseCollection(value) {
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === "object" && !Array.isArray(item))
  if (typeof value !== "string" || !value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === "object" && !Array.isArray(item)) : []
  } catch {
    return []
  }
}

function recordTotal(record) {
  if (!Array.isArray(record.items)) return 0
  const subtotal = record.items.reduce((sum, item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return sum
    const quantity = Number(item.quantity)
    const unitPrice = Number(item.unitPrice)
    return sum + (Number.isFinite(quantity) && Number.isFinite(unitPrice) ? quantity * unitPrice : 0)
  }, 0)
  const vat = Number(record.vatRate)
  return subtotal * (1 + (Number.isFinite(vat) ? vat : 0) / 100)
}

function parseGoals(value) {
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === "object" && !Array.isArray(item))
  if (typeof value !== "string" || !value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item === "object" && !Array.isArray(item)) : []
  } catch {
    return []
  }
}

export function summarizeAssistantWorkspaceData(dataByType, today = new Date().toISOString().slice(0, 10)) {
  const read = (type) => parseCollection(dataByType?.[type])
  const customers = read("customers")
  const documents = read("documents")
  const expenses = read("expenses")
  const tasks = read("planner")
  const invoices = read("invoice_documents")
  const messages = read("messages")
  const goals = parseGoals(dataByType?.goal_mode ?? dataByType?.goals)

  const openTasks = tasks.filter((item) => item.done !== true)
  const paidInvoices = invoices.filter((item) => item.type === "invoice" && item.status === "paid")
  const openInvoices = invoices.filter((item) => item.type === "invoice" && item.status !== "paid")
  const overdueInvoices = openInvoices.filter((item) => typeof item.dueDate === "string" && item.dueDate.slice(0, 10) < today)
  const gbpOutstanding = openInvoices
    .filter((item) => !item.currency || item.currency === "GBP")
    .reduce((sum, item) => sum + recordTotal(item), 0)
  const gbpExpenses = expenses
    .filter((item) => !item.currency || item.currency === "GBP")
    .reduce((sum, item) => {
      const amount = Number(item.amount)
      return sum + (Number.isFinite(amount) ? amount : 0)
    }, 0)
  const dueToday = openTasks.filter((item) => typeof item.due === "string" && item.due.slice(0, 10) === today).length
  const overdueTasks = openTasks.filter((item) => typeof item.due === "string" && item.due.slice(0, 10) < today).length
  const awaitingFollowUps = messages.filter((item) => typeof item.sourceId === "string" && (!item.workflowStatus || item.workflowStatus === "draft")).length
  const approvedFollowUps = messages.filter((item) => typeof item.sourceId === "string" && item.workflowStatus === "approved").length
  const approvedGoals = goals.filter((item) => item.state === "approved").length

  return [
    "Authenticated workspace facts for the signed-in user (aggregate counts only; source of truth):",
    `customers=${customers.length}`,
    `documents=${documents.length}`,
    `expense_records=${expenses.length}`,
    `expenses_total_GBP=${gbpExpenses.toFixed(2)}`,
    `open_tasks=${openTasks.length}`,
    `tasks_due_today=${dueToday}`,
    `overdue_tasks=${overdueTasks}`,
    `invoice_and_quote_records=${invoices.length}`,
    `paid_invoices=${paidInvoices.length}`,
    `open_invoices=${openInvoices.length}`,
    `overdue_invoices=${overdueInvoices.length}`,
    `outstanding_GBP=${gbpOutstanding.toFixed(2)}`,
    `followups_awaiting_approval=${awaitingFollowUps}`,
    `approved_followups_ready_to_complete=${approvedFollowUps}`,
    `active_goals=${goals.length}`,
    `approved_goals=${approvedGoals}`,
    "Use these aggregate facts when answering questions about current workspace data. Do not infer names, individual records, or facts absent from this summary.",
  ].join("; ").slice(0, 1_200)
}

export async function readAssistantWorkspaceContext(db, userId, today) {
  if (!db || typeof db.prepare !== "function" || typeof userId !== "string" || !userId) return null
  try {
    const types = [...WORKSPACE_TYPES, "goal_mode", "goals"]
    const rows = await Promise.all(types.map((type) =>
      db.prepare("SELECT data FROM workspace_data WHERE userId = ?1 AND dataType = ?2 LIMIT 1").bind(userId, type).first(),
    ))
    const dataByType = Object.fromEntries(types.map((type, index) => [type, rows[index]?.data ?? null]))
    // Match Core's migration policy: canonical goal_mode wins if its row
    // exists (including empty or malformed data); legacy goals is fallback only.
    const canonicalIndex = types.indexOf("goal_mode")
    const legacyIndex = types.indexOf("goals")
    if (rows[canonicalIndex]) dataByType.goals = null
    else dataByType.goal_mode = dataByType.goals ?? null
    return summarizeAssistantWorkspaceData(dataByType, today)
  } catch {
    return null
  }
}
