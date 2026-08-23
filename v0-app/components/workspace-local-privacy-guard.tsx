"use client"

import { useEffect } from "react"
import { useSession } from "@/lib/auth-client"

const USER_MARKER = "hegeva:v0:authenticated-user"
const WORKSPACE_PREFIX = "hegeva:v0:"

function clearWorkspaceLocalCopies() {
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index)
      if (key && key.startsWith(WORKSPACE_PREFIX) && key !== USER_MARKER) {
        localStorage.removeItem(key)
      }
    }
  } catch {}
}

export function WorkspaceLocalPrivacyGuard() {
  const { data: session, isPending } = useSession()
  const userId = session?.user?.id ? String(session.user.id) : ""

  useEffect(() => {
    if (isPending) return

    try {
      const previousUser = localStorage.getItem(USER_MARKER) || ""

      if (userId) {
        // If a different account becomes active in the same browser, remove
        // browser fallback copies before that account can see the prior data.
        if (previousUser && previousUser !== userId) {
          clearWorkspaceLocalCopies()
        }
        localStorage.setItem(USER_MARKER, userId)
        return
      }

      // When an authenticated session ends or expires, remove local copies of
      // that account's workspace. Guest-only local data is left alone on
      // browsers that have never held an authenticated HEGEVA session.
      if (previousUser) {
        clearWorkspaceLocalCopies()
        localStorage.removeItem(USER_MARKER)
      }
    } catch {}
  }, [isPending, userId])

  return null
}
