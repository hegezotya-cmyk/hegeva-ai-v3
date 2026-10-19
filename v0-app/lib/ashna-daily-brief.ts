import {
  rankHegevaCorePriorities,
  type HegevaCorePriority,
  type HegevaCoreSignals,
} from "@/lib/hegeva-core"

export type AshnaDailyBrief = {
  primary: HegevaCorePriority
  risks: HegevaCorePriority[]
  approvals: HegevaCorePriority[]
  preparedActions: HegevaCorePriority[]
}

export function buildAshnaDailyBrief(signals: HegevaCoreSignals): AshnaDailyBrief {
  const priorities = rankHegevaCorePriorities(signals)

  return {
    primary: priorities[0],
    risks: priorities.filter((priority) => priority.severity === "attention"),
    approvals: priorities.filter(
      (priority) =>
        priority.kind === "review-followups" ||
        priority.kind === "complete-followups",
    ),
    preparedActions: priorities.filter(
      (priority) =>
        !["clear", "start"].includes(priority.kind),
    ),
  }
}
