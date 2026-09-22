export const BUSINESS_SCORE_METHODOLOGY = "business-score-v1";
export const DEFAULT_SHARE_HOURS = 24;
export const MAX_SHARE_DAYS = 7;

const validDay = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const daysBetween = (a, b) => Math.max(0, Math.floor((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000));
const band = (score) => score < 50 ? "0-49" : score < 75 ? "50-74" : "75-100";
const total = (d) => (Array.isArray(d?.items) ? d.items : []).reduce((s, i) => {
  const q = Number(i?.quantity), p = Number(i?.unitPrice);
  return Number.isFinite(q) && Number.isFinite(p) && q >= 0 && p >= 0 ? s + q * p : s;
}, 0) * (Number.isFinite(Number(d?.vatRate)) && Number(d.vatRate) >= 0 ? 1 + Number(d.vatRate) / 100 : 1);

export function deriveBusinessScoreShare(input, today = new Date().toISOString().slice(0, 10)) {
  if (!validDay(today)) return { state: "incomplete", observedCategories: [], scoreBand: null };
  const invoices = Array.isArray(input?.invoices) ? input.invoices : [];
  const customers = Array.isArray(input?.customers) ? input.customers : [];
  const tasks = Array.isArray(input?.tasks) ? input.tasks : [];
  const observed = [];
  const inv = invoices.filter((d) => d?.type === "invoice" && validDay(d.dueDate));
  const quotes = invoices.filter((d) => d?.type === "quote" && validDay(d.dueDate));
  if (inv.length) observed.push("payments");
  if (quotes.length) observed.push("sales");
  const followups = customers.filter((c) => validDay(c?.followUp));
  if (followups.length) observed.push("customers");
  const dueTasks = tasks.filter((t) => validDay(t?.due));
  if (dueTasks.length) observed.push("admin");
  if (observed.length < 2) return { state: "incomplete", observedCategories: observed, scoreBand: null };
  const overdue = inv.filter((d) => d.status !== "paid" && d.dueDate < today);
  const stale = quotes.filter((d) => d.status !== "paid" && d.dueDate < today);
  const scores = {
    payments: Math.max(0, 100 - (overdue.length ? 10 : 0) - (overdue.reduce((m, d) => Math.max(m, daysBetween(d.dueDate, today)), 0) >= 14 ? 20 : 0) - (overdue.reduce((s, d) => s + total(d), 0) >= 1000 ? 15 : 0)),
    sales: Math.max(0, 100 - (stale.reduce((m, d) => Math.max(m, daysBetween(d.dueDate, today)), 0) >= 7 ? 20 : 0) - (stale.reduce((m, d) => Math.max(m, daysBetween(d.dueDate, today)), 0) >= 10 ? 10 : 0) - (stale.reduce((s, d) => s + total(d), 0) >= 500 ? 10 : 0)),
    customers: Math.max(0, 100 - (followups.filter((c) => c.followUp <= today && c.customerStatus !== "paused").length ? 15 : 0)),
    admin: Math.max(0, 100 - (dueTasks.some((t) => !t.done && t.priority === "high" && t.due < today) ? 8 : 0) - (dueTasks.some((t) => !t.done && t.due === today) ? 6 : 0)),
  };
  const score = Math.round(observed.reduce((s, c) => s + scores[c], 0) / observed.length);
  return { state: "ready", observedCategories: observed, scoreBand: band(score), score };
}

export function normalizeShareExpiry(requested, now = Date.now()) {
  const candidate = requested ? Date.parse(requested) : now + DEFAULT_SHARE_HOURS * 3600000;
  const max = now + MAX_SHARE_DAYS * 86400000;
  return new Date(Math.min(Number.isFinite(candidate) ? candidate : now + DEFAULT_SHARE_HOURS * 3600000, max)).toISOString();
}

export async function hashBusinessScoreToken(token) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function newBusinessScoreToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
