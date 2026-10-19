# HEGEVA Launch Readiness

Status: the current product baseline is deployed. Live monthly Premium and Pro
billing is configured; annual billing and provider-backed AI/media capabilities
remain separately gated.

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
  the required Stripe configuration is incomplete.
- Live monthly billing remains webhook-authoritative, signature-verified,
  idempotent, and protected against out-of-order lifecycle events.
- Verified Stripe events now persist a unique customer/subscription mapping, and
  later checkouts reuse the existing Stripe customer.
- Paid Sandbox accounts can create a short-lived, authenticated Stripe Customer
  Portal session from the account page.
- Worker logs and sampled traces are enabled in the checked configuration.
- Roadmap 3 is complete: HEGEVA Pulse summarizes real daily workspace signals,
  exposes direct business actions, and keeps Mission execution explicitly behind
  owner approval.
- Roadmap 4 is complete: the HEGEVA Companion uses bounded workspace continuity,
  offers user-controlled suggestions, and cannot silently impersonate a person or
  initiate provider work.
- The release preflight now includes the complete product, mobile, billing, and X20
  roadmap audit suite, including dedicated Roadmap 3 and Roadmap 4 gates.
- The primary roadmap gate now also covers the X20 identity/accounting lifecycle,
  X30 domain and presentation contracts, App Studio security boundaries,
  advertising and video studios, enterprise workflows, AI Bot approval UI,
  Financial Guard, paper trading, preview sandboxing, public-beta readiness, and
  visual polish. These existing checks can no longer silently drift outside the
  release path.
- The gate additionally exercises X30's disabled-provider canary and workspace
  accounting, the Foundation/Brain/memory runtime contracts, and the complete WOW
  and cinematic presentation checks.

## Verified billing safeguards

- Checkout is authenticated and disabled when billing readiness is incomplete.
- Monthly Premium and Pro prices use the configured live Stripe Price objects.
- Webhook bodies are bounded before signature verification.
- Verified webhook handling is signature-checked, idempotent and protected against
  stale event ordering.
- Entitlements are changed only by verified webhook lifecycle events; browser
  confirmation cannot grant access.
- Customer and subscription mappings have durable uniqueness constraints.
- Operational monitoring, refund/tax wording and rollback exercises remain
  owner-controlled responsibilities.

## Automated gates

- `npm run audit:roadmap`
- `npm run audit:roadmap-3`
- `npm run audit:roadmap-4`
- `npm run audit:studios`
- `npm run audit:platform-safety`
- `npm run audit:enterprise`
- `npm run audit:ai-bots`
- `npm run audit:ai-runtime`
- `npm run audit:quality-contracts`
- `npm run audit:core-runtime`
- `npm run audit:presentation`
- `npx tsc --noEmit`
- `npm run build`
- `npm run cf:build`

## Remaining owner-controlled commercial gates

1. Complete the end-to-end money test: registration, first value, checkout,
   verified entitlement, sign-out and return.
2. Keep operational monitoring and rollback procedures current.
3. Complete the owner review of refund, tax, support, privacy and legal wording.
4. Annual billing, trials and final credit policy require separate approval.
5. AI, advertising and video providers require independent cost, quota, canary and
   rollback approval before activation.

## Deployment policy

Production deployment requires a successful `release:check`, explicit owner
authorization, a recorded Cloudflare version and a live smoke test. Payment,
provider and Stripe configuration changes remain separate owner-controlled work.
