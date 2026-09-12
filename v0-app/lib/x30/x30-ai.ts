import { createX30GenerationRequest, type X30GenerationRequest } from "@/lib/x30/generation-contract"
import type { X30Brief } from "@/lib/x30/structured-brief"

export const X30_PROVIDER_ENABLED = false as const

export function buildX30GenerationRequest(brief: X30Brief, operationId: string, scope: "authenticated" | "local-simulation" = "authenticated"): X30GenerationRequest {
  const safeBrief: X30Brief = { ...brief, targetUsers: "bounded-user-summary", primaryGoal: "bounded-goal-summary" }
  return createX30GenerationRequest(safeBrief, operationId, scope)
}

export const X30_GENERATION_COPY = {
  en: { unavailable: "X30 generation is not currently available.", quota: "X30 generation allowance reached.", invalid: "The X30 brief could not be validated." },
  hu: { unavailable: "Az X30-generálás jelenleg nem érhető el.", quota: "Az X30-generálási keret elfogyott.", invalid: "Az X30 brief nem ellenőrizhető." },
  de: { unavailable: "Die X30-Generierung ist derzeit nicht verfügbar.", quota: "Das X30-Generierungslimit ist erreicht.", invalid: "Das X30-Briefing konnte nicht geprüft werden." },
  fr: { unavailable: "La génération X30 n’est pas disponible actuellement.", quota: "La limite de génération X30 est atteinte.", invalid: "Le brief X30 n’a pas pu être validé." },
  es: { unavailable: "La generación X30 no está disponible actualmente.", quota: "Se alcanzó el límite de generación X30.", invalid: "No se pudo validar el brief X30." },
} as const
