import type { EntityId } from "@/lib/foundation/contracts"

export type OperatingSyncState = "checking" | "cloud" | "local" | "saving" | "error"
export type OperatingStageId = "understand" | "plan" | "execute" | "check" | "result"
export type OperatingStageStatus = "pending" | "active" | "completed"

export interface OperatingRecord { id: EntityId }
export interface OperatingTask extends OperatingRecord { title?: string; due?: string; done: boolean }
export interface OperatingInvoice extends OperatingRecord { type: "invoice" | "quote"; status?: "draft" | "sent" | "paid"; dueDate?: string }

export interface OperatingCenterInput {
  ownerUserId: EntityId
  workspaceId: EntityId
  today: string
  syncState: OperatingSyncState
  customers: readonly OperatingRecord[]
  documents: readonly OperatingRecord[]
  expenses: readonly OperatingRecord[]
  tasks: readonly OperatingTask[]
  invoices: readonly OperatingInvoice[]
}

export interface OperatingStage {
  id: OperatingStageId
  status: OperatingStageStatus
}

export interface OperatingCenterSnapshot {
  ownerUserId: EntityId
  workspaceId: EntityId
  generatedForDate: string
  syncState: OperatingSyncState
  inventory: { customers: number; documents: number; expenses: number; invoices: number }
  openTaskCount: number
  openTasks: readonly OperatingTask[]
  overdue: { tasks: number; invoices: number; total: number }
  stages: readonly OperatingStage[]
  currentStage: OperatingStageId
  completedStages: number
  safeSummary: string
}

const STAGE_ORDER = ["understand", "plan", "execute", "check", "result"] as const satisfies readonly OperatingStageId[]

export function createOperatingCenterSnapshot(input: OperatingCenterInput): OperatingCenterSnapshot {
  validateInput(input)
  const openTasks = input.tasks.filter((task) => !task.done)
  const overdueTasks = openTasks.filter((task) => task.due && task.due < input.today).length
  const overdueInvoices = input.invoices.filter((invoice) => invoice.type === "invoice" && invoice.status !== "paid" && invoice.dueDate && invoice.dueDate < input.today).length
  const inventory = {
    customers: input.customers.length,
    documents: input.documents.length,
    expenses: input.expenses.length,
    invoices: input.invoices.length,
  }
  const hasRecords = Object.values(inventory).some((count) => count > 0)
  const hasTasks = input.tasks.length > 0
  const executionComplete = hasTasks && openTasks.length === 0
  const checkingComplete = hasRecords && executionComplete && overdueTasks + overdueInvoices === 0
  const completed: Record<OperatingStageId, boolean> = {
    understand: hasRecords,
    plan: hasRecords && hasTasks,
    execute: hasRecords && executionComplete,
    check: checkingComplete,
    result: checkingComplete,
  }
  const firstIncomplete = STAGE_ORDER.find((stage) => !completed[stage])
  const currentStage = firstIncomplete ?? "result"
  const stages = STAGE_ORDER.map((id) => ({ id, status: completed[id] ? "completed" : id === firstIncomplete ? "active" : "pending" }) satisfies OperatingStage)
  const completedStages = stages.filter((stage) => stage.status === "completed").length
  const attention = overdueTasks + overdueInvoices

  return {
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    generatedForDate: input.today,
    syncState: input.syncState,
    inventory,
    openTaskCount: openTasks.length,
    openTasks: openTasks.slice(0, 4).map((task) => ({ ...task })),
    overdue: { tasks: overdueTasks, invoices: overdueInvoices, total: attention },
    stages,
    currentStage,
    completedStages,
    safeSummary: attention ? `${attention} workspace item${attention === 1 ? "" : "s"} require attention.` : "No overdue workspace items.",
  }
}

function validateInput(input: OperatingCenterInput) {
  if (!input.ownerUserId.trim() || !input.workspaceId.trim()) throw new Error("operating-center-scope-required")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.today) || !Number.isFinite(Date.parse(`${input.today}T00:00:00.000Z`))) throw new Error("operating-center-date-invalid")
  const records = [...input.customers, ...input.documents, ...input.expenses, ...input.tasks, ...input.invoices]
  if (records.some((record) => !record.id.trim())) throw new Error("operating-center-record-id-required")
  for (const task of input.tasks) if (task.due && !isDateOnly(task.due)) throw new Error("operating-center-task-date-invalid")
  for (const invoice of input.invoices) if (invoice.dueDate && !isDateOnly(invoice.dueDate)) throw new Error("operating-center-invoice-date-invalid")
}

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`))
}
