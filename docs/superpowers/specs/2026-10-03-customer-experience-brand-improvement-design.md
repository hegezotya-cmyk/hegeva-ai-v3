# HEGEVA AI Customer Experience and Brand Improvement

## Goal

Make the existing journey clearer without adding a product area: a visitor starts the existing fictional Challenge, registers only when ready, reaches a supported first useful result, returns to relevant saved work, and can make an informed choice among the current plans.

## Scope and boundaries

- Preserve the charcoal-and-gold visual system and existing public Challenge/demo semantics.
- Reuse existing routes, workspace records, save paths, consent handling, analytics allowlists, and five-language localization (EN, HU, DE, FR, ES).
- Do not change Stripe behaviour, prices, D1 schemas or migrations, authentication, secrets, quotas, AI providers, production configuration, or owner-review boundaries.
- Do not create customer records, send messages, or perform payments during verification.
- Do not promise revenue or activation outcomes; success is clearer, truthful product guidance.

## Approved asset

The owner-approved original is `C:/Users/hegez/OneDrive/Desktop/Hegeva main logo.png`. It must be copied unchanged into the product asset location. It must not be regenerated, recoloured, stretched, or cropped. A shared brand component remains the authority for in-product header, footer, and application-navigation logo use.

## Customer problems and design

### 1. Inconsistent logo assets

`HegevaLogo` currently selects separate header and full assets. Consolidate it on the approved original with responsive, aspect-ratio-preserving size variants. Use the existing component for site header, footer, desktop command rail, and all current component consumers. Preserve document-print branding unless it is a direct `HegevaLogo` consumer; document output is outside this UI-only change.

Acceptance:

- The shared header, footer, desktop command rail, auth shell, demo shell, and mobile navigation use the same approved source through the shared component where they currently use a logo.
- `alt`, link behaviour, max-width containment, and non-distorted aspect ratio remain intact.
- No legacy/generic logo remains in a changed in-product placement.

### 2. First useful result has two equal-looking choices

The existing `/get-started` quick start presents invoice entry and customer-message preparation at the same level. Make the supported, reversible customer-message preparation route the single visually primary first-value action. Keep the invoice route available as a secondary option. The result remains explicitly prepared-only and does not send a message; opening the existing Messages route only seeds its existing draft handoff.

Acceptance:

- For a fresh authenticated workspace, one primary action is clear at first view.
- Existing client-side message classification, draft preparation, and no-send statement remain unchanged.
- Existing invoice workflow remains reachable and truthful.
- Empty, validation-error, prepared, and handoff states remain localized in all five supported locales.

### 3. Paid-plan presentation mixes available monthly checkout with planned annual billing

The current Pricing view shows annual amounts while its own live-billing copy says monthly billing is currently available and annual billing is planned. Retain every price and entitlement, but make availability explicit: present the active monthly choice as selectable and annual information as planned/non-selectable. Do not call Stripe or alter checkout eligibility.

Acceptance:

- Basic, Premium, Pro, and Enterprise price/entitlement data remain unchanged.
- Only supported monthly checkout actions are presented as currently available.
- Annual information remains visible only as planned, with no implication that annual checkout exists.
- Live billing readiness, cancellation, loading, and error states keep their existing truthful behaviour.

## Journey consistency

The homepage continues to use the current primary `/challenge` CTA and direct-registration secondary CTA. The Challenge remains clearly fictional and hands a willing visitor to existing registration with `/get-started` as the callback. No acquisition analytics event types, consent rules, or referral rules are altered by this work.

## Verification

- Add or extend focused source audits before changes for logo authority, quick-start ordering and prepared-only boundaries, and pricing availability truthfulness.
- Run relevant localization/type checks and existing focused audits for homepage, Challenge, auth hydration, first-value flow, billing readiness, and visual contract.
- Inspect changed layouts at 390x844, 412x915, and desktop only when isolated browser tooling is actually available. Otherwise record those as NOT VERIFIED.
- Use only local/test data if persistence is exercised.
- Run `git diff --check` and review changed files before local commit. No push or deployment is part of this work.

## Rollback

Revert only this feature's source commit if a regression is found. Do not alter D1, Stripe, user records, or deployed production configuration as part of source rollback. A production rollback, if separately authorized after a later release, returns traffic to the release-time prior UI Worker version without reversing database schema or data.
