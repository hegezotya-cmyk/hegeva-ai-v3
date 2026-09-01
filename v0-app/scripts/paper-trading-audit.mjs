import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
const source=await readFile(new URL("../lib/paper-trading.ts",import.meta.url),"utf8"); const page=await readFile(new URL("../components/bots/paper-trading-studio.tsx",import.meta.url),"utf8")
assert.match(source,/executionMode: "simulation"/); assert.match(source,/providerEvidence: "none"/); assert.match(source,/emergency-stopped/); assert.match(source,/simulatePaperTrading/); assert.match(source,/riskLimit: finitePercent/); assert.match(source,/stopLoss >= bot.takeProfit/)
assert.match(page,/useWorkspaceData/); assert.match(page,/window\.confirm/); assert.match(page,/disabled=\{!selectedBot\}/); assert.match(page,/copy\.disabled/); assert.doesNotMatch(page,/fetch\(|\/api\//)
assert.match(source,/PAPER_TRADING_STRATEGY_VERSION/)
assert.match(source,/PaperLedgerEvent/)
assert.match(source,/PAPER_TRADING_ADAPTERS/)
assert.match(source,/mode: "disabled"/)
assert.match(source,/PAPER_TRADING_COSTS/)
assert.match(source,/enforcePaperRisk/)
assert.match(source,/daily-loss-limit/); assert.match(source,/exposure-limit/); assert.match(source,/position-size-limit/); assert.match(source,/drawdown-limit/)
assert.match(source,/transitionPaperTradingState/); assert.match(source,/runPaperBacktest/); assert.match(source,/exportPaperBacktest/)
console.log("PAPER TRADING AUDIT PASS")
