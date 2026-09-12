# X20 Stability Audit

Status: deployed and verified in production (2026-08-26)

Critical chain under CI:
- runtime stability test
- TypeScript validation
- production build

Latest results:
- `npm run x20:audit`: passed (stability, functional, and capability suites)
- `npx tsc --noEmit`: passed
- `npm run build`: passed under Windows Node.js, matching the installed native dependencies
- Root `npm run release:check`: passed, including Worker syntax, six local D1
  migrations, API Worker dry-run packaging, and the OpenNext Cloudflare build

Production verification:
- API Worker `hegeva-ai-v3`: version `6e31f53e-931a-4874-a1e1-9548e18bc36d`
- V0 UI Worker `hegeva-ai-v3-v0`: version `32f9b951-b462-43cd-bae7-9d4f0525b414`
- Remote D1 state: current, with no migrations pending
- Full 31-check smoke suite: passed against both `https://hegevaai.co.uk`
  and the V0 Worker URL
- The custom-domain and V0 Worker homepages produced identical response bodies,
  confirming that the production domain serves the deployed V0 release

Audit maintenance:
- Updated the capability audit for the current best-of-three repair loop. It now
  verifies combined capability/spec ranking, bounded attempt persistence, early
  success, preservation of the original candidate, and selection of the best
  improved build across all retries.

Non-blocking warning:
- Next.js detects both the repository-root and `v0-app` lockfiles and infers the
  repository root for Turbopack. Set `turbopack.root` explicitly if the nested app
  is intended to be the permanent build root.

No new product features are introduced by this checkpoint file.
