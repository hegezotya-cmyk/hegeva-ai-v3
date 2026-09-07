# HEGEVA AI v3

Monorepo for the HEGEVA AI business workspace (https://hegevaai.co.uk).

## Structure

| Path | Description |
| --- | --- |
| `src/index-ledger.js` | Cloudflare Worker entrypoint (Stripe webhook ledger wrapper around the API) |
| `src/index.js` | Main API Worker: Better Auth, Resend email, Stripe billing, AI chat, business modules, D1 |
| `src/auth.js` | Better Auth configuration |
| `migrations/` | D1 SQL migrations |
| `scripts/` | Release smoke test, Stripe test lifecycle / price reconcile helpers |
| `v0-app/` | Next.js 16 frontend (OpenNext / Cloudflare deployment) — the live UI |

## Architecture

- **API**: Cloudflare Worker (`wrangler.jsonc`, entry `src/index-ledger.js`) backed by **D1**.
- **UI**: Next.js 16 app in `v0-app/`, built with OpenNext for Cloudflare. The frontend proxies `/api/*` to the API Worker via the `HEGEVA_API` service binding.
- **Deploys**: pushing to `v0-rebuild` auto-deploys the UI (`v0-ui-auto-deploy.yml`). API releases are staged manually via the `release.yml` workflow (check → remote-state → migrate → deploy-api → deploy-ui → smoke → full).

## Local development

```sh
npm install            # worker deps
npm --prefix v0-app install   # UI deps

npm run db:migrations:local   # apply D1 migrations locally
npm run worker:check          # syntax check all worker files
npm run deploy:dry-run        # validate worker deploy config
```

## Configuration

Secrets and variables (Cloudflare dashboard / `wrangler secret put`):

| Key | Purpose |
| --- | --- |
| `BETTER_AUTH_SECRET` | Auth signing secret |
| `BETTER_AUTH_URL` | Canonical app URL |
| `RESEND_API_KEY` | Transactional email sending |
| `STRIPE_SECRET_KEY` | Stripe API key (test or live) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

`wrangler.jsonc` vars (editable, `keep_vars: true`):

| Key | Default | Purpose |
| --- | --- | --- |
| `PAYMENT_MODE` | `test` | `test` or `live`. The code is mode-aware: in `live` mode live Stripe events/sessions are accepted, test events are rejected, and vice versa. |
| `PAYMENT_PROVIDER` | `stripe` | Billing provider |
| `PUBLIC_APP_URL` | `https://hegevaai.co.uk` | Public app origin |
| `STRIPE_PREMIUM_PRICE_ID` / `STRIPE_PRO_PRICE_ID` | test price IDs | Price IDs for plans; point these at live prices when going live |
| `AI_MODEL` | `@cf/qwen/qwen3-30b-a3b-fp8` | Workers AI model used by the chat; model falls back to the default if unset |

> Free tier note: Workers AI grants 10,000 neurons/day free. The default model price is within that budget for normal usage; if you override `AI_MODEL`, check the [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) page.

## Going live (Stripe)

1. Set `PAYMENT_MODE: "live"` in `wrangler.jsonc`.
2. Set live `STRIPE_SECRET_KEY` and the live endpoint's `STRIPE_WEBHOOK_SECRET` as secrets.
3. Point `STRIPE_PREMIUM_PRICE_ID` / `STRIPE_PRO_PRICE_ID` at live prices.
4. Run the staged `release.yml` workflow (migrate → deploy-api → smoke).

The webhook must be configured in Stripe for the API worker URL. Webhook events are idempotently deduplicated through the D1 event ledger.

## Release

- `release:check` — full CI-style preflight: worker syntax, D1 local migrations, deploy dry-run, UI tsc + Next.js + OpenNext builds.
- `release.yml` — the `v0-rebuild` branch is the deploy branch for releases.