# Growth conversion implementation plan

Goal: repair the consented acquisition funnel for Issue #87 without deploying or touching customer data.

Architecture: retain the current Next.js UI and Worker contracts. Base on production UI commit 26bb9fef0eb4b25100cbd81964dec3812a13246a (successful deployment run 40977239067). Port only inspected analytics fixes from PR #85, not its staging workflows; do not merge PR #86 or alter its dependency/security work.

Spec: owner's Growth & Conversion Fix brief, 2026-11-04; GitHub Issue #87 and comments.

Constraints: no production deploy, D1 writes, LIVE Stripe operations, posts, ads, TikTok changes, arbitrary analytics values or PII. Tests use local fixtures only. Owner subscription is not acquisition.

## Tasks
- [ ] Regression-first analytics: approved November labels, legacy referral exclusion, production-host policy, consent-only initialization and no advertising consent. Files: conversion-tracking.ts, analytics-consent.tsx, analytics-referrer.mjs, analytics-host-policy.mjs and associated tests. Preserve inspected PR #85 improvements.
- [ ] Close funnel gaps: Challenge primary CTA, metadata for pricing/login/get-started, privacy-safe event parameter handling. Test consent/revocation, duplicates, registration failures and confirmed/pending subscription paths.
- [ ] Audit public pages and mobile/desktop locally; preserve fictional demo labelling and real pricing. No unsupported redesign or duplicate SEO pages.
- [ ] Prepare four distinct UK trade offers, TikTok bio/CTA/UTM pack, official-source eligibility notes and owner actions.
- [ ] Run typecheck, build, applicable audits, browser fixtures and available lint; document limitations honestly. Review diff, push separate branch, draft PR, update Issue #87. No merge/deploy.

Review focus: unknown/malicious query values; consent granted after mount or revoked; reload/SPA duplicate events; pending/failed billing; local/staging traffic leaking into production analytics.

Ruling: execute the supplied detailed brief without another design approval round, as expressly requested. Native worktree tool rejected arguments; isolated git worktree fallback used. Existing dirty checkouts untouched.

Ruling: sessionStorage attribution intentionally survives same-tab internal navigation and payment return only; no unconsented cross-tab/device identity joining or fingerprinting.
