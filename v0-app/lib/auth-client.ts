"use client"

import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  // Keep every auth request on the public first-party origin. The API route
  // proxies these requests to the backend Worker through a service binding.
  baseURL: "https://hegevaai.co.uk",
  fetchOptions: {
    credentials: "include",
    cache: "no-store",
  },
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient
