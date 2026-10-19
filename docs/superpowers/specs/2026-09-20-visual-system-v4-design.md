# HEGEVA Visual System V4 Design

## Purpose

Create a premium, cinematic HEGEVA interface that makes the existing Command Center and HEGEVA Core feel like the visual centre of the product. The work is presentation-only: real workspace data, routes, safety states, approval flows, and business logic remain unchanged.

## Visual language

V4 uses a deep charcoal and dark-teal base with metallic gold as the primary identity accent. Warm amber is reserved for attention and revenue emphasis; teal/cyan is reserved for intelligence; green, blue, violet, amber, and red remain semantic supporting accents. Surfaces progress from background to section, standard card, elevated card, active card, and Core; each level gains restrained contrast, border definition, and shadow depth.

## Scope and boundaries

The implementation updates shared visual tokens, the application shell, official-logo containment, Command Center surfaces, Core and priority hierarchy, and shared authenticated-page surfaces. It may correct visible localization encoding only where the source text is demonstrably malformed. It does not add metrics, fake activity, routes, actions, or data.

The API Worker, auth, Stripe, billing, D1/schema/migrations, Cloudflare settings, provider controls, quotas, consent, analytics, SEO, and production data are out of scope. No deployment occurs.

## Components and data flow

`app/globals.css` becomes the visual source of truth for V4 tokens and reusable visual primitives. Existing components opt into named V4 classes; they continue to consume their current hooks, translations, actions, and routes. `CoreDecisionSurface` renders the same Core response with a more prominent hierarchy; prepared-work and owner-review affordances retain their existing governed states.

The official gold logo remains `/hegeva-logo-gold-official.png`, rendered through the existing `HegevaLogo` component. Its container, sizing, and responsive presentation change, not the asset or brand identity.

## Accessibility and responsive rules

Text/background contrast and focus rings remain visible. Decorative effects are non-interactive and reduced under `prefers-reduced-motion`. At 390px and 412px, decorative intensity is reduced, controls wrap safely, and tables retain their existing scroll wrappers. No layout may force horizontal page overflow.

## Verification

Add a focused source-level V4 audit before the visual implementation, then run it with the existing visual/mobile, Command Center, BOS, TypeScript, and production-build checks. Inspect the final diff for protected-area changes. Browser viewport results are reported as NOT PROVEN if the local browser cannot safely execute them.
