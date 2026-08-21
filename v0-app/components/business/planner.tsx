"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react"

type Task = {
  id: string
  title: string
  due?: string
  priority: "low" | "medium" | "high"
  done: boolean
}

const KEY = "hegeva:v0:planner"

export function LocalPlanner() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState("")
  const [due, setDue] = useState("")
  const [priority, setPriority] = useState<Task["priority"]>("medium")

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved) setTasks(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(tasks))
  }, [tasks])

  function addTask(e: FormEvent) {
    e.preventDefault()
    const clean = title.trim()
    if (!clean) return
    setTasks((current) => [
      { id: crypto.randomUUID(), title: clean, due: due || undefined, priority, done: false },
      ...current,
    ])
    setTitle("")
    setDue("")
    setPriority("medium")
  }

  const openCount = useMemo(() => tasks.filter((t) => !t.done).length, [tasks])

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={addTask} className="glass-panel h-fit rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-foreground">Add task</h2>
        <p className="mt-1 text-sm text-muted-foreground">Create only the work you actually want to track.</p>
        <div className="mt-5 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
          <select value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50">
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>
          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" /> Add task
          </button>
        </div>
      </form>

      <section className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Your tasks</h2>
            <p className="mt-1 text-sm text-muted-foreground">{openCount} open · {tasks.length} total</p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No tasks saved yet.</div>
        ) : (
          <div className="mt-5 space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 rounded-xl border border-border bg-background/30 p-4">
                <button onClick={() => setTasks((all) => all.map((t) => t.id === task.id ? { ...t, done: !t.done } : t))} className="mt-0.5 text-primary" aria-label={task.done ? "Mark open" : "Mark done"}>
                  {task.done ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={task.done ? "text-sm text-muted-foreground line-through" : "text-sm font-medium text-foreground"}>{task.title}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{task.priority}</span>
                    {task.due && <span>Due {task.due}</span>}
                  </div>
                </div>
                <button onClick={() => setTasks((all) => all.filter((t) => t.id !== task.id))} className="text-muted-foreground hover:text-destructive" aria-label="Delete task"><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
