/**
 * @param {{ customers?: readonly unknown[]; tasks?: readonly unknown[]; documents?: readonly unknown[]; invoices?: readonly unknown[]; drafts?: readonly unknown[] }} data
 */
export function hasAssistantWorkspaceData(data) {
  return [data.customers, data.tasks, data.documents, data.invoices, data.drafts]
    .some((records) => Array.isArray(records) && records.length > 0)
}
