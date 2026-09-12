"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n/provider"

export type CoreSignal = {
  approvedFollowUps: number
  followUpsAwaitingApproval: number
  overdueInvoices: number
  customerFollowUpsDue: number
  staleQuotes: number
  overdueTasks: number
  tasksToday: number
  draftInvoices: number
  hasRecords: boolean
}

export type CorePriority = {
  kind: string
  count: number
  href: string
  severity: "attention" | "ready"
}

export type OpportunityRadarFinding = {
  id: string
  kind: string
  count: number
  amount?: number
  currency?: string
  confidence: "high" | "medium"
  evidence: string[]
  impactValue: number
  href: string
}

export type FixMyBusinessSignal = {
  kind: string
  severity: "critical" | "attention" | "ready"
  count: number
  amount?: number
  sourceIds: string[]
  actionKey: string
}

export type GoalModeProjection = {
  plan: any
  outcome: any
  expectedProgress: number
  onTrack: boolean
} | null

export type PulseProjection = {
  understood: string
  continuity: string[]
  needsUser?: string
  nextActions: string[]
}

export type CompanionProjection = {
  context: string[]
  suggestions: string[]
  scope: string
  userControlled: true
}

export type PreparedAction = {
  kind: string
  status: "prepared" | "draft" | "awaiting-approval"
  title: string
  content: string
  sourceIds: string[]
  targetType: string
  targetHref: string
  reason: string
  preparedAt: string
}

export type CoreDecisionResponse = {
  coreSignals: CoreSignal
  corePriorities: CorePriority[]
  coreDecision: CorePriority
  opportunityRadar: OpportunityRadarFinding[]
  fixMyBusiness: FixMyBusinessSignal[]
  goalMode: GoalModeProjection
  pulse: PulseProjection
  companion: CompanionProjection
  priorities: CorePriority[]
  preparedActions: PreparedAction[]
  metadata: {
    version: string
    generatedAt: string
    locale: string
    scope: string
  }
}

export type CoreDecisionStatus = "loading" | "ready" | "unauthenticated" | "unavailable"

const FALLBACK: CoreDecisionResponse = {
  coreSignals: {
    approvedFollowUps: 0,
    followUpsAwaitingApproval: 0,
    overdueInvoices: 0,
    customerFollowUpsDue: 0,
    staleQuotes: 0,
    overdueTasks: 0,
    tasksToday: 0,
    draftInvoices: 0,
    hasRecords: false,
  },
  corePriorities: [],
  coreDecision: { kind: "start", count: 0, href: "/business/customers", severity: "ready" },
  opportunityRadar: [],
  fixMyBusiness: [{ kind: "foundation", severity: "ready", count: 0, sourceIds: [], actionKey: "buildFoundation" }],
  goalMode: null,
  pulse: { understood: "", continuity: [], nextActions: [] },
  companion: { context: [], suggestions: [], scope: "authenticated-cloud", userControlled: true },
  priorities: [],
  preparedActions: [],
  metadata: { version: "core-v1", generatedAt: new Date().toISOString(), locale: "en", scope: "authenticated-cloud" },
}

type CoreDecisionResult = { data: CoreDecisionResponse; status: Exclude<CoreDecisionStatus, "loading"> }

type SharedCoreDecisionRequest = {
  inflight: Promise<CoreDecisionResult> | null
  cached: { result: CoreDecisionResult; expiresAt: number } | null
}

const CORE_DECISION_CACHE_MS = 15_000
const CORE_DECISION_REQUEST_KEY = "__hegevaCoreDecisionRequest__"

function getSharedCoreDecisionRequest(): SharedCoreDecisionRequest | null {
  if (typeof window === "undefined") return null

  const browserWindow = window as Window & {
    [CORE_DECISION_REQUEST_KEY]?: SharedCoreDecisionRequest
  }

  if (!browserWindow[CORE_DECISION_REQUEST_KEY]) {
    browserWindow[CORE_DECISION_REQUEST_KEY] = { inflight: null, cached: null }
  }

  return browserWindow[CORE_DECISION_REQUEST_KEY]!
}

let inflight: Promise<CoreDecisionResult> | null = null

function fetchCoreDecision(): Promise<CoreDecisionResult> {
  const shared = getSharedCoreDecisionRequest()
  const now = Date.now()

  if (shared?.cached && shared.cached.expiresAt > now) return Promise.resolve(shared.cached.result)
  if (shared?.inflight) return shared.inflight
  if (inflight) return inflight

  const request = (async (): Promise<CoreDecisionResult> => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const response = await fetch("/api/core/decide", {
        method: "POST",
        credentials: "include",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({}),
      })
      clearTimeout(timeout)
      if (!response.ok) {
        if (response.status === 401) return { data: FALLBACK, status: "unauthenticated" }
        return { data: FALLBACK, status: "unavailable" }
      }
      const data = (await response.json()) as Partial<CoreDecisionResponse>
      return { data: { ...FALLBACK, ...data }, status: "ready" }
    } catch {
      return { data: FALLBACK, status: "unavailable" }
    }
  })()

  if (shared) shared.inflight = request
  else inflight = request

  void request.then((result) => {
    if (shared) shared.cached = { result, expiresAt: Date.now() + CORE_DECISION_CACHE_MS }
  }).finally(() => {
    if (shared?.inflight === request) shared.inflight = null
    if (inflight === request) inflight = null
  })

  return request
}

const GLOBAL_CORE_STATE: { data: CoreDecisionResponse; loading: boolean; status: CoreDecisionStatus } = { data: FALLBACK, loading: true, status: "loading" }
const coreListeners = new Set<() => void>()

function emitCore() { coreListeners.forEach((fn) => fn()) }

if (typeof window !== "undefined") {
  void fetchCoreDecision().then((result) => {
    GLOBAL_CORE_STATE.data = result.data
    GLOBAL_CORE_STATE.loading = false
    GLOBAL_CORE_STATE.status = result.status
    emitCore()
  })
}

export function useCoreDecision(): { data: CoreDecisionResponse; loading: boolean; status: CoreDecisionStatus } {
  const { locale } = useI18n()
  const [, rerender] = useState(0)
  useEffect(() => {
    const listener = () => rerender((n) => n + 1)
    coreListeners.add(listener)
    return () => { coreListeners.delete(listener) }
  }, [locale])
  return GLOBAL_CORE_STATE
}
