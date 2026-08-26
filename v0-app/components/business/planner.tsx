"use client"

import { FormEvent, useMemo, useState } from "react"
import { CheckCircle2, Circle, Cloud, CloudOff, Pencil, Plus, Trash2, X } from "lucide-react"
import { useWorkspaceData } from "@/lib/use-workspace-data"
import { useI18n } from "@/lib/i18n/provider"
import { getBusinessModulesCopy } from "@/lib/i18n/business-modules-copy"

type Task = {
  id: string
  title: string
  due?: string
  priority: "low" | "medium" | "high"
  done: boolean
}

export function LocalPlanner() {
  const { locale } = useI18n()
  const c = getBusinessModulesCopy(locale).planner
  const { items: tasks, setItems: setTasks, syncState, syncError, cloudEnabled } = useWorkspaceData<Task>("planner")
  const [title, setTitle] = useState("")
  const [due, setDue] = useState("")
  const [priority, setPriority] = useState<Task["priority"]>("medium")
  const [editingId, setEditingId] = useState<string | null>(null)
  const editCopy = {
    en:{edit:"Edit task",update:"Update task",cancel:"Cancel"},hu:{edit:"Feladat szerkesztése",update:"Feladat frissítése",cancel:"Mégse"},de:{edit:"Aufgabe bearbeiten",update:"Aufgabe aktualisieren",cancel:"Abbrechen"},fr:{edit:"Modifier la tâche",update:"Mettre à jour",cancel:"Annuler"},es:{edit:"Editar tarea",update:"Actualizar tarea",cancel:"Cancelar"},
  }[locale]

  function resetForm() {
    setTitle("")
    setDue("")
    setPriority("medium")
    setEditingId(null)
  }

  function editTask(task: Task) {
    setEditingId(task.id)
    setTitle(task.title)
    setDue(task.due || "")
    setPriority(task.priority)
  }

  function addTask(e: FormEvent) {
    e.preventDefault()
    const clean = title.trim()
    if (!clean) return
    setTasks((current) => {
      const existing = editingId ? current.find((task) => task.id === editingId) : undefined
      const next = { id: existing?.id || crypto.randomUUID(), title: clean, due: due || undefined, priority, done: existing?.done || false }
      return existing ? current.map((task) => task.id === existing.id ? next : task) : [next, ...current]
    })
    resetForm()
  }

  const openCount = useMemo(() => tasks.filter((t) => !t.done).length, [tasks])

  return (
    <div>
      <div className="glass-panel mb-6 flex items-start gap-3 rounded-2xl p-4">
        {cloudEnabled && syncState !== "error" ? <Cloud className="mt-0.5 size-4 text-primary" /> : <CloudOff className="mt-0.5 size-4 text-muted-foreground" />}
        <div>
          <p className="text-sm font-medium text-foreground">{syncState === "saving" ? c.saving : syncState === "cloud" ? c.synced : cloudEnabled ? c.checking : c.browser}</p>
          <p className="mt-1 text-xs text-muted-foreground">{syncError ? c.errorBody : cloudEnabled ? c.cloudBody : c.guestBody}</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={addTask} className="glass-panel h-fit rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-foreground">{editingId ? editCopy.edit : c.add}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{c.addBody}</p>
        <div className="mt-5 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={c.taskTitle} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" />
          <select value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])} className="w-full rounded-xl border border-border bg-input/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50">
            <option value="low">{c.low}</option>
            <option value="medium">{c.medium}</option>
            <option value="high">{c.high}</option>
          </select>
          <div className="flex gap-2"><button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            {editingId ? <Pencil className="size-4" /> : <Plus className="size-4" />} {editingId ? editCopy.update : c.add}
          </button>{editingId && <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2.5 text-sm" aria-label={editCopy.cancel}><X className="size-4" /> {editCopy.cancel}</button>}</div>
        </div>
      </form>

      <section className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{c.yourTasks}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{openCount} {c.open} · {tasks.length} {c.total}</p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{c.empty}</div>
        ) : (
          <div className="mt-5 space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 rounded-xl border border-border bg-background/30 p-4">
                <button onClick={() => setTasks((all) => all.map((t) => t.id === task.id ? { ...t, done: !t.done } : t))} className="mt-0.5 text-primary" aria-label={task.done ? c.markOpen : c.markDone}>
                  {task.done ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={task.done ? "text-sm text-muted-foreground line-through" : "text-sm font-medium text-foreground"}>{task.title}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{task.priority === "low" ? c.low : task.priority === "high" ? c.high : c.medium}</span>
                    {task.due && <span>{c.due} {task.due}</span>}
                  </div>
                </div>
                <div className="flex gap-2"><button type="button" onClick={() => editTask(task)} className="text-muted-foreground hover:text-primary" aria-label={editCopy.edit}><Pencil className="size-4" /></button><button type="button" onClick={() => { setTasks((all) => all.filter((t) => t.id !== task.id)); if (editingId === task.id) resetForm() }} className="text-muted-foreground hover:text-destructive" aria-label={c.delete}><Trash2 className="size-4" /></button></div>
              </div>
            ))}
          </div>
        )}
      </section>
      </div>
    </div>
  )
}
