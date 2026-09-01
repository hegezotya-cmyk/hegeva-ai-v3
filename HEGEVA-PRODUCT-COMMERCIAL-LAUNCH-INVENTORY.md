# HEGEVA Product, Commercial and Launch Inventory

Read-only inventory generated from the current `approved-ui-integration` tree. Existing application changes and protected untracked files were preserved; this report is the only file added by this package.

## Executive summary

HEGEVA has a functional Core shell, Assistant, App Studio, Business workspace, bounded X30 contracts, AI Bot configuration, paper-trading simulation, Enterprise foundations, and five-locale UI. Provider execution, live trading, X30 generation, live Stripe, and SSO/SAML remain fail-closed. The smallest honest paid launch is a local/cloud business workspace with invoices, quotes, customers, documents, expenses, planner, reports and messaging; AI/video/trading/SSO must remain clearly gated.

## Product and route matrix

| Area | Evidence | Status / persistence | Gate and launch phase |
|---|---|---|---|
| Homepage / shell | `app/page.tsx`, `components/site-header.tsx`, `app/globals.css` | Complete; browser/local and authenticated shell | Accessibility/build gate; launch |
| Command Center / Core | `app/command-center/page.tsx`, `components/command-center/operating-center.tsx`, `lib/foundation/*` | Functional projection; aggregate workspace data | Auth and truthful-status boundary; launch |
| Assistant | `app/assistant/page.tsx`, `components/assistant/assistant-chat.tsx`, `/api/chat` | Functional; workspace history persistence | Auth, quota and provider admission; launch with configured provider only |
| Prompt/Build/Fix X10 | `app/app-studio/{prompt-my-app,build-my-app,fix-my-app}` | Functional planning/verification flows; project persistence | No fabricated build/deploy; launch as guided tools |
| X20 | `app/app-studio/build-my-app-x20`, `lib/x20*`, `/api/*` | Functional but quota/provider gated | Explicit approval and accounting; gated |
| X30 | `app/app-studio/x30-alpha`, `lib/x30/*`, `/api/x30/generate` | Implemented, provider-disabled | Owner canary, quota, validation; gated |
| AI Bot | `app/app-studio/ai-bots`, `components/app-studio/ai-bot-studio.tsx`, `lib/ai-bot.ts` | Functional profile CRUD via `useWorkspaceData` | Provider and approval gate; post-launch |
| Advertising Studio | `app/app-studio/advertising`, `lib/advertising-workflows.ts` | Functional brief/draft CRUD; no generated output | Provider approval; post-launch |
| Video Ad Studio | `app/app-studio/video-ad-studio`, `lib/video-advertisement.ts` | Functional storyboard/spec CRUD | Video provider approval; post-launch |
| Business workspace | `app/business/page.tsx` and `app/business/*` | Functional cloud/local CRUD | Auth/cloud fallback; launch |
| Invoices / quotes | `app/business/invoices/page.tsx`, `components/business/reports.tsx` | Functional calculations, CRUD, print | Sandbox billing only; launch |
| Contracts / receipts / tax summaries | `app/business/{contracts,receipts,tax-summaries}`, `components/business/document-studio.tsx` | Functional CRUD/print with disclaimers | Legal/tax informational only; post-launch |
| Paper Trading | `app/bots/trading`, `lib/paper-trading.ts` | Deterministic simulation and persistence | Live orders prohibited; post-launch beta |
| Enterprise | `app/enterprise`, `components/enterprise/*`, `lib/enterprise.ts` | Organization/workspace/team foundation | SSO and commercial limits external; enterprise beta |
| Pricing | `app/pricing/page.tsx` | Present, Sandbox/unpriced | Owner pricing and Stripe production setup; pre-payment gate |
| Auth/account | `app/login`, `app/account`, `app/reset-password`, `lib/auth*` | Functional session/account flows | Production identity/provider review |
| Admin/contact | `app/admin/contact-leads`, `app/contact`, `/api/contact`, `/api/admin/*` | Functional bounded lead flow | Admin authorization and email configuration |
| Public/legal | `app/get-started`, `privacy`, `terms`, `robots.ts`, `sitemap.ts`, `manifest.ts`, `layout.tsx` | Present | Content/legal owner review |

## API, persistence and integration inventory

The Worker entrypoint is `src/index.js`. Relevant routes include `/api/auth/*`, `/api/chat`, `/api/workspace/:type`, `/api/contact`, `/api/admin/contact-leads`, `/api/billing/status`, `/api/billing/checkout`, `/api/billing/portal`, `/api/billing/webhook`, `/api/plan/status`, `/api/x30/generate`, and system email-status/test paths. Authentication is session-based and workspace scope is server-derived. `useWorkspaceData` provides cloud persistence with browser-local fallback and typed keys. X30 uses independent accounting tables and provider-disabled fail-closed behavior. AI Bot, advertising, video, paper trading and Enterprise currently reuse browser/cloud workspace persistence rather than adding migrations.

External boundaries are Workers AI, Stripe, Resend/email, market data, broker adapters, video providers, SSO/SAML, Cloudflare D1, Durable Objects and Workers/OpenNext deployment. No provider is invoked by these workflows during local verification.

## Functional and release gaps

### Completion update

- Route reachability for Advertising Studio, Video Ad Studio, AI Bots, Paper Trading, Enterprise, Contracts, Receipts and Tax Summaries is now covered by real Next.js routes and navigation links.
- CRUD persistence, duplicate/delete behavior, validation, print previews, provider-disabled states, paper-only enforcement and Enterprise redaction boundaries are implemented and audited.
- Centralized commercial configuration is present and all external capability flags remain disabled.
- Stable canonical persistence keys are used by the new business-document workflows.
- Remaining items below are not silently marked complete; they require native Windows execution or owner/external authority.

- Native Windows Next.js/OpenNext verification remains required; Linux is blocked by the unavailable SWC binary/read-only `.next` filesystem.
- Several existing temporary-database audits require writable temporary directories; Durable Object audit requires the native Windows workerd binary.
- Advertising channel labels and some legacy App Studio labels still need a final localization cleanup; this is a non-payment-blocking polish item.
- Live Stripe prices, products, webhook secrets and entitlement mapping remain owner-controlled.
- AI, video, X30 and broker execution require explicit provider configuration, quota review and approval.
- SSO/SAML requires external identity-provider configuration.
- No fake provider completion, live-trading or deployment action is present.

## Centralized commercial settings requiring owner decisions

Source: `v0-app/lib/commercial-config.ts`.

- Plan names and availability: `free`, `provisionalPro`, `provisionalEnterprise`.
- Monthly and annual GBP prices and included credits.
- Trial enabled/duration/credits.
- Feature credit costs: Assistant message, X30 generation, advertising generation, video generation.
- Assistant/X20/X30 daily and billing-period quotas; owner-workspace defense-in-depth limit.
- Trading simulation daily allowance.
- Enterprise maximum seats/workspaces, invitation availability and commercial ceiling.
- Trading risk ceilings: risk limit, stop loss, take profit, position sizing.
- Provider/model selection for AI, advertising, video and market data.
- Paid-provider, live-billing, live-trading, X30 and SSO feature flags.
- API/webhook availability, support/SLA tiers, overage policy and license rules.

All current commercial values are provisional or disabled and must not be presented as final pricing.

## Provider and cost map

| Capability | Current state | Production requirement / cost unit | First paid launch? |
|---|---|---|---|
| Assistant / AI Bot | Adapter/contracts; provider gated | Workers AI or approved model, tokens/request, quota and secrets | Optional |
| X10/X20 generation | Existing bounded routes; gated | Workers AI/provider and independent accounting | Optional |
| X30 | Provider-disabled | Owner canary, model/token budget, per-operation accounting | No |
| Advertising generation | Brief/spec only | Approved text model, tokens/request | No |
| Video generation | Storyboard/spec only | Paid video provider, seconds/render or job | No |
| Image generation | No active generation path in this package | Image provider, image count/size | No |
| Email/contact | Existing Resend/email boundary | Provider account and per-message cost | Contact only |
| Stripe | Sandbox/readiness contracts | Live keys, products, prices, webhooks and tax/legal review | Required before payment |
| Market data | Repository sample only | Licensed feed, request/stream cost | No |
| Broker | Disabled adapter boundary | Broker credentials, compliance and order risk controls | No |
| Enterprise SSO | Contract only | SAML/OIDC provider and enterprise agreement | No |
| Storage/database/queues | D1/workspace and DO boundaries exist | Cloudflare allocation and retention policy | Required |
| Analytics | No new provider added | Privacy-reviewed analytics choice | Optional |

## Provisional commercial model (owner proposal)

These are recommendations only and are not written into configuration.

| Plan | Indicative monthly / annual GBP | Audience and allowance proposal |
|---|---:|---|
| Free / Trial | £0 / £0 | Local workspace, limited business CRUD, no provider execution; 7–14 day trial candidate |
| Starter | £19–29 / £190–290 | Solo operators; business workspace, invoices/quotes, modest Assistant credits |
| Professional | £49–79 / £490–790 | Small teams; higher credits, App Studio/X20 review, expanded workspace limits |
| Business | £129–199 / £1,290–1,990 | Departments, Enterprise foundations, approvals, reporting and support SLA |
| Enterprise | Custom / custom | Contracted seats, workspaces, SSO, retention, audit export and SLA |

Final prices, credits, quotas, overages, taxes, seats and provider costs require owner and finance approval.

## Saturday launch matrix

### Must complete before accepting payment

- Native Windows TypeScript, Next.js and OpenNext verification.
- Live Stripe products/prices, webhook signature/idempotency, entitlement mapping and rollback procedure.
- Production legal, privacy, terms, support and refund wording.
- Auth/session, workspace isolation, quota and abuse review.
- Honest pricing page with no Sandbox-to-live ambiguity.

### Should follow immediately after launch

- Final five-locale cleanup and manual responsive/accessibility pass.
- Advertising/video provider activation only after cost and safety review.
- AI Bot provider activation with independent quota/accounting.
- Enterprise invitations, SSO and retention integration.

### Can remain gated

- X30 generation and owner canary.
- Live trading and broker orders.
- Paid advertising/video/image providers.
- SSO/SAML.

### Future expansion

- Licensed market data, broker execution, advanced analytics, queues and provider-backed media rendering.

## Recommended activation sequence

1. Complete native Windows build and Cloudflare compatibility gate.
2. Finalize legal/support and commercial decisions.
3. Configure Stripe Sandbox-to-live migration only after webhook and entitlement review.
4. Launch the business workspace paid surface with all AI/media/trading features clearly gated.
5. Separately approve one AI owner canary, then bounded provider rollout.
6. Add advertising/video providers only with independent quotas and cost kill switches.
7. Add Enterprise SSO and live trading only under separate security/compliance approvals.

## Explicit owner decisions

Owner decisions remain required for pricing, credits, quotas, trial policy, provider/model selection, AI/media costs, trading limits, Enterprise seats/workspaces, API/webhook exposure, support/SLA, overages, Stripe live activation, SSO provider, market-data licensing and broker compliance.

## Verification record

- Route tree and destination references were cross-checked against `v0-app/app`.
- Commercial settings were cross-checked against `lib/commercial-config.ts`.
- Provider claims were cross-checked against adapters and disabled flags.
- No application source was changed by this inventory package.
- `git diff --check`: PASS.
- No secrets, providers, D1, Stripe or external services were accessed.

## Final application quality package status

The repository-contained Financial Guard surface is now available at
`/business/financial-guard`. It uses typed versioned contracts, local
workspace-scoped monthly-close drafts, bounded margin calculations and
provider-neutral unavailable adapters. Reservation controls fail closed on
kill switches, missing prepaid credits, ceiling breaches, invalid revisions
and negative balances. External billing, infrastructure, AI, media, email and
market-data sources remain explicitly unavailable until configured and owner
approved; no external figures are represented as verified.

The Financial Guard dashboard is localized for EN/HU/DE/FR/ES and linked from
Business Hub, the desktop command rail and the site header. Final application
quality verification remains subject to native Windows build execution; known
WSL-only audit failures are environment limitations involving `/tmp` or the
Windows `workerd` binary, not product claims.

## Workers AI preparation status

The Cloudflare Workers AI text adapter is prepared but not active. It is
restricted to the existing Assistant and approved AI Bot operation classes,
uses the configured Workers AI binding only, and fails closed when flags,
allocation state, quota, prepaid allowance or Financial Guard reservations are
unavailable. No paid fallback, image/video path, X30 path or provider call was
added.

Owner-controlled activation variables (all currently absent/disabled):

`AI_PROVIDER_ENABLED`, `AI_PROVIDER_MODEL`, `AI_MAX_INPUT_TOKENS`,
`AI_MAX_OUTPUT_TOKENS`, `AI_TIMEOUT_MS`, `AI_DAILY_REQUEST_CEILING`,
`AI_DAILY_NEURON_CEILING`, `AI_DOCUMENTED_DAILY_NEURON_ALLOCATION`,
`AI_PER_USER_CEILING`, `AI_PER_WORKSPACE_CEILING`,
`AI_CONCURRENCY_CEILING`, `AI_GLOBAL_KILL_SWITCH`, `AI_BOT_CANARY_ENABLED`,
and `AI_BOT_CANARY_EMAIL`.

Activation additionally requires owner approval of the model and limits,
verified Workers AI allocation telemetry, Assistant/AI Bot admission wiring,
Financial Guard reservation integration, a bounded canary, and a rollback
procedure. This package does not claim Workers AI is live.
