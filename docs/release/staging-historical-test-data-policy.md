# Staging historical Stripe TEST data policy

This policy applies only to the staging reconciliation report. It does not change Stripe, D1, Worker configuration, or production release behavior.

1. The raw reconciliation always reports every Stripe TEST subscription. `UNKNOWN`, orphan, unmatched, wrong-account, live-mode, and incomplete-pagination records are never filtered.
2. A historical TEST exception may be evaluated only at runtime when all of these are true:
   - Stripe account identity is proven for the intended main TEST account;
   - `livemode=false`;
   - subscription is active/trialing/past_due and the full internal account, subscription, customer, user, and creation-time values exactly match the owner-approved record;
   - approval is explicit and documented by the owner.
3. Masked identifiers are display-only and cannot authorize an exception. No email-only or customer-only match is valid.
4. The report must show both raw counts and evaluated counts: raw unmatched subscriptions, approved historical exceptions, and remaining blockers.
5. One unmatched record, any mismatch, wrong account, live mode, missing approval, or incomplete pagination keeps `releaseSafe=false`.
6. The exception never applies to production data, live Stripe mode, or a D1/Stripe repair. Any repair requires a separate idempotent plan, pre-change snapshot, owner approval, and rollback.
