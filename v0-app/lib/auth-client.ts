"use client"

import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  // Keep every auth request on the public first-party origin. The API route
  // proxies these requests to the backend Worker through a service binding.
  // In the browser, keep authentication on the same first-party origin as the
  // page (including isolated localhost test fixtures). Do not redirect auth
  // requests to a different production/staging host from a preview page.
  // Retain a deterministic, environment-scoped fallback for SSR/build time.
  baseURL: typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_ENV === "staging"
      ? "https://staging.hegevaai.co.uk"
      : "https://hegevaai.co.uk",
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
