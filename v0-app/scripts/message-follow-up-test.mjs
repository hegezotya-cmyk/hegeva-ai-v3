import assert from "node:assert/strict"
import fs from "node:fs"
import { isLinkedMessageFollowUpTask, upsertMessageFollowUpTask } from "../lib/message-follow-up.ts"

const original = [{ id: "unrelated", title: "Call supplier", priority: "low", done: false }]
const first = upsertMessageFollowUpTask(original, {
  draftId: "draft-1", title: "Follow up: quote", due: "2026-11-02", locale: "en",
})
assert.equal(first.length, 2, "a dated draft should create one planner task")
assert.equal(first[0].sourceId, "draft-1", "the planner task should link back to its message draft")
assert.equal(first[0].due, "2026-11-02")
assert.equal(first[0].done, false)
assert.equal(isLinkedMessageFollowUpTask(first[0], "draft-1"), true, "a new planner task should resolve from its draft id")
assert.equal(isLinkedMessageFollowUpTask({ sourceId: "legacy-task-source" }, "draft-legacy", "legacy-task-source"), true, "legacy message-task links should remain readable")
assert.equal(isLinkedMessageFollowUpTask(first[0], "other-draft"), false, "planner tasks must not link to a different draft")

const edited = upsertMessageFollowUpTask(first, {
  draftId: "draft-1", title: "Follow up: updated quote", due: "2026-11-06", locale: "en",
})
assert.equal(edited.length, 2, "editing a draft should update rather than duplicate its task")
assert.equal(edited[0].id, first[0].id)
assert.equal(edited[0].title, "Follow up: updated quote")
assert.equal(edited[0].due, "2026-11-06")

const legacyTasks = [{ id: "legacy-task", title: "Old follow-up", due: "2026-10-01", priority: "medium", done: true, sourceId: "legacy-source" }]
const migrated = upsertMessageFollowUpTask(legacyTasks, {
  draftId: "draft-legacy", legacySourceId: "legacy-source", title: "Follow up: edited legacy", due: "2026-11-07", locale: "en",
})
assert.equal(migrated.length, 1, "editing a legacy-linked draft should not create a duplicate planner task")
assert.equal(migrated[0].id, "legacy-task", "the existing planner task ID should be retained")
assert.equal(migrated[0].sourceId, "draft-legacy", "the existing task should migrate to stable draft-ID linkage")
assert.equal(migrated[0].due, "2026-11-07")
assert.equal(migrated[0].done, false)

const cleared = upsertMessageFollowUpTask(edited, {
  draftId: "draft-1", title: "Follow up: updated quote", due: "", locale: "en",
})
assert.deepEqual(cleared, edited, "clearing a date should not silently delete an existing planner task")
assert.deepEqual(upsertMessageFollowUpTask(original, {
  draftId: "draft-2", title: "Follow up: no date", due: "", locale: "en",
}), original, "an undated draft should not create a planner task")
const messageStudio = fs.readFileSync(new URL("../components/business/message-studio.tsx", import.meta.url), "utf8")
assert(messageStudio.includes("isLinkedMessageFollowUpTask(task, draft.id, draft.sourceId)"), "Message Studio should display and complete planner tasks linked by draft ID while retaining legacy links")

console.log("Message follow-up audit passed: date creates, edits update, and clearing does not delete tasks.")
