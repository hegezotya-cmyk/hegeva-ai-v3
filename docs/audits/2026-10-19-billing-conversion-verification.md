# Billing conversion verification — 2026-10-19

## Verified evidence
- Stripe LIVE: two successful GBP 14.99 PaymentIntents and two paid invoices; one active subscription (read-only).
- GA4 property 553012718: registration_completed (1), checkout_started (2), no subscription_success in the queried 2026-09-10 through 2026-10-19 range.
- Frontend `v0-app/app/account/page.tsx`: `trackSubscriptionSuccess` only on `?billing=success` return after paid entitlement is re-read.
- Backend `src/index.js`: verifies Stripe webhook signature and handles `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`. It updates entitlement on paid checkout/invoice events.

## Required design constraints before changing production
1. Do not send server-side GA4 events without demonstrable, recorded analytics consent; Stripe payment itself does not grant analytics consent.
2. Do not treat checkout return, active entitlement, or `invoice.paid` as interchangeable measures. Define initial purchase conversion separately from subscription renewal revenue.
3. Ensure Stripe event idempotency, webhook signature verification, and event-to-customer binding remain intact.
4. A browser-only `subscription_success` event can miss successful payments when the buyer never returns. Preserve truthful reporting rather than backfilling fabricated GA4 conversions.
5. Do not repeat a real charge or create a second live subscription for testing.

## Next implementation gates
- Inspect existing consent storage and server consent propagation; decide whether server-side GA4 conversion can lawfully be emitted.
- Add regression tests for successful first invoice, renewal invoice, replayed webhook, consent denied, missing metadata, and paid entitlement.
- Run build and CI; inspect results; request review before production deployment.

Status: investigation only. No billing code, Stripe objects, GA4 configuration, or production deployment changed.
