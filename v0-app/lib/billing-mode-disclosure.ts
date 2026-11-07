export type BillingMode = "live" | "test" | null

type BillingStatusLike = { mode?: string | null } | null | undefined

export function resolveBillingMode(
  billingStatus: BillingStatusLike,
  publicBillingStatus: BillingStatusLike,
): BillingMode {
  const mode = billingStatus?.mode ?? publicBillingStatus?.mode
  return mode === "live" || mode === "test" ? mode : null
}

export function resolveBillingDisclosure(
  loading: boolean,
  mode: BillingMode,
  copy: { checking: string; live: string; test: string; unavailable: string },
): string {
  if (loading) return copy.checking
  if (mode === "live") return copy.live
  if (mode === "test") return copy.test
  return copy.unavailable
}
