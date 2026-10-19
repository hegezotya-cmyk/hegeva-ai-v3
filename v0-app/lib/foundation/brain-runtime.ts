import type {
  ApprovalState,
  BrainRun,
  BrainStage,
  EvaluationResult,
  ModelDescriptor,
  WorkflowJob,
} from "@/lib/foundation/contracts"

export const BRAIN_STAGE_ORDER = [
  "request",
  "understand",
  "spec",
  "plan",
  "permission",
  "model",
  "tool-or-job",
  "evaluate",
  "result",
] as const satisfies readonly BrainStage[]

export type BrainTransitionInput = {
  stage: BrainStage
  safeSummary: string
  model?: ModelDescriptor
  job?: WorkflowJob
  evaluation?: EvaluationResult
}

export type SafeBrainRun = BrainRun & {
  safeSummary: string
  history: readonly { stage: BrainStage; safeSummary: string }[]
}

export class BrainTransitionError extends Error {
  constructor(public readonly code: "invalid-stage" | "approval-required" | "job-required" | "job-active" | "evaluation-required" | "invalid-summary", message: string) {
    super(message)
    this.name = "BrainTransitionError"
  }
}

export function createBrainRun(input: Pick<BrainRun, "id" | "correlationId" | "request">): SafeBrainRun {
  const request = input.request.trim()
  if (!request) throw new BrainTransitionError("invalid-summary", "A Brain run requires a user-visible request.")
  return {
    ...input,
    request,
    stage: "request",
    permission: "not-required",
    safeSummary: "Request received",
    history: [{ stage: "request", safeSummary: "Request received" }],
  }
}

export function setBrainApproval(run: SafeBrainRun, approval: Extract<ApprovalState, "approved" | "rejected">, safeSummary: string): SafeBrainRun {
  if (run.stage !== "permission") throw new BrainTransitionError("invalid-stage", "Approval can only be recorded at the permission stage.")
  const summary = requireSummary(safeSummary)
  return { ...run, permission: approval, safeSummary: summary, history: [...run.history, { stage: run.stage, safeSummary: summary }] }
}

export function advanceBrainRun(run: SafeBrainRun, input: BrainTransitionInput): SafeBrainRun {
  const currentIndex = BRAIN_STAGE_ORDER.indexOf(run.stage)
  const expected = BRAIN_STAGE_ORDER[currentIndex + 1]
  if (!expected || input.stage !== expected) throw new BrainTransitionError("invalid-stage", `Brain stage ${run.stage} can only advance to ${expected ?? "no further stage"}.`)
  if (input.stage === "model" && run.permission !== "approved") throw new BrainTransitionError("approval-required", "Model execution cannot begin without explicit approval.")
  if (input.stage === "tool-or-job" && run.permission !== "approved") throw new BrainTransitionError("approval-required", "Tool or job execution cannot begin without explicit approval.")
  if (input.stage === "tool-or-job" && !input.job) throw new BrainTransitionError("job-required", "Tool authority must be represented by a permission-gated job.")
  if (input.stage === "evaluate" && run.job && !["completed", "failed", "cancelled"].includes(run.job.state)) throw new BrainTransitionError("job-active", "An active job cannot be evaluated as a finished result.")
  if (input.stage === "result" && !run.evaluation && !input.evaluation) throw new BrainTransitionError("evaluation-required", "A result requires an evaluation record.")

  const safeSummary = requireSummary(input.safeSummary)
  return {
    ...run,
    stage: input.stage,
    permission: input.stage === "permission" ? "pending" : run.permission,
    model: input.model ?? run.model,
    job: input.job ?? run.job,
    evaluation: input.evaluation ?? run.evaluation,
    safeSummary,
    history: [...run.history, { stage: input.stage, safeSummary }],
  }
}

/** Read-only workspace projection; it intentionally stops at permission. */
export type WorkspaceMissionProjectionInput = {
  scope: "authenticated-cloud" | "local-browser"
  hasRecords: boolean
  openTasks: number
  overdueItems: number
}

export type WorkspaceMissionProjection = SafeBrainRun & {
  safeSummary: string
  needsUser?: string
}

export function createWorkspaceMissionProjection(input: WorkspaceMissionProjectionInput): WorkspaceMissionProjection {
  let run = createBrainRun({
    id: "workspace-mission-projection",
    correlationId: "workspace-read-only-projection",
    request: "Review workspace readiness",
  })
  for (const stage of ["understand", "spec", "plan", "permission"] as const) {
    run = advanceBrainRun(run, {
      stage,
      safeSummary: stage === "understand"
        ? input.hasRecords ? "Workspace records available" : "No workspace data available"
        : stage === "plan"
          ? input.openTasks > 0 ? "Open work is visible for review" : "No open work is visible"
          : stage === "permission"
            ? input.scope === "authenticated-cloud" ? "Awaiting owner approval" : "Local preview; approval required"
            : "Workspace context reviewed",
    })
  }
  return { ...run, needsUser: "Review and approve the next mission step." }
}

function requireSummary(value: string) {
  const summary = value.trim()
  if (!summary) throw new BrainTransitionError("invalid-summary", "Every Brain transition requires a concise user-safe summary.")
  return summary
}
