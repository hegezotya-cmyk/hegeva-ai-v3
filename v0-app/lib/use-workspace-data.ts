"use client"

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import { useSession } from "@/lib/auth-client"

export type WorkspaceSyncState = "checking" | "cloud" | "local" | "saving" | "error"

function localKey(type: string) {
  return `hegeva:v0:${type}`
}

function readLocal<T>(type: string): T[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(localKey(type)) || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocal<T>(type: string, items: T[]) {
  try {
    localStorage.setItem(localKey(type), JSON.stringify(items))
  } catch {}
}

export function useWorkspaceData<T>(type: string): {
  items: T[]
  setItems: Dispatch<SetStateAction<T[]>>
  syncState: WorkspaceSyncState
  syncError: string
  cloudEnabled: boolean
} {
  const { data: session, isPending } = useSession()
  const userId = session?.user?.id
  const [items, setItems] = useState<T[]>([])
  const [syncState, setSyncState] = useState<WorkspaceSyncState>("checking")
  const [syncError, setSyncError] = useState("")
  const readyToSave = useRef(false)

  useEffect(() => {
    let cancelled = false
    readyToSave.current = false
    setSyncError("")

    async function load() {
      if (isPending) {
        setSyncState("checking")
        return
      }

      if (!userId) {
        if (!cancelled) {
          setItems(readLocal<T>(type))
          setSyncState("local")
          readyToSave.current = true
        }
        return
      }

      setSyncState("checking")

      try {
        const response = await fetch(`/api/workspace/${encodeURIComponent(type)}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        })
        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(payload?.error || "Cloud workspace could not be loaded.")
        }

        const cloudItems = Array.isArray(payload?.data) ? payload.data as T[] : []
        if (!cancelled) {
          setItems(cloudItems)
          writeLocal(type, cloudItems)
          setSyncState("cloud")
          readyToSave.current = true
        }
      } catch (error) {
        if (!cancelled) {
          setItems(readLocal<T>(type))
          setSyncState("error")
          setSyncError(error instanceof Error ? error.message : "Cloud sync is temporarily unavailable.")
          readyToSave.current = true
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isPending, type, userId])

  useEffect(() => {
    if (!readyToSave.current) return
    writeLocal(type, items)

    if (!userId) {
      setSyncState("local")
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setSyncState("saving")
      setSyncError("")

      try {
        const response = await fetch(`/api/workspace/${encodeURIComponent(type)}`, {
          method: "PUT",
          credentials: "include",
          signal: controller.signal,
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ data: items }),
        })
        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(payload?.error || "Cloud workspace could not be saved.")
        }

        setSyncState("cloud")
      } catch (error) {
        if (controller.signal.aborted) return
        setSyncState("error")
        setSyncError(error instanceof Error ? error.message : "Cloud sync is temporarily unavailable.")
      }
    }, 500)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [items, type, userId])

  return {
    items,
    setItems,
    syncState,
    syncError,
    cloudEnabled: Boolean(userId),
  }
}
