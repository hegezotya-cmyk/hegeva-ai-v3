export type VisualDirection = {
  industry: string
  mood: "warm" | "precise" | "energetic" | "calm" | "elegant" | "direct"
  density: "relaxed" | "balanced" | "dense"
  primaryWorkflow: string
  palette: "meadow" | "ledger" | "hospitality" | "studio" | "editorial" | "industrial" | "technical"
  surface: "soft" | "structured" | "editorial"
  typography: "friendly" | "technical" | "confident"
  navigation: "workflow" | "workspace" | "catalogue"
  mobilePriority: string
  componentPriorities: readonly string[]
}

const directions: Record<string, VisualDirection> = {
  pet: { industry:"Pet care", mood:"warm", density:"balanced", primaryWorkflow:"Booking and pet care", palette:"meadow", surface:"soft", typography:"friendly", navigation:"workflow", mobilePriority:"Next appointment and quick booking", componentPriorities:["schedule","pet roster","service menu"] },
  finance: { industry:"Financial services", mood:"precise", density:"dense", primaryWorkflow:"Review and decision", palette:"ledger", surface:"structured", typography:"technical", navigation:"workspace", mobilePriority:"Alerts and approvals", componentPriorities:["metrics","exceptions","audit trail"] },
  restaurant: { industry:"Hospitality", mood:"warm", density:"relaxed", primaryWorkflow:"Menu and reservation", palette:"hospitality", surface:"editorial", typography:"confident", navigation:"catalogue", mobilePriority:"Reserve and browse menu", componentPriorities:["availability","menu","guest details"] },
  beauty: { industry:"Beauty and wellness", mood:"elegant", density:"relaxed", primaryWorkflow:"Discover and book", palette:"editorial", surface:"editorial", typography:"confident", navigation:"catalogue", mobilePriority:"Services, specialist and booking", componentPriorities:["service story","availability","portfolio"] },
  trades: { industry:"Trades and field services", mood:"direct", density:"balanced", primaryWorkflow:"Quote and schedule", palette:"industrial", surface:"structured", typography:"confident", navigation:"workflow", mobilePriority:"Call, quote and next job", componentPriorities:["service area","trust evidence","quote action"] },
  tech: { industry:"Technology", mood:"precise", density:"dense", primaryWorkflow:"Configure and monitor", palette:"technical", surface:"structured", typography:"technical", navigation:"workspace", mobilePriority:"System state and action", componentPriorities:["system status","workflow","technical detail"] },
}

export function inferVisualDirection(input: string): VisualDirection {
  const value=input.toLowerCase()
  if (/pet|groom|dog|cat|veterinar/.test(value)) return directions.pet
  if (/fintech|finance|bank|invoice|accounting|investment/.test(value)) return directions.finance
  if (/restaurant|cafe|menu|food|reservation/.test(value)) return directions.restaurant
  if (/beauty|salon|spa|skincare|wellness|makeup/.test(value)) return directions.beauty
  if (/plumb|electric|builder|roof|trade|contractor|repair service/.test(value)) return directions.trades
  if (/software|developer|platform|cloud|cyber|technology|saas/.test(value)) return directions.tech
  return { industry:"Professional services", mood:"calm", density:"balanced", primaryWorkflow:"Plan and complete work", palette:"studio", surface:"structured", typography:"confident", navigation:"workspace", mobilePriority:"Current work and next action", componentPriorities:["workflow","activity","result"] }
}
