"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n/provider"
import { useSession } from "@/lib/auth-client"
import { createCoreRequestCoordinator } from "@/lib/core-request-coordinator"

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

export type BusinessRuleProjection = {
  ruleId: string
  kind: string
  sourceIds: string[]
  count: number
  severity: "high" | "medium" | "low"
  role: AIEmployeeRole
  href: string
  requiresApproval: true
}

export type LeadToMoneyProjection = {
  id: string
  stage: "lead" | "qualified" | "customer" | "quote" | "follow-up" | "invoice" | "payment" | "repeat-business"
  sourceIds: string[]
  status: "observed" | "needs-attention" | "complete"
  reason: string
  nextStage?: "lead" | "qualified" | "customer" | "quote" | "follow-up" | "invoice" | "payment" | "repeat-business"
  targetHref: string
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

export type AIEmployeeRole = "Sales" | "Finance" | "Marketing" | "Support"

export type AIEmployeeDelegation = {
  role: AIEmployeeRole
  label: string
  status: "awaiting-approval"
  preparationStatus: "prepared-only"
  deliveryStatus: "not-sent"
  executionStatus: "not-executed"
  title: string
  content: string
  sourceIds: string[]
  targetType: string
  targetHref: string
  rationale: string
  preparedAt: string
}

export type CoreDecisionResponse = {
  coreSignals: CoreSignal
  corePriorities: CorePriority[]
  coreDecision: CorePriority
  opportunityRadar: OpportunityRadarFinding[]
  fixMyBusiness: FixMyBusinessSignal[]
  businessRules: BusinessRuleProjection[]
  leadToMoney: LeadToMoneyProjection[]
  goalMode: GoalModeProjection
  pulse: PulseProjection
  companion: CompanionProjection
  priorities: CorePriority[]
  preparedActions: PreparedAction[]
  employeeDelegations: AIEmployeeDelegation[]
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
  businessRules: [],
  leadToMoney: [],
  goalMode: null,
  pulse: { understood: "", continuity: [], nextActions: [] },
  companion: { context: [], suggestions: [], scope: "authenticated-cloud", userControlled: true },
  priorities: [],
  preparedActions: [],
  employeeDelegations: [],
  metadata: { version: "core-v1", generatedAt: new Date().toISOString(), locale: "en", scope: "authenticated-cloud" },
}

type CoreDecisionResult = { data: CoreDecisionResponse; status: Exclude<CoreDecisionStatus, "loading"> }

const coreRequests = createCoreRequestCoordinator<CoreDecisionResult>()

async function fetchCoreDecisionRaw(): Promise<CoreDecisionResult> {
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
}

const GLOBAL_CORE_STATE: { data: CoreDecisionResponse; loading: boolean; status: CoreDecisionStatus; revision: number } = { data: FALLBACK, loading: true, status: "loading", revision: 0 }
const coreListeners = new Set<() => void>()
let activeCoreIdentity: string | null = null

function emitCore() { coreListeners.forEach((fn) => fn()) }

function loadCoreDecision(identity: string, invalidate = false) {
  GLOBAL_CORE_STATE.data = FALLBACK
  GLOBAL_CORE_STATE.loading = true
  GLOBAL_CORE_STATE.status = "loading"
  emitCore()
  void coreRequests.request(identity, fetchCoreDecisionRaw, invalidate).then(({ value: result, accepted }) => {
    if (!accepted || activeCoreIdentity !== identity) return
    GLOBAL_CORE_STATE.data = result.data
    GLOBAL_CORE_STATE.loading = false
    GLOBAL_CORE_STATE.status = result.status
    GLOBAL_CORE_STATE.revision += 1
    emitCore()
  })
}

export function useCoreDecision(): { data: CoreDecisionResponse; loading: boolean; status: CoreDecisionStatus; identity: string | null; revision: number; refresh: () => void } {
  const { locale } = useI18n()
  const { data: session, isPending } = useSession()
  const identity = session?.user?.id ? `user:${session.user.id}` : null
  const [, rerender] = useState(0)
  useEffect(() => {
    const listener = () => rerender((n) => n + 1)
    coreListeners.add(listener)
    return () => { coreListeners.delete(listener) }
  }, [locale])
  useEffect(() => {
    if (isPending) return
    const identityChanged = activeCoreIdentity !== identity
    activeCoreIdentity = identity
    if (!identity) {
      GLOBAL_CORE_STATE.data = FALLBACK
      GLOBAL_CORE_STATE.loading = false
      GLOBAL_CORE_STATE.status = "unauthenticated"
      emitCore()
      return
    }
    if (identityChanged) loadCoreDecision(identity, true)
  }, [identity, isPending])
  const visible = activeCoreIdentity === identity ? GLOBAL_CORE_STATE : { data: FALLBACK, loading: Boolean(identity), status: identity ? "loading" as const : "unauthenticated" as const, revision: 0 }
  return { ...visible, identity, refresh: () => { if (identity) loadCoreDecision(identity, true) } }
}
