# HEGEVA AI retention loop — design

## Intent

Help a UK small-business owner return to HEGEVA every working day by showing the most valuable next action, making a safe follow-up ready for review, and providing a short weekly business picture. The product must remain useful for trades and small service businesses without sending customer communications on its own.

## What already exists

- `/business/money-today` is live. It ranks overdue invoices, stale quotes and due customer follow-ups from the signed-in workspace.
- Payment and quote follow-up logic already creates owner-reviewable work. It deliberately does not send messages automatically.
- The Planner already has a broader daily-work model for tasks, customers, invoices and quotes.

## Goals

1. Give a signed-in owner one clear next commercial action from the existing Money Today view.
2. Let the owner prepare and approve a follow-up from an existing safe workflow, with a clear preview and no hidden delivery.
3. Add a compact weekly summary of cash, open work and follow-up pressure, based only on the owner’s own workspace data.
4. Make all new views usable at phone and desktop widths.
5. Track only aggregate, owner-visible interaction measurements; never message contents, tokens, payment secrets or unnecessary personal data.

## Non-goals

- No automatic email, SMS or WhatsApp sending.
- No new external messaging provider.
- No changes to Stripe, subscriptions, production database schema, authentication, roles or sharing links.
- No invented revenue forecast where the records do not support one.

## Approaches considered

1. One large replacement dashboard: visually central, but it duplicates existing Money Today and Planner logic and has a larger regression surface.
2. **Chosen — incremental retention loop:** strengthen the existing Money Today route with safe entry points to prepared follow-up review, then add a separate weekly summary. It reuses established data contracts and is easier to test and release safely.

## Chosen delivery order

### Phase 1 — daily action to approved follow-up

- Keep Money Today as the daily entry point.
- For each applicable invoice or quote item, route the owner to the existing review/approval workflow rather than delivering anything directly.
- Explain when an action cannot be prepared (for example, it is paused, disputed, or a payment promise is still current).
- Use idempotent existing draft rules so a repeated visit never creates duplicate follow-ups.

### Phase 2 — weekly business summary

- Add a signed-in business route that shows a simple seven-day summary:
  - paid revenue recorded in the period where supported;
  - outstanding and overdue invoice value only when safely comparable in GBP;
  - quotes and customer follow-ups needing attention;
  - open/overdue planner work.
- Each number states its scope. If evidence is missing, display an honest unavailable/empty state instead of zero or a fabricated forecast.
- Link each attention item to its existing business screen.

### Phase 3 — safe measurement

- Record only aggregate events such as weekly-summary-opened and follow-up-review-opened, scoped to the workspace and visible only to authorised owners/admins.
- Define every metric in the owner reporting view before it is displayed.
- Do not record names, emails, message bodies, URLs, authentication data, payment data, or share tokens.

## Safety and access

- All data is fetched through existing authenticated workspace contracts.
- Existing ownership and role checks remain the source of truth.
- A prepared message remains a draft until an authorised owner explicitly approves and sends it.
- No action from Money Today may bypass invoice state, follow-up state, expiry, pause, dispute or idempotency controls.

## Acceptance checks

- Anonymous visitors see no workspace figures or follow-up controls.
- A valid workspace shows only its own action and weekly-summary data.
- Paused, disputed and still-promised invoices are not offered for a payment chase.
- Reopening the page does not make duplicate drafts or deliveries.
- All new routes have loading, empty and unavailable states.
- Unit/regression tests cover ranking, blocked payment states, metric privacy and the weekly-summary aggregation.
- Mobile and desktop checks pass before any production release.

## Delivery and release

- Each phase is committed and checked separately.
- Staging verification precedes a production release.
- Production deployment requires explicit owner approval after the relevant test results are green.
