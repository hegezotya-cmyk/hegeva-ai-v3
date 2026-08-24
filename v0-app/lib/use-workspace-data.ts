"use client"

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import { useSession } from "@/lib/auth-client"

export type WorkspaceSyncState = "checking" | "cloud" | "local" | "saving" | "error"

function localKey(type: string, ownerKey: string) {
  return `hegeva:v0:${ownerKey}:${type}`
}

function readLocal<T>(type: string, ownerKey: string): T[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(localKey(type, ownerKey)) || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocal<T>(type: string, ownerKey: string, items: T[]) {
  try {
    localStorage.setItem(localKey(type, ownerKey), JSON.stringify(items))
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
  const ownerKey = userId ? `user:${userId}` : "guest"
  const [items, setItems] = useState<T[]>([])
  const [syncState, setSyncState] = useState<WorkspaceSyncState>("checking")
  const [syncError, setSyncError] = useState("")
  const readyToSave = useRef(false)
  const skipNextSave = useRef(false)

  useEffect(() => {
    let cancelled = false
    readyToSave.current = false
    skipNextSave.current = false
    setSyncError("")

    async function load() {
      if (isPending) {
        setSyncState("checking")
        return
      }

      if (!userId) {
        if (!cancelled) {
          skipNextSave.current = true
          setItems(readLocal<T>(type, ownerKey))
          setSyncState("local")
          readyToSave.current = true
        }
        return
      }

      setSyncState("checking")
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 8000)

      try {
        const response = await fetch(`/api/workspace/${encodeURIComponent(type)}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        })
        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(payload?.error || "Cloud workspace could not be loaded.")
        }

        const cloudItems = Array.isArray(payload?.data) ? payload.data as T[] : []
        if (!cancelled) {
          skipNextSave.current = true
          setItems(cloudItems)
          writeLocal(type, ownerKey, cloudItems)
          setSyncState("cloud")
          readyToSave.current = true
        }
      } catch (error) {
        if (!cancelled) {
          skipNextSave.current = true
          setItems(readLocal<T>(type, ownerKey))
          setSyncState("error")
          setSyncError(controller.signal.aborted ? "Cloud workspace request timed out." : error instanceof Error ? error.message : "Cloud sync is temporarily unavailable.")
          readyToSave.current = true
        }
      } finally {
        window.clearTimeout(timeout)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isPending, type, userId, ownerKey])

  useEffect(() => {
    if (!readyToSave.current) return
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }

    writeLocal(type, ownerKey, items)

    if (!userId) {
      setSyncState("local")
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setSyncState("saving")
      setSyncError("")
      const requestTimeout = window.setTimeout(() => controller.abort(), 8000)

      try {
        const response = await fetch(`/api/workspace/${encodeURIComponent(type)}`, {
          method: "PUT",
          credentials: "include",
          cache: "no-store",
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
        if (controller.signal.aborted) {
          setSyncState("error")
          setSyncError("Cloud workspace save timed out.")
          return
        }
        setSyncState("error")
        setSyncError(error instanceof Error ? error.message : "Cloud sync is temporarily unavailable.")
      } finally {
        window.clearTimeout(requestTimeout)
      }
    }, 500)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [items, type, userId, ownerKey])

  return {
    items,
    setItems,
    syncState,
    syncError,
    cloudEnabled: Boolean(userId),
  }
}
