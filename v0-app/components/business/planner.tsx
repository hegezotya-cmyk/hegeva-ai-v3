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
      <div className="glass-panel relative mb-6 flex items-start gap-3 overflow-hidden rounded-3xl border-cyan/10 p-4 sm:p-5">
        <span className="pointer-events-none absolute -right-12 -top-16 size-40 rounded-full bg-cyan/10 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden />
        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_24px_-10px_rgba(80,220,160,.75)]">
          {cloudEnabled && syncState !== "error" ? <Cloud className="size-4" /> : <CloudOff className="size-4 text-muted-foreground" />}
        </span>
        <div className="relative">
          <p className="text-sm font-medium text-foreground">{syncState === "saving" ? c.saving : syncState === "cloud" ? c.synced : cloudEnabled ? c.checking : c.browser}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{syncError ? c.errorBody : cloudEnabled ? c.cloudBody : c.guestBody}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={addTask} className="glass-panel relative h-fit overflow-hidden rounded-3xl p-5 sm:p-6">
          <span className="pointer-events-none absolute -left-12 -top-14 size-36 rounded-full bg-violet/8 blur-3xl" aria-hidden />
          <div className="relative flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl border border-violet/20 bg-violet/10 text-violet">
              {editingId ? <Pencil className="size-4" /> : <Plus className="size-4" />}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{editingId ? editCopy.edit : c.add}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{c.addBody}</p>
            </div>
          </div>

          <div className="relative mt-5 space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={c.taskTitle} className="w-full rounded-2xl border border-border/80 bg-black/10 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/40 focus:bg-background/60 focus:ring-2 focus:ring-primary/10" />
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-full rounded-2xl border border-border/80 bg-black/10 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/40 focus:bg-background/60 focus:ring-2 focus:ring-primary/10" />
            <select value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])} className="w-full rounded-2xl border border-border/80 bg-background/80 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10">
              <option value="low">{c.low}</option>
              <option value="medium">{c.medium}</option>
              <option value="high">{c.high}</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-cyan px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_14px_32px_-18px_rgba(60,220,180,.75)] transition hover:-translate-y-0.5 hover:brightness-105">
                {editingId ? <Pencil className="size-4" /> : <Plus className="size-4" />} {editingId ? editCopy.update : c.add}
              </button>
              {editingId && <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 rounded-2xl border border-border/80 bg-background/30 px-3 py-2.5 text-sm text-muted-foreground transition hover:border-primary/25 hover:text-foreground" aria-label={editCopy.cancel}><X className="size-4" /> {editCopy.cancel}</button>}
            </div>
          </div>
        </form>

        <section className="glass-panel relative overflow-hidden rounded-3xl p-5 sm:p-6">
          <span className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-primary/8 blur-3xl" aria-hidden />
          <span className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" aria-hidden />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{c.yourTasks}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{openCount} {c.open} · {tasks.length} {c.total}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(80,220,160,.75)]" aria-hidden />
              {openCount} {c.open}
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-dashed border-cyan/20 bg-gradient-to-br from-cyan/[0.045] to-violet/[0.035] p-8 text-center text-sm text-muted-foreground">
              <span className="pointer-events-none absolute right-5 top-1/2 size-20 -translate-y-1/2 rounded-full border border-cyan/10" aria-hidden />
              <span className="relative">{c.empty}</span>
            </div>
          ) : (
            <div className="relative mt-5 space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="group flex items-start gap-3 rounded-2xl border border-border/70 bg-gradient-to-br from-white/[0.035] to-transparent p-4 transition hover:border-primary/20 hover:bg-primary/[0.035]">
                  <button onClick={() => setTasks((all) => all.map((t) => t.id === task.id ? { ...t, done: !t.done } : t))} className="mt-0.5 text-primary transition hover:scale-105" aria-label={task.done ? c.markOpen : c.markDone}>
                    {task.done ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={task.done ? "text-sm text-muted-foreground line-through" : "text-sm font-medium text-foreground"}>{task.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className={task.priority === "high" ? "rounded-full border border-gold/25 bg-gold/8 px-2 py-1 text-gold" : task.priority === "low" ? "rounded-full border border-cyan/20 bg-cyan/8 px-2 py-1 text-cyan" : "rounded-full border border-violet/20 bg-violet/8 px-2 py-1 text-violet"}>{task.priority === "low" ? c.low : task.priority === "high" ? c.high : c.medium}</span>
                      {task.due && <span className="rounded-full border border-border/70 bg-background/30 px-2 py-1">{c.due} {task.due}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => editTask(task)} className="inline-flex size-9 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition hover:border-primary/20 hover:bg-primary/8 hover:text-primary" aria-label={editCopy.edit}><Pencil className="size-4" /></button>
                    <button type="button" onClick={() => { setTasks((all) => all.filter((t) => t.id !== task.id)); if (editingId === task.id) resetForm() }} className="inline-flex size-9 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition hover:border-destructive/20 hover:bg-destructive/8 hover:text-destructive" aria-label={c.delete}><Trash2 className="size-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
