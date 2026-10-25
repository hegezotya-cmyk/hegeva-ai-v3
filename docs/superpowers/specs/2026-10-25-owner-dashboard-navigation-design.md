# Owner Dashboard Navigation — Design

## Intent

Make the existing owner-only registration and subscription dashboard easy for the configured HEGEVA owner to find from the desktop command navigation. This removes the need to know or type the direct `/admin/registrations` address.

## Current state

The production dashboard already enforces owner access in the API and is linked from the account page. The desktop command rail has no owner-only entry, so it is not discoverable during normal day-to-day use.

## Goals

- Add an owner-only `Tulajdonosi áttekintő` link to the desktop command rail.
- Link to `/admin/registrations`.
- Render nothing for signed-out and non-owner users.
- Preserve the API's server-side owner check; the navigation condition is convenience only, not authorization.
- Reuse the existing visual navigation patterns without exposing the owner
  identity to the browser.

## Non-goals

- No changes to registration, billing, Stripe, D1 schema, or existing metrics.
- No extra user data, exports, or third-party tracking.
- No production deployment before tests and separate release approval.

## Approaches considered

1. **Account-page link only.** Already exists, but is easy to overlook.
2. **Always-visible navigation link.** Easier to find, but leaks the existence of an admin area to every user.
3. **Owner-only navigation link (chosen).** Keeps the dashboard discoverable for the owner while preserving the present UI boundary for other users.

## Design

The command rail will obtain the authenticated session using its existing session hook. For a signed-in user it will call a dedicated, no-store owner-access endpoint. That endpoint returns only a boolean after applying the same server-side owner check as the dashboard. The rail appends one admin link only for that boolean. The API remains the authority for access and no dashboard records are requested merely to decide navigation visibility.

## Verification

- A focused component/source test first fails because the command rail lacks the owner dashboard route.
- After implementation, the test proves the owner route is conditionally present and its path is exact.
- Existing navigation and build/type checks run before release consideration.
