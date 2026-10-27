export type MessageFollowUpTask = {
  id: string
  title: string
  due?: string
  priority: "low" | "medium" | "high"
  done: boolean
  sourceId?: string
}

type FollowUpInput = {
  draftId: string
  legacySourceId?: string
  title: string
  due: string
  locale: string
}

export function upsertMessageFollowUpTask<T extends MessageFollowUpTask>(
  tasks: T[],
  { draftId, legacySourceId, title, due }: FollowUpInput,
): T[] {
  if (!draftId || !due) return tasks
  const existing = tasks.find((task) => task.sourceId === draftId || Boolean(legacySourceId && task.sourceId === legacySourceId))
  const next: MessageFollowUpTask = {
    id: existing?.id || `message-follow-up-${draftId}`,
    title,
    due,
    priority: existing?.priority || "medium",
    done: false,
    sourceId: draftId,
  }
  return existing
    ? tasks.map((task) => task.sourceId === draftId ? { ...task, ...next } as T : task)
    : [next as T, ...tasks]
}

export function isLinkedMessageFollowUpTask(
  task: Pick<MessageFollowUpTask, "sourceId">,
  draftId: string,
  legacySourceId?: string,
): boolean {
  return task.sourceId === draftId || Boolean(legacySourceId && task.sourceId === legacySourceId)
}
