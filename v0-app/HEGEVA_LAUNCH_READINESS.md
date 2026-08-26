# HEGEVA Launch Readiness

Status: development complete for this roadmap pass; production deployment blocked
pending explicit approval and the launch blockers below.

## Completed in this pass

- Business workspace records now support create, search, edit, update, and delete.
- Planner tasks and message drafts now support persisted editing.
- Reports now calculate paid and outstanding invoice values from real saved invoice
  records, including VAT and per-currency formatting.
- Mobile navigation is viewport-bounded, scrollable, safe-area aware, and uses
  non-squeezed account controls.
- Shared primary controls, language controls, record actions, and the mobile menu
  have improved touch targets.
- The assistant composer stacks safely on narrow screens.
- Global viewport overflow and mobile text scaling safeguards are active.
- Pricing checks authenticated backend billing readiness and fails closed when
  Stripe Sandbox configuration is incomplete.
- Billing remains test-only, webhook-authoritative, signature-verified, idempotent,
  and protected against out-of-order lifecycle events.
- Verified Stripe events now persist a unique customer/subscription mapping, and
  later checkouts reuse the existing Stripe customer.
- Paid Sandbox accounts can create a short-lived, authenticated Stripe Customer
  Portal session from the account page.
- Worker logs and sampled traces are enabled in the checked configuration.
- The release preflight now includes the complete product, mobile, billing, and X20
  roadmap audit suite.

## Automated gates

- `npm run audit:roadmap`
- `npx tsc --noEmit`
- `npm run build`
- `npm run cf:build`

## Launch blockers

1. Billing is intentionally restricted to Stripe test mode. Live keys, live recurring
   prices, and a live webhook endpoint must be configured and independently verified
   before accepting money.
2. Subscription lifecycle simulations against Stripe test clocks must cover renewal, payment failure, plan
   change, cancel-at-period-end, terminal cancellation, duplicate webhooks, and
   out-of-order webhooks before live mode.
3. Premium and Pro displayed prices must be reconciled against the exact live Stripe
   recurring Price objects before removing Sandbox messaging.
4. Production smoke testing happens only after a separately approved deployment.

## Deployment policy

No production deployment is authorized by this roadmap pass. Ask for explicit user
approval after all non-deployment checks pass and launch blockers are resolved or
formally accepted.
