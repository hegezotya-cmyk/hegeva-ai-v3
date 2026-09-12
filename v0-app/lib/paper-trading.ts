/** Provider-neutral paper trading contracts and deterministic simulation. Live trading is deliberately impossible here. */
import { COMMERCIAL_CONFIG } from "@/lib/commercial-config"
export const PAPER_TRADING_VERSION = "0.1" as const
export const TRADING_TIMEFRAMES = ["1h", "4h", "1d", "1w"] as const
export const TRADING_STRATEGIES = ["trend-following", "range", "momentum"] as const
export const TRADING_STATES = ["draft", "ready", "running", "paused", "stopped", "emergency-stopped"] as const
export type TradingTimeframe = typeof TRADING_TIMEFRAMES[number]
export type TradingStrategy = typeof TRADING_STRATEGIES[number]
export type TradingState = typeof TRADING_STATES[number]

export const PAPER_TRADING_STRATEGY_VERSION = "0.1" as const
export type PaperTradingStrategy = {
  schemaVersion: typeof PAPER_TRADING_STRATEGY_VERSION
  id: string
  name: string
  strategy: TradingStrategy
  symbols: string[]
  timeframe: TradingTimeframe
  riskLimit: number
  stopLoss: number
  takeProfit: number
  positionSizing: number
  enabled: boolean
  updatedAt: string
}

export type PaperLedgerEvent =
  | { kind: "strategy-created" | "strategy-updated" | "strategy-enabled" | "strategy-disabled"; eventId: string; strategyId: string; at: string }
  | { kind: "simulation-started" | "simulation-paused" | "simulation-stopped" | "emergency-stopped"; eventId: string; strategyId: string; at: string; reason?: string }
  | { kind: "order"; eventId: string; strategyId: string; symbol: string; side: "buy" | "sell"; quantity: number; price: number; fee: number; slippage: number; at: string }
  | { kind: "trade"; eventId: string; strategyId: string; symbol: string; pnl: number; fee: number; at: string }

export interface PaperTradingAdapters {
  marketData: { source: "repository-sample"; load: (symbols: readonly string[], timeframe: TradingTimeframe) => readonly { symbol: string; close: number }[] }
  broker: { mode: "disabled"; submit: never }
}

export const PAPER_TRADING_ADAPTERS: PaperTradingAdapters = {
  marketData: { source: "repository-sample", load: (symbols) => symbols.map((symbol, i) => ({ symbol, close: [101, 117, 89][i] ?? 100 })) },
  broker: { mode: "disabled" } as PaperTradingAdapters["broker"],
}

export const PAPER_TRADING_COSTS = { feePct: 0.1, spreadPct: 0.05, slippagePct: 0.05 } as const

export function transitionPaperTradingState(current: TradingState, action: "start" | "pause" | "stop" | "emergency-stop"): TradingState {
  if (action === "emergency-stop") return "emergency-stopped"
  if (action === "start" && ["draft", "ready", "paused"].includes(current)) return "running"
  if (action === "pause" && current === "running") return "paused"
  if (action === "stop" && ["running", "paused", "ready"].includes(current)) return "stopped"
  throw new Error("paper-state-transition-invalid")
}

export function enforcePaperRisk(bot: PaperTradingBot, metrics: { dailyLossPct: number; exposurePct: number; drawdownPct: number; positionSizePct: number }): { allowed: boolean; code?: string } {
  if (metrics.dailyLossPct < 0 && Math.abs(metrics.dailyLossPct) > bot.riskLimit) return { allowed: false, code: "daily-loss-limit" }
  if (metrics.exposurePct > bot.riskLimit) return { allowed: false, code: "exposure-limit" }
  if (metrics.positionSizePct > bot.positionSizing) return { allowed: false, code: "position-size-limit" }
  if (metrics.drawdownPct > bot.stopLoss) return { allowed: false, code: "drawdown-limit" }
  return { allowed: true }
}

export interface PaperBacktestReport { schemaVersion: "0.1"; dataset: "repository-sample"; trades: PaperTrade[]; startingBalance: number; endingBalance: number; fees: number; slippage: number; returnPct: number; maxDrawdownPct: number; exportedAt: string }

export function runPaperBacktest(bot: PaperTradingBot): PaperBacktestReport {
  const base = simulatePaperTrading(bot)
  const gross = base.trades.reduce((sum, trade) => sum + trade.pnl, 0)
  const fees = Number((bot.virtualBalance * bot.positionSizing / 100 * PAPER_TRADING_COSTS.feePct / 100).toFixed(2))
  const slippage = Number((bot.virtualBalance * bot.positionSizing / 100 * PAPER_TRADING_COSTS.slippagePct / 100).toFixed(2))
  const endingBalance = Number((bot.virtualBalance + gross - fees - slippage).toFixed(2))
  return { schemaVersion: "0.1", dataset: "repository-sample", trades: base.trades, startingBalance: bot.virtualBalance, endingBalance, fees, slippage, returnPct: Number(((endingBalance - bot.virtualBalance) / bot.virtualBalance * 100).toFixed(2)), maxDrawdownPct: base.drawdownPct, exportedAt: "deterministic-simulation" }
}

export function exportPaperBacktest(report: PaperBacktestReport): string { return JSON.stringify(report) }

export interface PaperTradingBot {
  schemaVersion: typeof PAPER_TRADING_VERSION
  kind: "paper-trading-bot"
  id: string
  name: string
  strategy: TradingStrategy
  symbols: string[]
  timeframe: TradingTimeframe
  riskLimit: number
  stopLoss: number
  takeProfit: number
  positionSizing: number
  virtualBalance: number
  state: TradingState
  executionMode: "simulation"
  providerEvidence: "none"
  updatedAt: string
}

export interface PaperTrade { symbol: string; side: "buy" | "sell"; quantity: number; price: number; pnl: number }
export interface PaperSimulation { balance: number; positions: number; orders: number; trades: PaperTrade[]; returnPct: number; drawdownPct: number; riskUsedPct: number; dataset: "repository-sample" }

export const PAPER_TRADING_RISK_LIMITS = {
  maxRiskLimitPct: COMMERCIAL_CONFIG.trading.maximumRiskPercent,
  maxStopLossPct: COMMERCIAL_CONFIG.trading.maximumStopLossPercent,
  maxTakeProfitPct: COMMERCIAL_CONFIG.trading.maximumTakeProfitPercent,
  maxPositionSizingPct: COMMERCIAL_CONFIG.trading.maximumPositionSizingPercent,
  defaultVirtualBalance: 10_000,
} as const

const unsafe = /<|>|javascript:|data:|\b(?:eval|script|iframe|style|jsx|import|function|curl|deploy|execute)\b/i
const bytes = (value: string) => new TextEncoder().encode(value).byteLength
const cleanText = (value: unknown, max: number, field: string) => {
  if (typeof value !== "string") throw new Error(`paper-${field}-type`)
  const clean = value.trim()
  if (!clean || clean.length > max || bytes(clean) > max * 4 || unsafe.test(clean)) throw new Error(`paper-${field}-invalid`)
  return clean
}
const finitePercent = (value: unknown, field: string, max: number) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > max) throw new Error(`paper-${field}-invalid`)
  return Number(value.toFixed(2))
}
const allowed = (value: unknown, values: readonly string[], field: string) => {
  if (typeof value !== "string" || !values.includes(value)) throw new Error(`paper-${field}-invalid`)
  return value
}

export function validatePaperTradingBot(input: unknown): PaperTradingBot {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("paper-object-invalid")
  const value = input as Record<string, unknown>
  const forbidden = new Set(["__proto__", "prototype", "constructor"])
  const keys = ["schemaVersion", "kind", "id", "name", "strategy", "symbols", "timeframe", "riskLimit", "stopLoss", "takeProfit", "positionSizing", "virtualBalance", "state", "executionMode", "providerEvidence", "updatedAt"]
  if (Object.keys(value).some((key) => forbidden.has(key) || !keys.includes(key))) throw new Error("paper-unexpected-key")
  if (value.schemaVersion !== PAPER_TRADING_VERSION || value.kind !== "paper-trading-bot") throw new Error("paper-version-invalid")
  const symbols = value.symbols
  if (!Array.isArray(symbols) || symbols.length < 1 || symbols.length > 8) throw new Error("paper-symbols-invalid")
  const normalizedSymbols = symbols.map((symbol) => cleanText(symbol, 12, "symbol").toUpperCase())
  if (new Set(normalizedSymbols).size !== normalizedSymbols.length || normalizedSymbols.some((symbol) => !/^[A-Z0-9./-]+$/.test(symbol))) throw new Error("paper-symbols-invalid")
  if (value.executionMode !== "simulation" || value.providerEvidence !== "none") throw new Error("paper-live-mode-forbidden")
  const bot: PaperTradingBot = {
    schemaVersion: PAPER_TRADING_VERSION, kind: "paper-trading-bot", id: cleanText(value.id, 64, "id"), name: cleanText(value.name, 80, "name"),
    strategy: allowed(value.strategy, TRADING_STRATEGIES, "strategy") as TradingStrategy,
    symbols: normalizedSymbols, timeframe: allowed(value.timeframe, TRADING_TIMEFRAMES, "timeframe") as TradingTimeframe,
    riskLimit: finitePercent(value.riskLimit, "risk-limit", PAPER_TRADING_RISK_LIMITS.maxRiskLimitPct), stopLoss: finitePercent(value.stopLoss, "stop-loss", PAPER_TRADING_RISK_LIMITS.maxStopLossPct), takeProfit: finitePercent(value.takeProfit, "take-profit", PAPER_TRADING_RISK_LIMITS.maxTakeProfitPct), positionSizing: finitePercent(value.positionSizing, "position-sizing", PAPER_TRADING_RISK_LIMITS.maxPositionSizingPct),
    virtualBalance: finitePercent(value.virtualBalance, "balance", 100000000), state: allowed(value.state, TRADING_STATES, "state") as TradingState,
    executionMode: "simulation", providerEvidence: "none", updatedAt: cleanText(value.updatedAt, 40, "updated-at"),
  }
  if (bot.stopLoss >= bot.takeProfit || bot.positionSizing > bot.riskLimit) throw new Error("paper-risk-relationship-invalid")
  return bot
}

/** Uses fixed repository-contained sample prices; it never calls a market provider. */
export function simulatePaperTrading(bot: PaperTradingBot): PaperSimulation {
  const trades: PaperTrade[] = bot.symbols.slice(0, 3).map((symbol, index) => {
    const price = [101, 117, 89][index] ?? 100
    const quantity = Number((bot.virtualBalance * (bot.positionSizing / 100) / price).toFixed(4))
    const pnl = Number((quantity * price * ((bot.takeProfit - bot.stopLoss) / 100) * 0.08).toFixed(2))
    return { symbol, side: index % 2 ? "sell" : "buy", quantity, price, pnl }
  })
  const pnl = trades.reduce((sum, trade) => sum + trade.pnl, 0)
  return { balance: Number((bot.virtualBalance + pnl).toFixed(2)), positions: trades.length, orders: trades.length * 2, trades, returnPct: Number((pnl / bot.virtualBalance * 100).toFixed(2)), drawdownPct: Number(Math.min(bot.riskLimit, bot.stopLoss * 0.6).toFixed(2)), riskUsedPct: Number(Math.min(bot.riskLimit, bot.positionSizing).toFixed(2)), dataset: "repository-sample" }
}

export const PAPER_TRADING_COPY = {
  en: { title: "HEGEVA Trading Bot", sub: "Paper trading workspace", simulation: "Simulation only — not financial advice", create: "Create paper bot", save: "Save bot", run: "Run simulation", stop: "Emergency stop", delete: "Delete", ready: "Simulation ready", disabled: "Live trading is disabled", empty: "No paper bots yet", saved: "Saved locally to your workspace", risk: "Risk limit", strategy: "Strategy", symbol: "Symbols (comma separated)", balance: "Virtual balance", time: "Timeframe", name: "Bot name", approval: "No broker or real-money action is available." },
  hu: { title: "HEGEVA Trading Bot", sub: "Papíralapú kereskedési munkaterület", simulation: "Csak szimuláció — nem pénzügyi tanácsadás", create: "Papírbot létrehozása", save: "Bot mentése", run: "Szimuláció futtatása", stop: "Vészleállítás", delete: "Törlés", ready: "Szimuláció kész", disabled: "Az éles kereskedés le van tiltva", empty: "Még nincs papírbot", saved: "Helyben mentve a munkaterületre", risk: "Kockázati limit", strategy: "Stratégia", symbol: "Szimbólumok (vesszővel)", balance: "Virtuális egyenleg", time: "Időtáv", name: "Bot neve", approval: "Bróker- és valódi pénzes művelet nem érhető el." },
  de: { title: "HEGEVA Trading Bot", sub: "Arbeitsbereich für Paper-Trading", simulation: "Nur Simulation — keine Finanzberatung", create: "Paper-Bot erstellen", save: "Bot speichern", run: "Simulation starten", stop: "Not-Aus", delete: "Löschen", ready: "Simulation bereit", disabled: "Live-Handel ist deaktiviert", empty: "Noch keine Paper-Bots", saved: "Lokal im Arbeitsbereich gespeichert", risk: "Risikogrenze", strategy: "Strategie", symbol: "Symbole (durch Komma getrennt)", balance: "Virtuelles Guthaben", time: "Zeitraum", name: "Botname", approval: "Kein Broker und keine Echtgeldaktion verfügbar." },
  fr: { title: "HEGEVA Trading Bot", sub: "Espace de paper trading", simulation: "Simulation uniquement — pas un conseil financier", create: "Créer un bot papier", save: "Enregistrer le bot", run: "Lancer la simulation", stop: "Arrêt d’urgence", delete: "Supprimer", ready: "Simulation prête", disabled: "Le trading réel est désactivé", empty: "Aucun bot papier", saved: "Enregistré localement dans votre espace", risk: "Limite de risque", strategy: "Stratégie", symbol: "Symboles (séparés par des virgules)", balance: "Solde virtuel", time: "Période", name: "Nom du bot", approval: "Aucun courtier ni mouvement réel n’est disponible." },
  es: { title: "HEGEVA Trading Bot", sub: "Espacio de paper trading", simulation: "Solo simulación — no es asesoramiento financiero", create: "Crear bot de papel", save: "Guardar bot", run: "Ejecutar simulación", stop: "Parada de emergencia", delete: "Eliminar", ready: "Simulación lista", disabled: "El trading real está desactivado", empty: "Aún no hay bots de papel", saved: "Guardado localmente en tu espacio", risk: "Límite de riesgo", strategy: "Estrategia", symbol: "Símbolos (separados por comas)", balance: "Saldo virtual", time: "Periodo", name: "Nombre del bot", approval: "No hay bróker ni operaciones con dinero real disponibles." },
}
