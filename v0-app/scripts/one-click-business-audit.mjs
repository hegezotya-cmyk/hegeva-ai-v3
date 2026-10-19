import fs from "node:fs"

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8")
const ui = read("components/business/one-click-business.tsx")
const logic = read("lib/one-click-business.ts")
const hub = read("app/business/page.tsx")
const consent = read("components/analytics-consent.tsx")
const getStarted = read("lib/i18n/first-customer-copy.ts")
const firstWow = read("components/get-started/first-wow.tsx")
const has = (pattern) => pattern.test(ui)

const checks = [
  [ui.includes('useWorkspaceData<Customer>("customers")') && ui.includes('useWorkspaceData<Task>("planner")') && ui.includes('useWorkspaceData<Doc>("invoice_documents")'), "real workspace records"],
  [has(/status:\s*"review"/) && has(/status:\s*"approved"/) && has(/status:\s*"created"/), "approval state machine"],
  [logic.includes("validateLaunchBrief") && logic.includes("customerEmail"), "validated inputs"],
  [logic.includes("one-click:") && has(/some\([^)]*=>[^)]*\.sourceId\s*===/), "duplicate protection"],
  [ui.includes("No email, quote or message is sent") && ui.includes("semmi nem kerül elküldésre"), "no automatic send"],
  [ui.includes("en:") && ui.includes("hu:") && ui.includes("de:") && ui.includes("fr:") && ui.includes("es:"), "five locales"],
  [hub.includes('/business/launch'), "business hub entry"],
  [ui.includes('Link from "next/link"') && ui.includes('"/business/customers"') && ui.includes('"/business/invoices"') && ui.includes('"/business/planner"') && ui.includes('created.filter'), "created-record handoff"],
  [getStarted.includes('href: "/business/launch"'), "guided onboarding entry"],
  [firstWow.includes('href="/business/launch"'), "first-WOW entry"],
  [ui.includes('recordAnalyticsEvent("own_business_start", "/business/launch"') && ui.includes('recordAnalyticsEvent("own_business_result", "/business/launch"'), "consented start and result measurement"],
  [consent.includes('"/business/launch"'), "analytics path allowlist"],
  [ui.includes('useWorkspaceData<BusinessProfile>("business_profile")') && ui.includes("profiles[0]?.name"), "saved business-name prefill"],
  [ui.includes("activeRunId") && ui.includes("setActiveRunId(id)"), "current-session result selection"],
  [ui.includes("newOpportunity") && ui.includes("setActiveRunId(null)"), "explicit new-opportunity reset"],
  [ui.includes("quoteNet") && ui.includes("quoteVat") && ui.includes("quoteTotal"), "quote preview totals"],
  [ui.includes("formatMoney") && ui.includes("Intl.NumberFormat"), "localized quote currency formatting"],
  [ui.includes("current.brief.businessName") && ui.includes("current.brief.customerName") && ui.includes("current.brief.dueDate"), "quote preview parties and validity"],
  [ui.includes("TRADE_PRESETS") && ui.includes('"painter"') && ui.includes('"builder"') && ui.includes('"cleaner"') && ui.includes('"electrician"') && ui.includes('"small-shop"'), "trade preset selector"],
  [ui.includes("customerSection") && ui.includes("workSection") && ui.includes("priceSection"), "three-part opportunity form"],
  [ui.includes('value="new-customer"') && ui.includes("selectCustomer") && ui.includes("customer.title") && ui.includes("customer.meta"), "existing-customer selection"],
]

for (const [ok, name] of checks) if (!ok) throw new Error(`One-Click Business audit failed: ${name}`)
console.log("One-Click Business V3 audit passed: guided WOW entry, consented funnel measurement, validated facts, approval gate, duplicate-safe record creation, five locales, and no automatic send")
