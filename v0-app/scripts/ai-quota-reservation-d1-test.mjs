import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { isMainThread, parentPort, workerData, Worker } from "node:worker_threads"
import { DatabaseSync } from "node:sqlite"
import { reserveAIUsage } from "../../src/ai-quota-reservation.js"

const SCHEMA = `
  CREATE TABLE ai_usage (
    userId TEXT NOT NULL,
    period TEXT NOT NULL,
    aiMessages INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    PRIMARY KEY (userId, period)
  );
`

function openDatabase(filename) {
  const db = new DatabaseSync(filename)
  db.exec("PRAGMA busy_timeout = 5000")
  return db
}

function d1Adapter(db) {
  return {
    DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return {
              run() {
                const result = db.prepare(sql).run(...values)
                return { meta: { changes: Number(result.changes) } }
              },
            }
          },
        }
      },
    },
  }
}

function usage(db, userId, period) {
  return Number(db.prepare("SELECT aiMessages FROM ai_usage WHERE userId = ? AND period = ?").get(userId, period)?.aiMessages ?? 0)
}

async function concurrentAttempt(filename, userId, period, limit) {
  const db = openDatabase(filename)
  try {
    const result = await reserveAIUsage(d1Adapter(db), userId, period, limit)
    return result.reserved ? "success" : "rejected"
  } catch {
    return "error"
  } finally {
    db.close()
  }
}

if (!isMainThread) {
  parentPort.postMessage(await concurrentAttempt(workerData.filename, workerData.userId, workerData.period, workerData.limit))
} else {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "hegeva-quota-d1-"))
  const filename = path.join(tempDir, "quota.sqlite")
  const period = "2026-08"
  const db = openDatabase(filename)

  try {
    db.exec(SCHEMA)
    const adapter = d1Adapter(db)

    let result = await reserveAIUsage(adapter, "missing", period, 50)
    assert.equal(result.reserved, true)
    assert.equal(result.result.meta.changes, 1)
    assert.equal(usage(db, "missing", period), 1)

    db.prepare("INSERT INTO ai_usage VALUES (?, ?, ?, ?, ?)").run("below", period, 49, "now", "now")
    result = await reserveAIUsage(adapter, "below", period, 50)
    assert.equal(result.reserved, true)
    assert.equal(result.result.meta.changes, 1)
    assert.equal(usage(db, "below", period), 50)

    db.prepare("INSERT INTO ai_usage VALUES (?, ?, ?, ?, ?)").run("exact", period, 50, "now", "now")
    result = await reserveAIUsage(adapter, "exact", period, 50)
    assert.equal(result.reserved, false)
    assert.equal(result.result.meta.changes, 0)
    assert.equal(usage(db, "exact", period), 50)

    db.prepare("INSERT INTO ai_usage VALUES (?, ?, ?, ?, ?)").run("above", period, 51, "now", "now")
    result = await reserveAIUsage(adapter, "above", period, 50)
    assert.equal(result.reserved, false)
    assert.equal(result.result.meta.changes, 0)
    assert.equal(usage(db, "above", period), 51)

    db.prepare("INSERT INTO ai_usage VALUES (?, ?, ?, ?, ?)").run("other", "2026-09", 50, "now", "now")
    result = await reserveAIUsage(adapter, "other", period, 50)
    assert.equal(result.reserved, true)
    assert.equal(usage(db, "other", period), 1)
    assert.equal(usage(db, "other", "2026-09"), 50)

    db.close()
    const attempts = 100
    const outcomes = await Promise.all(Array.from({ length: attempts }, () => new Promise((resolve, reject) => {
      const worker = new Worker(new URL(import.meta.url), { workerData: { filename, userId: "parallel", period, limit: 50 } })
      worker.once("message", resolve)
      worker.once("error", reject)
    })))
    const successes = outcomes.filter((value) => value === "success").length
    const rejections = outcomes.filter((value) => value === "rejected").length
    const errors = outcomes.filter((value) => value === "error").length
    const verify = openDatabase(filename)
    const finalCount = usage(verify, "parallel", period)
    verify.close()
    assert.equal(successes, 50)
    assert.equal(rejections, 50)
    assert.equal(errors, 0)
    assert.equal(finalCount, 50)
    console.log(`D1 quota reservation test passed: attempts=${attempts}, successes=${successes}, quotaRejections=${rejections}, databaseErrors=${errors}, finalAiMessages=${finalCount}`)
  } finally {
    try { db.close() } catch {}
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}
