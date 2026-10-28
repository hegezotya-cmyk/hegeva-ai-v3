# Advanced Assistant Responses repair

> Use superpowers:executing-plans. User request is the specification.

**Goal:** Accept documented GPT-OSS Responses output, return complete Hungarian answers, retain exact eight-credit success accounting and full failure refunds, preserve Standard.

**Architecture:** Keep the existing admission and settlement route. Select model-specific request fields in the provider boundary and accept only completed assistant output_text for Advanced. Never expose reasoning or tool output.

**Tech stack:** Workers AI binding, JavaScript, Node test runner, SQLite-backed accounting tests.

**Constraints:** No production release before results are reviewed. No database migrations, model changes, credit price changes, or Standard behavior changes. Use existing isolated release-integration worktree on fix/advanced-assistant-responses.

**Review focus:** Multiple text chunks; reasoning-only/refusal/tool output; incomplete/error status; payload byte bounds; exact-once monthly and top-up settlement.

## Steps
- [ ] Add provider and real SQLite accounting regression tests; run RED and capture missing-response.
- [ ] Implement Responses input/max_output_tokens and completed output_text extraction, retaining all text and token metrics.
- [ ] Run new tests plus existing runtime/economics/settlement suites and release checks; gate regressions in CI.
- [ ] Fresh branch review, then exact-head Linux checks and staging API deployment without migrations.
- [ ] Signed-in staging: full Hungarian Advanced answer, eight-credit delta, Standard one-credit delta; failure refund evidence. Remove test chat residue when supported.
- [ ] Present evidence and limitations before any production merge/deployment.
